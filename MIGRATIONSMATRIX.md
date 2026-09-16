# MIGRATIONSMATRIX – ZENTRALE DATENHALTUNG

## 1. Status

Projektbasis: Version 4.4.15

Diese Matrix ist eine Planungs- und Freigabegrundlage.

Sie verändert noch keine Datenstruktur.

Statuswerte:

- **Behalten:** bleibt führende Datei
- **Erzeugen:** bleibt vorhanden, wird aber nur automatisch erzeugt
- **Zusammenführen:** Felder werden in eine führende Quelle überführt
- **Ablösen:** Datei kann nach vollständiger Umstellung entfernt werden
- **Archivieren:** nicht mehr produktiv verwenden
- **Prüfen:** Abhängigkeiten sind vor Entscheidung vollständig zu untersuchen

---

## 2. Matrix der produktiven Daten

| Datei | Aktuelle Rolle | Führende Quelle künftig | Zielstatus | Hauptabhängigkeiten | Priorität |
|---|---|---|---|---|---|
| `teams.json` | Mannschaftsstammdaten | `teams.json` | Behalten | Spieldaten, Team-Badges, Adminmodule | 1 |
| `teilnehmer.json` | Teilnehmerstammdaten | `teilnehmer.json` | Behalten | Tipps, Punkte, Teamwertung, Highscore | 1 |
| `wettbewerbe.json` | Wettbewerbsregister und Filter | `wettbewerbe.json` | Behalten | Wettbewerbsseiten, Saisonübersicht, Spieltagwertung | 1 |
| `spieldaten.json` | reale Spiele, Termine, Ergebnisse | `spieldaten.json` | Behalten | nahezu alle sportlichen Ansichten und Berechnungen | 1 |
| `tippspieltage.json` | Kicktipp-Wertungsspieltage | `tippspieltage.json` | Behalten | Saisonübersicht, Spieltagwertung, Sonderformate | 1 |
| `wertungsregeln.json` | Punkteparameter | `wertungsregeln.json` | Behalten | Punkteberechnung, Smugglerwertung | 1 |
| `tipps.json` | Teilnehmer-Tipps | `tipps.json` | Behalten | Punkteberechnung, Fristen, Zuverlässigkeit | 1 |
| `bonusfragen.json` | Bonusfragen und Lösungen | `bonusfragen.json` | Behalten | Bonuspflege, Punkteberechnung | 1 |
| `bonusantworten.json` | Teilnehmerantworten | `bonusantworten.json` | Behalten | Bonuspflege, Punkteberechnung | 1 |
| `smugglerauftraege.json` | Zuordnung Auftrag zu Spiel | `smugglerauftraege.json` + `spieldaten.json` | Zusammenführen | Startseite, Smugglerpflege, Smugglerwertung | 2 |
| `punkte.json` | berechnete Gesamtpunkte | zentrale Berechnung | Erzeugen | Highscore, Team-, Wettbewerbs- und Spieltagwertung | 2 |
| `smugglerpunkte.json` | berechnete Smugglerwertung | zentrale Berechnung | Erzeugen | Smuggler-Rangliste | 2 |
| `teampunkte.json` | berechnete Teamwertung | zentrale Berechnung | Erzeugen | Highscore und Teamansicht | 2 |
| `wettbewerbspunkte.json` | berechnete Wettbewerbswertungen | zentrale Berechnung | Erzeugen | Highscore und Wettbewerbsansichten | 2 |
| `spieltagpunkte.json` | berechnete Spieltagwertungen | zentrale Berechnung | Erzeugen | Highscore, Saisonverlauf | 2 |
| `ranglistenverlauf.json` | berechneter Verlauf | zentrale Berechnung | Erzeugen | Ranglistenverlauf | 2 |
| `tippfristen.json` | abgeleitete Tippfristen | `spieldaten.json` + Tippspieltaglogik | Erzeugen | Erinnerungen und Zuverlässigkeit | 2 |
| `abgabe-erinnerungen.json` | vorbereitete Erinnerungen | Fristen + Tipps + Teilnehmer | Erzeugen | lokaler Adminworkflow | 3 |
| `abgabezuverlaessigkeit.json` | berechnete Zuverlässigkeit | Fristen + Tipps + Protokoll | Erzeugen | lokaler Adminworkflow | 3 |
| `erinnerungsprotokoll.json` | manuell geführtes Protokoll | `erinnerungsprotokoll.json` | Behalten | Zuverlässigkeitsauswertung | 3 |
| `highscore.json` | öffentliche Gesamtausgabe | Punkte- und Teilnehmerdaten | Erzeugen | Highscore-Seite und Teaser | 2 |
| `hall-of-fame.json` | öffentliche Ehrentafel | `saisonarchiv.json` + bestätigte Rekorde | Erzeugen | Hall-of-Fame-Seite, Startseite | 3 |
| `saisonarchiv.json` | historische Saisondaten | `saisonarchiv.json` | Behalten | Hall of Fame, Saisonabschluss | 3 |
| `bundesliga-tabelle.json` | Tabelle/Cache | `spieldaten.json` | Erzeugen oder Ablösen | Bundesliga-Seite, ältere Startseitenlogik | 3 |
| `schmugglersiegel-register.json` | Farben und Kürzel der Siegel | `teams.json` oder Design-Erweiterung | Zusammenführen | `team-badge.js` | 3 |
| `uefa-kandidaten-2026-27.json` | saisongebundener Importnachweis | `teams.json` | Archivieren | keine produktive Darstellung | 4 |

---

## 3. Matrix der Darstellungsdateien

| Datei/Gruppe | Aktuelle Rolle | Ziel | Zielstatus | Priorität |
|---|---|---|---|---|
| `spieltag.json` | Texte und Verhalten der 7-Tage-Kachel | nur Konfiguration, keine Spieldaten | Behalten | 2 |
| `bundesliga.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `dfb-pokal.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `champions-league.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `europa-league.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `relegation.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `dynamo-dresden.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema plus Smugglerdaten | Zusammenführen | 3 |
| `piratenkodex.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `weihnachtsregatta.json` | Seitentexte und Karten | gemeinsames Wettbewerbsschema | Zusammenführen | 3 |
| `saison-2026-2027.json` | saisongebundene Präsentation | allgemeine Saisonmetadaten | Ablösen | 4 |
| `site-data.json` | alte Startseiten-Sammeldatei | zentrale Datenquellen | Ablösen | 2 |
| `clubdaten.json` | parallele Champion- und Rekorddaten | `saisonarchiv.json` / `hall-of-fame.json` | Ablösen | 3 |
| `topspieler.json` | alte Rekorddarstellung | `highscore.json` | Ablösen | 4 |
| `vor-saisonstart.json` | ältere Beispieldaten | Test-/Archivordner | Archivieren | 4 |
| `beispiele/*.json` | Demonstrationsdaten | Test-/Archivordner | Archivieren | 4 |

---

## 4. Feldmigration `site-data.json`

| Bisheriges Feld | Zielquelle | Maßnahme |
|---|---|---|
| `season` | zentrale Saisonmetadaten | nicht mehr separat pflegen |
| `kickoff` | frühestes relevantes Spiel aus `spieldaten.json` oder Saisonmetadaten | dynamisch ermitteln |
| `matches[]` | `spieldaten.json` + `teams.json` | ersetzen |
| `matches[].home` / `away` | Team-IDs in `spieldaten.json` | Namen und Kürzel aus `teams.json` auflösen |
| `matches[].hc` / `ac` | Siegel-/Teamfarben | nicht in Startseitendatei pflegen |
| `table[]` | berechnete Tabelle aus `spieldaten.json` | ersetzen |
| `stats[]` | `highscore.json` oder berechnete Rekorde | ersetzen |
| `champion` | `hall-of-fame.json` beziehungsweise `saisonarchiv.json` | ersetzen |

Voraussetzung für Löschung:

`app-v40.js` und jede weitere Referenz müssen vollständig auf zentrale Quellen umgestellt sein.

---

## 5. Feldmigration `smugglerauftraege.json`

| Feld | Bewertung | Ziel |
|---|---|---|
| `auftraege[].id` | eigenständige stabile ID | behalten |
| `auftraege[].nummer` | fachliche Nummer | behalten |
| `auftraege[].name` | Auftragsname | behalten |
| `auftraege[].spielId` | zentrale Spielreferenz | behalten |
| `auftraege[].kicktippSpieltag` | Wertungszuordnung | mit `tippspieltage.json` abgleichen |
| `auftraege[].status` | Auftragsstatus | aus Spiel- und Auftragslogik ableiten oder klar definieren |
| `auftraege[].notiz` | administrative Information | behalten |
| `mission.heim` | doppelter Vereinsname | aus `spieldaten.json` + `teams.json` erzeugen |
| `mission.auswaerts` | doppelter Vereinsname | aus `spieldaten.json` + `teams.json` erzeugen |
| `mission.termin` | doppelter Termin | aus `spieldaten.json` erzeugen |
| `mission.statusText` | Präsentation | aus Status ableiten |
| `mission.titel` / `untertitel` | Präsentation | als Seitenkonfiguration behalten |
| `mission.link` / `buttonText` | Präsentation | behalten |

---

## 6. Feldmigration Hall of Fame

| Aktuelle Quelle | Inhalt | Ziel |
|---|---|---|
| `saisonarchiv.json` | historische Saisons und Sieger | führend |
| `hall-of-fame.json` | öffentliche Aufbereitung und aktuelle offene Felder | automatisch erzeugen |
| `clubdaten.json` | teilweise dieselben Sieger und Rekorde | nach Verbraucherprüfung ablösen |
| `site-data.json.champion` | Championkopie | entfernen |
| `highscore.json.records` | aktuelle Leistungsrekorde | als Quelle für bestätigte Rekorde verwenden |

Vor Migration ist festzulegen, welche Rekorde automatisch berechnet und welche manuell bestätigt werden.

---

## 7. Feldmigration Team- und Siegeldaten

| Information | Aktuelle Datei | Ziel |
|---|---|---|
| Team-ID | `teams.json`, Siegelregister | nur `teams.json` |
| Name | `teams.json`, einzelne Darstellungsdateien | nur `teams.json` |
| Kurzname | `teams.json`, Siegelregister | `teams.json` |
| Land | `teams.json`, UEFA-Pool | `teams.json` |
| Primärfarbe | Siegelregister | Designfeld in `teams.json` oder referenzierte Design-Erweiterung |
| Sekundärfarbe | Siegelregister | Designfeld in `teams.json` oder referenzierte Design-Erweiterung |
| SVG-Datei | Siegelregister | optional; Inline-SVG kann aus Farben und Kürzel erzeugt werden |
| Qualifikationsstatus | UEFA-Pool und `teams.json.international` | `teams.json.international` |
| Quelle/Stand | UEFA-Pool | Importprotokoll archivieren |

---

## 8. Vorgesehene Migrationsetappen

### Etappe 1 – Referenzprüfung

- alle produktiven HTML- und JavaScript-Verbraucher erfassen
- Adminmodule erfassen
- ungenutzte und historische Verbraucher unterscheiden
- keine Daten ändern

### Etappe 2 – `site-data.json` ablösen

- Startseitenmodule auf `spieldaten.json`, `teams.json`, `highscore.json` und `hall-of-fame.json` umstellen
- Parallelbetrieb mit Fallback
- Desktop- und Mobiltest
- erst danach Datei archivieren

### Etappe 3 – Schmugglersiegel zentralisieren

- Farben und Kürzel eindeutig einer Team-ID zuordnen
- doppelte vollständige Teamlisten vermeiden
- `team-badge.js` unverändert funktionsfähig halten

### Etappe 4 – Wettbewerbskonfiguration vereinheitlichen

- gemeinsames Schema definieren
- acht Inhaltsdateien schrittweise migrieren
- keine Änderung des sichtbaren Layouts

### Etappe 5 – Hall of Fame und Archiv konsolidieren

- `saisonarchiv.json` als historische Wahrheit festlegen
- `hall-of-fame.json` erzeugen
- `clubdaten.json` und Championkopien ablösen

### Etappe 6 – Tabellen und Statistiken

- Bundesliga-Tabelle ausschließlich aus Ergebnissen berechnen
- Cache nur bei technischem Bedarf erzeugen
- `topspieler.json` ablösen

### Etappe 7 – Saisonwechsel

- saisonfest benannte Präsentationsdateien ersetzen
- allgemeine Saisonmetadaten einführen
- Adminworkflow anpassen

---

## 9. Freigabekriterien je Etappe

Eine Etappe gilt erst als abgeschlossen, wenn:

- alle betroffenen Verbraucher dokumentiert sind
- alte und neue Daten parallel verglichen wurden
- keine Referenz auf stabile IDs verloren geht
- Adminexporte weiter funktionieren
- öffentliche Seiten auf Desktop und Mobil geprüft sind
- Fallback und Rückbau getestet sind
- CHANGELOG und Architekturunterlagen aktualisiert sind

---

## 10. Nicht zulässige Abkürzungen

Nicht zulässig:

- mehrere JSON-Dateien gleichzeitig löschen
- IDs umbenennen ohne Migrationsskript
- Darstellungsdateien mit Stammdaten vermischen
- berechnete Ergebnisse manuell als führende Daten behandeln
- öffentliche Seiten und Adminmodule gleichzeitig ohne Zwischenprüfung umstellen
- alte Dateien entfernen, bevor alle Referenzen nachweislich verschwunden sind

---

## 11. Nächster Umsetzungsschritt

Als erste technische Etappe wird die vollständige Verbraucher- und Feldprüfung für `site-data.json` durchgeführt.

Erst nach Freigabe dieser Detailanalyse wird Code geändert.

## Wertungsregel als Migrationsvoraussetzung

Jede spätere Umstellung der Punkteberechnung muss die 5/3/2-Wertung, den 3-Punkte-Fall bei Remis ohne exaktes Ergebnis sowie die ausschließliche Nutzung des 90-Minuten-Ergebnisses einschließlich Nachspielzeit nachweislich erhalten.
