# Manuelle Installation – nur vNext-Simulation

Repository: `OldSmugglersClub/tosmc-vnext-simulation`
Basis: main / `b99cf9a8cb72c4ec26fb822a7c9cc9f14c63035e` / Version `4.11.4`
Ziel: `4.11.5`

1. Vor Einspielung aktuellen GitHub-HEAD gegen Basis prüfen. Bei Abweichung NICHT blind überschreiben.
2. ZIP-Root-Dateien und `scripts/tests/` mit gleichen relativen Pfaden in das lokale vNext-Repository kopieren.
3. `SHA256SUMS.txt` für Paketdateien kontrollieren. `PRUEFNACHWEISE/` ist nur Dokumentation, nicht in die Website übernehmen.
4. Tests bei Bedarf aus dem Repository ausführen; GitHub Desktop Commit und Push ausschließlich durch Nutzer.
5. Sichtabnahme Desktop/Mobil und reale externe APIs nach Einspielung prüfen; ohne diese keine vollständige Funktionsfreigabe.

## Summary
TOSMC-VNEXT | FEATURE | Quellenintegrität und Layoutkorrekturen 4.11.5

## Description
Übernahme der bestätigten operativen LIVE-4.9.7–4.9.10-Erweiterungen in die vNext-Simulation:
- Champions-League-Ligaphase und 36er-Tabelle ausschließlich aus zentralen TOSMC-Spieldaten
- Dynamische OpenLigaDB-Konfliktdiagnose und Plausibilitätsfilter für CL/EL/DFB/Dynamo
- Doppelte CL-Spielplananzeige verhindert; bestätigte Ergebnisse und Tippverteilungen geschützt
- Europa League: nächster aktueller/zukünftiger Spieltag standardmäßig geöffnet
- DFB: abgeschlossene Hauptrunden geschlossen, acht bestätigte Achtelfinaltermine als paarungsbezogener Fallback, leere Ergebnisplatzhalter entfernt
- Originalwappen-Alias SK Puntigamer Sturm Graz
- Mobile Mannschaftsnamen ohne Silbentrennung
- Regressionstests für Quellen, Wertungen und Layout ergänzt
Version 4.11.4 → 4.11.5. Nur Wettbewerbscode, CSS, VERSION und Prüftests geändert.
Syntax-, Quellen- und isolierte Layoutregressionen bestanden. Vollständiger Website-E2E-Test, externe API-Aktualität und Nutzersichtprüfung offen. Keine Änderung an LIVE/TEST2v2 oder produktiven Daten.
