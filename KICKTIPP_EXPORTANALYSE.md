# KICKTIPP-EXPORTANALYSE

## 1. Grundlage

Analysiert wurden 10 tatsächlich aus Kicktipp exportierte ZIP-Dateien vom 01.08.2026.

Die Dateien enthalten jeweils eine UTF-8-CSV mit:

- Semikolon als Trennzeichen
- doppelte Anführungszeichen als Textbegrenzung
- Kopfzeile in der ersten Zeile
- ZIP-Verpackung durch Kicktipp

Die Originaldateien enthalten teilweise E-Mail-Adressen und werden deshalb nicht in das öffentliche GitHub-Projekt übernommen.

---

## 2. Erkannte Exporttypen

### 2.1 Tipper

Beispieldatei:

`kicktipp-the-old-smugglers-club-Tipper-2026-08-01-07-42-34-+0000-10492084132576448900.csv.zip`

Erkannte Spalten:

- `Name`
- `E-Mail`
- `Mitglied seit`
- `Punkte`
- `Position`
- `Neue Piraten`
- `Gruppenpunkte`
- `Gruppenposition`
- `Position in Gruppe`
- `Old Smugglers Team`
- `Gruppenpunkte`
- `Gruppenposition`
- `Position in Gruppe`
- `Sprache`

Bewertung:

- geeignet zur Synchronisierung von Teilnehmernamen
- enthält E-Mail-Adressen und weitere interne Verwaltungsdaten
- darf nicht unverändert öffentlich veröffentlicht werden
- enthält in diesem Export keine ausdrücklich benannte `TipperID`
- Teamzugehörigkeit ist über die Spalten „Neue Piraten“ und „Old Smugglers Team“ ableitbar

---

### 2.2 Tipps eines Spieltags

Beispieldatei:

`kicktipp-the-old-smugglers-club-Tipps-1. Spieltag-2026-08-01-07-42-28-+0000-15602939014373252902.csv.zip`

Erkannte Grundspalten:

- `Name`
- `TipperID`

Erkannte Spielspalten:

- `FCB - VFB`
- `KOE - TSG`
- `ELV - B04`
- `M05 - SCP`
- `FCU - SGE`
- `RBL - BMG`
- `BVB - HSV`
- `SCF - SVW`
- `FCA - S04`

Bewertung:

- `TipperID` ist der bevorzugte stabile Schlüssel für den Tippimport
- jede Spielpaarung wird als eigene Spalte geliefert
- Tippwerte stehen in den Zellen der jeweiligen Spielspalte
- leere Zellen kommen tatsächlich vor
- der Wert `-:-` kommt tatsächlich vor
- die genaue fachliche Bedeutung von `-:-` kann erst anhand eines späteren realen Exports mit abgegebenen Tipps endgültig verifiziert werden
- bis dahin wird `-:-` nicht automatisch als gültiger Tipp interpretiert

---

### 2.3 Rangliste Einzelwertung

Analysierte Beispiele:

- `kicktipp-the-old-smugglers-club-Rangliste-Einzelwertung_1. Spieltag-2026-08-01-07-41-52-+0000-6771016311551832167.csv.zip`
- `kicktipp-the-old-smugglers-club-Rangliste-Einzelwertung_Bonus-2026-08-01-07-41-47-+0000-10139193959531876449.csv.zip`
- `kicktipp-the-old-smugglers-club-Rangliste-Einzelwertung_Piratenkodex I - El Clasico-2026-08-01-07-42-50-+0000-16775456416666754769.csv.zip`
- `kicktipp-the-old-smugglers-club-Rangliste-Einzelwertung_Smugglerauftrag Auftakt-2026-08-01-07-41-33-+0000-1362778295706308710.csv.zip`
- `kicktipp-the-old-smugglers-club-Rangliste-Einzelwertung_Smugglers Weihnachtsregatta-2026-08-01-07-43-02-+0000-3454675307536624330.csv.zip`

Einheitliche Spalten:

- `Rang`
- `Name`
- `Punkte`
- `Bonuspunkte`
- `Spieltagssieger`
- `Gesamtpunkte`
- `Gesamtspieltagssiege`
- `Spieltagsplatzierung`
- `E-Mail`

Bewertung:

- geeignet zur direkten Übernahme offizieller Kicktipp-Wertungen
- enthält Rang, Punkte, Bonuspunkte und Gesamtwerte
- enthält E-Mail-Adressen und muss vor öffentlicher Verarbeitung bereinigt werden
- Name allein ist kein idealer stabiler Schlüssel
- Zuordnung soll über Teilnehmerregister erfolgen; E-Mail darf nur lokal als Hilfsschlüssel verwendet werden

---

### 2.4 Gesamtübersicht Einzelwertung

Beispieldatei:

`kicktipp-the-old-smugglers-club-Gesamtübersicht-Einzelwertung-2026-08-01-07-42-15-+0000-11709034223312120528.csv.zip`

Die Datei enthält:

- `Rang`
- `Name`
- eine große Zahl einzelner Spieltags- und Sonderwertungsspalten
- Saison-Gesamtwerte am Ende der Zeile

Bewertung:

- zentrale Quelle für die offizielle Kicktipp-Gesamtwertung
- geeignet für Highscore, Saisonmatrix und Ranglistenverlauf
- Spaltennamen bilden die in Kicktipp angelegten Wertungsspieltage ab
- neue Spieltage können später zusätzliche Spalten erzeugen
- Parser darf deshalb nicht mit einer fest codierten Spaltenanzahl arbeiten

---

### 2.5 Team-Gesamtübersichten

Analysiert wurden:

- Gesamtübersicht „Old Smugglers Team“
- Gesamtübersicht „Neue Piraten“

Bewertung:

- geeignet zur offiziellen Teamdarstellung
- Teamnamen werden von Kicktipp vorgegeben
- die Website verwendet derzeit teilweise andere interne Bezeichnungen
- dafür ist eine feste Zuordnungstabelle notwendig

---

## 3. Verbindliche Erkenntnisse

1. Kicktipp liefert ZIP-Dateien mit CSV-Inhalt.
2. CSV-Encoding ist UTF-8 mit BOM.
3. Trennzeichen ist Semikolon.
4. Die Tipps-Datei enthält eine stabile `TipperID`.
5. Ranglisten und Übersichten enthalten keine erkennbare `TipperID`.
6. E-Mail-Adressen dürfen nur lokal verarbeitet werden.
7. Fehlende Tippzellen kommen vor und dürfen die Berechnung nicht blockieren.
8. Kicktipp-Ranglisten können als offizielle Wertungen übernommen werden.
9. Spalten der Gesamtübersicht sind dynamisch und dürfen nicht fest programmiert werden.
10. Exporttypen sind über Dateinamen zuverlässig unterscheidbar, müssen aber zusätzlich über Kopfzeilen validiert werden.

---

## 4. Offene Punkte

Noch nicht endgültig geklärt:

- Bedeutung von `-:-` in einer Tipps-Zelle
- Darstellung eines tatsächlich abgegebenen Tipps nach Anstoß
- ob Kicktipp spätere Exporte zusätzliche Status- oder Ergebnisspalten liefert
- ob identische Namen mehrfach vorkommen können
- ob Ranglistenexporte in späteren Phasen zusätzliche Spalten erhalten

Diese Punkte werden mit dem ersten realen Spieltag erneut geprüft.

---

## 5. Datenschutz

Die Exporte enthalten personenbezogene Daten, insbesondere:

- E-Mail-Adressen
- Mitgliedszeitpunkte
- Teilnehmernamen
- Gruppenzuordnungen

Regeln:

- Originalexporte bleiben lokal
- Originalexporte werden nicht in GitHub gespeichert
- öffentliche JSON-Dateien enthalten keine E-Mail-Adressen
- E-Mail darf nur lokal zur eindeutigen Zuordnung verwendet werden
- Protokolle dürfen keine vollständigen E-Mail-Adressen ausgeben
