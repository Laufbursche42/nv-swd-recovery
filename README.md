# Laufbursche SWD Recovery for Navee

A tool to revive a bricked NAVEE controller of the **02831 family** via SWD. The page builds a flash-ready image (IAP bootloader and app) from an official stock image, which you then write to the controller on a PC with `swd_flash_navee.py`.

This is purely an analysis and repair tool. It does not flash anything itself and sends nothing anywhere - the firmware images are only linked, and assembly happens in your browser on your own machine.

## Scope (important)

- **Controllers only, 02831 only.** Covered are the 02831-family controllers: NT5 Max (9301), NT5 Max+/Turbo, ST3, ST3 Pro, GT3, GT3 Pro, GT3 Max, NT3 Pro.
- **The meter / display is a different chip** and cannot be recovered with this. Neither can 3553G or MM32 controllers (UT5 Max, XT5, NT5 Max 9701 and others). The page detects this from the uploaded image and tells you.
- **Flashing is done on a PC with an SWD probe** (ST-Link, J-Link or CMSIS-DAP) using [pyOCD](https://pyocd.io) - not in the browser and not over Bluetooth. You need access to the controller SWD pins (SWCLK, SWDIO, GND, 3V3).
- **Experimental.** The IAP bootloader is generic within the 02831 class but not yet finally confirmed on the individual target model. Only reasonable because a failure is recoverable again via SWD.

## What the page does

1. You download the **stock controller image** of your model (official NAVEE .bin).
2. The page detects from the content whether it is an 02831 controller image.
3. It assembles `IAP[0 : 0x3000] + app` (app = the stock image without its first 0x100 header bytes) and offers the result as `*_SWD_IAP+APP.bin` for download.

Why this is needed: the OTA image contains only the app. The resident IAP/bootloader (`0x08000000 .. 0x08003000`) is wiped by an RDP-unlock mass-erase and is in no OTA image. Without the IAP the scooter still boots, but the OTA update in the app is dead (error "Block N ACK timeout"). The assembled image restores both.

## Requirements

- An SWD debug probe (ST-Link V2/V3, J-Link or CMSIS-DAP) and jumper wires.
- Python (on Windows `py -3`), then: `pip install pyocd`
- The `*_SWD_IAP+APP.bin` downloaded from the page.
- The **serial number from the type plate / sticker** of your scooter (for the last step).

## Wiring

Connect the probe to the controller SWD pads:

| Probe | Controller |
|-------|-----------|
| SWCLK | SWCLK |
| SWDIO | SWDIO |
| GND | GND |
| 3V3 | 3V3 (only if the controller is not otherwise powered) |

The exact pad location is model-dependent - look on the controller board.

## Steps

Run all commands in the folder with `swd_flash_navee.py`.

**1) Check status (read-only, changes nothing):**

```
py -3 swd_flash_navee.py --status
```

- `RP level : 0` -> go to step 3.
- `RP level : 1` -> read access is locked, do step 2 first.
- `RP level : 2` -> permanently locked, not recoverable (controller replacement only).

**2) Only if RP Lv1: unlock (erases the whole program area):**

```
py -3 swd_flash_navee.py --unlock
```

Then **remove power from the controller completely and reconnect it**, then `--status` again - now it should read `RP level : 0`. A "DP wait"/stall during the erase is expected and harmless.

**3) Flash the assembled image:**

```
py -3 swd_flash_navee.py Modelname_SWD_IAP+APP.bin
```

This erase-programs the IAP and app and verifies word by word. At the end it must read `verify: OK`.

**4) Write back the serial number** (an `--unlock` erased it; the firmware derives serial, PID and region from it):

```
py -3 swd_flash_navee.py -sn YOUR_REAL_SERIAL
```

Use exactly the serial from the sticker. Then power-cycle the scooter and restart - the app should show serial and model again. The odometer is on a separate, also-erased page and starts at 0.

## Afterwards

Check an OTA update in the app. If it runs through (no more "Block N ACK timeout"), the controller is 100 percent restored. Only then is tuning worth considering again.

## Risk and law

Only on your own device, at your own risk. SWD access and reflashing can damage the controller further. Removing the speed limit voids road approval and is not legal on public roads. Firmware images are property of NAVEE and are only linked here.
