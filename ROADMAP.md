# ROADMAP – THE OLD SMUGGLERS CLUB

## 1. Zweck

Dieses Dokument enthält ausschließlich den freigegebenen Entwicklungsplan des Projekts **The Old Smugglers Club**.

Es trennt abgeschlossene Arbeiten, verbindlich offene Aufgaben und spätere Ideen. Technische Details gehören in `ARCHITEKTUR.md`, dauerhafte Regeln in `PromptManual/PROJECT_MANUAL.md` und konkrete Versionsänderungen in `CHANGELOG.md`.

---

## 2. Aktueller Stand

**Aktuelle Projektlinie:** Version 4.4.x  
**Letzter produktiver Funktionsstand:** Version 4.4.12
**Ziel:** Version 5.0 LTS

Die öffentlichen Bereiche sind produktionsreif. Die verbleibenden Arbeiten betreffen überwiegend Datenarchitektur, Administration, Dokumentation und Gesamtqualität.

---

## 3. Version 4.x – weitgehend abgeschlossen

### Öffentliche Bereiche

- [x] Startzentrale / Willkommen
- [x] Countdown
- [x] Aktueller Spieltag
- [x] Wettbewerbsübersicht
- [x] Bundesliga
- [x] DFB-Pokal
- [x] Champions League
- [x] Europa League
- [x] Relegation
- [x] Smuggleraufträge
- [x] Piratenkodex
- [x] Weihnachtsregatta
- [x] Bonuswettbewerb
- [x] Highscore
- [x] Hall of Fame
- [x] Kummerkasten
- [x] Saisonübersicht

### Verbindliche Fachlogik

- [x] Bonuswettbewerb ist Tippspieltag 1
- [x] 25 Bonusfragen mit je 5 Punkten
- [x] maximal 125 Bonuspunkte
- [x] Bonuspunkte fließen in die Gesamtwertung ein
- [x] Smugglerauftrag „Auftakt“ beginnt mit Tippspieltag 2
- [x] öffentliche Bereiche enthalten keine Wartungs- oder Technikhinweise
- [x] Adminseiten sind aus dem öffentlichen Navigationsfluss getrennt

### Dokumentation

- [x] `PromptManual/PROJECT_MANUAL.md`
- [x] `ARCHITEKTUR.md`
- [x] einheitlicher Release-Workflow mit vollständigem Paket und Updatepaket

---

## 4. Version 4.4.x – Dokumentation des Ist-Zustands

### 4.4.0 – Architektur

- [x] technische Bestandsaufnahme
- [x] Seiten- und Datenabhängigkeiten dokumentiert
- [x] zentrale und redundante Datenquellen identifiziert
- [x] Zielbild für zentrale Datenhaltung festgehalten

### 4.4.1 – Roadmap

- [x] Entwicklungsphasen verbindlich gegliedert
- [x] Reihenfolge bis Version 5.0 festgelegt
- [x] abgeschlossene und offene Aufgaben getrennt

### 4.4.6 – Pilotintegration Schmugglersiegel

- [x] farbige SVG-Siegel für 1. FC Nürnberg und SG Dynamo Dresden erstellt
- [x] hervorgehobene Paarung in „Aktueller Spieltag“ integriert
- [x] Desktop-Abstände kompakter ausgerichtet
- [x] mobile Abstände zwischen Siegel und Mannschaftsnamen korrigiert
- [x] optische Abnahme auf Desktop und Mobil
- [x] weitere Mannschaften und Wettbewerbsseiten nach Abnahme ergänzt

### Noch offen innerhalb 4.4.x

- [x] `DESIGN_GUIDE.md` aus dem freigegebenen Ist-Zustand abgeleitet
- [x] lokalen Adminbereich v4.0.5 vollständig analysieren (`ADMIN-SYSTEMANALYSE.md`)
- [ ] vollständiges `ADMIN_HANDBUCH.md` auf Basis des realen Systems erstellen
- [ ] bestehendes `CHANGELOG.md` langfristig in eine konsistente Struktur überführen
- [ ] Feld-für-Feld-Migrationsmatrix für redundante JSON-Daten erstellen

---


### Smugglers Design System (SDS)

- [x] Begriff „Schmugglersiegel“ und Masterprinzip freigegeben
- [x] technische Spezifikation `SMUGGLERS_DESIGN_SYSTEM.md` erstellt
- [x] zentrale Assetstruktur angelegt
- [ ] editierbare Masterdatei entwickeln und in mehreren Größen prüfen
- [x] Pilotserie im freigegebenen v2-Stil erstellen und auf Desktop/Mobil abnehmen
- [x] vollständige Vereinsbibliothek für alle aktiven Teams ableiten
- [x] schrittweise, rückbaubare Integration über die zentrale Komponente auf alle Wettbewerbsseiten ausgeweitet

## 5. Version 4.5.x – Zentrale Datenhaltung

Ziel ist, Saison-, Termin-, Wettbewerbs- und Statusdaten möglichst nur noch einmal zu pflegen.

### Vorbereitung

- [ ] führende Datenquelle für jedes redundante Feld festlegen
- [ ] direkte JSON-Pfade und Fallback-Pfade erfassen
- [ ] Rückwärtskompatibilität bewerten
- [ ] Migrationsreihenfolge definieren
- [ ] Testfälle für öffentliche Seiten festlegen

### Umsetzung

- [ ] aktuelle Ereignisse aus zentralen Spieldaten ableiten
- [ ] Parallelpflege von `spieltag.json` reduzieren oder beenden
- [ ] Wettbewerbsspezifische Dateien auf tatsächlich notwendige Metadaten begrenzen
- [ ] Saisonstatus und Termine konsolidieren
- [ ] Sonderwettbewerbe in die zentrale Datenlogik einordnen
- [ ] Datenpfade konsequent über `datenregister.json` beziehen
- [ ] veraltete oder redundante Fallbacks nur nach bestätigter Migration entfernen

### Abnahmekriterien

- [ ] ein Termin muss nur einmal gepflegt werden
- [ ] Statusänderungen erscheinen an allen betroffenen Stellen konsistent
- [ ] keine sichtbare Veränderung an freigegebenen Kacheln
- [ ] bestehende historische Daten bleiben darstellbar
- [ ] Desktop und Mobil bleiben fehlerfrei

---

## 6. Version 4.6.x – Adminbereich und Datenpflege

### Adminbereich vereinfachen

- [ ] klare Trennung nach Pflegeaufgaben
- [ ] verständliche Bezeichnungen statt technischer Dateinamen
- [ ] unnötige oder doppelte Arbeitsschritte entfernen
- [ ] Eingabeprüfungen und verständliche Fehlermeldungen prüfen
- [ ] öffentliche Navigation weiterhin vollständig getrennt halten

### Saisonpflege optimieren

- [ ] neue Saison möglichst ohne HTML-Anpassungen anlegen
- [ ] Wettbewerbe über Daten statt Quellcode konfigurieren
- [ ] Saisonwechsel als nachvollziehbaren Ablauf definieren
- [ ] Archivierung abgeschlossener Saisons festlegen
- [ ] Rücksetz- und Importabläufe dokumentieren

### Adminhandbuch

- [ ] neue Saison anlegen
- [ ] Bundesliga und weitere Wettbewerbe importieren
- [ ] Hall of Fame pflegen
- [ ] Highscore zurücksetzen und aktualisieren
- [ ] Bonusfragen und Bonusantworten pflegen
- [ ] Smugglerauftrag wechseln
- [ ] JSON-Dateien sicher bearbeiten
- [ ] GitHub-Update durchführen
- [ ] typische Fehler und Wiederherstellung erklären

---

## 7. Version 4.7.x – Qualität und Bereinigung

- [ ] HTML-Struktur aller öffentlichen und administrativen Seiten prüfen
- [ ] CSS-Dubletten und widersprüchliche Regeln erfassen
- [ ] JavaScript auf tote Funktionen und unnötige Parallelpfade prüfen
- [ ] JSON-Schema und Pflichtfelder dokumentieren
- [ ] tote Dateien und historische Altlasten kennzeichnen
- [ ] Links, Anker und Navigation vollständig testen
- [ ] Ladefehler und verständliche Fallbackanzeigen prüfen
- [ ] Basis-Barrierefreiheit prüfen
- [ ] Performance und Dateigrößen bewerten

Löschungen oder strukturelle Bereinigungen erfolgen nur nach gesonderter Freigabe und mit vollständiger Liste „Ersetzen / Neu / Löschen“.

---

## 8. Version 4.8.x – Endabnahme vor LTS

### Öffentliche Website

- [ ] Startzentrale
- [ ] Countdown
- [ ] aktueller Spieltag
- [ ] alle Wettbewerbsseiten
- [ ] Hall of Fame
- [ ] Highscore
- [ ] Bonuswettbewerb
- [ ] Smuggleraufträge
- [ ] Saisonübersicht
- [ ] Kummerkasten

### Technische Prüfung

- [ ] Desktop-Test aller Seiten
- [ ] Mobiltest aller Seiten
- [ ] keine Überlagerungen
- [ ] keine Wortabbrüche
- [ ] kein horizontales Scrollen
- [ ] alle Links und Navigationselemente funktionieren
- [ ] alle JSON-Dateien syntaktisch gültig
- [ ] Daten werden konsistent dargestellt
- [ ] Adminbereich vollständig geprüft
- [ ] GitHub-Struktur und Dokumentation vollständig

---

## 9. Version 5.0 LTS – stabile Langzeitversion

Version 5.0 wird erst freigegeben, wenn alle verpflichtenden Punkte der Abschnitte 4 bis 8 erledigt oder ausdrücklich zurückgestellt wurden.

### Freigabekriterien

- [ ] zentrale Datenhaltung ist abgeschlossen oder klar abgegrenzt
- [ ] Adminpflege ist nachvollziehbar und dokumentiert
- [ ] Saisonwechsel ist ohne unnötige Quellcodeänderungen möglich
- [ ] öffentliche Seiten sind technisch und optisch abgenommen
- [ ] Desktop und Mobil sind vollständig getestet
- [ ] Dokumentation entspricht dem tatsächlichen Projektstand
- [ ] vollständiges Projektpaket und Updatepaket liegen vor
- [ ] `VERSION.txt`, `README.md`, `CHANGELOG.md` und Uploadliste sind aktuell

Version 5.0 erhält den Status **LTS**, wenn keine bekannten kritischen Fehler und keine offenen Pflichtmigrationen bestehen.

---

## 10. Version 5.1 – nach LTS

Noch nicht verbindlich terminiert.

Mögliche Inhalte dürfen erst nach Stabilisierung von 5.0 bewertet werden:

- Bedienkomfort im Adminbereich
- zusätzliche Prüf- und Importhilfen
- weitergehende Automatisierung der Saisonpflege
- kleinere funktionale Erweiterungen innerhalb bestehender Komponenten

---

## 11. Version 6.0 – Ideensammlung

Version 6.0 ist keine aktuelle Entwicklungszusage.

Ideen werden gesammelt, aber erst nach einer stabilen 5.x-Phase bewertet. Änderungen an Grid, Navigation, Kachelgrößen oder Grundlayout benötigen weiterhin eine ausdrückliche Grundsatzfreigabe.

---

## 12. Nächster verbindlicher Arbeitsschritt

Als nächstes wird ein lokaler, nicht veröffentlichender Importprototyp entwickelt. Er erkennt ZIP/CSV-Dateien, validiert Kopfzeilen und zeigt eine Importvorschau, verändert aber noch keine produktiven JSON-Dateien.


## Version 4.4.3 – Rechtliche Grundausstattung

- [x] Impressum ergänzt
- [x] Datenschutzerklärung für aktuellen technischen Stand ergänzt
- [x] rechtliche Footerlinks auf allen öffentlichen Seiten ergänzt
- [ ] Rechtstexte vor Version 5.0 nochmals gegen den dann tatsächlichen technischen Stand prüfen


## Zentraler Spieltagsabschluss

- [x] fachliche Regeln für Kicktipp-Import und fehlende Tipps festgelegt
- [x] verbindliches Konzept dokumentiert
- [x] echte Kicktipp-Exportdateien analysiert
- [ ] Importformat und Feldzuordnung dokumentieren
- [ ] Adminmodul „Spieltag abschließen“ entwickeln
- [ ] harte Vollständigkeits- und Fehlerprüfung umsetzen
- [ ] automatische Berechnungskette umsetzen
- [ ] GitHub-Exportpaket automatisch erzeugen und bei Bedarf unter 100 Dateien aufteilen
- [ ] realen Testspieltag vollständig durchlaufen

## Wertungslogik

- [x] 5/3/2-Punktewertung dokumentiert
- [x] Remis mit falschem Ergebnis als 3-Punkte-Fall festgelegt
- [x] 90 Minuten einschließlich Nachspielzeit definiert
- [x] Verlängerung und Elfmeterschießen ausgeschlossen

## Admin-Cockpit und Spielbetrieb

- [x] realen Spielbetriebs-Workflow dokumentiert
- [x] Admin-Cockpit fachlich konzipiert
- [x] echte Kicktipp-Exportdateien analysiert
- [ ] nicht veröffentlichenden Kicktipp-Importprototyp entwickeln
- [ ] Importvorschau und Sperrlogik entwickeln
- [ ] automatische Berechnungskette anbinden
- [ ] GitHub-Exportgenerator anbinden
- [ ] realen Testspieltag durchführen
## Nachgelagerter Ausbau: Sondermissionszentrale

Die in 4.7.0 entfernte Startseitenkachel für Smuggleraufträge soll erst in einer späteren Website-Version zurückkehren, wenn sie vollständig automatisiert ist. Geplanter Umfang:

- Auswahl zwischen Smuggleraufträgen, Piratenkodex und Weihnachtsregatta,
- automatische Ermittlung der jeweils aktuellen Mission,
- dynamische Gegner-, Termin-, Status-, Wertungs- und Fortschrittsdaten,
- wiederverwendbare dynamische Missionsakte und Historie,
- vollständige Desktop- und Mobiltests.

Bis dahin bleiben die drei Bereiche über „Unsere Wettbewerbe“ erreichbar.

