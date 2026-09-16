# ADMIN-SYSTEMANALYSE – THE OLD SMUGGLERS CLUB

## 1. Zweck und geprüfter Stand

Dieses Dokument beschreibt den tatsächlich vorliegenden lokalen Administrationsbereich **The Old Smugglers Club Admin v4.0.5**.

Geprüfte Grundlage:

- Paket: `the-old-smugglers-club-admin-v4.0.5-lokal.zip`
- Umfang: 223 Dateien
- Betriebsart: lokale statische Webanwendung mit lokalem HTTP-Server
- Start: `ADMIN_STARTEN.bat`
- Zieladresse: `http://localhost:8765/admin.html`

Der Adminbereich ist technisch vom öffentlichen GitHub-Pages-Auftritt getrennt und darf nicht vollständig in das öffentliche Repository hochgeladen werden.

---

## 2. Systemgrenze

```text
The Old Smugglers Club
│
├── Öffentliche Website
│   ├── GitHub Pages
│   ├── öffentliche HTML-/CSS-/JS-Dateien
│   └── veröffentlichte JSON-Daten
│
└── Lokaler Adminbereich
    ├── läuft nur auf dem Windows-PC
    ├── liest lokale JSON-Dateien
    ├── verarbeitet und prüft Daten im Browser
    ├── erzeugt neue JSON-/CSV-Dateien als Download
    └── verändert GitHub nicht automatisch
```

Wichtig: Der Adminbereich schreibt die vorhandenen Dateien nicht direkt zurück. Der Ablauf ist weiterhin manuell:

1. Daten im Adminmodul bearbeiten oder berechnen.
2. neue JSON-Datei exportieren.
3. gleichnamige Datei im lokalen Adminordner ersetzen.
4. bei öffentlicher Wirkung dieselbe Datei gezielt im GitHub-Repository ersetzen.

---

## 3. Technischer Betrieb

### Startkomponenten

- `ADMIN_STARTEN.bat` startet den lokalen Betrieb.
- `admin-server.ps1` stellt die Dateien unter `localhost:8765` bereit.
- `admin.html` ist die zentrale Einstiegsseite.

Der lokale Server ist notwendig, weil Browser bei direktem Öffnen über `file://` den Zugriff auf JSON-Dateien häufig blockieren.

### Verwendete Technologien

- HTML für Module und Oberflächen
- CSS für die lokale Adminoberfläche
- JavaScript für Laden, Bearbeiten, Prüfen, Berechnen und Exportieren
- JSON als Datenbasis und Austauschformat
- CSV als zusätzlicher Export für Auswertungen
- PowerShell/Batch für den lokalen Start
- Python für Import-, Release- und Prüfaufgaben

---

## 4. Zentrale Navigation und Module

`admin.html` verlinkt die wichtigsten Pflege- und Auswertungsmodule.

### Datenpflege

| Modul | Aufgabe | Führende Exportdatei |
|---|---|---|
| `spielpflege.html` | Spiele, Termine, Ergebnisse und Status pflegen | `spieldaten.json` |
| `wettbewerbspflege.html` | Wettbewerbe und Metadaten pflegen | `wettbewerbe.json` |
| `team-teilnehmerpflege.html` | Teams, Teilnehmer und Zuordnungen pflegen | `teams.json`, `teilnehmer.json` |
| `tipppflege.html` | Tipps je Teilnehmer und Spiel pflegen | `tipps.json` |
| `bonuspflege.html` | Bonusfragen, Lösungen und Antworten verwalten | `bonusfragen.json`, `bonusantworten.json` |
| `smugglerpflege.html` | Dynamo-Smuggleraufträge und Spielzuordnung verwalten | `smugglerauftraege.json` |
| `saisonarchiv.html` | abgeschlossene Saisons und Titel archivieren | `saisonarchiv.json` |

### Berechnung und Wertung

| Modul | Eingaben | Ergebnis |
|---|---|---|
| `punkteberechnung.html` | Tipps, Bonusdaten, Regeln und Spieldaten | `punkte.json` |
| `smugglerwertung.html` | Smuggleraufträge, Tipps, Teilnehmer, Spiele, Regeln | `smugglerpunkte.json` |
| `teamwertung.html` | Einzelpunkte und Teilnehmerzuordnung | `teampunkte.json` |
| `wettbewerbswertung.html` | Einzelpunkte und Wettbewerbe | `wettbewerbspunkte.json` |
| `spieltagwertung.html` | Einzelpunkte, Spieldaten und Wettbewerbe | `spieltagpunkte.json` |
| `ranglistenverlauf.html` | Punktedaten und Spielabschnitte | `ranglistenverlauf.json` |

### Kontrolle und Organisation

| Modul | Aufgabe | Export |
|---|---|---|
| `daten-cockpit.html` | lesende Gesamtübersicht der Datenquellen | kein führender Nutzdatenexport |
| `datenqualitaet.html` | Pflichtfelder, IDs, Referenzen, Termine und Tippwerte prüfen | `datenqualitaet.json`, CSV |
| `tippfristen.html` | bestätigte Fristen und fehlende Tipps prüfen | `tippfristen.json`, CSV |
| `abgabe-erinnerungen.html` | Erinnerungstexte für fehlende Abgaben vorbereiten | `abgabe-erinnerungen.json`, CSV/Text |
| `erinnerungsprotokoll.html` | versendete Erinnerungen dokumentieren | `erinnerungsprotokoll.json`, CSV |
| `abgabezuverlaessigkeit.html` | Abgabequote und organisatorischen Teilnehmerstatus auswerten | `abgabezuverlaessigkeit.json`, CSV |
| `admin.html` | Datenquellen prüfen, Systembericht und Sicherung erzeugen | Prüf-/Sicherungsdateien |

---

## 5. Datenfluss

Der grundlegende Datenfluss ist bereits sinnvoll getrennt:

```text
Pflegedaten
├── spieldaten.json
├── wettbewerbe.json
├── teams.json
├── teilnehmer.json
├── tipps.json
├── bonusfragen.json
├── bonusantworten.json
└── smugglerauftraege.json
        │
        ▼
Berechnungs- und Prüfmodule
├── Punkteberechnung
├── Smugglerwertung
├── Teamwertung
├── Wettbewerbswertung
├── Spieltagwertung
├── Fristenkontrolle
└── Datenqualitätsprüfung
        │
        ▼
Abgeleitete Daten
├── punkte.json
├── smugglerpunkte.json
├── teampunkte.json
├── wettbewerbspunkte.json
├── spieltagpunkte.json
├── ranglistenverlauf.json
├── tippfristen.json
└── weitere Prüf- und Organisationsdaten
        │
        ▼
Gezielter manueller Upload in das öffentliche Repository
```

Die Architektur ist damit grundsätzlich datengetrieben. Der größte manuelle Aufwand liegt derzeit nicht in der Berechnung, sondern im kontrollierten Ersetzen der exportierten Dateien.

---

## 6. Zentrale Infrastruktur

### `datenregister.json` und `datenregister.js`

Das Datenregister bündelt die Pfade gemeinsam genutzter Datenquellen. Mehrere Module verwenden es bereits. Einzelne Skripte besitzen jedoch weiterhin direkte Dateinamen oder Fallbackpfade.

Folge: Die zentrale Datenhaltung ist vorbereitet, aber noch nicht vollständig durchgesetzt.

### `datenmodell.js`

Enthält gemeinsame Modell- und Prüffunktionen für Wettbewerbe, Spiele, Teams und Tippspieltage. Dies reduziert bereits doppelte Logik.

### Release- und Prüfwerkzeuge

Vorhanden sind unter anderem:

- `scripts/release_audit.py`
- `scripts/build_release_manifest.py`
- `scripts/update_data.py`
- `RELEASE-MANIFEST.json`
- `RELEASE-AUDIT.json`

Diese Werkzeuge belegen, dass der Adminbereich bereits eigene Release- und Integritätsfunktionen besitzt.

---

## 7. Stärken des vorhandenen Adminbereichs

1. **Klare Trennung vom öffentlichen Auftritt**  
   Adminfunktionen sind lokal und nicht öffentlich erreichbar.

2. **Datengetriebene Pflege**  
   Zentrale Kernbereiche werden über JSON statt durch direkte HTML-Änderungen gepflegt.

3. **Stabile IDs**  
   Teilnehmer, Spiele, Wettbewerbe und Tipps werden überwiegend über IDs referenziert.

4. **Kontrollierter Export**  
   Der Browser erzeugt vollständige, gleichnamige JSON-Dateien. Das reduziert Teiländerungen und unvollständige Uploads.

5. **Mehrstufige Qualitätskontrolle**  
   Datenqualität, Tippfristen, Erinnerungen und Zuverlässigkeit sind eigene Module.

6. **Getrennte Wertungsdateien**  
   Gesamt-, Team-, Wettbewerbs-, Spieltag- und Smugglerwertungen sind nachvollziehbar getrennt.

7. **Keine automatische Veröffentlichung**  
   Das verhindert unbeabsichtigte Änderungen am produktiven GitHub-Stand.

---

## 8. Kritische Befunde

### 8.1 Versions- und Dokumentationsabweichungen

Das Paket heißt **v4.0.5**, während mehrere enthaltene Dokumente ältere Stände nennen:

- `README.md` nennt als aktuellen Stand Version 3.25.
- `README-ADMIN.md` nennt Version 4.0.4.
- `ADMIN-BEDIENUNGSANLEITUNG.md` verweist auf das Paket v4.0.4.
- einzelne Release- und GitHub-Dateien stammen aus vielen historischen Zwischenversionen.

Das ist kein unmittelbarer Funktionsfehler, aber ein erheblicher Wartungsfehler. Ein Anwender kann nicht sicher erkennen, welche Anleitung für v4.0.5 verbindlich ist.

### 8.2 Adminpaket enthält öffentliche Websitebestandteile

Das lokale Paket enthält neben den Adminmodulen auch öffentliche Seiten und öffentliche Daten. Das kann für lokale Vorschau sinnvoll sein, vergrößert aber die Gefahr, versehentlich das falsche Paket oder zu viele Dateien nach GitHub zu übertragen.

### 8.3 Hoher Altlastenanteil

Im Paket liegen zahlreiche historische:

- `GITHUB-UPDATE-*`
- `RELEASE_NOTES_*`
- alte Anleitungen
- doppelte Hilfsskripte

Beispiel: `update_data.py` ist im Hauptverzeichnis und zusätzlich unter `scripts/` vorhanden.

Diese Dateien sind teilweise nachvollziehbare Historie, erschweren aber die Orientierung im produktiven Adminordner.

### 8.4 Manuelle Dateiersetzung bleibt fehleranfällig

Der Export ist kontrolliert, aber danach müssen Dateien manuell:

- im Download-Ordner gefunden,
- lokal ersetzt,
- gegebenenfalls nach GitHub hochgeladen werden.

Mögliche Fehler:

- falsche Datei hochgeladen
- Export nicht in den lokalen Adminordner übernommen
- lokale und öffentliche Datenstände laufen auseinander
- abhängige Wertungen werden nach einer Datenänderung nicht neu berechnet

### 8.5 Abhängige Berechnungsreihenfolge ist nicht zentral geführt

Nach Änderungen an Spielen, Tipps, Teilnehmern oder Bonusantworten müssen abhängige Dateien in der richtigen Reihenfolge neu erzeugt werden. Diese Reihenfolge ist technisch vorhanden, aber noch nicht als geführter Arbeitsablauf im Adminzentrum abgebildet.

### 8.6 Direkte Pfade neben Datenregister

Mehrere Module nutzen zusätzlich direkte JSON-Dateinamen. Das ist robust, verhindert aber eine vollständig zentrale Pfadverwaltung.

### 8.7 Handbuch ist noch kein vollständiges Bedienhandbuch

`ADMIN-HANDBUCH.md` enthält derzeit nur eine Überschrift und einen Satz. Die brauchbare Start- und Betriebsanleitung liegt in `ADMIN-BEDIENUNGSANLEITUNG.md`, beschreibt aber nicht alle Module Schritt für Schritt.

---

## 9. Sicherheits- und Datenschutzbewertung

Positiv:

- lokaler Betrieb ohne öffentlichen Adminzugang
- keine automatische GitHub-Schreibfunktion
- keine automatische Nachrichtenübermittlung
- E-Mail-Adressen werden laut Dokumentation nicht in die zentrale Teilnehmerliste übernommen

Zu beachten:

- jeder mit Zugriff auf den PC und den entpackten Ordner kann den Adminbereich verwenden
- Sicherungen können Teilnehmer- und Tippdaten enthalten
- ursprüngliche Kicktipp-Exporte mit E-Mail-Adressen dürfen nicht in das öffentliche Repository gelangen
- der lokale Adminordner sollte regelmäßig gesichert und nicht in öffentlich synchronisierte Ordner gelegt werden, sofern diese unkontrolliert geteilt werden

---

## 10. Empfohlene Zielstruktur des Adminpakets

Noch keine Umsetzung; zunächst nur Zielbild:

```text
Old-Smugglers-Club-Admin/
├── ADMIN_STARTEN.bat
├── admin-server.ps1
├── admin.html
├── modules/
│   ├── pflege/
│   ├── wertung/
│   └── kontrolle/
├── assets/
├── data/
├── scripts/
├── docs/
│   ├── ADMIN_HANDBUCH.md
│   ├── DATENSTRUKTUR.md
│   ├── BACKUP_RESTORE.md
│   └── CHANGELOG.md
└── VERSION.txt
```

Eine solche Umstrukturierung darf nicht unmittelbar erfolgen, weil viele HTML- und JavaScript-Dateien derzeit relative Pfade erwarten. Sie benötigt eine eigene Migration und vollständige Tests.

---

## 11. Empfohlene weitere Reihenfolge

### Schritt 1 – vollständiges Adminhandbuch

Auf Basis des tatsächlichen v4.0.5-Systems erstellen:

- Start und Beenden
- Datensicherung
- Module und Zweck
- korrekte Bearbeitungsreihenfolge
- Export und lokaler Dateiaustausch
- GitHub-Veröffentlichung
- Saisonwechsel
- Fehlerbehebung

### Schritt 2 – Abhängigkeitsmatrix

Für jede führende Datei dokumentieren:

- welches Modul sie ändert
- welche Auswertungen danach neu berechnet werden müssen
- welche öffentlichen Seiten sie verwenden
- welche Exportdateien anschließend auf GitHub gehören

### Schritt 3 – Adminbereich vereinfachen

Erst nach Dokumentation und Freigabe bewerten:

- zentrale Aufgabenübersicht
- geführte Reihenfolge nach Datenänderungen
- eindeutige Anzeige „lokaler Stand / zu veröffentlichende Dateien“
- weniger historische Dateien im Arbeitsordner
- konsistente Versionsanzeige

### Schritt 4 – Saisonwechsel optimieren

Ziel:

- neue Saison überwiegend durch JSON-Pflege
- keine unnötigen HTML-Anpassungen
- kontrollierter Archiv- und Rücksetzablauf

---

## 12. Ergebnis

Der lokale Adminbereich v4.0.5 ist funktional deutlich weiter entwickelt, als die vorhandenen Kurzhandbücher erkennen lassen. Er bildet bereits eine eigenständige zweite Anwendung neben der öffentlichen Website.

Die technische Grundidee ist tragfähig: lokale Pflege, zentrale JSON-Dateien, getrennte Prüf- und Wertungsmodule sowie kontrollierter manueller Export.

Der größte aktuelle Mangel ist nicht fehlende Funktionalität, sondern **fehlende Konsolidierung und Dokumentation**. Vor strukturellen Änderungen sollten daher zuerst das vollständige Adminhandbuch und eine Abhängigkeitsmatrix erstellt werden.
