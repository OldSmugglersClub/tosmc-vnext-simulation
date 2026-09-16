# ADMIN-HANDBUCH – THE OLD SMUGGLERS CLUB

## 1. Zweck und Geltungsbereich

Dieses Handbuch beschreibt den tatsächlich vorhandenen lokalen Administrationsbereich **v4.0.5** für das Projekt **The Old Smugglers Club**.

Der lokale Adminbereich ist eine eigenständige Anwendung neben der öffentlichen Website:

- **Öffentliche Website:** wird über GitHub Pages veröffentlicht.
- **Lokaler Adminbereich:** läuft ausschließlich auf dem eigenen Windows-PC.
- **Datenübernahme:** erfolgt derzeit manuell durch Export und anschließendes Ersetzen der gleichnamigen Dateien im öffentlichen GitHub-Repository.

Der Adminbereich verändert das GitHub-Repository nicht automatisch.

---

## 2. Sicherheitsgrundsatz

Das vollständige Adminpaket darf niemals in das öffentliche GitHub-Repository hochgeladen werden.

Nicht öffentlich hochladen:

- `admin.html`
- sämtliche Adminmodule
- `ADMIN_STARTEN.bat`
- `admin-server.ps1`
- lokale Prüf- und Hilfsskripte
- interne Protokolle
- vollständige lokale Admin-ZIP-Dateien
- ursprüngliche Kicktipp-Exporte mit personenbezogenen Daten

Öffentlich hochgeladen werden nur die ausdrücklich benötigten HTML-, CSS-, JavaScript- und JSON-Dateien aus einem freigegebenen Website-Updatepaket.

---

## 3. Installation

### 3.1 Empfohlener Speicherort

1. Im Windows-Explorer den Ordner `Dokumente` öffnen.
2. Einen Ordner anlegen, zum Beispiel:
   `Old Smugglers Club Admin`
3. Das Admin-ZIP vollständig in diesen Ordner entpacken.
4. Nicht direkt innerhalb der ZIP-Datei arbeiten.

### 3.2 Vorhandene Startdateien

Der aktuelle Adminstand enthält:

- `ADMIN_STARTEN.bat`
- `admin-server.ps1`
- `admin.html`

Diese Dateien bilden den lokalen Startweg.

---

## 4. Adminbereich starten und beenden

### 4.1 Start

1. Den entpackten Adminordner öffnen.
2. `ADMIN_STARTEN.bat` doppelt anklicken.
3. Das geöffnete PowerShell-Fenster geöffnet lassen.
4. Der Browser sollte automatisch starten.
5. Falls nicht, folgende Adresse manuell öffnen:

`http://localhost:8765/admin.html`

`localhost` bedeutet, dass die Anwendung nur auf dem eigenen Rechner erreichbar ist.

### 4.2 Beenden

- PowerShell-Fenster schließen, oder
- im PowerShell-Fenster `Strg + C` drücken.

Danach ist der lokale Adminbereich nicht mehr erreichbar.

### 4.3 Wichtig

Die Adminseiten nicht per direktem Doppelklick als lokale Datei öffnen. Browser blockieren in diesem Modus häufig das Laden der JSON-Dateien. Der Aufruf muss über `http://localhost:8765/` erfolgen.

---

## 5. Grundablauf jeder Datenpflege

Für die meisten bearbeitenden Module gilt:

1. Lokale Sicherung anlegen.
2. Adminbereich starten.
3. Gewünschtes Modul öffnen.
4. Daten laden und prüfen.
5. Änderung durchführen.
6. Exportfunktion verwenden.
7. Heruntergeladene JSON-Datei kontrollieren.
8. Gleichnamige Datei im lokalen Adminordner ersetzen.
9. Öffentliche Website lokal bzw. über den Adminserver prüfen.
10. Soll die Änderung veröffentlicht werden, dieselbe Datei im GitHub-Repository ersetzen.
11. Website nach Veröffentlichung mit `Strg + F5` prüfen.

Der Export aktualisiert weder den lokalen Adminordner noch GitHub automatisch.

---

## 6. Administrationszentrum

Startseite:

`admin.html`

Bezeichnung:

**Administrations- und Wartungszentrum**

Von dort sind die vorhandenen Module erreichbar:

- Daten-Cockpit
- Zentrale Spielpflege
- Wettbewerbsverwaltung
- Teams & Teilnehmer
- Zentrale Tippdaten
- Punkteberechnung
- Bonusfragen & Sonderpunkte
- Smuggleraufträge
- Smugglerwertung
- Teamwertung
- Wettbewerbswertungen
- Spieltagwertungen
- Ranglistenverlauf
- Saisonarchiv & Hall of Fame
- Tippfristen & Abgaben
- Abgabe-Erinnerungen
- Erinnerungsprotokoll
- Abgabezuverlässigkeit
- Datenqualitätsprüfung

---

## 7. Daten-Cockpit

Datei:

`daten-cockpit.html`

Zweck:

- zentrale, lesende Übersicht
- Anzeige registrierter Datenquellen
- Prüfung von Ladezuständen
- Überblick über Wettbewerbe und Datenbestände
- Erkennen fehlender oder nicht erreichbarer Dateien

Das Daten-Cockpit dient primär der Kontrolle und nicht der eigentlichen Datenbearbeitung.

Wichtige zugehörige Dateien:

- `daten-cockpit.js`
- `daten-cockpit.css`
- `datenregister.json`
- `datenregister.js`
- `systemstatus.json`

---

## 8. Zentrale Spielpflege

Datei:

`spielpflege.html`

Hauptdatenquelle:

`spieldaten.json`

Zweck:

- Spiele anlegen
- bestehende Spiele bearbeiten
- Termine und Anstoßzeiten pflegen
- Heim- und Auswärtsteam zuordnen
- Wettbewerb und Spieltag zuordnen
- Ergebnis und Spielstatus pflegen
- vollständige `spieldaten.json` exportieren

Empfohlener Ablauf:

1. Zentrale Spielpflege öffnen.
2. Bestehende Daten laden.
3. Spiel über stabile ID auswählen oder neu anlegen.
4. Wettbewerb, Spieltag, Teams, Datum und Uhrzeit prüfen.
5. Ergebnis nur als Endergebnis markieren, wenn das Spiel abgeschlossen ist.
6. Datenprüfung ausführen.
7. Vollständige `spieldaten.json` exportieren.
8. Lokale Datei ersetzen.
9. Anschließend abhängige Wertungen neu berechnen.

Kritisch:

- Team-IDs nicht eigenmächtig ändern.
- Spiel-IDs nachträglich nicht ändern, wenn Tipps oder Sonderwertungen darauf verweisen.
- Datums- und Zeitformat konsistent halten.

---

## 9. Wettbewerbsverwaltung

Datei:

`wettbewerbspflege.html`

Hauptdatenquelle:

`wettbewerbe.json`

Zweck:

- Wettbewerbe verwalten
- Bezeichnungen und Zuordnungen pflegen
- Runden und Status verwalten
- vollständige `wettbewerbe.json` exportieren

Vor Änderungen prüfen:

- Wird die Wettbewerbs-ID bereits in `spieldaten.json`, `tippspieltage.json` oder Wertungsdateien verwendet?
- Ist der Wettbewerb öffentlich bereits verlinkt?
- Ist die Bezeichnung Bestandteil der Hall of Fame oder des Highscores?

IDs bestehender Wettbewerbe dürfen nicht ohne geplante Migration geändert werden.

---

## 10. Teams und Teilnehmer

Datei:

`team-teilnehmerpflege.html`

Zentrale Datenquellen:

- `teams.json`
- `teilnehmer.json`

Zweck:

- Mannschaftsdaten pflegen
- Teilnehmerdaten pflegen
- Teamzuordnung der Teilnehmer verwalten
- stabile IDs beibehalten
- Datenexport für die weitere Nutzung

Für Teilnehmer gilt:

- Keine unnötigen personenbezogenen Daten übernehmen.
- E-Mail-Adressen gehören nicht in die öffentliche `teilnehmer.json`.
- Anzeigenamen und stabile IDs nicht leichtfertig verändern.
- Teamzuordnungen beeinflussen die Teamwertung.

Für Mannschaften gilt:

- Team-ID als stabile Referenz behandeln.
- Schreibweisen vereinheitlichen.
- Neue Vereine zentral in `teams.json` ergänzen.
- Schmugglersiegel und Registerzuordnung bei neuen Vereinen mitprüfen.

---

## 11. Zentrale Tippdaten

Datei:

`tipppflege.html`

Hauptdatenquelle:

`tipps.json`

Zweck:

- vorhandene Tipps prüfen
- Tipps lokal ergänzen oder korrigieren
- Teilnehmer und Spiele über stabile IDs zuordnen
- vollständige `tipps.json` exportieren

Vor dem Export prüfen:

- Teilnehmer-ID vorhanden
- Spiel-ID vorhanden
- Tippwerte vollständig und plausibel
- keine doppelten Tipps für dieselbe Kombination aus Teilnehmer und Spiel

Korrekturen an bereits gewerteten Tipps erfordern anschließend eine neue Punkteberechnung.

---

## 12. Punkteberechnung

Datei:

`punkteberechnung.html`

Wichtige Datenquellen:

- `tipps.json`
- `spieldaten.json`
- `teilnehmer.json`
- `wertungsregeln.json`
- `bonusfragen.json`
- `bonusantworten.json`

Wesentliche Regel:

- Ergebnis: 5 Punkte
- Tordifferenz: 3 Punkte
- Tendenz: 2 Punkte

Ausgabe:

`punkte.json`

Empfohlener Ablauf nach neuen Endergebnissen:

1. `spieldaten.json` aktualisieren.
2. `tipps.json` kontrollieren.
3. Punkteberechnung öffnen.
4. Berechnung vollständig durchführen.
5. Auffälligkeiten prüfen.
6. `punkte.json` exportieren.
7. Lokale und öffentliche Datei ersetzen.
8. Danach abhängige Wertungen neu erzeugen.

---

## 13. Bonusfragen und Sonderpunkte

Datei:

`bonuspflege.html`

Datenquellen:

- `bonusfragen.json`
- `bonusantworten.json`

Aktuelle Projektregel:

- Bonuswettbewerb ist Tippspieltag 1.
- 25 Saisonfragen.
- 5 Punkte je richtiger Antwort.
- maximal 125 Punkte.
- Punkte fließen in die Gesamtwertung ein.
- Smugglerauftrag „Auftakt“ beginnt deshalb mit Spieltag 2.

Ablauf:

1. Fragen und Lösungen prüfen.
2. Teilnehmerantworten eintragen oder importieren.
3. Vollständigkeit kontrollieren.
4. Dateien exportieren.
5. Punkteberechnung erneut ausführen.

---

## 14. Smuggleraufträge

Datei:

`smugglerpflege.html`

Hauptdatenquelle:

`smugglerauftraege.json`

Zweck:

- 34 Dynamo-Sondermissionen verwalten
- reale Dynamo-Spiele über Spiel-ID zuordnen
- Kicktipp-Spieltag festlegen
- Bezeichnung und Status pflegen

Verbindliche Regeln:

- Jeder Smugglerauftrag ist ein reales Spiel der SG Dynamo Dresden.
- Jeder Auftrag ist ein eigener Wertungsspieltag.
- Der Auftakt ist Tippspieltag 2.

Vor Export prüfen:

- referenzierte Spiel-ID existiert in `spieldaten.json`
- Spiel ist tatsächlich Dynamo Dresden zugeordnet
- Kicktipp-Spieltag ist korrekt
- kein Auftrag doppelt vorhanden

---

## 15. Smugglerwertung

Datei:

`smugglerwertung.html`

Datenquellen:

- `smugglerauftraege.json`
- `spieldaten.json`
- `tipps.json`
- `teilnehmer.json`
- `wertungsregeln.json`

Ausgabe:

`smugglerpunkte.json`

Die Smugglerwertung ist eine eigenständige Rangliste. Nach Änderungen an Ergebnissen, Tipps oder Smuggleraufträgen muss sie neu berechnet und exportiert werden.

---

## 16. Teamwertung

Datei:

`teamwertung.html`

Datenquellen:

- `punkte.json`
- `teilnehmer.json`

Ausgabe:

`teampunkte.json`

Zweck:

- Einzelpunkte anhand der Teamzuordnung zusammenführen
- Old Smugglers Team und New Smugglers Team auswerten

Nach Änderungen an:

- `punkte.json`
- Teilnehmerstatus
- Teamzuordnung

muss die Teamwertung neu erzeugt werden.

---

## 17. Wettbewerbswertungen

Datei:

`wettbewerbswertung.html`

Hauptdatenquelle:

`punkte.json`

Ausgabe:

`wettbewerbspunkte.json`

Zweck:

- getrennte Einzelranglisten je Wettbewerb erzeugen

Nach einer neuen Gesamtpunkteberechnung sollte diese Wertung ebenfalls neu erstellt werden.

---

## 18. Spieltagwertungen

Datei:

`spieltagwertung.html`

Datenquellen:

- `spieldaten.json`
- `punkte.json`
- weitere zentrale Teilnehmer- und Wettbewerbsdaten

Ausgabe:

`spieltagpunkte.json`

Zweck:

- getrennte Rangliste für jeden erfassten Wertungsspieltag

Besonders relevant für:

- normale Spieltage
- Smuggleraufträge
- Piratenkodex
- Weihnachtsregatta
- Bonuswettbewerb

---

## 19. Ranglistenverlauf

Datei:

`ranglistenverlauf.html`

Datenquelle/Ausgabe:

`ranglistenverlauf.json`

Zweck:

- zeitliche Entwicklung von Punkten und Platzierungen
- Form der letzten Wertungsabschnitte
- Verlaufskontrolle

Der Ranglistenverlauf sollte erst nach aktualisierten Punkte- und Spieltagwertungen neu erzeugt werden.

---

## 20. Saisonarchiv und Hall of Fame

Datei:

`saisonarchiv.html`

Zentrale Daten:

- `saisonarchiv.json`
- `hall-of-fame.json`

Zweck:

- abgeschlossene Spielzeiten archivieren
- Titelträger und Rekorde pflegen
- Hall-of-Fame-Daten vorbereiten
- JSON- oder CSV-Export

Vor Saisonabschluss:

1. Alle Ergebnisse vollständig erfassen.
2. Punkte und Sonderwertungen neu berechnen.
3. Gesamtchampion und Wettbewerbssieger prüfen.
4. Archivdatensatz erstellen.
5. Hall of Fame ergänzen.
6. Beide Dateien sichern und veröffentlichen.

Historische Einträge nicht überschreiben, sondern ergänzen.

---

## 21. Tippfristen und Abgaben

Datei:

`tippfristen.html`

Datenquelle/Ausgabe:

`tippfristen.json`

Zweck:

- bestätigte Anstoßzeiten kontrollieren
- Fristen ableiten
- fehlende Tippabgaben erkennen

Nur bestätigte Termine als verlässliche Fristgrundlage verwenden.

Bei Spielverlegungen müssen Termine und Fristen erneut geprüft werden.

---

## 22. Abgabe-Erinnerungen

Datei:

`abgabe-erinnerungen.html`

Datenquelle/Ausgabe:

`abgabe-erinnerungen.json`

Zweck:

- aus fehlenden Abgaben vorbereitete Erinnerungstexte erzeugen
- Texte kopierbar bereitstellen

Ein automatischer Versand findet nicht statt.

Erinnerungen vor dem Kopieren kontrollieren:

- richtiger Teilnehmer
- richtiger Wettbewerb
- richtige Frist
- keine bereits abgegebene Tippabgabe

---

## 23. Erinnerungsprotokoll

Datei:

`erinnerungsprotokoll.html`

Datenquelle/Ausgabe:

`erinnerungsprotokoll.json`

Zweck:

- manuell versendete Erinnerungen dokumentieren
- Einträge ergänzen und entfernen
- JSON- oder CSV-Export

Das Protokoll beeinflusst die spätere Auswertung der Abgabezuverlässigkeit.

---

## 24. Abgabezuverlässigkeit

Datei:

`abgabezuverlaessigkeit.html`

Zentrale Datenquellen:

- bestätigte Tippfristen
- vorhandene Tipps
- Erinnerungsprotokoll
- Teilnehmerdaten

Ausgabe:

`abgabezuverlaessigkeit.json`

Zweck:

- fehlende oder verspätete Abgaben auswerten
- Teilnehmerstatus und Zuverlässigkeit kontrollieren

Die Auswertung ist lesend. Vor Schlussfolgerungen müssen Termine, Tipps und Erinnerungsprotokoll aktuell sein.

---

## 25. Datenqualitätsprüfung

Datei:

`datenqualitaet.html`

Datenquelle/Ausgabe:

`datenqualitaet.json`

Geprüft werden unter anderem:

- fehlende Pflichtfelder
- doppelte IDs
- ungültige Referenzen
- unvollständige Ergebnisse
- unplausible Tippwerte
- inkonsistente Termine

Empfehlung:

Die Datenqualitätsprüfung ist der letzte Pflichtschritt vor jedem öffentlichen Datenupdate.

Fehler nicht blind automatisch korrigieren. Zuerst Ursache und betroffene Referenzen prüfen.

---

## 26. Empfohlene Berechnungsreihenfolge

Nach neuen Spielergebnissen oder Tippkorrekturen:

1. `spieldaten.json`
2. `tipps.json`
3. `bonusfragen.json` / `bonusantworten.json`, falls betroffen
4. `punkte.json`
5. `smugglerpunkte.json`
6. `teampunkte.json`
7. `wettbewerbspunkte.json`
8. `spieltagpunkte.json`
9. `ranglistenverlauf.json`
10. `highscore.json`, sofern der bestehende Workflow dies erzeugt oder importiert
11. Datenqualitätsprüfung
12. Veröffentlichung der geänderten Dateien

Diese Reihenfolge verhindert, dass abgeleitete Ranglisten mit veralteten Grunddaten veröffentlicht werden.

---

## 27. Neue Saison anlegen

Der aktuelle Adminbereich besitzt kein vollständig automatisches Ein-Klick-Verfahren für den Saisonwechsel.

Der Saisonwechsel erfolgt kontrolliert:

1. Vollständige Sicherung des Adminordners erstellen.
2. Alte Saison abschließen.
3. Saisonarchiv und Hall of Fame ergänzen.
4. Neue Saisonkennung in den zentralen Daten prüfen.
5. Neue Wettbewerbe und Spieltage anlegen.
6. Teilnehmerbestand übernehmen und Status prüfen.
7. Teams und neue Vereine ergänzen.
8. Neue Spiele in `spieldaten.json` eintragen.
9. Smuggleraufträge neu zuordnen.
10. Bonusfragen der neuen Saison eintragen.
11. Tippfristen prüfen.
12. Abgeleitete Wertungsdateien kontrolliert leeren oder neu erzeugen.
13. Datenqualitätsprüfung ausführen.
14. Öffentliche Website vollständig auf Desktop und Mobil testen.

Vor dem tatsächlichen Saisonwechsel ist eine eigene, versionsgebundene Checkliste zu erstellen.

---

## 28. GitHub-Update durchführen

Der Adminbereich lädt nicht automatisch zu GitHub hoch.

Manueller Ablauf:

1. Exportierte Datei im Download-Ordner finden.
2. Dateiname prüfen.
3. Inhalt lokal sichern.
4. Gleichnamige Datei im Repository öffnen bzw. ersetzen.
5. Bei mehreren Dateien Updatepaket verwenden.
6. GitHub-Commit mit eindeutiger Versionsangabe erstellen.
7. Veröffentlichung abwarten.
8. Website mit `Strg + F5` neu laden.
9. Betroffene Bereiche auf Desktop und Mobil prüfen.

GitHub-Weboberfläche:

- höchstens 100 Dateien pro Uploadpaket
- größere Updates in mehrere Pakete aufteilen

---

## 29. Backup und Wiederherstellung

Vor jeder größeren Änderung:

1. Gesamten Adminordner kopieren.
2. Sicherung mit Datum und Versionsstand benennen.
3. Zusätzlich zentrale JSON-Dateien separat sichern.
4. Letzten funktionierenden Stand nicht überschreiben.

Beispiel:

`OSC-Admin-Backup-2026-08-01-v4.0.5`

Bei Fehlern:

1. Adminserver beenden.
2. fehlerhaften Ordner nicht weiter bearbeiten.
3. letzte funktionierende Sicherung kopieren.
4. Adminbereich aus der Kopie starten.
5. Unterschiede zur fehlerhaften Version nachvollziehen.

---

## 30. Typische Fehler

### Adminseite lädt keine Daten

- Seite nicht direkt per Doppelklick öffnen.
- Adminserver starten.
- `http://localhost:8765/admin.html` verwenden.
- PowerShell-Fenster geöffnet lassen.

### Port 8765 ist belegt

- alte PowerShell-Fenster schließen
- Adminserver erneut starten

### Export ist auf der Website nicht sichtbar

- Export ersetzt lokale Datei nicht automatisch
- Datei im Repository möglicherweise nicht ersetzt
- GitHub Pages noch nicht aktualisiert
- Browsercache mit `Strg + F5` leeren

### Ranglisten sind veraltet

- Grunddaten wurden geändert
- abhängige Punkte- und Wertungsdateien wurden nicht neu berechnet
- empfohlene Berechnungsreihenfolge vollständig wiederholen

### Referenzfehler

- Team-, Teilnehmer-, Spiel- oder Wettbewerbs-ID wurde verändert
- Datenqualitätsprüfung ausführen
- stabile IDs wiederherstellen oder Migration planen

---

## 31. Bekannte Grenzen des aktuellen Adminsystems

- Keine automatische GitHub-Veröffentlichung.
- Viele Exporte müssen manuell in den lokalen Ordner und das Repository übernommen werden.
- Öffentliche Websitebestandteile und Adminmodule liegen im lokalen Paket teilweise gemeinsam vor.
- Historische Release-Dateien erhöhen die Dateimenge.
- Versionsangaben innerhalb älterer Dokumente sind teilweise nicht einheitlich.
- Der Saisonwechsel ist noch nicht vollständig automatisiert.
- Die Berechnungsreihenfolge wird noch nicht zentral erzwungen.
- Eine zentrale Datenbasis ist noch nicht vollständig abgeschlossen.

Diese Punkte sind Bestandteil der weiteren 4.x-Roadmap.

---

## 32. Verbindlicher nächster Architektur-Schritt

Nach Fertigstellung dieses Handbuchs folgt eine Feld-für-Feld-Migrationsmatrix für die zentrale Datenhaltung.

Darin wird dokumentiert:

- welches Datenfeld heute in welcher Datei liegt
- welche Datei führend ist
- welche Redundanzen bestehen
- welche Adminmodule betroffen sind
- welche öffentliche Seite die Daten verwendet
- welche Migration ohne Funktionsverlust möglich ist

Bis zur Freigabe dieser Migrationsmatrix werden keine bestehenden JSON-Dateien eigenmächtig entfernt oder umbenannt.


## 33. Geplanter zentraler Spieltagsabschluss

Der Zielworkflow ist in `SPIELTAGSABSCHLUSS_KONZEPT.md` verbindlich beschrieben.

Wesentliche Regel:

> Der Kicktipp-Export ist die verbindliche Wahrheit. Fehlende Tipps sind zulässig, gelten als nicht abgegeben und erhalten 0 Punkte. Sie blockieren die Berechnung nicht.

Die technische Umsetzung beginnt erst nach Analyse einer echten Kicktipp-Exportdatei.

## 34. Verbindliche Wertungslogik

Für alle Berechnungen gilt: Ergebnis 5 Punkte, Tordifferenz 3 Punkte, Tendenz 2 Punkte, Remis ohne exaktes Ergebnis 3 Punkte, falsche Tendenz 0 Punkte. Gewertet wird ausschließlich das offizielle Ergebnis nach 90 Minuten einschließlich Nachspielzeit, ohne Verlängerung und ohne Elfmeterschießen.

## 35. Geplanter Spielbetriebs-Workflow

Der verbindliche Ablauf ist in `SPIELBETRIEB_WORKFLOW.md` beschrieben.

Das geplante zentrale Bedienkonzept ist in `ADMIN_COCKPIT_KONZEPT.md` dokumentiert.

Bis zur technischen Umsetzung bleiben die bestehenden Einzelmodule maßgeblich.

## 36. Kicktipp-Exportanalyse

Die tatsächlich analysierten Exportformate und der geplante Importvertrag sind dokumentiert in:

- `KICKTIPP_EXPORTANALYSE.md`
- `KICKTIPP_IMPORTSPEZIFIKATION.md`

Originalexporte enthalten personenbezogene Daten und dürfen nicht in das öffentliche Repository übernommen werden.
