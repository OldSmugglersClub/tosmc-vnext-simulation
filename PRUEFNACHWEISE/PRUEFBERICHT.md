# TOSMC Admin vNext 4.11.6 – Mobile Plakettennieten
Datum: 19.11.2026 (Europe/Berlin)

## Quellen
- Übergabe `TOSMC_AN_VNEXT_2026-11-19_Mobile_Plakettennieten(1).md` vollständig gelesen.
- vNext-Regelwerk 1.3 und Fehlerprotokoll aus geprüfter Übergabe-ZIP vom 18.11.2026 berücksichtigt.
- GitHub vNext `OldSmugglersClub/tosmc-vnext-simulation`, Branch `main`, HEAD `d61cbf9e5343b94074d78bddb186f0754acbddb5`, VERSION `4.11.5`, read-only abgerufen.
- GitHub Blob `index.html`: `7121b9c521543fbdbecbb97051df65f4c47a9acb`; lokale Originalbytes identisch.
- Operativer Referenzcommit `4d92cdca5ffb390dede73a5a39f1b73abb058322`, nur Diff gelesen, keine operative Datei kopiert.

## Befund
Im vorhandenen vNext-Mobilcode ist ein Innenabstand von 10 px dokumentiert, während die Nietendekoration ursprünglich 12 px zum Plakettenrand einhält. Ein tatsächliches Überdecken von Glyphen wurde im isolierten Testaufbau nicht reproduziert. Die abweichende Geometrie gegenüber dem auf LIVE bestätigten Fix ist nachgewiesen.

## Änderung
- `index.html`: ein eigener, auf max. 760 px und ausschließlich `#aktueller-spieltag #sm-schedule-label` begrenzter CSS-Block mit padding `8px 24px`, `overflow-wrap:anywhere`, Nieten links/rechts je 8 px.
- `VERSION.txt`: 4.11.5 → 4.11.6.
- Keine Änderung der rechten Statusplakette, der Desktop-CSS-Regeln, JS, Daten, Berechnungen, Links oder Workflows.

## Regressionen
- Lokaler isolierter Chromium-CSS/DOM-Test: 9/9 Breiten 320, 360, 375, 390, 520, 760, 800, 1024, 1440 px bestanden.
- Linke Plakette: ab 760 px und darunter 24 px horizontaler Innenabstand, Nieten je 8 px Randabstand; keine im Test beobachtete Text-/Nietenüberlappung.
- Rechte Plakette: alle neun Layoutmessungen vor/nach Änderung identisch.
- Desktop 800/1024/1440 px: alle gemessenen linken Layoutwerte vor/nach Änderung identisch.
- Dokumentbreite: an neun Testbreiten kein neuer horizontaler Overflow.
- HTML via Python HTMLParser ohne Parserfehler verarbeitet.
- Dateidiff auf zwei Website-Dateien begrenzt; bisherige `index.html` bis auf neuen CSS-Block byteidentisch.

## Offene Nachweise
- Echter vollständiger Seitenaufruf im Browser: durch `ERR_BLOCKED_BY_ADMINISTRATOR` gesperrt; isolierte CSS-/DOM-Tests wurden stattdessen erfolgreich durchgeführt.
- Visuelle Nutzerprüfung nach manueller Simulationseinspielung ausstehend.
- Kein GitHub-Commit, Push, Workflowstart, LIVE/TEST2v2-Eingriff oder produktiver Abschluss durchgeführt.

## Einspielung
Nur `index.html` und `VERSION.txt` im Repository `OldSmugglersClub/tosmc-vnext-simulation` auf Basis des oben angegebenen HEAD manuell ersetzen. Bei neuerem HEAD vor Einspielung erneut abgleichen. Das Paket ist ein kleines UPDATE, kein vollständiges Repository.
