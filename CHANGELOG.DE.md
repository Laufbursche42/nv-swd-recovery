# Changelog

## v3

- Fehler-melden: das Markdown-Fett (`**`) aus der auto-gefüllten Ticket-Vorlage entfernt. Das Fett rendert teils nicht (ein Leerzeichen vor dem schließenden Marker) oder war unbalanciert, sodass rohe Sterne im Ticket standen. Die Labels sind jetzt Klartext.

## v2

- Cloudflare Web Analytics aktiviert (cookielos, nur aggregierte Seitenaufrufe); Beacon-Quelle in der Content-Security-Policy erlaubt.

## v1

- Erste Version. Baut im Browser aus einem offiziellen NAVEE-02831-Controller-Stock-Image ein flash-fertiges SWD-Abbild (IAP-Bootloader und App).
- Erkennung am Inhalt: 02831-Controller werden zusammengesetzt, Meter beziehungsweise Display und 3553G/MM32-Controller werden mit Hinweis abgelehnt.
- Enthält das Flash-Script `swd_flash_navee.py` als Download und eine zweisprachige Anleitung.
- Design, Theme, Sprache (DE/EN) und der vorausgefüllte Problem-melden-Link wie die übrigen Laufbursche-Tools.
