# SPIELTAGSABSCHLUSS – KONZEPT UND VERBINDLICHE REGELN

## 1. Ziel

Der lokale Adminbereich erhält künftig ein zentrales Modul:

**Spieltag abschließen**

Dieses Modul bündelt alle notwendigen Schritte vom Kicktipp-Export und den Spielergebnissen bis zum vollständigen GitHub-Updatepaket.

Der Betreiber soll nach Eingabe der Endergebnisse und Auswahl der Kicktipp-Exportdatei nicht mehrere Berechnungsseiten manuell nacheinander bedienen müssen.

---

## 2. Verbindliche Grundregel

> **Was die Kicktipp-Exportdatei übermittelt, ist verbindlich.**

Die Software darf den Inhalt der Exportdatei nicht eigenmächtig ergänzen, korrigieren oder durch Annahmen ersetzen.

---

## 3. Fehlende Tipps

Ein fehlender Tipp ist kein Importfehler.

Wenn für einen Teilnehmer und ein Spiel kein Tipp in der Kicktipp-Exportdatei vorhanden ist, gilt:

- der Tipp wurde nicht abgegeben
- der Tipp erhält 0 Punkte
- die Berechnung wird nicht blockiert
- es erfolgt keine nachträgliche Ergänzung
- es erfolgt keine manuelle Ersatzwertung
- nach Anstoß gibt es keine Korrekturmöglichkeit

Die Tippfrist ist der jeweilige Anstoßzeitpunkt.

---

## 4. Zulässiges Fehlen und echte Fehler

### 4.1 Zulässiges Fehlen

Nicht blockierend:

- ein Teilnehmer hat gar nicht getippt
- ein Teilnehmer hat nur einzelne Spiele nicht getippt
- ein Tipp fehlt nach Ablauf der Abgabefrist
- ein Teilnehmer ist in der Teilnehmerliste vorhanden, aber im Export ohne Tippdatensatz

Diese Fälle werden als **nicht abgegeben** behandelt.

### 4.2 Blockierende Fehler

Die Berechnung darf nicht starten bei:

- unlesbarer oder beschädigter Exportdatei
- falschem Dateiformat
- Exportdatei gehört nicht zum ausgewählten Spieltag
- unbekanntem Spiel
- unbekanntem Teilnehmer, sofern keine eindeutige Zuordnung möglich ist
- doppeltem Tippdatensatz für dieselbe Kombination aus Teilnehmer und Spiel
- ungültigem Tippformat
- fehlendem Endergebnis bei einem Spiel, das abgeschlossen werden soll
- unbekannter oder doppelter Spiel-ID
- widersprüchlichen Ergebnisdaten
- nicht eindeutiger Zuordnung eines Kicktipp-Spiels zu `spieldaten.json`

---

## 5. Pflichtdaten vor Berechnung

Das Modul startet erst, wenn folgende Daten vorliegen:

1. ausgewählter Wettbewerb und Spieltag
2. gültige Kicktipp-Exportdatei
3. eindeutige Zuordnung der Exportspiele zu `spieldaten.json`
4. vollständige Endergebnisse aller abzuschließenden Spiele
5. gültige Teilnehmerzuordnung
6. gültige Wertungsregeln
7. vorhandene Team- und Wettbewerbsstammdaten

Nicht verlangt wird, dass jeder Teilnehmer jeden Tipp abgegeben hat.

---

## 6. Geplanter Ablauf im Adminbereich

### Schritt 1 – Spieltag auswählen

Auswahl von:

- Wettbewerb
- Saison
- Spieltag beziehungsweise Wertungsspieltag

### Schritt 2 – Kicktipp-Datei auswählen

Die Datei wird lokal eingelesen.

Die Software prüft:

- Dateiformat
- Zeichencodierung
- Spaltenstruktur
- Spieltag
- Spiele
- Teilnehmer
- Tippwerte
- Duplikate

### Schritt 3 – Importvorschau

Anzeigen:

- erkannte Spiele
- erkannte Teilnehmer
- vorhandene Tipps
- nicht abgegebene Tipps
- unbekannte Teilnehmer
- unbekannte Spiele
- Warnungen
- blockierende Fehler

Nicht abgegebene Tipps werden neutral als Status angezeigt und nicht als Fehler.

### Schritt 4 – Ergebnisse prüfen

Für jedes Spiel:

- Heimteam
- Auswärtsteam
- Endergebnis
- Status „beendet“
- Anstoßzeitpunkt

Fehlende Endergebnisse blockieren den Abschluss.

### Schritt 5 – Berechnung freigeben

Der Button **Spieltag berechnen** wird nur aktiviert, wenn keine blockierenden Fehler mehr vorliegen.

### Schritt 6 – Automatische Berechnungskette

Nach Freigabe werden in fester Reihenfolge aktualisiert:

1. importierte Tipps
2. Tipp-Punkte
3. Spieltagswertung
4. Gesamtwertung
5. Wettbewerbswertung
6. Teamwertung
7. Smugglerwertung, falls betroffen
8. Bonuswertung, falls betroffen
9. Ranglistenverlauf
10. Highscore
11. Bundesliga-Tabelle und Statistiken, falls betroffen
12. Tippfristen und Abgabezuverlässigkeit
13. Datenqualitätsbericht

### Schritt 7 – Ergebnisbericht

Anzeigen:

- verarbeitete Spiele
- verarbeitete Teilnehmer
- vorhandene Tipps
- nicht abgegebene Tipps
- berechnete Punkte
- erzeugte Dateien
- Warnungen
- blockierende Fehler
- Zeitstempel

### Schritt 8 – GitHub-Exportpaket

Das Modul erzeugt ein ZIP mit ausschließlich den geänderten öffentlichen Dateien.

Vorgaben:

- maximal 100 Dateien pro GitHub-Web-Paket
- bei mehr als 100 Dateien automatische Aufteilung
- klare Reihenfolge der Teilpakete
- Liste Ersetzen / Neu / Löschen
- Versionsnummer
- CHANGELOG
- Prüfbericht

---

## 7. Interne Darstellung fehlender Tipps

Fehlende Tipps dürfen intern als expliziter Status geführt werden, zum Beispiel:

```json
{
  "teilnehmerId": "teilnehmer-017",
  "spielId": "bl-2026-01-05",
  "status": "nicht-abgegeben",
  "punkte": 0
}
```

Diese internen Statusdatensätze dürfen nur erzeugt werden, wenn sie für Berechnung, Statistik oder Nachvollziehbarkeit erforderlich sind.

Sie verändern nicht den Inhalt der ursprünglichen Kicktipp-Exportdatei.

---

## 8. Abgabefrist

Die Abgabefrist ist der tatsächliche Anstoßzeitpunkt des jeweiligen Spiels.

Folgen:

- vor Anstoß vorhandener Tipp wird gewertet
- nach Anstoß fehlender Tipp bleibt nicht abgegeben
- keine rückwirkende Ergänzung
- keine manuelle Kulanzwertung
- keine automatische Tippannahme

Falls Kicktipp im Export eigene Zeitinformationen liefert, haben diese Vorrang.

---

## 9. Importgrundsatz

Die Kicktipp-Datei ist eine Eingabequelle, keine Datei, die verändert wird.

Das System muss:

- Originaldatei unverändert lassen
- Importzeitpunkt protokollieren
- Dateiname und optional Prüfsumme speichern
- Zuordnungsprobleme offen anzeigen
- keine stillen Korrekturen durchführen

---

## 10. Benötigte Beispieldatei

Vor Programmierung des Importparsers wird eine echte Kicktipp-Exportdatei benötigt.

Zu prüfen sind:

- Dateityp
- Dateiname
- Tabellenblätter, falls Excel
- Spaltennamen
- Teilnehmerdarstellung
- Spielbezeichnungen
- Tippformat
- leere Felder
- Datums- und Zeitfelder
- Zeichencodierung
- Sonderfälle bei nicht abgegebenen Tipps
- mögliche Mehrfachzeilen
- mögliche Ergebnis- oder Statusfelder

Ohne echte Beispieldatei darf kein produktiver Parser freigegeben werden.

---

## 11. Umsetzungsphasen

### Phase 1 – Exportanalyse

- echte Kicktipp-Datei analysieren
- Importformat dokumentieren
- Feldzuordnung definieren
- Sonderfälle erfassen

### Phase 2 – Importmodul

- Datei auswählen
- validieren
- Vorschau anzeigen
- Teams, Spiele und Teilnehmer zuordnen
- fehlende Tipps korrekt behandeln

### Phase 3 – Abschluss-Workflow

- Ergebnisprüfung
- harte Freigabelogik
- Berechnungskette
- Fehlerbericht

### Phase 4 – Exportpaket

- geänderte JSON-Dateien
- Versionierung
- CHANGELOG
- Uploadliste
- automatische Aufteilung unter 100 Dateien

### Phase 5 – Test

- Testspieltag mit vollständigen Tipps
- Testspieltag mit einzelnen fehlenden Tipps
- Teilnehmer ohne jeden Tipp
- falscher Spieltag
- unbekannter Teilnehmer
- doppelter Tipp
- fehlendes Endergebnis
- Desktop- und Mobilprüfung der öffentlichen Ergebnisse

---

## 12. Abnahmekriterium

Das Modul gilt erst als freigegeben, wenn ein vollständiger realer oder realitätsnaher Spieltag mit mindestens diesen Fällen korrekt verarbeitet wurde:

- vollständig abgegebene Tipps
- einzelne fehlende Tipps
- Teilnehmer ohne Tippabgabe
- mehrere Endergebnisse
- korrekte 2/3/5-Punktewertung
- korrekte Spieltags- und Gesamtwertung
- korrekte Tabellenberechnung
- korrektes GitHub-Updatepaket
- keine manuelle Nachbearbeitung der berechneten Dateien

## Verbindliche Wertungsregeln

- Exaktes Ergebnis: **5 Punkte**
- Richtige Tordifferenz: **3 Punkte**
- Richtige Tendenz: **2 Punkte**
- Unentschieden mit falschem exakten Ergebnis: **3 Punkte**
- Falsche Tendenz: **0 Punkte**

Gewertet wird ausschließlich das offizielle Ergebnis nach regulärer Spielzeit: 90 Minuten einschließlich Nachspielzeit, ohne Verlängerung und ohne Elfmeterschießen. Diese Regel gilt auch in K.-o.-Spielen.
