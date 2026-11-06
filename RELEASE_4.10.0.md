# vNext-Simulationswebsite – Release 4.10.0

Stand: 06.11.2026. Dieses Release ersetzt die zuvor fehlerhaft vorgeschlagenen Kennungen `3.13.0` und `4.9.2-HF12-HF121` für dieselbe Lieferung. Diese Pakete nicht einspielen.

## Verbindliche Versionierung
- Website: `4.10.0` (Funktions-/Darstellungsupdate von älterer Simulations-Baseline `4.9.2-HF12-HF120`).
- Admin: `3.12.8`, unverändert.
- Ab sofort `X.Y.Z` ohne `HF`-Suffix: Fix → Patch +1; Update → Minor +1, Patch 0; Upgrade → Major +1, Minor 0, Patch 0.
- Alte Versionsangaben in historischen Dokumenten und alten Artefakten sind Archivbelege, keine aktuelle Produktkennung.

## Gezielte Änderungen
- `index.html`: Live-Termin-Vorschau
- `logbuch.css`: Logbuch-Layout, mobile Karten, Datumsdarstellung
- `logbuch.js`: Spieltagsrückblicke und geteilte Spieltagssieger
- `VERSION.txt`: neue Website-Version `4.10.0`

## Sicherheitsgrenzen
Nur im Repository `OldSmugglersClub/tosmc-vnext-simulation` durch Nutzer nach Dateidiff übernehmen. Simulationsdaten, historische Werte, Terminwaechter, Workflows und Admincode nicht ersetzen. Das bestehende `SHA256_MANIFEST.json` ist eine historische Referenz für HF120 und wird nicht umgeschrieben. Einspielung/Browserprüfung sind offen.

## Dateien und Nachweis
Nur vier Bestandsdateien geändert und diese zwei Release-Dateien neu. SHA-256-Dateivergleich in `RELEASE_4.10.0.json`. Kein Commit/Push durch die KI.
