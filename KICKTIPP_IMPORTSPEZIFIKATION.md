# KICKTIPP-IMPORTSPEZIFIKATION

## 1. Ziel

Das lokale Admin-Cockpit soll Kicktipp-Exportdateien selbstständig erkennen, prüfen und in öffentliche Website-Daten überführen.

Der normale Saisonbetrieb darf keinen Chat-Import benötigen.

---

## 2. Eingabe

Der Nutzer wählt einen lokalen Importordner oder mehrere Kicktipp-ZIP-Dateien aus.

Unterstützt werden zunächst:

- Tipper
- Tipps eines Spieltags
- Rangliste Einzelwertung
- Gesamtübersicht Einzelwertung
- Gesamtübersicht Old Smugglers Team
- Gesamtübersicht Neue Piraten

Weitere Exporttypen können später ergänzt werden.

---

## 3. Dateierkennung

Die Erkennung erfolgt zweistufig:

### Stufe 1 – Dateiname

Erwartete Namensbestandteile:

- `-Tipper-`
- `-Tipps-`
- `-Rangliste-Einzelwertung_`
- `-Gesamtübersicht-Einzelwertung-`
- `-Gesamtübersicht-Old Smugglers Team-`
- `-Gesamtübersicht-Neue Piraten-`

### Stufe 2 – Kopfzeile

Eine Datei gilt nur dann als erkannt, wenn die erwarteten Pflichtspalten vorhanden sind.

Beispiele:

Tipps:

- `Name`
- `TipperID`
- mindestens eine Spielspalte

Rangliste:

- `Rang`
- `Name`
- `Punkte`
- `Gesamtpunkte`

Tipper:

- `Name`
- `E-Mail`
- `Mitglied seit`

---

## 4. Pflicht- und optionale Dateien

### Für einen normalen Spieltagsimport zwingend

- Tipps-Datei des betroffenen Spieltags
- Gesamtübersicht Einzelwertung
- lokal vorhandene Stammdaten
- vollständige Endergebnisse in `spieldaten.json`

### Empfohlen

- Tipper-Export, wenn Teilnehmerbestand oder Zuordnung geändert wurde
- Rangliste des betroffenen Spieltags

### Nur bei betroffenem Wettbewerb

- Smugglerauftrag-Rangliste
- Bonus-Rangliste
- Piratenkodex-Rangliste
- Weihnachtsregatta-Rangliste
- Team-Gesamtübersichten

Fehlende optionale Dateien blockieren den Import nicht.

---

## 5. Teilnehmerzuordnung

Priorität:

1. `TipperID`
2. lokale, bereits bestätigte Zuordnungstabelle
3. E-Mail-Adresse, ausschließlich lokal
4. exakter Teilnehmername
5. manuelle Bestätigung

Unbekannte Teilnehmer blockieren die endgültige Veröffentlichung, bis sie eindeutig zugeordnet wurden.

Namen werden nicht automatisch überschrieben, wenn eine stabile ID bereits vorhanden ist.

---

## 6. Spielzuordnung

Spielspalten wie:

`FCB - VFB`

werden über eine zentrale Kürzelzuordnung den Team-IDs und anschließend einer Spiel-ID aus `spieldaten.json` zugeordnet.

Voraussetzungen:

- Wettbewerb und Spieltag sind ausgewählt
- genau ein passendes Spiel existiert
- Heim- und Auswärtsreihenfolge stimmt

Mehrdeutige oder unbekannte Spiele blockieren den Abschluss.

---

## 7. Tippwerte

Zulässige Werte werden erst nach dem ersten realen Export endgültig festgeschrieben.

Vorläufige Behandlung:

- leere Zelle → nicht abgegeben, 0 Punkte
- `-:-` → ungeklärter Sonderwert; Warnung, keine automatische Wertung
- Muster `Zahl:Zahl` → abgegebener Tipp
- andere Werte → blockierender Formatfehler

Die Originalzelle bleibt unverändert protokolliert.

---

## 8. Offizielle Wertungen

Kicktipp-Ranglisten und Gesamtübersichten gelten als führende Quelle für:

- Rang
- Punkte
- Bonuspunkte
- Spieltagssiege
- Gesamtpunkte
- Team-Gesamtwerte

Die Website soll diese Werte übernehmen und nicht unabhängig neu berechnen.

Eine lokale 5/3/2-Berechnung bleibt als Prüfmechanismus möglich, darf aber offizielle Kicktipp-Werte nicht still überschreiben.

---

## 9. Website-spezifische Berechnungen

Aus den importierten Daten kann das Admin-Cockpit zusätzlich erzeugen:

- Ranglistenverlauf
- Form der letzten Spieltage
- persönliche Bestwerte
- Serien und Rekorde
- Hall-of-Fame-Kandidaten
- Saisonstatistiken
- Abgabezuverlässigkeit
- Highscore-Präsentationsdatei

Diese Auswertungen müssen klar von offiziellen Kicktipp-Werten getrennt bleiben.

---

## 10. Importvorschau

Vor dem Import wird angezeigt:

- erkannte Dateien
- ignorierte Dateien
- Spieltag
- Teilnehmeranzahl
- Spielanzahl
- vorhandene Tipps
- fehlende Tipps
- ungeklärte `-:-`-Werte
- unbekannte Teilnehmer
- unbekannte Spiele
- Pflichtdateien
- optionale Dateien
- blockierende Fehler
- Warnungen

---

## 11. Datenschutz und Ausgabe

Öffentliche Ausgabedateien dürfen nicht enthalten:

- E-Mail-Adressen
- Mitgliedszeitpunkte
- interne Kicktipp-IDs, sofern sie nicht technisch zwingend erforderlich sind
- lokale Dateipfade
- Prüfsummen der Originaldateien

Lokal gespeichert werden dürfen:

- Importzeitpunkt
- Dateiname
- Prüfsumme
- Dateityp
- Teilnehmerzuordnung
- Fehler- und Warnungsstatus

---

## 12. Ergebnisdateien

Das Cockpit erzeugt nur die tatsächlich betroffenen Dateien, beispielsweise:

- `teilnehmer.json`
- `tipps.json`
- `punkte.json` oder offizieller Wertungsimport
- `spieltagpunkte.json`
- `wettbewerbspunkte.json`
- `teampunkte.json`
- `ranglistenverlauf.json`
- `highscore.json`
- Importprotokoll

Das GitHub-Paket enthält keine Original-Kicktipp-Exporte.

---

## 13. Technische Parser-Regeln

- ZIP lokal öffnen
- genau eine CSV je Kicktipp-ZIP erwarten
- UTF-8 mit BOM unterstützen
- Semikolon als Trennzeichen
- Anführungszeichen korrekt behandeln
- dynamische Spalten unterstützen
- keine feste Teilnehmer- oder Spielanzahl
- keine feste Reihenfolge optionaler Spalten voraussetzen
- Kopfzeilen normalisieren, aber Originalbezeichnung protokollieren
- Fehler niemals still korrigieren

---

## 14. Nächster Entwicklungsschritt

Auf Basis dieser Spezifikation wird ein lokaler, nicht veröffentlichender Import-Prototyp entwickelt.

Der Prototyp soll zunächst nur:

1. Importordner auswählen
2. ZIP-Dateien erkennen
3. CSV-Dateien lesen
4. Typen klassifizieren
5. Kopfzeilen validieren
6. Importvorschau anzeigen
7. keine JSON-Nutzdaten verändern

Erst nach Abnahme folgt die tatsächliche Datenübernahme.
