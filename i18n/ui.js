'use strict';
// UI strings, DE (default) + EN (fallback). Values with < or & are injected as HTML.
window.UI_I18N = {
  de: {
    pageTitle: 'Laufbursche SWD Recovery for Navee',
    brandSub: 'SWD Recovery for Navee',
    buildLabel: 'Build',

    introTitle: 'Was das ist',
    introLede: 'Baut aus einem Stock-Controller-Image deines NAVEE-Rollers ein flash-fertiges SWD-Abbild (IAP-Bootloader und App), um einen gebrickten Controller der 02831-Familie wiederzubeleben.<br><br>Alles passiert in diesem Browser, es wird nichts hochgeladen und nichts gespeichert. Geflasht wird danach am PC per SWD-Probe, nicht hier und nicht per Bluetooth.',

    limitsTitle: 'Grenzen und Risiko',
    limitsBody: '<b>Nur Controller, nur 02831.</b> Abgedeckt sind die Controller der 02831-Familie: NT5 Max 9301, NT5 Max+/Turbo, ST3, ST3 Pro, GT3, GT3 Pro, GT3 Max, NT3 Pro. Meter beziehungsweise Display sind ein anderer Chip und lassen sich hiermit NICHT retten. Ebenso wenig 3553G- oder MM32-Controller (UT5 Max, XT5, NT5 Max 9701).<br><br><b>Geflasht wird am PC per SWD-Probe</b> (ST-Link, J-Link oder CMSIS-DAP) mit pyOCD - nicht im Browser und nicht per Bluetooth. Du brauchst Zugriff auf die SWD-Pins des Controllers.<br><br><b>Experimentell.</b> Das IAP ist innerhalb der 02831-Klasse generisch, am einzelnen Zielmodell aber noch nicht abschließend bestätigt. Vertretbar nur, weil ein Fehlschlag per SWD wieder rückholbar ist.',

    step1Title: 'Schritt 1 - Stock-Firmware laden',
    step1Hint: 'Lade das zu deinem Modell passende Controller-Image (offizielle NAVEE-Datei) und lade es im nächsten Schritt wieder hoch.',
    step1More: 'Dein Modell fehlt? Du kannst jedes 02831-Controller-Stock-Image hochladen - erkannt wird es am Inhalt, nicht an der Liste.',
    getBtn: 'Download',

    step2Title: 'Schritt 2 - Image hochladen und bauen',
    step2Intro: 'Wähle das heruntergeladene Stock-Image. Es wird im Browser geprüft und das SWD-Abbild zusammengesetzt.',
    dlBtn: 'SWD-Image herunterladen',

    step3Title: 'Schritt 3 - Per SWD flashen',
    step3Lede: 'Am PC mit SWD-Probe und pyOCD. Jeder Schritt steht in der Anleitung.',
    step3Short: 'Kurz: --status, bei RP Lv1 erst --unlock (löscht alles), dann das Abbild flashen, danach -sn <Seriennummer> für Serial, PID und Region.',
    legalNote: 'Nur am eigenen Gerät, auf eigene Verantwortung. Eine Speed-Entdrosselung lässt die ABE erlöschen und ist auf öffentlichen Wegen nicht zulässig. Firmware-Images sind Eigentum von NAVEE und werden hier nur verlinkt.',

    resIdle: 'Noch keine Datei gewählt.',
    resNotCtrl: 'Das ist kein 02831-Controller-Image (kein Controller-Magic bei 0x90). Meter beziehungsweise Display sind ein anderer Chip und hiermit NICHT per SWD rettbar. Lade das Stock-Controller-Image deines Modells hoch.',
    res3553g: 'Erkannt: 3553G-Controller. Für diesen Chip gibt es kein IAP und keinen SWD-Recovery-Weg hier.',
    resOther: 'Erkannt: ein SZMC-Controller, aber NICHT 02831. Nur 02831 wird hier unterstützt.',
    resUnknown: 'Unbekanntes Image. Bitte das Stock-Controller-Image deines Modells hochladen.',
    resTooSmall: 'Datei zu klein - das ist kein vollständiges OTA-Image.',
    resIapSize: 'Interner Fehler: die IAP-Größe stimmt nicht.',
    resIapFail: 'Konnte das IAP nicht laden.',
    resReadErr: 'Fehler beim Lesen der Datei.',
    resOk: 'Erkannt: 02831-Controller. Zusammengesetzt: IAP und App, {len} Byte (0x{hex}). Unten herunterladen und per SWD flashen.',

    footReadme: 'Anleitung',
    footChangelog: 'Changelog',
    footDisclaimer: 'Haftungsausschluss',
    footLicense: 'Lizenz',
    footPrivacy: 'Datenschutz',
    footTrademarks: 'Marken',
    footScript: 'swd_flash_navee.py',
    footReport: 'Problem melden',
    docLoading: 'Lade …',
    docClose: 'Schließen'
  },
  en: {
    pageTitle: 'Laufbursche SWD Recovery for Navee',
    brandSub: 'SWD Recovery for Navee',
    buildLabel: 'Build',

    introTitle: 'What this is',
    introLede: 'Builds a flash-ready SWD image (IAP bootloader and app) from a stock controller image of your NAVEE scooter, to revive a bricked controller of the 02831 family.<br><br>Everything happens in this browser, nothing is uploaded and nothing is stored. Flashing is done afterwards on a PC with an SWD probe, not here and not over Bluetooth.',

    limitsTitle: 'Limits and risk',
    limitsBody: '<b>Controllers only, 02831 only.</b> Covered are the 02831-family controllers: NT5 Max 9301, NT5 Max+/Turbo, ST3, ST3 Pro, GT3, GT3 Pro, GT3 Max, NT3 Pro. The meter / display is a different chip and cannot be recovered with this, and neither can 3553G or MM32 controllers (UT5 Max, XT5, NT5 Max 9701).<br><br><b>Flashing is done on a PC with an SWD probe</b> (ST-Link, J-Link or CMSIS-DAP) using pyOCD - not in the browser and not over Bluetooth. You need access to the controller SWD pins.<br><br><b>Experimental.</b> The IAP is generic within the 02831 class but not yet finally confirmed on the individual target model. Only reasonable because a failure is recoverable again via SWD.',

    step1Title: 'Step 1 - get the stock firmware',
    step1Hint: 'Download the controller image for your model (official NAVEE file) and upload it again in the next step.',
    step1More: 'Your model is missing? You can upload any 02831 controller stock image - it is detected by content, not by the list.',
    getBtn: 'Download',

    step2Title: 'Step 2 - upload and build',
    step2Intro: 'Pick the downloaded stock image. It is checked in the browser and the SWD image is assembled.',
    dlBtn: 'Download SWD image',

    step3Title: 'Step 3 - flash via SWD',
    step3Lede: 'On a PC with an SWD probe and pyOCD. Every step is in the guide.',
    step3Short: 'In short: --status, if RP Lv1 first --unlock (erases everything), then flash the image, then -sn <serial> for serial, PID and region.',
    legalNote: 'Only on your own device, at your own risk. Removing the speed limit voids road approval and is not legal on public roads. Firmware images are property of NAVEE and are only linked here.',

    resIdle: 'No file selected yet.',
    resNotCtrl: 'This is not an 02831 controller image (no controller magic at 0x90). The meter / display is a different chip and cannot be recovered via SWD here. Upload the stock controller image of your model.',
    res3553g: 'Detected: 3553G controller. There is no IAP and no SWD recovery path here for this chip.',
    resOther: 'Detected: an SZMC controller, but NOT 02831. Only 02831 is supported here.',
    resUnknown: 'Unknown image. Please upload the stock controller image of your model.',
    resTooSmall: 'File too small - this is not a complete OTA image.',
    resIapSize: 'Internal error: the IAP size is wrong.',
    resIapFail: 'Could not load the IAP.',
    resReadErr: 'Error reading the file.',
    resOk: 'Detected: 02831 controller. Assembled: IAP and app, {len} bytes (0x{hex}). Download below and flash via SWD.',

    footReadme: 'Guide',
    footChangelog: 'Changelog',
    footDisclaimer: 'Disclaimer',
    footLicense: 'License',
    footPrivacy: 'Privacy',
    footTrademarks: 'Trademarks',
    footScript: 'swd_flash_navee.py',
    footReport: 'Report a problem',
    docLoading: 'Loading …',
    docClose: 'Close'
  }
};
