# SMUGGLERS DESIGN SYSTEM (SDS)

## 1. Status

**SDS-Version:** 1.0 – Spezifikation  
**Projektversion:** 4.4.5  
**Freigabestatus:** Master-Spezifikation freigegeben; visuelle Masterdatei noch nicht erstellt.

Dieses Dokument definiert das verbindliche Gestaltungssystem für eigene visuelle Kennzeichen des Projekts **The Old Smugglers Club**.

## 2. Zweck

Das SDS schafft eine einheitliche, langfristig wartbare visuelle Sprache für:

- Schmugglersiegel für Vereine
- Wettbewerbssiegel
- Hall-of-Fame-Siegel
- Pokale und Medaillen
- Rang- und Erfolgsauszeichnungen

Offizielle Vereinswappen oder nachgebaute Vereinslogos sind nicht Bestandteil des Systems.

## 3. Begriff

Die eigenen Vereinskennzeichen heißen verbindlich **Schmugglersiegel**.

Sie repräsentieren einen Verein innerhalb der Website ausschließlich durch:

- Vereinsfarben
- ein neutrales Kürzel
- das einheitliche SDS-Masterdesign

## 4. Master-Schmugglersiegel v1.0

### 4.1 Grundform

- kreisförmig
- Seitenverhältnis 1:1
- transparenter Außenbereich
- keine Schild-, Banner- oder Wappenform

### 4.2 Außenring

- massiver Messingring
- acht gleichmäßig angeordnete Nieten
- dezente Alterung und Patina
- keine glänzende Chrom- oder Goldfolienoptik
- Geometrie für alle Schmugglersiegel identisch

### 4.3 Innenfläche

- vertikale Holzbohlen
- identische Holzstruktur für alle Siegel
- maximal zwei Vereinsfarben
- keine Übernahme offizieller Muster oder Logos

### 4.4 Initialen

- zentral ausgerichtet
- erhabene Messingoptik
- einheitliche Serifenschrift
- zwei bis vier Zeichen
- Kürzel müssen neutral und eindeutig sein
- keine vereinseigene Markenschrift

### 4.5 Neutrale Symbole

- oben: einheitliche Kompassrose
- unten: einheitlicher Anker
- Symbole variieren nicht zwischen Vereinen

### 4.6 Nicht zulässig

- offizielle Vereinswappen
- nachgezeichnete oder verfremdete Vereinslogos
- Vereinsmaskottchen
- Vereinsschriftzüge im Originalstil
- Banner mit Vereinsnamen
- Cliparts, Emojis oder Comicstil
- individuelle Sonderformen pro Verein

## 5. Farbregeln

- maximal zwei Hauptfarben je Verein
- Messing, Patina und Schatten bleiben serienweit identisch
- Farben werden gedämpft und an das dunkle Piratendesign angepasst
- gute Kontraste zu den Messinginitialen sind Pflicht
- bei sehr ähnlichen Vereinsfarben erfolgt die Unterscheidung zusätzlich über das Kürzel

## 6. Größenstandard

### Master

- 256 × 256 Pixel als verbindliche Entwurfsgröße

### Ableitungen

- 128 × 128 Pixel
- 96 × 96 Pixel
- 64 × 64 Pixel
- 48 × 48 Pixel
- 32 × 32 Pixel
- 24 × 24 Pixel
- 16 × 16 Pixel

Die kleineren Größen werden aus dem freigegebenen Master abgeleitet und müssen separat auf Lesbarkeit geprüft werden.

## 7. Dateistandard

### Format

- bevorzugt SVG für den editierbaren Master
- WebP oder PNG nur für geprüfte Rasterexporte
- transparenter Hintergrund

### Dateinamen

- ausschließlich Kleinbuchstaben
- Wörter mit Bindestrichen trennen
- keine Leerzeichen und keine Umlaute

Beispiele:

```text
sg-dynamo-dresden.svg
borussia-dortmund.svg
fc-bayern-muenchen.svg
```

## 8. Ordnerstruktur

```text
assets/
└── smugglers-design-system/
    ├── master/
    ├── schmugglersiegel/
    ├── wettbewerbssiegel/
    ├── pokale/
    ├── medaillen/
    ├── auszeichnungen/
    ├── texturen/
    │   ├── messing/
    │   └── holz/
    └── dokumentation/
        └── SMUGGLERS_DESIGN_SYSTEM.md
```

## 9. Einsatzbereiche

Nach gesonderter Freigabe dürfen Schmugglersiegel eingesetzt werden in:

- Aktueller Spieltag
- Wettbewerbs- und Saisonseiten
- Tabellen und Spielplänen
- Hall of Fame
- Highscore
- Adminbereich
- Saisonarchiv

Die Integration erfolgt schrittweise. Bereits freigegebene Kachelgrößen, Grid, Navigation und Grundlayout bleiben unverändert.

## 10. Entwicklungsphasen

### Phase 1 – Master

- [x] Begriff und Designprinzip festgelegt
- [x] technische Spezifikation dokumentiert
- [x] Ordnerstruktur angelegt
- [ ] editierbare Masterdatei entwickeln
- [ ] Darstellung in 256, 64 und 32 Pixel prüfen
- [ ] Master durch den Projektleiter freigeben

### Phase 2 – Pilotserie

- [ ] vier bewusst unterschiedliche Vereine ableiten
- [ ] Farb- und Kürzelregeln prüfen
- [ ] Desktop- und Mobilwirkung testen
- [ ] Serie freigeben oder Master korrigieren

### Phase 3 – Vereinsbibliothek

- [ ] vollständige Liste aller im Tippspiel vorkommenden Vereine ermitteln
- [ ] eindeutige Kürzel und Farbpaare festlegen
- [ ] alle Schmugglersiegel erzeugen
- [ ] Assetregister erstellen

### Phase 4 – Integration

- [ ] zuerst eine nichtkritische Testansicht integrieren
- [ ] Desktop und Mobil prüfen
- [ ] weitere Seiten einzeln freigeben
- [ ] Adminbereich zuletzt anbinden

## 11. Rückbau

Die Siegelintegration muss jederzeit vollständig rückbaubar bleiben.

Deshalb gilt:

- keine Vereinsnamen aus bestehenden Daten entfernen
- Siegel nur ergänzend anzeigen
- bei fehlendem Asset automatisch auf den Vereinsnamen zurückfallen
- keine bestehende Funktion von einem Siegel abhängig machen

## 12. Offener nächster Schritt

In Version 4.4.6 wird ausschließlich die editierbare Masterdatei entwickelt und als isolierter Prototyp geprüft. Eine Serienproduktion oder Integration in öffentliche Seiten erfolgt erst nach ausdrücklicher Freigabe.


## Stand Version 4.4.8

- Der v2-Pilotstil mit dominanten Kürzeln wurde freigegeben.
- Für alle 52 aktiven Teams aus `teams.json` existiert ein eigenes SVG-Schmugglersiegel.
- Die zentrale Zuordnung erfolgt über `schmugglersiegel-register.json`.
- Die Darstellung wird durch `team-badge.js` vereinheitlicht.
- Offizielle Vereinswappen, Vereinsschriften und geschützte Embleme werden nicht verwendet.
- Farben dienen der Wiedererkennbarkeit, sind aber bewusst Teil des eigenen SDS-Stils.
