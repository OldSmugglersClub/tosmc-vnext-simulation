TOSMC – Produktiv-Hotfix HF120 (Beschriftung Spieltagsbilanz)

Basis: Live HF119. TEST15 auf Test2v2 durch Betreiber bestaetigt.

Nur diese VIER Dateien in den ROOT des Live-Repositories kopieren:
- logbuch.js
- logbuch.html
- index.html
- VERSION.txt

Die beigefuegte logbuch.css ist als Schutzreferenz byteidentisch mit HF119 und soll NICHT ersetzt werden. README und Manifest ebenfalls nicht einspielen.

Ablauf:
1. Aktuellen Live-Stand nochmals gegen BEFORE-SHA256 pruefen; bei Abweichung STOPP.
2. Ausschliesslich die vier Dateien lokal ueber GitHub Desktop ersetzen.
3. Git-Diff auf die vier Dateien begrenzen; Commit und Push nur durch Betreiber.
4. GitHub-Schutzpruefung und Pages-Deployment kontrollieren.
5. Browsercheck Logbuch sowie Startseiten-Teaser, aktuelle und historische Eintraege, Desktop/Mobil.
6. Live-Abschluss erst nach Betreiberbestaetigung.

Keine Wertungsdaten, kein Admin und keine historischen Archive veraendert.
