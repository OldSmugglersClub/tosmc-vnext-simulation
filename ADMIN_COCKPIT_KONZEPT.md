# ADMIN-COCKPIT – KONZEPT

## 1. Ziel

Das Admin-Cockpit soll den normalen Saisonbetrieb vereinfachen.

Statt zahlreiche einzelne Module nacheinander öffnen zu müssen, erhält der Betreiber wenige klare Hauptaktionen.

Die bestehenden Adminmodule bleiben erhalten und werden im Hintergrund weiterverwendet.

---

## 2. Hauptaktionen

### Saison vorbereiten

Für:

- neue Saison anlegen
- Wettbewerbe prüfen
- Teams ergänzen
- Teilnehmer übernehmen
- Bonusfragen anlegen
- Smuggleraufträge zuordnen
- Spieltage vorbereiten

### Spieltag abschließen

Für:

- Ergebnisse prüfen
- Kicktipp-Export laden
- Tipps importieren
- Wertungen berechnen
- Statistiken aktualisieren
- GitHub-Paket erzeugen

### Bonusfragen auswerten

Für:

- Antworten importieren
- Lösungen festlegen
- Bonuspunkte berechnen
- Gesamtwertung aktualisieren

### Highscore aktualisieren

Für:

- Gesamtwertung
- Spieltagswertungen
- Teamwertung
- Bonuswertung
- Ranglistenverlauf
- Rekorde

### GitHub-Update erstellen

Für:

- geänderte Dateien sammeln
- Version erhöhen
- CHANGELOG aktualisieren
- Uploadliste erstellen
- Paket unter 100 Dateien halten
- gegebenenfalls automatisch aufteilen

### Datenqualität prüfen

Für:

- fehlende IDs
- doppelte Datensätze
- ungültige Referenzen
- unvollständige Ergebnisse
- falsche Tippformate
- veraltete Berechnungen

---

## 3. Startbildschirm

Der Startbildschirm soll anzeigen:

- aktuelle Saison
- aktuell offener Spieltag
- letzter berechneter Spieltag
- letzter Kicktipp-Import
- letzter GitHub-Export
- Datenstatus
- offene Warnungen
- blockierende Fehler
- Versionsstand

---

## 4. Statuslogik

### Grün

- alle Pflichtdaten vorhanden
- Berechnung möglich
- keine blockierenden Fehler

### Gelb

- Warnungen vorhanden
- Berechnung grundsätzlich möglich
- Prüfung empfohlen

### Rot

- Pflichtdaten fehlen
- Berechnung blockiert
- konkrete Fehler müssen behoben werden

Farbe wird immer zusätzlich durch Text erklärt.

---

## 5. Geführter Spieltagsabschluss

Der Ablauf besteht aus festen Schritten:

1. Spieltag auswählen
2. Kicktipp-Datei laden
3. Import prüfen
4. Ergebnisse prüfen
5. Berechnung starten
6. Ergebnisbericht prüfen
7. GitHub-Paket erzeugen

Der Nutzer kann erst zum nächsten Schritt wechseln, wenn die Pflichtprüfung erfolgreich ist.

---

## 6. Sicherheitsregeln

- Keine automatische Veröffentlichung ohne ausdrückliche Bestätigung.
- Originale Kicktipp-Exportdatei bleibt unverändert.
- Vor jeder Berechnung wird ein lokales Backup erzeugt.
- Vor jedem GitHub-Export wird ein Prüfbericht erstellt.
- Fehlende Tipps werden nicht ergänzt.
- Datenfehler werden nicht still korrigiert.
- IDs werden nicht automatisch umbenannt.

---

## 7. Technische Zielarchitektur

Das Cockpit wird als zusätzliche lokale Adminseite umgesetzt.

Vorgesehene Bestandteile:

- `admin-cockpit.html`
- `admin-cockpit.css`
- `admin-cockpit.js`
- Importparser für Kicktipp
- zentrale Prüfkomponente
- zentrale Berechnungskette
- Exportgenerator
- Protokolldatei

Bestehende Module werden nach Möglichkeit wiederverwendet und nicht dupliziert.

---

## 8. Abhängigkeiten

Das Cockpit benötigt mindestens:

- `spieldaten.json`
- `teams.json`
- `teilnehmer.json`
- `wettbewerbe.json`
- `tippspieltage.json`
- `wertungsregeln.json`
- Kicktipp-Exportdatei
- bestehende Berechnungsmodule

---

## 9. Umsetzungsreihenfolge

1. echte Kicktipp-Exportdatei analysieren
2. Importformat dokumentieren
3. Parser entwickeln
4. Importvorschau entwickeln
5. Prüf- und Sperrlogik entwickeln
6. Berechnungskette anbinden
7. Ergebnisbericht entwickeln
8. GitHub-Exportgenerator anbinden
9. vollständigen Testspieltag durchführen

---

## 10. Nicht Bestandteil dieser Version

Version 4.6.0 programmiert noch kein Cockpit.

Sie legt ausschließlich den verbindlichen Arbeitsablauf und die technische Zielrichtung fest.

## 11. Verbindliche Importgrundlage

Die technische Implementierung richtet sich nach `KICKTIPP_IMPORTSPEZIFIKATION.md` und `kicktipp-import-schema.json`.
