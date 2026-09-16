# Testplan I-03

1. Nur in einer lokalen Kopie der Website 4.6.1 testen.
2. I-02-HF1-Testdaten in die produktiven Dateinamen der Kopie übertragen.
3. Highscore öffnen: Reihenfolge und Ränge müssen exakt `highscore.json` entsprechen.
4. Bonusansicht öffnen: Werte müssen aus `highscore.json -> individual.bonus` stammen.
5. `bonusfragen.json` und `bonusantworten.json` unverändert lassen; sie dürfen die Rangliste nicht beeinflussen.
6. Hall of Fame öffnen: Ohne Abschlussstatus bleiben bestehende Titel unverändert.
7. Kontrolltest mit einer Kopie von `wettbewerbspunkte.json`: Nur bei `abgeschlossen: true` darf Platz 1 in der Laufzeitanzeige erscheinen.
8. Desktop und Mobil visuell vergleichen; es dürfen keine Layoutunterschiede entstehen.
9. Nichts auf GitHub hochladen.
