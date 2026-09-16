# DATENARCHITEKTUR – THE OLD SMUGGLERS CLUB

## 1. Zweck

Dieses Dokument beschreibt die tatsächliche Datenarchitektur der Projektversion 4.4.15.

Es legt fest:

- welche JSON-Dateien heute Stammdaten enthalten
- welche Dateien Konfigurationen enthalten
- welche Dateien aus anderen Daten berechnet werden
- welche Dateien nur die Darstellung steuern
- welche Redundanzen bestehen
- welches Zielbild für die zentrale Datenhaltung gilt

Dieses Dokument führt noch keine Migration aus.

---

## 2. Grundprinzip

Die Datenarchitektur wird in fünf Ebenen getrennt:

1. Stammdaten
2. Saison- und Spieldaten
3. Tipp- und Wertungsdaten
4. Darstellungs- und Seitenkonfiguration
5. System-, Prüf- und Archivdaten

Abgeleitete Dateien dürfen nicht manuell als zweite Wahrheit gepflegt werden.

---

## 3. Führende Stammdaten

### 3.1 `teams.json`

Rolle:

- zentrale Mannschaftsliste
- stabile Team-IDs
- Vereinsname
- Kurzname
- Land
- Aktivstatus
- nationale und internationale Zuordnung

Tatsächliche Hauptfelder:

- `schemaVersion`
- `aktualisiert`
- `hinweis`
- `teams[]`
- `teams[].id`
- `teams[].name`
- `teams[].kurzname`
- `teams[].land`
- `teams[].logo`
- `teams[].aktiv`
- `teams[].national`
- `teams[].international`

Bewertung:

`teams.json` ist die führende Datei für Mannschaftsidentitäten.

Andere Dateien dürfen Mannschaften nur über `teamId` referenzieren. Vereinsnamen, Kurzformen und Farben sollen nicht erneut in Spiel- oder Wettbewerbsdateien gepflegt werden.

---

### 3.2 `teilnehmer.json`

Rolle:

- zentrale Teilnehmerliste
- stabile Teilnehmer-IDs
- Anzeigenamen
- Teamzuordnung
- Aktivstatus
- Kicktipp-Importinformationen

Bewertung:

`teilnehmer.json` bleibt führend für alle Teilnehmeridentitäten und Teamzuordnungen.

Ranglisten- und Punktedateien dürfen Namen zu Anzeigezwecken enthalten, sollen aber aus der Teilnehmer-ID erzeugt werden.

---

### 3.3 `wettbewerbe.json`

Rolle:

- zentrale Wettbewerbsdefinitionen
- Wettbewerbs-ID
- Anzeigename
- Zielseite
- Filter für `spieldaten.json`
- Saisonstatus
- Zielwerte für Spiele und Tippspieltage

Bewertung:

`wettbewerbe.json` ist die führende Datei für Wettbewerbsidentitäten und Filterregeln.

Die separaten Dateien `bundesliga.json`, `dfb-pokal.json`, `champions-league.json`, `europa-league.json`, `relegation.json`, `dynamo-dresden.json`, `piratenkodex.json` und `weihnachtsregatta.json` enthalten derzeit überwiegend Seitentexte und Darstellungsinformationen. Sie sind keine führenden Spieldaten.

---

### 3.4 `wertungsregeln.json`

Rolle:

- zentrale Punkteparameter

Projektregel:

- Tendenz: 2 Punkte
- Differenz: 3 Punkte
- Ergebnis: 5 Punkte

Bewertung:

Die Regeln sollen nur hier gepflegt werden. Kopien in `tippspieltage.json`, `punkte.json` oder Quellcode dürfen langfristig nur noch erzeugte Momentaufnahmen sein.

---

## 4. Führende Saison- und Spieldaten

### 4.1 `spieldaten.json`

Rolle:

- zentrale saisonfähige Liste aller realen Spiele
- stabile Spiel-IDs
- Saison
- Wettbewerb
- Runde
- Spieltag
- Heim- und Auswärtsteam über IDs
- Datum und Anstoß
- Terminstatus
- Ergebnis
- Sonderwertungen

Tatsächliche Spielfelder:

- `id`
- `saison`
- `wettbewerb`
- `wettbewerbAnzeige`
- `runde`
- `spieltagNummer`
- `spielNummer`
- `datum`
- `datumAnzeige`
- `datumVon`
- `datumBis`
- `anstoss`
- `heimTeamId`
- `auswaertsTeamId`
- `heimtore`
- `auswaertstore`
- `status`
- `terminBestaetigt`
- `sonderwertungen`
- `notiz`
- `quelleStand`

Bewertung:

`spieldaten.json` ist die einzige vorgesehene führende Datei für reale Spiele, Termine, Teams, Status und Ergebnisse.

---

### 4.2 `tippspieltage.json`

Rolle:

- Abbildung der Kicktipp-Wertungsspieltage
- Bonusspieltag
- normale Spieltage
- Smuggleraufträge
- Piratenkodex
- Weihnachtsregatta
- Wertungsparameter einzelner Sonderformate

Bewertung:

`tippspieltage.json` ist führend für die logische Gruppierung realer Spiele zu Kicktipp-Spieltagen.

Die Datei ersetzt nicht `spieldaten.json`. Ein Tippspieltag referenziert oder gruppiert reale Spiele.

---

### 4.3 `smugglerauftraege.json`

Rolle:

- Zuordnung der 34 Smuggleraufträge zu realen Dynamo-Spielen
- Nummer und Name des Auftrags
- referenzierte `spielId`
- Kicktipp-Spieltag
- Auftragsstatus
- Seitentexte für den aktuellen Auftrag

Bewertung:

Die Zuordnung `Auftrag -> spielId` ist fachlich eigenständig und bleibt erhalten.

Termin, Gegner und Ergebnis dürfen jedoch nur aus `spieldaten.json` kommen. Die Felder unter `mission` enthalten derzeit teilweise doppelte Anzeigedaten und sind Migrationskandidaten.

---

### 4.4 `bonusfragen.json` und `bonusantworten.json`

Rolle:

- Definition der 25 Saisonfragen
- korrekte Lösungen und Wertung
- Teilnehmerantworten

Bewertung:

Beide Dateien bleiben getrennt:

- Fragen sind Konfiguration.
- Antworten sind Nutzdaten.

Die Bonusregeln sollen auf `wertungsregeln.json` beziehungsweise eine eindeutige Bonuskonfiguration verweisen, nicht mehrfach gepflegt werden.

---

## 5. Tipp- und Wertungsdaten

### 5.1 `tipps.json`

Rolle:

- zentrale Tippdaten
- Referenz auf Teilnehmer-ID
- Referenz auf Spiel-ID

Bewertung:

`tipps.json` ist führend für abgegebene Tipps.

---

### 5.2 Berechnete Dateien

Folgende Dateien sind abgeleitete Ergebnisse und keine Stammdaten:

- `punkte.json`
- `smugglerpunkte.json`
- `teampunkte.json`
- `wettbewerbspunkte.json`
- `spieltagpunkte.json`
- `ranglistenverlauf.json`
- `abgabezuverlaessigkeit.json`
- `tippfristen.json`
- `abgabe-erinnerungen.json`

Diese Dateien werden aus führenden Grunddaten erzeugt.

Sie dürfen veröffentlicht werden, müssen aber bei Änderungen ihrer Quellen neu berechnet werden.

---

### 5.3 `highscore.json`

Rolle:

- öffentliche, aufbereitete Highscore-Ausgabe
- Gesamtwertung
- Spieltagwertung
- Teamwertung
- Bonuswertung
- Rekorde

Bewertung:

`highscore.json` ist eine Präsentations- und Exportdatei.

Sie enthält Daten, die auch in `teilnehmer.json`, `punkte.json`, `teampunkte.json`, `spieltagpunkte.json` und Bonusdaten vorhanden sind. Langfristig soll sie automatisiert erzeugt und nicht manuell parallel gepflegt werden.

---

## 6. Hall of Fame und Archiv

### 6.1 `hall-of-fame.json`

Rolle:

- aktueller Champion
- Wettbewerbssieger
- Meisterchronik
- Rekorde
- Ehrenmitglieder
- Seitentexte und Metadaten

### 6.2 `saisonarchiv.json`

Rolle:

- archivierte Saisons
- Saisonstatus
- Meister
- Wettbewerbssieger
- Rekorde

### 6.3 `clubdaten.json`

Rolle:

- ältere beziehungsweise parallele Zusammenfassung von Champion, Siegern, Rekorden und Ehrenmitgliedern

Bewertung:

Zwischen diesen drei Dateien besteht deutliche fachliche Überschneidung.

Zielbild:

- `saisonarchiv.json` wird führend für historische Saisondaten.
- `hall-of-fame.json` wird daraus als öffentliche Darstellungsdatei erzeugt.
- `clubdaten.json` wird nach Prüfung aller Verbraucher abgelöst.

Eine sofortige Löschung ist nicht zulässig.

---

## 7. Tabellen- und Statistikdaten

### 7.1 `bundesliga-tabelle.json`

Rolle:

- gespeicherte Bundesliga-Tabelle
- Status
- Teams und Tabellenwerte

### 7.2 Tabelle aus `spieldaten.json`

`wettbewerb.js` kann Tabellen aus den zentralen Spielen berechnen.

Bewertung:

Wenn die Tabellenberechnung aus `spieldaten.json` vollständig funktioniert, ist `bundesliga-tabelle.json` eine abgeleitete Cache- oder Exportdatei.

Sie darf nicht dauerhaft manuell parallel zu den Ergebnissen gepflegt werden.

---

### 7.3 `topspieler.json`

Rolle:

- ältere Präsentationsdatei für Bestwerte

Bewertung:

Die Datei wird nach aktuellem Stand nur durch ältere Startseitenlogik beziehungsweise Dokumentation referenziert.

Sie ist ein Kandidat für Ablösung durch `highscore.json` oder zentral berechnete Rekorddaten.

---

## 8. Darstellungs- und Seitenkonfiguration

### 8.1 Wettbewerbsseiten

Folgende Dateien enthalten überwiegend Texte, Karten, Statusschilder, Buttons und Fußzeilen:

- `bundesliga.json`
- `dfb-pokal.json`
- `champions-league.json`
- `europa-league.json`
- `relegation.json`
- `dynamo-dresden.json`
- `piratenkodex.json`
- `weihnachtsregatta.json`

Bewertung:

Diese Dateien sind Inhaltskonfigurationen, keine Spieldaten.

Sie können bestehen bleiben, sollten aber ein gemeinsames Schema erhalten. Termine, Teams und Ergebnisse gehören nicht in diese Dateien.

---

### 8.2 `spieltag.json`

Rolle:

- Konfiguration der Kachel „Aktueller Spieltag“
- Überschriften
- Anzeigedauer
- Platzhalter
- Links und Buttontexte

Bewertung:

Die Datei soll nur Darstellung und Verhalten konfigurieren.

Die angezeigten Spiele müssen aus `spieldaten.json` und `tippspieltage.json` kommen.

---

### 8.3 `saison-2026-2027.json`

Rolle:

- Titel und Untertitel der Saisonübersicht
- Referenz auf die Wettbewerbsquelle

Bewertung:

Die Datei enthält saisonbezogene Präsentation.

Langfristig sollte sie durch eine allgemeine `saisons.json` oder durch Saisonmetadaten in einer zentralen Datei ersetzt werden, damit keine neue dateinamensgebundene Datei pro Saison nötig ist.

---

### 8.4 `site-data.json`

Rolle:

- ältere Startseiten-Datenstruktur
- Saison
- Countdown
- Beispielspiele
- Beispieltabelle
- Statistiken
- Champion

Bewertung:

`site-data.json` dupliziert Inhalte aus:

- `spieldaten.json`
- `teams.json`
- `bundesliga-tabelle.json`
- `highscore.json`
- `hall-of-fame.json`

Die Datei ist ein klarer Migrationskandidat. Vor Ablösung muss `app-v40.js` vollständig auf zentrale Quellen umgestellt werden.

---

### 8.5 `vor-saisonstart.json` und `beispiele/*.json`

Rolle:

- historische oder demonstrative Beispieldaten

Bewertung:

Diese Dateien gehören nicht zur produktiven führenden Datenhaltung.

Sie können später in einen klar gekennzeichneten Archiv- oder Testordner verschoben werden.

---

## 9. System- und Verwaltungsdaten

### 9.1 `datenregister.json`

Rolle:

- zentrales Register der Datenquellen
- Ladepfade
- Rollen und Beschreibungen
- Websiteversion

Bewertung:

Die Datei ist keine fachliche Datenquelle, sondern ein technisches Verzeichnis.

Sie soll nach jeder Migration aktualisiert werden.

---

### 9.2 Prüf- und Statusdateien

- `systemstatus.json`
- `RELEASE-MANIFEST.json`
- `RELEASE-AUDIT.json`
- `teilnehmer-importbericht.json`
- `datenqualitaet.json`, sofern im Adminexport vorhanden

Bewertung:

Diese Dateien dienen Prüfungen, Releases oder Importnachweisen.

Sie sind nicht Teil der fachlichen öffentlichen Datenbasis.

---

### 9.3 Erinnerungs- und Protokolldaten

- `erinnerungsprotokoll.json`
- `abgabe-erinnerungen.json`
- `abgabezuverlaessigkeit.json`

Bewertung:

Diese Dateien gehören zum lokalen administrativen Workflow.

Vor jeder öffentlichen Verwendung ist zu prüfen, ob personenbezogene oder interne Daten enthalten sind.

---

## 10. Schmugglersiegel

### 10.1 `schmugglersiegel-register.json`

Rolle:

- Team-ID
- Kürzel
- Primär- und Sekundärfarbe
- Siegelzuordnung

### 10.2 Überschneidung mit `teams.json`

`teams.json` enthält bereits Mannschaftsidentität und Kurzname. Das Siegelregister enthält zusätzliche Farbinformationen.

Zielbild:

- Team-ID, Name, Kurzname und Land bleiben in `teams.json`.
- Siegelparameter können entweder in `teams.json` integriert oder als klar abgegrenzte Design-Erweiterung referenziert werden.
- Zwei vollständige Listen aller Teams sollen langfristig vermieden werden.

---

## 11. Vorsorglicher UEFA-Pool

### `uefa-kandidaten-2026-27.json`

Rolle:

- nachvollziehbare Herkunft des erweiterten Kandidatenpools
- direkt qualifizierte und mögliche Qualifikationsteilnehmer

Bewertung:

Die Datei ist eine saisongebundene Import- und Nachweisdatei.

Führende Teamidentitäten bleiben in `teams.json`.

Der Kandidatenpool darf nicht separat als zweite Teamliste weitergepflegt werden.

---

## 12. Zielbild

### Führende Dateien

- `teams.json`
- `teilnehmer.json`
- `wettbewerbe.json`
- `spieldaten.json`
- `tippspieltage.json`
- `smugglerauftraege.json`
- `bonusfragen.json`
- `bonusantworten.json`
- `tipps.json`
- `wertungsregeln.json`
- `saisonarchiv.json`

### Automatisch erzeugte Dateien

- `punkte.json`
- `smugglerpunkte.json`
- `teampunkte.json`
- `wettbewerbspunkte.json`
- `spieltagpunkte.json`
- `ranglistenverlauf.json`
- `tippfristen.json`
- `abgabe-erinnerungen.json`
- `abgabezuverlaessigkeit.json`
- `highscore.json`
- `hall-of-fame.json`
- optional `bundesliga-tabelle.json`

### Reine Präsentationskonfiguration

- `spieltag.json`
- Wettbewerbsseiten-JSON
- allgemeine Saisonansicht

### Ablösungs- oder Archivkandidaten

- `site-data.json`
- `clubdaten.json`
- `topspieler.json`
- saisonfest benannte Präsentationsdateien
- Demonstrations- und Beispieldateien
- historische Release-Prüfdateien im produktiven Projektstamm

---

## 13. Migrationsregel

Keine Datei wird nur deshalb gelöscht, weil sie in diesem Dokument als Kandidat markiert ist.

Vor jeder Ablösung müssen geprüft werden:

1. alle HTML-Verbraucher
2. alle JavaScript-Verbraucher
3. alle Adminmodule
4. alle Export- und Berechnungsschritte
5. Desktop- und Mobilansicht
6. Fallback-Verhalten
7. Rückbaumöglichkeit

Die konkrete Reihenfolge steht in `MIGRATIONSMATRIX.md`.

## Wertungsrelevante Ergebnisfelder

`spieldaten.json` muss ein eindeutig nutzbares Ergebnis nach regulärer Spielzeit enthalten. Gemeint sind 90 Minuten einschließlich Nachspielzeit. Ergebnisse nach Verlängerung oder Elfmeterschießen müssen getrennt gespeichert und bei der Tippwertung ignoriert werden.

## Externe Sportdaten und Europa-League-Fallback – 4.7.2-HF3-HF6

Externe Sportdaten werden in `wettbewerb.js` ausschließlich für die visuelle Wettbewerbsdarstellung verarbeitet.

### OpenLigaDB-Daten
Die JSON-Antworten von OpenLigaDB werden nicht als führende OSC-Daten gespeichert. Sie werden zur Laufzeit gelesen und in Tabellen bzw. K.-o.-Paarungen transformiert.

### `europa-league-ko-2026.json`
Lokale Rückfallebene für die Europa-League-K.-o.-Phase 2026/27.

Struktur:
- `wettbewerb`
- `saison`
- `quelle`
- `status`
- `runden.achtelfinale`
- `runden.viertelfinale`
- `runden.halbfinale`
- `runden.finale`

Die Datei startet leer. Sie darf nur mit verifizierten realen Paarungen und Ergebnissen befüllt werden. Sie ersetzt keine OSC-Spieldaten und keine Admin-Ergebniseingabe.
