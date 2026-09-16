# Test2v2 4.9.2-HF12-HF98-TEST1

## Champion-Pokal / Hall of Fame
- Neues freigegebenes Champion-Pokalbild als `champion-trophy.jpeg`.
- Startseite: Pokal nutzt die vorhandene Champion-Kachel deutlich stärker aus, bleibt aber vollständig sichtbar (`object-fit: contain`).
- Mobile: eigene Größenbegrenzung, damit Bild und Beschriftung vollständig im Fenster bleiben.
- Ehrenlogbuch: Champion-Bereich erhält mehr Bildfläche; keine Änderung an Hall-of-Fame-Datenlogik.
- Cache-Buster direkt am Pokalbild auf beiden Seiten.

## Schutz
- Keine produktiven JSON-Dateien verändert.
- Keine Scorer-, Wettbewerbs-, Ranking- oder Admin-Logik verändert.
