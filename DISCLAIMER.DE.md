# Haftungsausschluss

Lies dies, bevor du das Werkzeug benutzt.

## Machbarkeitsstudie, keine Gewähr

Dieses Werkzeug ist eine **Machbarkeitsstudie** und wird allein zu Forschungs- und Dokumentationszwecken veröffentlicht: um nachprüfbar zu dokumentieren, wie sich ein gebrickter NAVEE-Controller der 02831-Familie über SWD wiederherstellen lässt.

> **Keine Gewähr auf Funktion oder Sicherheit.** Eine fehlerfreie Funktion wird nicht zugesichert. Ein Schreibvorgang kann fehlschlagen, vom Controller falsch ausgewertet werden oder das Gerät in einen unerwarteten Zustand versetzen.

Der Autor übernimmt **keinerlei Haftung** für Schäden, Verluste oder sonstige Folgen jeder Art, die aus der Nutzung entstehen. Die Nutzung erfolgt vollständig auf eigenes Risiko.

## Was dieses Werkzeug tut und was nicht

Dieses Werkzeug stellt die Original-Firmware (Stock) eines Controllers wieder her. Es hebt von sich aus nichts frei und verändert keine Geschwindigkeit. Es setzt nur den IAP-Bootloader und die unveränderte App-Firmware zu einem flash-fertigen Abbild zusammen, das du selbst per SWD schreibst.

> **SWD-Zugriff und Reflash können den Controller weiter beschädigen.** Das Gerät ist bereits defekt. Ein Fehlschlag ist per SWD in der Regel erneut rückholbar, aber nicht garantiert.

## Experimentell und modellübergreifend

> **Der IAP-Bootloader ist innerhalb der 02831-Klasse generisch, am einzelnen Zielmodell aber noch nicht abschließend bestätigt.** Nutze das Werkzeug nur, wenn du SWD-Zugriff auf den Controller hast.

## Nur am eigenen Gerät

- Nutze dieses Werkzeug nur an einem Gerät, das dir gehört.
- Flashst du später eine entdrosselte Firmware, erlischt die ABE und der Betrieb im öffentlichen Verkehr ist nicht erlaubt. Das ist nicht Gegenstand dieses Werkzeugs, aber behalte es im Blick.

## Keine Rechtsberatung

Dies ist keine Rechtsberatung. Die vor Ort geltenden Regeln können abweichen. Wer diese Bedingungen nicht vollständig akzeptieren kann, darf das Werkzeug nicht nutzen. Siehe auch die [Lizenz](#LICENSE).
