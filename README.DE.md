# Laufbursche SWD Recovery for Navee

Werkzeug zur Wiederbelebung eines gebrickten NAVEE-Controllers der **02831-Familie** per SWD. Die Seite baut aus einem offiziellen Stock-Image ein flash-fertiges Abbild (IAP-Bootloader und App), das du mit `swd_flash_navee.py` am PC auf den Controller schreibst.

Dies ist ein reines Analyse- und Reparatur-Werkzeug. Es flasht nichts selbst und sendet nichts irgendwohin - die Firmware-Images werden nur verlinkt, zusammengesetzt wird im Browser auf deinem Rechner.

## Grenzen (wichtig)

- **Nur Controller, nur 02831.** Abgedeckt sind die Controller der 02831-Familie: NT5 Max (9301), NT5 Max+/Turbo, ST3, ST3 Pro, GT3, GT3 Pro, GT3 Max, NT3 Pro.
- **Der Meter beziehungsweise das Display ist ein anderer Chip** und lässt sich hiermit NICHT retten. Ebenso wenig 3553G- oder MM32-Controller (UT5 Max, XT5, NT5 Max 9701 und andere). Die Seite erkennt das am hochgeladenen Image und sagt es dir.
- **Geflasht wird am PC per SWD-Probe** (ST-Link, J-Link oder CMSIS-DAP) mit [pyOCD](https://pyocd.io) - nicht im Browser und nicht per Bluetooth. Du brauchst Zugriff auf die SWD-Pins (SWCLK, SWDIO, GND, 3V3) des Controllers.
- **Experimentell.** Der IAP-Bootloader ist innerhalb der 02831-Klasse generisch, am einzelnen Zielmodell aber noch nicht abschließend bestätigt. Vertretbar nur, weil ein Fehlschlag per SWD wieder rückholbar ist.

## Was die Seite tut

1. Du lädst das **Stock-Controller-Image** deines Modells (offizielle NAVEE-.bin).
2. Die Seite erkennt am Inhalt, ob es ein 02831-Controller-Image ist.
3. Sie setzt `IAP[0 : 0x3000] + App` zusammen (App = das Stock-Image ohne seine ersten 0x100 Header-Bytes) und bietet das Ergebnis als `*_SWD_IAP+APP.bin` zum Download.

Warum das nötig ist: Das OTA-Image enthält nur die App. Der residente IAP/Bootloader (`0x08000000 .. 0x08003000`) wird bei einem RDP-Unlock-Mass-Erase mitgelöscht und steht in keinem OTA-Image. Ohne IAP bootet der Roller zwar, aber die OTA-Aktualisierung in der App ist tot (Fehler "Block N ACK timeout"). Das zusammengesetzte Abbild stellt beides her.

## Voraussetzungen

- Ein SWD-Debug-Probe (ST-Link V2/V3, J-Link oder CMSIS-DAP) und Jumper-Kabel.
- Python (unter Windows `py -3`), dann: `pip install pyocd`
- Das von der Seite heruntergeladene `*_SWD_IAP+APP.bin`.
- Die **Seriennummer vom Typenschild/Aufkleber** deines Rollers (für den letzten Schritt).

## Verkabelung

Verbinde den Probe mit den SWD-Pads des Controllers:

| Probe | Controller |
|-------|-----------|
| SWCLK | SWCLK |
| SWDIO | SWDIO |
| GND | GND |
| 3V3 | 3V3 (nur falls der Controller nicht anderweitig versorgt ist) |

Die genaue Pad-Lage ist modellabhängig - am Controller-Board suchen.

## Ablauf

Alle Befehle im Ordner mit `swd_flash_navee.py` ausführen.

**1) Status prüfen (nur lesen, ändert nichts):**

```
py -3 swd_flash_navee.py --status
```

- `RP level : 0` -> weiter zu Schritt 3.
- `RP level : 1` -> der Lesezugriff ist gesperrt, erst Schritt 2.
- `RP level : 2` -> permanent gesperrt, nicht mehr rettbar (nur Controllertausch).

**2) Nur falls RP Lv1: entsperren (löscht den gesamten Programmbereich):**

```
py -3 swd_flash_navee.py --unlock
```

Danach den Controller **komplett vom Strom nehmen und wieder anschließen**, dann erneut `--status` - jetzt sollte `RP level : 0` stehen. Ein "DP wait"/Stall während des Erase ist erwartet und harmlos.

**3) Das zusammengesetzte Abbild flashen:**

```
py -3 swd_flash_navee.py Modellname_SWD_IAP+APP.bin
```

Das erase-programmiert IAP und App und verifiziert Wort für Wort. Am Ende muss `verify: OK` stehen.

**4) Seriennummer zurückschreiben** (ein `--unlock` hat sie gelöscht; daraus leitet die Firmware Serial, PID und Region ab):

```
py -3 swd_flash_navee.py -sn DEINE_ECHTE_SERIENNUMMER
```

Nimm exakt die Seriennummer vom Aufkleber. Danach den Roller stromlos machen und neu starten - die App sollte Serial und Modell wieder zeigen. Der Kilometerstand liegt auf einer eigenen, mit gelöschten Seite und beginnt bei 0.

## Danach

Prüfe in der App eine OTA-Aktualisierung. Läuft sie durch (kein "Block N ACK timeout" mehr), ist der Controller zu 100 Prozent wiederhergestellt. Erst dann ist wieder an Tuning zu denken.

## Risiko und Recht

Nur am eigenen Gerät, auf eigene Verantwortung. SWD-Zugriff und Reflash können den Controller weiter beschädigen. Eine Speed-Entdrosselung lässt die ABE erlöschen und ist auf öffentlichen Wegen nicht zulässig. Firmware-Images sind Eigentum von NAVEE und werden hier nur verlinkt.
