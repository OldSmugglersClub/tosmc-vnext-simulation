# ARCHITEKTUR – THE OLD SMUGGLERS CLUB

## 1. Zweck dieses Dokuments

Dieses Dokument beschreibt den tatsächlich vorhandenen technischen Aufbau der Website auf Basis der öffentlichen Projektversion **4.4.1** und der ergänzend geprüften lokalen Administration **v4.0.5**. Es dient als verbindliche Bestandsaufnahme vor der geplanten Zentralisierung der Datenhaltung.

Es dokumentiert den Ist-Zustand. Es nimmt noch keine Datenmigration und keine Änderung an öffentlichen Seiten vor.

---

## 2. Technischer Grundaufbau

Die Website ist eine statische GitHub-Pages-Anwendung ohne serverseitiges Backend.

Verwendete Technologien:

- HTML für Seiten und Komponenten
- CSS für Layout, Gestaltung und responsive Darstellung
- JavaScript für Datenladung, Filterung, Berechnung und Darstellung
- JSON für Saison-, Wettbewerbs-, Ranglisten- und Verwaltungsdaten
- Python-Skripte ausschließlich als lokale Hilfsmittel für Import, Prüfung und Release-Erstellung

Die öffentlichen Seiten lesen ihre Daten im Browser über `fetch()` aus JSON-Dateien. Änderungen an Daten werden daher durch Bearbeitung und Upload der JSON-Dateien veröffentlicht.

---

## 3. Haupteinstieg und öffentliche Bereiche

```text
index.html
│
├── Startzentrale / Countdown
│   └── site-data.json
│
├── Aktueller Spieltag
│   ├── datenregister.json
│   ├── wettbewerbe.json
│   ├── spieldaten.json
│   ├── teams.json
│   └── tippspieltage.json
│
├── Smuggleraufträge-Teaser
│   └── smugglerauftraege.json
│
├── Hall-of-Fame-Teaser
│   └── hall-of-fame.json
│
├── Wettbewerbsnavigation
│   └── wettbewerbe.json
│
└── Highscore-Teaser
    ├── highscore-teaser.js
    └── highscore.json
```

Weitere öffentliche Seiten:

```text
hall-of-fame.html
└── hall-of-fame.json

highscore.html
├── highscore.js
├── highscore.json
├── hall-of-fame.json
├── punkte.json
└── teilnehmer.json

saison-2026-2027.html
├── saisonuebersicht.js
├── saison-2026-2027.json
├── wettbewerbe.json
├── spieldaten.json
└── tippspieltage.json
```

---

## 4. Wettbewerbsseiten

Die Wettbewerbsseiten verwenden einen gemeinsamen technischen Unterbau:

```text
bundesliga.html
dfb-pokal.html
champions-league.html
europa-league.html
relegation.html
dynamo-dresden.html
piratenkodex.html
weihnachtsregatta.html
        │
        ├── wettbewerb.css
        ├── wettbewerb.js
        ├── datenregister.js
        ├── datenmodell.js
        ├── wettbewerbe.json
        ├── spieldaten.json
        ├── teams.json
        ├── tippspieltage.json
        └── jeweilige <seitenname>.json
```

`wettbewerb.js` erkennt den Wettbewerb aus dem Dateinamen der aufgerufenen HTML-Seite. Beispiel:

- `bundesliga.html` → `bundesliga`
- `dfb-pokal.html` → `dfb-pokal`
- `dynamo-dresden.html` → `dynamo-dresden`

Aus diesem Namen wird zusätzlich die gleichnamige JSON-Datei geladen. Die zentrale Spielliste stammt bereits aus `spieldaten.json`. Wettbewerbsspezifische Metadaten und ergänzende Inhalte liegen weiterhin teilweise in separaten JSON-Dateien.

Für die Bundesliga wird zusätzlich `bundesliga-tabelle.json` berücksichtigt. Liegen dort keine manuellen Tabellenwerte vor, kann die Tabelle aus abgeschlossenen Bundesliga-Spielen in `spieldaten.json` berechnet werden.

---

## 5. Zentrales Datenregister

`datenregister.json` ist das zentrale Verzeichnis gemeinsam genutzter Datenquellen.

```text
datenregister.json
├── wettbewerbe          → wettbewerbe.json
├── spiele               → spieldaten.json
├── teams                → teams.json
├── tippspieltage        → tippspieltage.json
├── highscore            → highscore.json
├── hallOfFame           → hall-of-fame.json
├── clubdaten            → clubdaten.json
├── saisonuebersicht     → saison-2026-2027.json
├── spieltag             → spieltag.json
├── bundesligaTabelle    → bundesliga-tabelle.json
├── teilnehmer           → teilnehmer.json
├── tipps                → tipps.json
├── wertungsregeln       → wertungsregeln.json
├── punkte               → punkte.json
├── bonusfragen          → bonusfragen.json
├── bonusantworten       → bonusantworten.json
├── smugglerauftraege    → smugglerauftraege.json
├── smugglerpunkte       → smugglerpunkte.json
├── teampunkte           → teampunkte.json
├── wettbewerbspunkte    → wettbewerbspunkte.json
├── spieltagpunkte       → spieltagpunkte.json
├── ranglistenverlauf    → ranglistenverlauf.json
├── saisonarchiv         → saisonarchiv.json
├── tippfristen          → tippfristen.json
├── abgabeErinnerungen   → abgabe-erinnerungen.json
├── erinnerungsprotokoll → erinnerungsprotokoll.json
└── weitere Prüf- und Importdaten
```

`datenregister.js` stellt die Pfade für JavaScript-Module bereit. Mehrere Module besitzen zusätzlich direkte Fallback-Pfade. Das erhöht Robustheit, erzeugt aber auch doppelte Pfaddefinitionen, die bei einer späteren Zentralisierung geprüft werden müssen.

---

## 6. Zentrale und dezentrale Datenhaltung im Ist-Zustand

### Bereits weitgehend zentral

- Spiele: `spieldaten.json`
- Teams: `teams.json`
- Wettbewerbsdefinitionen: `wettbewerbe.json`
- Tippspieltage: `tippspieltage.json`
- Datenpfade: `datenregister.json`
- Hall of Fame: `hall-of-fame.json`
- Highscore-Grunddaten: `highscore.json`

### Noch parallel oder redundant gepflegt

- `spieltag.json` neben der Ableitung aktueller Ereignisse aus `spieldaten.json`
- einzelne Wettbewerbsdateien neben `wettbewerbe.json` und `spieldaten.json`
- `site-data.json` für Start- und Saisonstatus
- `saison-2026-2027.json` als separate Saisonübersicht
- `smugglerauftraege.json` neben Sonderwertungsangaben in zentralen Spieldaten
- direkte JSON-Pfade in einzelnen Skripten zusätzlich zum Datenregister

Diese Parallelität ist der zentrale Ansatzpunkt der geplanten Datenkonsolidierung. Vor einer Migration muss für jedes Feld entschieden werden, welche Datei künftig die führende Quelle ist.

---

## 7. Highscore und Wertungsdaten

```text
highscore.html
└── highscore.js
    ├── highscore.json
    ├── hall-of-fame.json
    ├── punkte.json
    └── teilnehmer.json
```

Weitere Wertungs- und Verwaltungsdaten:

- `tipps.json`
- `wertungsregeln.json`
- `spieltagpunkte.json`
- `wettbewerbspunkte.json`
- `smugglerpunkte.json`
- `teampunkte.json`
- `ranglistenverlauf.json`

Die öffentlichen Highscore-Bereiche zeigen keine technischen Hinweise. Verwaltungs- und Berechnungsseiten bleiben getrennt vom öffentlichen Navigationsfluss.

---

## 8. Bonuswettbewerb

```text
bonuspflege.html
├── bonuspflege.js
├── bonusfragen.json
├── bonusantworten.json
├── teilnehmer.json
└── punkte- und Wertungsdaten
```

Fachliche Festlegung:

- Bonuswettbewerb ist Tippspieltag 1
- 25 Fragen
- 5 Punkte je richtiger Antwort
- maximal 125 Punkte
- Punkte erscheinen separat und in der Gesamtwertung
- Smugglerauftrag „Auftakt“ beginnt mit Tippspieltag 2

---

## 9. Lokaler Adminbereich

Der lokale Adminbereich wurde in Version 4.4.2 erstmals vollständig als eigenständige zweite Anwendung geprüft. Grundlage ist das Paket `the-old-smugglers-club-admin-v4.0.5-lokal.zip`.

```text
Öffentliche Website (GitHub Pages)
        ▲
        │ gezielter manueller Upload exportierter JSON-Dateien
        │
Lokaler Adminbereich (localhost:8765)
├── Pflege: Spiele, Wettbewerbe, Teilnehmer, Tipps, Bonus, Smuggleraufträge
├── Berechnung: Gesamt-, Team-, Wettbewerb-, Spieltag- und Smugglerwertung
├── Kontrolle: Datenqualität, Fristen, Erinnerungen, Zuverlässigkeit
└── Export: vollständige JSON- und teilweise CSV-Dateien
```

Zentrale Einstiegsseite ist `admin.html`; gestartet wird die Anwendung über `ADMIN_STARTEN.bat`. Der Adminbereich verändert weder lokale Ausgangsdateien noch GitHub automatisch. Exportierte Dateien müssen kontrolliert ersetzt und anschließend gezielt veröffentlicht werden.

Die vollständige Bestandsaufnahme, Modulzuordnung, Datenflüsse, Stärken, Risiken und empfohlene weitere Schritte stehen in `ADMIN-SYSTEMANALYSE.md`.

Wesentliche Architekturmerkmale:

- eigenständige lokale Anwendung mit 223 Dateien
- Trennung von Pflege-, Berechnungs- und Kontrollmodulen
- zentrale JSON-Daten und stabile IDs
- manuelle Export- und Veröffentlichungskette
- teilweise zentrale Pfade über `datenregister.json`, teilweise direkte Fallbackpfade
- relevante Versions- und Dokumentationsabweichungen innerhalb des Adminpakets

## 10. Gemeinsame JavaScript-Bausteine

- `datenregister.js` – lädt und verwaltet Pfade aus `datenregister.json`
- `datenmodell.js` – gemeinsame Datenprüfung und Modellfunktionen
- `wettbewerb.js` – gemeinsame Logik aller Wettbewerbsseiten
- `highscore.js` – Highscore, Teamduell, Bonuswertung, Podium und Ranglisten
- `highscore-teaser.js` – reduzierte Highscore-Darstellung auf der Startseite
- `saisonuebersicht.js` – Saisonübersicht aus mehreren zentralen Datenquellen
- `accessibility-v33.js` – gemeinsame Bedienungs- und Zugänglichkeitsfunktionen
- `performance-v247.js` – gemeinsame Performance-Unterstützung

---

## 11. GitHub-Pages- und Release-Struktur

Die Website wird direkt aus dem Repository-Hauptverzeichnis veröffentlicht.

Wesentliche Dateien:

- `index.html`
- `CNAME`
- `VERSION.txt`
- `README.md`
- `CHANGELOG.md`
- `PromptManual/PROJECT_MANUAL.md`
- `ARCHITEKTUR.md`

Hilfsskripte für lokale Releases und Prüfungen liegen unter `scripts/`.

Jedes Release muss enthalten:

- vollständiges Projektpaket
- separates Updatepaket
- aktualisierte Versionsnummer
- CHANGELOG
- README
- Release Notes
- Liste „Ersetzen / Neu / Löschen“

---

## 12. Erkannte Architektur-Risiken

Diese Punkte werden nur dokumentiert und in dieser Version nicht verändert:

1. **Mehrere Quellen für ähnliche Informationen**  
   Saisonstatus, aktueller Spieltag und Wettbewerbsdaten liegen teilweise parallel vor.

2. **Direkte Pfade zusätzlich zum Datenregister**  
   Einzelne Skripte enthalten Fallback-Dateinamen. Bei Umbenennungen müssen daher Register und Code geprüft werden.

3. **Historische Dateien im Projektstamm**  
   Zahlreiche ältere Release Notes, Anleitungen und Testdateien befinden sich im veröffentlichten Projektverzeichnis. Eine Bereinigung darf erst nach einer Abhängigkeitsprüfung und ausdrücklicher Freigabe erfolgen.

4. **Saisonname in Dateinamen**  
   `saison-2026-2027.json` und `saison-2026-2027.html` erfordern beim Saisonwechsel derzeit Dateiarbeit oder Weiterleitungslogik.

5. **Getrennte Wettbewerbsdateien**  
   Sie enthalten teilweise Inhalte, die langfristig aus `wettbewerbe.json` und `spieldaten.json` ableitbar sein könnten.

---

## 13. Zielarchitektur für die nächste Entwicklungsphase

Die konkrete Migration wird erst nach gesonderter Analyse und Freigabe umgesetzt.

Angestrebtes Prinzip:

```text
datenregister.json
│
├── clubdaten.json
├── saison.json
├── wettbewerbe.json
├── spieldaten.json
├── teams.json
├── tippspieltage.json
├── teilnehmer.json
├── tipps.json
├── wertungsregeln.json
├── hall-of-fame.json
└── abgeleitete Ausgaben / Ranglisten
```

Dabei sollen:

- Termine nur einmal gepflegt werden
- Wettbewerb und Sonderwertung nur einmal zugeordnet werden
- Startseite, Saisonübersicht und Wettbewerbsseiten dieselben Spieldaten verwenden
- ein Saisonwechsel möglichst ohne HTML-Änderung möglich sein
- bestehende öffentliche Darstellung unverändert bleiben

---

## 14. Nächster fachlicher Schritt

Vor einer Änderung der Datenstruktur ist eine Feld-für-Feld-Matrix zu erstellen:

- Information
- derzeitige Quelldatei(en)
- verwendende Seite(n)
- künftig führende Quelle
- notwendige Migration
- Rückwärtskompatibilität
- Testfälle Desktop und Mobil

Erst nach Freigabe dieser Migrationsmatrix darf die zentrale Datenhaltung technisch umgebaut werden.


## Ergänzende Datenarchitektur

Die Feld- und Migrationsanalyse ist ab Version 4.5.0 ausgelagert in:

- `DATENARCHITEKTUR.md`
- `MIGRATIONSMATRIX.md`

Diese Dokumente sind vor jeder strukturellen Änderung an JSON-Dateien zu prüfen.

## Externe Wettbewerbsdaten ab Website 4.7.2-HF3-HF6

`wettbewerb.js` besitzt zusätzlich einen reinen Darstellungsdatenpfad für externe Sportdaten. Dieser Datenpfad ist von der OSC-Fachlogik getrennt.

### OpenLigaDB
- DFB-Pokal: `https://api.openligadb.de/getmatchdata/dfb/2026`
- Champions League: `https://api.openligadb.de/getmatchdata/ucl/2026`
- Europa League: `https://api.openligadb.de/getmatchdata/uel/2026`

Die Abfragen erfolgen clientseitig über `fetch()` auf den statischen GitHub-Pages-Seiten. OpenLigaDB ist eine optionale Darstellungsquelle; ein Ausfall darf die OSC-Wertung nicht blockieren.

### DFB-Pokal
Der Turnierbaum verwendet Achtelfinale, Viertelfinale, Halbfinale und Finale. Die Verbindungslinien werden datenbasiert über tatsächlich in der Folgerunde wieder auftauchende Teams gezogen. Nicht vorhandene K.-o.-Runden werden nicht durch Vorsaisondaten ersetzt.

### Champions League
Die Ligaphasen-Tabelle wird aus den OpenLigaDB-Spielen mit den Rundenbezeichnungen `1. Spieltag` bis `8. Spieltag` berechnet. Dadurch bleiben spätere K.-o.-Spiele aus der Tabelle ausgeschlossen. Der K.-o.-Baum enthält Playoffs, Achtelfinale, Viertelfinale, Halbfinale und Finale. Hin- und Rückspiele werden teambezogen zu einem Gesamtergebnis aggregiert.

### Europa League
Die Europa League nutzt OpenLigaDB rundenweise als Primärquelle. Die lokale Datei `europa-league-ko-2026.json` ist die optionale Rückfallebene. Eine Runde wird nur dann aus OpenLigaDB übernommen, wenn sie vollständig verwertbar ist. Bei einem verifizierten Widerspruch zwischen OpenLigaDB und lokalem Fallback erhält der lokale Fallback Vorrang.

### Architekturschutz
Externe Tabellen und Turnierbäume sind ausschließlich Wettbewerbsinformation. Sie verändern weder Admin-Daten noch Kicktipp-Importe, Highscore, Teilnehmerdaten oder OSC-Wertungen.
