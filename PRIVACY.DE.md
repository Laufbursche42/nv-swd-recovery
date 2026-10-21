# Datenschutz

Dieses Werkzeug läuft vollständig in deinem Browser. Es hat kein eigenes Backend und keine Konten. Dieser Text erklärt genau, was mit deinen Daten passiert und was nicht.

## Kurzfassung

Das Werkzeug sammelt nichts. Es gibt keine Konten, keine Analyse, keine Telemetrie, kein Tracking, keine Werbung, keine Cookies und keine Skripte von Dritten. Nichts wird jemals an den Autor gesendet.

## Welche Daten das Werkzeug verarbeitet und wo sie bleiben

Alles Folgende bleibt auf deinem Gerät und wird nicht an dieses Projekt hochgeladen:

- Die Firmware-Datei, die du lädst (NAVEE-Controller-`.bin`). Sie wird komplett im Browser gelesen und zu einem SWD-Abbild zusammengesetzt und nie hochgeladen. Das zusammengesetzte Abbild wird nur dann heruntergeladen, wenn du es selbst auslöst.
- Ein paar Einstellungen (Sprache, Design) werden nur lokal in deinem Browser gespeichert.

## Netzwerkverbindungen

Das Werkzeug stellt in diesen Fällen eine Netzwerkverbindung her:

- **Laden der Seite.** Dein Browser holt die statischen Dateien vom Hoster (siehe unten).
- **Laden des IAP-Bootloaders.** Eine normale Anfrage an diese Seite selbst (gleicher Host), um den Bootloader-Baustein für das Zusammensetzen zu holen.
- **Herunterladen der Original-Firmware.** Die Download-Links öffnen die Herstellerdatei in einem neuen Tab, eine normale Browser-Anfrage an den Datei-Host des Herstellers. Die Seite leitet dabei nichts weiter und schickt keine deiner Daten mit.

Deine Firmware-Datei oder dein zusammengesetztes Abbild werden in keinem Fall an dieses Projekt gesendet. Es gibt hier keine Bluetooth-Verbindung.

## Hosting und Zugriffsstatistik

Die Seite wird als statische Datei über einen Hoster ausgeliefert (GitHub Pages / Cloudflare Pages). Beim Abruf verarbeiten diese Anbieter technisch notwendige Zugriffsdaten (etwa IP-Adresse, Zeitpunkt und Browser-Kennung), um die Dateien zuzustellen. Es werden keine persönlichen Profile gebildet und keine Konten benötigt. Details regeln die Datenschutzerklärungen von [GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement) und [Cloudflare](https://www.cloudflare.com/privacypolicy/).

## Kein Entwickler-Backend

Nichts wird jemals an den Autor gesendet. Es gibt kein Cloud-Konto und keinen von diesem Projekt betriebenen Server, der deine Daten empfängt. Die Original-Firmware liegt beim Hersteller, nicht bei diesem Projekt.

## Kontakt

Bei Fragen zum Datenschutz wende dich an den Autor (Laufbursche): [laufbursche42.github.io/Laufbursche42](https://laufbursche42.github.io/Laufbursche42/)
