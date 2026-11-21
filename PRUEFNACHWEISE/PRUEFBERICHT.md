# vNext 4.11.7 – Prüfbericht (21.11.2026)

Basis: `tosmc-vnext-simulation-main (1).zip`, Website-Root `index.html`, Version 4.11.6. Dieser Dateistand stimmt mit dem zuvor direkt gelesenen GitHub-Blob `4feed780a59cdbba89639832de48f63230d976fc` überein.

Änderung: Nur automatische Öffnungsregel der Tagesgruppen in `#aktueller-spieltag`: 72 Stunden vor frühestem Eventstart der Gruppe, statt Freitag/Samstag/Sonntag/Montag. Kein Wettbewerbsvorrang; manuelles `details`-Verhalten bleibt unverändert. Version 4.11.7.

Prüfungen:
- 11/11 JS-Zeitgrenz- und Gruppentests bestanden (auch unsortierte Events und Wochenenden).
- 3 eingebettete JavaScript-Blöcke: `node --check` bestanden.
- Außer der Öffnungsregel keine Änderung an `index.html`; `VERSION.txt` 4.11.7.
- Basis-SHA256 index.html: `b7ce88e41424f443171efad6b2b4febf7918269d6261404760e7d2810d7424d1`.
- Update-SHA256 index.html: `9cec555dc509e506f2255d98f2e09bcdd7a03e971571f4cb2b484ed5c03cb535`.
- ZIP-CRC, SHA-256: geprüft (siehe SHA256SUMS.txt).
- Browser-/LIVE-Sichtabnahme offen. Kein GitHub-Schreibzugriff, keine operative Website-Änderung.

Voraussetzung: Vor Einspielung den aktuellen Website-Stand mit Basis vergleichen; dieses Update überschreibt nur `index.html` und `VERSION.txt`.
