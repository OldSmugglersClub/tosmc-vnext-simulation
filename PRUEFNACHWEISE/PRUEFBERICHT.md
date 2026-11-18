# TOSMC Admin vNext – 4.11.5 technische Teilprüfung

**Prüfzeitpunkt:** 2026-11-18T21:47:45+01:00  
**Repository:** `OldSmugglersClub/tosmc-vnext-simulation`, Branch `main`  
**GitHub-HEAD/Basis:** `b99cf9a8cb72c4ec26fb822a7c9cc9f14c63035e`  
**Ausgangsversion:** `4.11.4` (lokaler Quell-ZIP nachweislich GitHub-Blob-identisch bei `index.html`, `wettbewerb.js`, `wettbewerb.css`, `VERSION.txt`)  
**Zielversion:** `4.11.5`  
**Freigabegrad:** Stufe A, technische Entwicklung/Teilprüfung. **Keine** Einspiel- oder Gesamtfreigabe.

## Umgesetzt

- CL-Ligaphasenansicht ausschließlich aus zentralen vNext-TOSMC-Spielen; dokumentierter Bestand: 144 Spiele, 8 × 18, 36 Teams. API-Konflikte werden separat diagnostiziert, nicht zur Änderung der zentralen Gegner/Tore/Tipps genutzt; keine doppelte CL-Spielplanliste.
- CL-Tabelle aus 36 zentralen Teams, mit ausschließlich bestätigten Endergebnissen. Nicht bestätigte Tore werden ignoriert.
- OpenLigaDB-Quellwächter für CL-, EL-, DFB- und Dynamo-Zusatzdaten: Konflikte, Duplikate, Team-Identitäten, Kollisionen und Zwischenergebnisse. Externe Spiele ohne zentrale Referenz bleiben nur **strukturell plausibilisiert**.
- EL-Standard-Akkordeon öffnet den nächsten noch aktuellen/zukünftigen Spieltag statt dauerhaft des ersten.
- DFB abgeschlossene Hauptrunden zu; acht paarungsbezogene, dokumentiert offizielle Anstoßzeiten nur als eng begrenzter Fallback; keine Ergebnisplatzhalter bei offenen KO-Spielen.
- Alias `SK Puntigamer Sturm Graz` auf vorhandenes Originalwappen; mobile Namen ohne unerwünschte Silbentrennung (reguläre Paarungszeilen).
- DFB-Torjäger-Anzeige der validierten positiven Toranzahl angepasst; Datenimport unverändert.
- Veralteter CL-Doppellisten-Test auf neue geschützte Renderstruktur aktualisiert, zusätzliche reproduzierbare Regressionstests beigepackt.

## Prüfungen

| Prüfpunkt | Ergebnis |
|---|---|
| ZIP-Übergabe Original | 15 Dateien, ZIP CRC korrekt, 14/14 SHA-256 korrekt |
| JavaScript-Syntax (`node --check`) | BESTANDEN |
| CL zentrale Daten und Wertung | BESTANDEN: 144 Spiele / 8 × 18 / 36 Teams, falscher Gegner erkannt, doppelte Liste verhindert, unbestätigte Tore ignoriert |
| API-Quellenwächter | BESTANDEN: 14 Szenarien |
| DFB acht Termine und 0-Tore-Anzeige | BESTANDEN |
| DFB-Ergebnisplatzhalter/EL-Unverändertheit | BESTANDEN |
| Sturm Graz Alias | BESTANDEN: 5/5 |
| Mobile Worttrennungsregeln | BESTANDEN |
| CL-Doppellistenschutz | BESTANDEN |
| Isolierte Chromium-CSS-Layoutprüfung (320, 350, 375, 390, 425, 520, 760, 800, 820, 1024, 1280, 1440 px) | BESTANDEN: 12/12, feste Achse, keine horizontalen Überläufe des Testfixtures |
| Vollständiger Live-Website-Browser-Test | NICHT AUSGEFÜHRT: lokale URL `ERR_BLOCKED_BY_ADMINISTRATOR` |
| Aktuelle externe Live-API-Daten für CL/EL/DFB/Dynamo/Torjäger | NICHT INHALTLICH VERIFIZIERT |
| Nutzereinspielung, GitHub-Commit, Push, Sichtfreigabe | OFFEN |

## Schutz und Lieferumfang

Nur `wettbewerb.js`, `wettbewerb.css`, `VERSION.txt` geändert. Sechs gezielt aus den operativen Belegarchiven adaptierte Tests und zwei ergänzende vNext-Tests liegen unter `scripts/tests/`. `index.html` sowie 834 weitere originale Repository-Dateien bleiben unverändert. **Keine Änderungen** an zentralen JSON-Daten, Admin, Terminautomatik, Workflows, Teams, Originalwappen, Historie, Tipp-/Punkte-/Saison-/Migrationslogik. Kein GitHub-Schreibzugriff.

Dieses **Update-ZIP** enthält nur geänderte/neu hinzugefügte Dateien, keine vollständige Repository-Sicherung. Dateien am selben relativen Pfad im lokalen Repository ersetzen bzw. hinzufügen. Nutzer übernimmt Einspielung, Commit/Push und Sichtkontrolle selbst. Es ist keine Freigabe für LIVE oder TEST2v2.

## Externe Unsicherheit

OpenLigaDB-Zusatzpartien ohne zentrale TOSMC-Referenz sind strukturell plausibilisiert, nicht fachlich als vollständig richtig bestätigt. Aktuelle Torjägerlisten (insbesondere CL/EL/DFB) konnten nicht unabhängig verifiziert werden. Lokale CSS-Test-Fixtures ersetzen keine vollständige Browser-End-to-End- oder Nutzer-Sichtprüfung.
