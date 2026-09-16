# Version 4.2.1 – Zentrale Saisoninformationen

Die wichtigsten Angaben der Startseite werden nicht mehr mehrfach fest im HTML gepflegt, sondern aus den bereits vorhandenen öffentlichen Datendateien übernommen.

## Änderungen

- Saison und Bundesliga-Start werden aus `site-data.json` geladen
- die nächste Mission wird aus `smugglerauftraege.json` übernommen
- der aktuelle Champion wird aus `hall-of-fame.json` übernommen
- Startzentrale, Countdown, Smugglerauftrag und Hall of Fame bleiben dadurch inhaltlich synchron
- sichere Fallback-Werte bleiben erhalten, falls eine Datendatei vorübergehend nicht geladen werden kann
- keine sichtbare Layoutänderung
- keine Änderung an Kachelgrößen, Raster oder Navigation
- keine Bilderstellung und keine neuen Bilddateien
