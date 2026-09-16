# SPIELBETRIEB-WORKFLOW – THE OLD SMUGGLERS CLUB

## 1. Ziel

Dieses Dokument beschreibt den verbindlichen Ablauf eines regulären Spieltags vom Spielende bis zur aktualisierten Website.

Der spätere Adminbereich soll diesen Ablauf weitgehend automatisieren und nur dann eine Berechnung erlauben, wenn alle zwingend benötigten Daten vorliegen.

---

## 2. Grundprinzip

Der Spielbetrieb basiert auf zwei verbindlichen Eingaben:

1. offizielle Endergebnisse nach regulärer Spielzeit
2. Kicktipp-Exportdatei mit den tatsächlich abgegebenen Tipps

Die Kicktipp-Exportdatei ist die verbindliche Wahrheit für Tippabgaben.

Fehlende Tipps:

- sind zulässig
- gelten als nicht abgegeben
- erhalten 0 Punkte
- blockieren die Berechnung nicht

---

## 3. Pflichtdaten

Vor einer Berechnung müssen vorhanden sein:

- Wettbewerb
- Saison
- Spieltag beziehungsweise Wertungsspieltag
- alle relevanten Spiele
- offizielle Endergebnisse nach 90 Minuten einschließlich Nachspielzeit
- gültige Kicktipp-Exportdatei
- Teilnehmerstammdaten
- Teamstammdaten
- Wettbewerbsstammdaten
- Wertungsregeln

Nicht erforderlich ist eine vollständige Tippabgabe aller Teilnehmer.

---

## 4. Wertungsregeln

- richtiges Ergebnis: 5 Punkte
- richtige Tordifferenz: 3 Punkte
- richtige Tendenz: 2 Punkte
- Remis ohne exaktes Ergebnis: 3 Punkte
- falsche Tendenz: 0 Punkte

Gewertet wird ausschließlich das offizielle Ergebnis nach regulärer Spielzeit:

- 90 Minuten
- einschließlich Nachspielzeit
- ohne Verlängerung
- ohne Elfmeterschießen

---

## 5. Operativer Ablauf

### Schritt 1 – Spieltag auswählen

Auswahl von:

- Saison
- Wettbewerb
- Spieltag
- gegebenenfalls Sonderwertung

### Schritt 2 – Ergebnisse erfassen

Für jedes Spiel:

- Heimtore
- Auswärtstore
- Status beendet
- 90-Minuten-Ergebnis bestätigt

### Schritt 3 – Kicktipp-Export laden

Die Exportdatei wird lokal ausgewählt.

Die Software prüft:

- Dateiformat
- Spieltag
- Teilnehmer
- Spiele
- Tippwerte
- Duplikate
- Zuordnungen

### Schritt 4 – Importvorschau

Die Vorschau zeigt:

- erkannte Teilnehmer
- erkannte Spiele
- vorhandene Tipps
- nicht abgegebene Tipps
- Warnungen
- blockierende Fehler

Nicht abgegebene Tipps erscheinen als neutraler Status und nicht als Fehler.

### Schritt 5 – Berechnung freigeben

Die Berechnung wird nur freigegeben, wenn:

- alle Spiele eindeutig zugeordnet sind
- alle Endergebnisse vorliegen
- alle Teilnehmer eindeutig zugeordnet sind
- keine doppelten oder ungültigen Tippdatensätze vorhanden sind

### Schritt 6 – Berechnung

Automatische Reihenfolge:

1. Tipps importieren
2. Punkte je Tipp berechnen
3. Spieltagswertung aktualisieren
4. Gesamtwertung aktualisieren
5. Wettbewerbswertung aktualisieren
6. Teamwertung aktualisieren
7. Smugglerwertung aktualisieren, falls betroffen
8. Bonuswertung aktualisieren, falls betroffen
9. Ranglistenverlauf aktualisieren
10. Highscore aktualisieren
11. Bundesliga-Tabelle und Statistiken aktualisieren, falls betroffen
12. Tippfristen und Abgabezuverlässigkeit aktualisieren
13. Datenqualitätsprüfung ausführen

### Schritt 7 – Abschlussbericht

Der Bericht enthält:

- verarbeitete Spiele
- verarbeitete Teilnehmer
- vorhandene Tipps
- nicht abgegebene Tipps
- erzeugte Dateien
- Warnungen
- blockierende Fehler
- Zeitstempel
- Versionsnummer

### Schritt 8 – GitHub-Updatepaket

Erzeugt werden:

- geänderte JSON-Dateien
- CHANGELOG
- VERSION.txt
- README
- Liste Ersetzen / Neu / Löschen
- Prüfbericht
- Updatepaket

Bei mehr als 100 Dateien wird automatisch in mehrere GitHub-Web-Pakete aufgeteilt.

---

## 6. Blockierende Fehler

Die Berechnung darf nicht starten bei:

- unlesbarer Exportdatei
- falschem Spieltag
- unbekanntem Spiel
- unbekanntem Teilnehmer ohne eindeutige Zuordnung
- doppeltem Tippdatensatz
- ungültigem Tippformat
- fehlendem Endergebnis
- widersprüchlichen Ergebnisdaten
- fehlenden Stammdaten
- fehlerhaften IDs

---

## 7. Nicht blockierende Fälle

Die Berechnung darf starten bei:

- Teilnehmer ohne Tippabgabe
- einzelnen fehlenden Tipps
- vollständig fehlender Tippzeile eines Teilnehmers
- leeren Tippfeldern, sofern Kicktipp diese so exportiert

Diese Fälle erhalten 0 Punkte.

---

## 8. Typischer Bundesliga-Spieltag

Beispielablauf:

1. Letztes Spiel des Spieltags ist beendet.
2. Ergebnisse werden im Adminbereich eingetragen.
3. Kicktipp-Exportdatei wird geladen.
4. Importvorschau wird geprüft.
5. Spieltag wird berechnet.
6. Bundesliga-Tabelle wird neu berechnet.
7. Spieltags- und Gesamtwertung werden neu erzeugt.
8. Highscore und Teamwertung werden aktualisiert.
9. GitHub-Updatepaket wird erzeugt.
10. Update wird hochgeladen.
11. Website wird mit Strg + F5 geprüft.

---

## 9. Sonderwettbewerbe

### Smuggleraufträge

- reales Dynamo-Spiel
- eigener Wertungsspieltag
- Auftrag „Auftakt“ ist Tippspieltag 2

### Bonuswettbewerb

- Tippspieltag 1
- 25 Fragen
- 5 Punkte je richtiger Antwort
- maximal 125 Punkte

### K.-o.-Wettbewerbe

- gewertet wird ausschließlich das Ergebnis nach 90 Minuten einschließlich Nachspielzeit
- Verlängerung und Elfmeterschießen bleiben unberücksichtigt

---

## 10. Abnahmekriterien

Der Workflow gilt erst als freigegeben, wenn mindestens folgende Fälle erfolgreich getestet wurden:

- vollständiger Spieltag
- einzelne fehlende Tipps
- Teilnehmer ohne Tippabgabe
- korrekte 5/3/2-Wertung
- Remis mit 3 Punkten
- K.-o.-Spiel nach 90 Minuten
- unbekannter Teilnehmer
- doppelter Tipp
- fehlendes Ergebnis
- korrektes GitHub-Updatepaket
