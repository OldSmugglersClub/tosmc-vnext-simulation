# Release Notes – Version 4.4.12

## Zweck
Ausweitung der bereits freigegebenen Schmugglersiegel-Integration auf die übrigen Wettbewerbsseiten.

## Betroffene Seiten
- DFB-Pokal
- Champions League
- Europa League
- Relegation
- Piratenkodex
- Weihnachtsregatta

## Technische Umsetzung
Jede Seite lädt nun `team-badge.js` vor `wettbewerb.js`. Die vorhandene zentrale Badge-Komponente erzeugt die Schmugglersiegel aus Teamkürzel und Vereinsfarben.

## Unverändert
- Grid
- Kachelgrößen
- Navigation
- Wettbewerbsdaten
- Tabellen- und Spielplanlogik
