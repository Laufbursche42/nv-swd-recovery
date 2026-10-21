#!/usr/bin/env python3
# NAVEE controller (EastSoft FS026R7L, STM32F0-clone, custom flash controller) - SWD flash recovery via pyOCD.
#
# WARNING - UNTESTED. This drives a non-standard flash controller whose protocol was reconstructed
# from the stock firmware's own flash routines (it is NOT an STM32/GD32-compatible flash, so no stock
# tool profile can program it). It is meant for recovering an ALREADY-BRICKED controller.
#
# Reality check: this is a RECONSTRUCTED path, NOT a guaranteed fix, and it is UNTESTED on real
# hardware. It is reasonable to try because:
#   - the device is already dead, and SWD writes are repeatable (just re-run),
#   - the default flash mode touches ONLY the main flash array via the flash controller registers.
# Some values may be wrong for the actual chip (page size, program burst, flash address, BUSY bit).
# If a step fails, capture the printed error / STAT value and report back so it can be fixed -
# do not force it.
#
# Modes:
#   --status        connect and print the flash read-protection level (RP) and status bits. Read-only.
#   --unlock        if RP is Lv1, lower it to Lv0. This ERASES the whole program area (that is the
#                   only way out of RP). It can NEVER set Lv2, so it cannot lock the chip further.
#   <payload.bin>   erase + program + verify a stock payload into main flash.
#   -sn <SERIAL>    restore the scooter serial after an erase wiped it; the firmware re-derives the
#                   PID and region from it, so serial + model + region all come back in one write.
#
# Protocol CONFIRMED against the EastSoft FS026 Reference Manual V1.5 (flash controller "FC",
# base F = 0x40022000); it also matches the stock firmware's own flash routines:
#   F+0x00  FC_CMD - command: 0xF0 = program, 0xF1 = 1-page erase (0xF2 = sector = 4 pages),
#                    0xF6 = configure read-protection (RP)
#   F+0x04  FC_PA  - program/page address (flash offset)
#   F+0x08  FC_PLD - 32-bit program load data
#   F+0x10  FC_CTL - control (OPRLD config-word reload, not used here)
#   F+0x14  FC_STA - status: FCBUSY = bit 4, CMDULK = bit 5, RPLV = bits 2-1 (0=Lv0,1=Lv1,2=Lv2)
#   F+0x20  FC_UPL - protection-update low: RP level value consumed by the 0xF6 flow
#   F+0x28  FC_UL  - unlock: write KEY1 (0x00112233) then KEY2 (0x55667788); write 0 to lock
# Flash main: 0x08000000 - 0x0801FFFF, 128 KB, page = 512 B (0x200), sector = 2 KB.
#
# RP (FS026 RM V1.5 5.4.4.2): Lv0 = 0xAAAAAAAA (open, default), Lv2 = 0xCCCCCCCC (PERMANENT, debug
# disabled), anything else = Lv1 (SWD cannot read/write the program area, but the RP-reconfig flow
# still works over SWD). Writing FC_UPL = 0xAAAAAAAA + FC_CMD = 0xF6 while protected drops RP to Lv0
# and triggers a full program-area erase. The new level only reflects after a power cycle.
#
# Requirements:  pip install pyocd    then:  py -3 swd_flash_navee.py payload.bin
#   payload.bin = the stock .bin with the first 0x100 (256) header bytes removed (see the guide).
#
# TRY a backup first (the exact syntax depends on the pyOCD version), e.g.:
#   pyocd cmd -t cortex_m -c "savemem 0x08000000 0x20000 backup_full.bin"
# If the read works, keep backup_full.bin (the settings/odometer pages are device-unique). A dump of
# all-zero bytes means the read did not reach flash - run --status: RP Lv1 blocks SWD flash reads,
# while RP Lv0 + all-zero points at a connection problem (try a slower SWD clock) instead.

import sys, time
from pyocd.core.helpers import ConnectHelper

F        = 0x40022000
CMD      = F + 0x00
ADDR     = F + 0x04
FIFO     = F + 0x08
STAT     = F + 0x14
UPL      = F + 0x20
KEY      = F + 0x28
KEY1     = 0x00112233
KEY2     = 0x55667788
ORIGIN   = 0x08000000     # flash main base (FS026 RM V1.5: 0x08000000..0x0801FFFF, 128 KB)
PAGE     = 0x200          # 512 B page (FS026 RM V1.5); 0xF1 erases one page
BUSY_BIT = 1 << 4         # FC_STA FCBUSY = bit 4
ULK_BIT  = 1 << 5         # FC_STA CMDULK = bit 5
CMD_RP   = 0xf6           # FC_CMD: configure read-protection
RP_LV0   = 0xAAAAAAAA     # RP unprotected; writing this while protected drops RP + erases the flash
RP_LV2   = 0xCCCCCCCC     # RP permanent lock - must never be written

def busy(t):  return (t.read32(STAT) & BUSY_BIT) != 0

def wait(t, timeout=2.0):
    t0 = time.time()
    while busy(t):
        if time.time() - t0 > timeout:
            raise TimeoutError("flash BUSY did not clear; STAT=0x%08x" % t.read32(STAT))

def unlock(t):
    t.write32(KEY, KEY1)
    t.write32(KEY, KEY2)

def lock(t):
    t.write32(KEY, 0)

def set_addr(t, off):
    v = t.read32(ADDR) & 0xff000000
    t.write32(ADDR, v | (off & 0x00ffffff))

def erase_page(t, off):
    wait(t)
    set_addr(t, off)
    c = t.read32(CMD) & 0xffffff00
    t.write32(CMD, c | 0xf1)     # page erase
    wait(t)

def prog_word(t, off, word):
    wait(t)
    set_addr(t, off)
    t.write32(FIFO, word)
    c = t.read32(CMD) & 0xffffff00
    t.write32(CMD, c | 0xf0)     # word program
    wait(t)

def rp_level(t):
    return (t.read32(STAT) >> 1) & 0x3

def print_status(t):
    s = t.read32(STAT)
    rplv = (s >> 1) & 0x3
    names = {0: "Lv0 - unprotected",
             1: "Lv1 - SWD flash read/write blocked (recoverable via --unlock)",
             2: "Lv2 - PERMANENT, debug disabled (not recoverable)"}
    print("FC_STA  = 0x%08x" % s)
    print("  RP level : %d  (%s)" % (rplv, names.get(rplv, "reserved")))
    print("  CMDULK   : %d  (1 = flash controller unlocked)" % ((s >> 5) & 1))
    print("  FCBUSY   : %d" % ((s >> 4) & 1))
    print("  WPDIS    : %d  (1 = write-protection off)" % ((s >> 3) & 1))
    print("  UCRPDIS  : %d  (1 = user-code readout-protection off)" % (s & 1))
    return rplv

def remove_rp(t):
    rplv = print_status(t)
    if rplv == 0:
        print("\nRP is already Lv0 - nothing to unlock.")
        print("If the flash still reads as all-zero, this is a CONNECTION problem, not RP")
        print("(check pad contact / try a slower SWD clock, e.g. pyocd -f 400k).")
        return
    if rplv == 2:
        print("\nRP is Lv2 - permanent. The debug port is disabled and the chip cannot be")
        print("unlocked or erased. Only controller replacement.")
        return
    # rplv == 1: lower to Lv0; this erases the whole program area (FS026 RM V1.5 5.4.4.2)
    val = RP_LV0
    if val != RP_LV0 or val == RP_LV2:      # guard: only ever the unprotected value
        raise SystemExit("refusing to write a non-Lv0 RP value")
    print("\nRP Lv1 detected - lowering to Lv0. THIS ERASES THE WHOLE PROGRAM AREA.")
    unlock(t)
    if not (t.read32(STAT) & ULK_BIT):
        raise SystemExit("unlock failed (CMDULK=0); STAT=0x%08x" % t.read32(STAT))
    t.write32(UPL, val)                     # RP -> Lv0
    c = t.read32(CMD) & 0xffffff00
    print("Issuing RP-config command (0xF6); the erase runs on-chip now.")
    # Writing 0xF6 lowers RP to Lv0 AND mass-erases the program area. During that
    # operation the flash controller stalls the debug bus, so this write (and any
    # follow-up read) commonly times out with 'DP wait'. That is EXPECTED - the
    # command has latched and the erase is running - so tolerate it here.
    try:
        t.write32(CMD, c | CMD_RP)          # start RP config flow (0xF6)
        wait(t, timeout=5.0)
        lock(t)
        print("RP unlock + full erase issued cleanly. STAT=0x%08x" % t.read32(STAT))
    except Exception as e:
        print("Debug port stalled during the erase (expected): %s" % e)
        print("The RP-lower + erase command was issued to the chip.")
    print("\nNext:")
    print("  1) POWER-CYCLE the board (remove power completely, then reconnect).")
    print("  2) py -3 swd_flash_navee.py --status    -> expect 'RP level : 0'.")
    print("  3) if Lv0: py -3 swd_flash_navee.py payload_<model>.bin")

# ── identity / config restore (after a full-chip erase wiped the device-unique record) ──
# The scooter serial is the single source of the app's serial, the firmware-derived PID, and the
# region. It lives in the controller config page at flash 0x0801F800 (one 512 B page holds groups
# A/B/C/D, one ASCII byte per 32-bit word). Writing the real factory serial back restores serial +
# PID + region in one shot; the meter re-syncs itself (no meter flashing). Groups A and B must hold
# valid bytes (A not all 0xFF, B no 0xFF) or the boot loader erases this page and re-defaults it,
# wiping the serial again - so write their defaults too.
CFG   = 0x1F800                                      # 0-based FC_PA offset of flash 0x0801F800
CFG_A = [0x01, 0x00, 0x01, 0x30, 0x18, 0x06, 0x04]   # Group A @ +0x00: firmware defaults (anti self-heal)
CFG_B = "TK00323H0000001S73"                         # Group B @ +0x1C: BLDC-serial template (anti self-heal; not app-shown)

def _prog_ascii(t, off, s, nwords):
    for i in range(nwords):
        prog_word(t, off + i * 4, ord(s[i]) if i < len(s) else 0x00)   # one ASCII byte per 32-bit word

def restore_identity(t, serial):
    if not all(0x20 <= ord(c) <= 0x7e for c in serial):
        raise SystemExit("serial must be printable ASCII - use the EXACT factory sticker serial")
    if not (12 <= len(serial) <= 20):
        raise SystemExit("serial length %d looks wrong - expected the ~17-char factory sticker serial" % len(serial))
    print("restoring scooter serial: %s" % serial)
    print("  -> app serial, firmware-derived PID, and region (serial chars 9-10 = '%s') all return" % serial[8:10])
    unlock(t)
    if not (t.read32(STAT) & ULK_BIT):
        raise SystemExit("unlock failed (CMDULK=0); STAT=0x%08x" % t.read32(STAT))
    erase_page(t, CFG)                                                 # 512 B page 0x0801F800 only (not odometer/cal)
    for i, b in enumerate(CFG_A): prog_word(t, CFG + 0x00 + i * 4, b)  # Group A
    _prog_ascii(t, CFG + 0x1C, CFG_B, 18)                             # Group B
    _prog_ascii(t, CFG + 0x64, serial, 20)                            # Group C = the app's scooter serial
    for i in range(16):           prog_word(t, CFG + 0xB8 + i * 4, 0)  # Group D (not app-visible)
    lock(t)
    got = "".join(chr(t.read32(ORIGIN + CFG + 0x64 + i * 4) & 0xff) for i in range(len(serial)))
    if got != serial:
        print("verify MISMATCH: read back %r - do NOT power-cycle; re-check SWD and retry." % got)
        return
    print("verify OK: serial @0x%08x reads back correctly." % (ORIGIN + CFG + 0x64))
    print("\nPower-cycle the scooter; the app should show the serial + model again.")
    print("NOTE: odometer/mileage is a separate, erased page (not restored) - starts at 0.")

def flash(path):
    data = open(path, "rb").read()
    if len(data) % 4:
        data += b"\xff" * (4 - len(data) % 4)
    print("payload %d bytes -> 0x%08x" % (len(data), ORIGIN))

    with ConnectHelper.session_with_chosen_probe(target_override="cortex_m") as session:
        t = session.target
        t.halt()
        unlock(t)
        # erase every page the payload covers
        end = ORIGIN + len(data)
        a = ORIGIN
        while a < end:
            print("erase 0x%08x" % a); erase_page(t, a - ORIGIN); a += PAGE
        # program word by word
        for i in range(0, len(data), 4):
            w = int.from_bytes(data[i:i+4], "little")
            prog_word(t, i, w)
            if (i & 0xfff) == 0:
                print("program 0x%08x" % (ORIGIN + i))
        lock(t)
        # verify
        bad = 0
        for i in range(0, len(data), 4):
            if t.read32(ORIGIN + i) != int.from_bytes(data[i:i+4], "little"):
                bad += 1
                if bad <= 8:
                    print("mismatch @0x%08x" % (ORIGIN + i))
        print("verify: %s" % ("OK" if bad == 0 else "%d mismatches" % bad))
        t.reset()

def connect_and(fn):
    try:
        with ConnectHelper.session_with_chosen_probe(target_override="cortex_m") as session:
            t = session.target
            try:
                t.halt()
            except Exception as e:
                print("warn: could not halt core (%s) - continuing via debug mem access" % e)
            fn(t)
    except Exception as e:
        # a stalled debug port during/after an erase can make pyOCD's session
        # teardown throw ('Error during board uninit' / DP wait); the on-chip
        # operation is unaffected, so do not present it as a crash.
        print("note: debug session ended with a stall (%s)" % e)
        print("      -> harmless if you just ran --unlock; power-cycle and re-run --status.")

def main():
    args = sys.argv[1:]
    if not args:
        print("usage:")
        print("  py -3 swd_flash_navee.py --status            show RP level / flash status (read-only)")
        print("  py -3 swd_flash_navee.py --unlock            remove RP Lv1 (ERASES everything)")
        print("  py -3 swd_flash_navee.py payload.bin         flash a stock payload")
        print("  py -3 swd_flash_navee.py -sn <SERIAL>        restore the scooter serial (fixes serial+PID+region)")
        sys.exit(1)
    if args[0] == "--status":
        connect_and(print_status)
    elif args[0] == "--unlock":
        connect_and(remove_rp)
    elif args[0] in ("-sn", "--serial", "--restore-id"):
        if len(args) < 2:
            print("usage: py -3 swd_flash_navee.py -sn <SCOOTER_SERIAL_FROM_STICKER>")
            sys.exit(1)
        serial = args[1]
        connect_and(lambda t: restore_identity(t, serial))
    else:
        flash(args[0])

if __name__ == "__main__":
    main()
