# Release Notes – Version 3.12

## Zentrale Punkteberechnung

Version 3.12 implementiert die verbindliche Wertungslogik des Old Smugglers Club:

- richtige Tendenz: 2 Punkte
- richtige Tordifferenz: 3 Punkte
- exaktes Ergebnis: 5 Punkte

Je Tipp wird ausschließlich die höchste zutreffende Stufe vergeben. Die Berechnung nutzt zentrale Teilnehmer-, Tipp- und Spieldaten, erzeugt eine Rangliste und kann `punkte.json` sowie eine CSV-Rangliste exportieren. Integrierte Testfälle prüfen die Regelstufen bei jedem Laden.
