# TOSMC vNext 4.11.8 – KORRIGIERTES Iconpaket mit Nutzer-Originalmotiven

Verbindliche Bildzuordnung:
- **Desktop/Windows + Browserfavicon:** das HOCHGELADENE, detailreiche Piratenmotiv `ChatGPT-Bild 22. Nov. 2026, 08_31_44.png`.
- **iPhone/Android:** das HOCHGELADENE, reduzierte Totenkopf-Kompassmotiv `ChatGPT-Bild 22. Nov. 2026, 08_40_27.png`.

Nur diese beiden PNG-Originale wurden skaliert und in Zielformate konvertiert. Das Android-Maskable-Icon enthält dasselbe Motiv mit technisch notwendigem Sicherheitsrand. Keine alternativen Motivbilder, keine Bildgenerierung.

## Website
Die Dateien unter `WEBSITE_ROOT/` in den Stamm von `OldSmugglersClub/tosmc-vnext-simulation` übernehmen. Die `index.html`, `VERSION.txt` und das `manifest.webmanifest` wurden gegenüber dem zuvor erstellten, noch nicht bestätigten v4.11.8-Iconpaket **bytegleich übernommen**. Somit sind ausschließlich Icon-Bilddateien korrigiert.

## Desktop
Die Datei `DESKTOP/tosmc-windows.ico` als Symbol der Windows-Verknüpfung verwenden (Rechtsklick auf Verknüpfung > Eigenschaften > Anderes Symbol). Enthält mehrere Auflösungen.

## Mobil
- iOS: Über Safari erneut „Zum Home-Bildschirm“ hinzufügen. Bereits existierende Symbole nicht automatisch löschen.
- Android: Chrome kann Web-App-Icons aktualisieren; sofortiger Wechsel ist nicht garantiert. Neu hinzufügen für neues Symbol.

**Keine automatische Löschung oder Änderung bereits angelegter Desktop- oder Homescreen-Verknüpfungen.**

## Grenzen und Nachweise
Geprüft: Bildquellen, Zielauflösungen, Windows-ICO, Manifestverweise, Unverändertheit der übrigen Paketdateien, ZIP-CRC und SHA-256. Eine echte iPhone-/Android-/Windows-Oberflächenprüfung und GitHub-Einspielung stehen aus. Keine Repository-Schreibzugriffe.
