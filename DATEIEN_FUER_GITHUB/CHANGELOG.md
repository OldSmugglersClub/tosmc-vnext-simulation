# Website 4.7.1-TEST5

- TEST4 als nicht veröffentlichten Zwischenstand verworfen und vollständig in TEST5 übernommen.
- Hinweisblock „Besondere Leistungen“ mit Piratensymbol statt gelbem Seitenstrich.
- Wettbewerbsnamen im Highscore auf Desktop und Mobil ohne willkürliche Worttrennung.
- DFB-Pokal in der Saisonübersicht einheitlich als „Ab Achtelfinale“ dargestellt.
- Buttonfarbregel vereinheitlicht: Gelb für Kicktipp, Braun für interne Rücknavigation.
- Interne Pflegehinweise wie „aktuell hinterlegt“ aus der öffentlichen Saisonübersicht entfernt.
- Saisonübersicht auf Mobil und Desktop inhaltlich vereinheitlicht.
- Keine Änderungen an Fachlogik, Datenmodell, Navigation, Grid oder Kachelgrößen.

# Website 4.7.1-TEST4

- Hall-of-Fame-Hinweis „Besondere Leistungen“: gelben Seitenstrich durch vorhandenes Club-Piratensymbol ersetzt.
- Highscore-Wettbewerbsnavigation: willkürliche Worttrennung bei Gesamtwertung, Bundesliga und Piratenkodex verhindert.
- Saisonübersicht: DFB-Pokal-Zeitraum besucherorientiert auf „Ab Achtelfinale“ vereinheitlicht.
- Aktionsfarben vereinheitlicht: Kicktipp gelb, interne Rücknavigation braun.
- Keine Änderungen an Fachlogik, Buttonzielen, Grid, Kachelgrößen, Admin oder JSON-Strukturen.

# Website 4.7.1-TEST3

- Mobile Header-Kollision zwischen Markenname und Menü behoben.
- Willkürliche Worttrennung bei „Weihnachtsregatta“ verhindert.
- Keine Funktions- oder Architekturänderungen.

# Website 4.7.0-HF2 – Adaptive mobile Spieltagsliste – 05.08.2026

- Mobile Höhe der unteren Spieltagsliste richtet sich nach der tatsächlichen Spielanzahl.
- Ein Spiel wird kompakt ohne Scrollbereich und ohne Leerfläche angezeigt.
- Zwei Spiele werden vollständig ohne internes Scrollen angezeigt.
- Ab drei Spielen bleibt die Liste scrollbar; etwa zwei Begegnungen sind gleichzeitig sichtbar.
- Desktop-Darstellung, Daten und Spieltagslogik bleiben unverändert.

# Website 4.7.0-HF1 – Mobile Spieltagsliste – 05.08.2026

- Mobile Spieltagsliste vergrößert, sodass mindestens zwei Begegnungen sichtbar sind.
- Desktop und Logik unverändert.

# Website 4.7.0 FINAL – Produktionsfreigabe – 05.08.2026

- Freigegebener Stand RC8.5-HF4 übernommen.
- Simulierter Testzeitpunkt aus `website-view.json` entfernt.
- Versionsangaben auf `4.7.0` vereinheitlicht.
- Hall of Fame, Wettbewerbsseiten, Saisonübersicht, Highscore, Spieltagskachel und Countdown als freigegebener Produktionsstand gebündelt.
- Smugglerauftrags-Startseitenkachel bleibt entfernt; Wettbewerb und Berechnungen bleiben erhalten.

# Website 4.7.0-RC8.5-HF4-TEST – Hall of Fame final strukturieren – 05.08.2026

- Auf der Startseite steht „Ehrenmitglieder & besondere Leistungen“ nun vor der Rekordtafel.
- Die Rekordtafel wurde unter die besondere Leistung verschoben.
- Die redaktionelle Ehrenlogbuch-Erklärbox wurde von der Startseite entfernt.
- Im Ehrenlogbuch steht die Erklärbox als letzter inhaltlicher Abschnitt direkt vor Status und Footer.
- Keine Änderungen an Daten, Siegerlogik, Rekordwerten, Grid, Navigation oder Kachelgrößen.

# Website 4.7.0-RC8.5-HF3-TEST – Hall of Fame Bereinigung – 05.08.2026

- Meisterchronik von der Startseite entfernt; sie bleibt ausschließlich im Ehrenlogbuch.
- Startseiten-Footer auf dynamische Versionsanzeige aus `VERSION.txt` umgestellt.
- Champion-Pokal im Ehrenlogbuch auf den robusten ASCII-Dateinamen `champion-trophy.jpeg` umgestellt.
- Fehlerhaft codierte Duplikate der Champion-Trophäe entfernt.
- Keine Änderungen an Hall-of-Fame-Daten, Titelkabinett, Rekordtafel oder besonderer Leistung.

# Website 4.7.0-RC8.5-HF2-TEST – Ehrenlogbuch statistisch trennen – 05.08.2026

- Die repräsentative Sonderauszeichnung bleibt ausschließlich auf der Startseite.
- Das Ehrenlogbuch zeigt besondere Leistungen jetzt als kompakte chronologische Liste.
- Meisterchronik, Titelkabinett, Rekordtafel und Hall-of-Fame-Daten bleiben unverändert.
- Keine Änderungen an Grid, Kachelgrößen, Navigation oder Admin-Logik.

# Website 4.7.0-RC8.4-TEST – nicht automatisierte Sondermissionskachel entfernt – 05.08.2026

- Die eigenständige Smugglerauftragskachel wurde von der Startseite entfernt.
- Grund: Der automatische Wechsel der aktuellen Mission, der Missionsakte und sämtlicher veränderlicher Felder für Auftrag 2–34 ist noch nicht umgesetzt.
- Der zugehörige Startseiten-Navigationspunkt wurde entfernt, damit kein toter Sprunglink bestehen bleibt.
- Die Smuggleraufträge bleiben über „Unsere Wettbewerbe“ → „Dynamo Dresden“ vollständig erreichbar.
- Ein späterer Ausbau zu einer zentralen Sondermissionskachel für Smuggleraufträge, Piratenkodex und Weihnachtsregatta bleibt in der Roadmap vorgemerkt.
- Keine Änderungen an Grid, Kachelgrößen der verbleibenden Bereiche, Berechnung, Wettbewerbsseiten oder Spielbetriebsdaten.

# Website 4.7.0-RC8.3-TEST – Sondermissionskachel redaktionell präzisiert – 05.08.2026

- Die Bereichsbezeichnung der Smugglerauftragskachel wurde von „Sondermissionen“ auf „Sondermission“ geändert.
- Die Kachel bleibt in Version 4.7.0 ausschließlich auf die Smuggleraufträge ausgerichtet.
- Der spätere Ausbau zu einer auswählbaren Sondermissionszentrale für Smuggleraufträge, Piratenkodex und Weihnachtsregatta ist für eine Folgeversion vorgesehen.
- Keine Änderungen an Datenlogik, Navigation, Grid, Kachelgröße oder Grundlayout.

# Website 4.7.0-RC8.2-HF1-TEST – Wettbewerbsseiten redaktionell geordnet – 05.08.2026

- Die öffentliche technische Datenmanagement-Box der Bundesliga-Seite wurde entfernt.
- Auf der Seite „Dynamo Dresden / Smuggleraufträge“ stehen die Regeln jetzt vor der vollständigen Liste der 34 Aufträge.
- Datenquellen, Berechnung, Navigation, Grid, Kachelgrößen und Grundlayout bleiben unverändert.

# Website 4.7.0-RC8.1-HF3-TEST – Missionsblock vertikal zentriert – 05.08.2026

- Symbol und vollständiger Textblock der Box „Nächste Mission“ werden als gemeinsame Einheit vertikal zentriert.
- Überschrift, Missionsname und Datum erhalten feste, ruhige Abstände ohne zusätzliche obere Verschiebung.
- Keine Änderungen an Grid, Kachelgröße, Datenquelle, Navigation oder Grundlayout.

# Website 4.7.0-RC8.1-HF2-TEST – Missionsfeld typografisch entzerrt – 05.08.2026

- Überschrift, Missionsname und Datum erhalten eine klarere vertikale Gliederung innerhalb der bestehenden Statusbox.
- Der Abstand unter „Nächste Mission“ und zwischen Missionsname und Datum wurde gezielt vergrößert.
- Missionsname und Datum bleiben vollständig dynamisch; die Begrenzung auf höchstens zwei Namenszeilen bleibt erhalten.
- Keine Änderungen an Grid, Kachelgröße, Datenquelle, Navigation oder Grundlayout.

# Website 4.7.0-RC8.1-HF1-TEST – Missionsname und Termin abgesichert – 05.08.2026

- „Nächste Mission“ zeigt jetzt den Namen des nächsten bestätigten Events und das Datum in getrennten Zeilen.
- Der Missionsname ist auf zwei sichtbare Zeilen begrenzt und bricht lange Bezeichnungen kontrolliert um.
- Der Testzeitpunkt liegt vor dem Smugglerauftrag „Auftakt“, damit die fachlich erste Mission der Saison geprüft wird.
- Countdown, Spieltagskachel und Schmugglerrat verwenden weiterhin dieselbe zentrale Eventauswahl.
- Keine Änderungen an Grid, Kachelgröße, Navigation oder Grundlayout.

# Website 4.7.0-RC8.1-TEST – Hoher Schmugglerrat dynamisiert – 05.08.2026

- Saisonplakette und Saisonfeld lesen die aktive Saison aus dem zentralen Spielbetriebsdatenstand.
- „Nächste Mission“ nutzt dieselbe Ereignisauswahl wie Countdown und Spieltagskachel.
- Der alte Smugglerauftrag-spezifische Überschreibpfad für „Nächste Mission“ wurde entfernt.
- „Aktueller Champion“ behält die Hall-of-Fame-Datenanbindung; statische Altwerte im HTML wurden durch neutrale Fallbacks ersetzt.
- Link und Beschriftung „Zur Tipprunde“ werden aus der zentralen Schedule-Konfiguration geladen und bei fehlendem Link ausgeblendet.
- Keine Änderungen an Grid, Kachelgröße, Navigation, Grundlayout oder Design.

# Website 4.7.0-RC7-HF1-TEST – Dynamische Footer-Version – 05.08.2026

- Die Versionsanzeige der Saisonübersicht wird nicht mehr statisch im HTML gepflegt.
- `saisonuebersicht.js` lädt die aktuelle Version über das Datenregister aus `VERSION.txt`.
- Bei fehlender oder leerer Versionsdatei erscheint ein eindeutiger Fehlerhinweis statt einer veralteten Versionsnummer.
- Keine Änderungen an Saisonkennzahlen, Wettbewerbsstatus, Tabellenstruktur, Grid, Navigation oder Grundlayout.

# Website 4.7.0-RC7-TEST

- Saisonübersicht fachlich nachgeschärft.
- „Bereits terminiert“ zählt nur Spiele mit bestätigtem Datum und Anstoßzeit.
- Wettbewerbsstatus wird aus Terminierung und Ergebnissen abgeleitet; statische Angaben bleiben nur als Fallback für Wettbewerbe ohne Spiele erhalten.
- Saison-Sollwerte werden ohne missverständliches Pluszeichen als bekannte Planung angezeigt; offene Wettbewerbe werden im Hinweis ausgewiesen.
- Versionsanzeige der Saisonübersicht aktualisiert.
- Keine Änderung an Grid, Tabellenstruktur, Navigation oder Grundlayout.

# Website 4.7.0-RC6-HF7-TEST – Spielzeilen-Refactoring – 05.08.2026

- Die Paarung jeder Spielzeile wird als eine geschlossene Einheit gerendert: Wappen, Heimteam, Trennzeichen, Auswärtsteam, Wappen.
- Die in HF6 versehentlich entfernte sichtbare Siegelgestaltung wurde vollständig wiederhergestellt.
- Eine einzige verbindliche Regelgruppe steuert die Desktop- und Mobildarstellung der Paarung.
- Keine Änderungen an Grid, Kachelgröße, Spieltagsdaten, Navigation, Countdown oder Highscore.

# Website 4.7.0-RC6-HF6-TEST – CSS-Kaskade der Spielpaarungen bereinigt – 05.08.2026

- Widersprüchliche RC5-, HF2-, HF4- und HF5-Regeln der Spielpaarung wurden aus `index.html` bereinigt.
- Für Desktop gilt nur noch eine verbindliche Paarungsregel: Wappen direkt am jeweiligen Mannschaftsnamen, gesamte Paarung mittig.
- HTML-Struktur, Spielbetriebsdaten, Kachelgröße, Grid, Navigation und Berechnungslogik bleiben unverändert.
- Der Hotfix behebt die nachträgliche Überschreibung der HF5-Regel durch ältere CSS-Blöcke.

# Website 4.7.0-RC6-HF5-TEST – Wappen direkt an den Mannschaftsnamen – 05.08.2026

- Heimwappen steht unmittelbar vor dem Heimteam.
- Auswärtswappen steht unmittelbar hinter dem Auswärtsteam.
- Die vollständige Paarung wird als geschlossene Einheit innerhalb der Spielzeile zentriert.
- Uhrzeit, Wettbewerb und Statusplakette bleiben unverändert.
- Keine Änderungen an Grid, Kachelgröße, Spieltagsdaten, Navigation oder Berechnungslogik.

# Website 4.7.0-RC6-HF4-TEST – Paarungen optisch zentriert – 05.08.2026

- Heimteamnamen stehen rechtsbündig zum festen Trennzeichen; Auswärtsteamnamen beginnen linksbündig dahinter.
- Jede Begegnung wirkt damit wieder als geschlossene Einheit „Mannschaft A – Mannschaft B“.
- Feste Siegel-, Trennzeichen- und Statusachsen aus RC6-HF2 bleiben erhalten.
- Keine Änderungen an Grid, Kachelgröße, Kalenderdaten, Navigation, Countdown-Logik oder Highscore.

# Website 4.7.0-RC6-HF3-TEST – Spielzeilen exakt ausgerichtet – 05.08.2026

- Heim- und Auswärtsteamnamen beginnen in allen Desktop-Spielzeilen auf identischen vertikalen Achsen.
- Die rechtsbündige Ausrichtung der Heimteam-Namen wurde entfernt; unterschiedliche Namenslängen verschieben die Zeilen nicht mehr optisch.
- Die hervorgehobene Begegnung wird abhängig vom Zustand als „Aktuelles Spiel“, „Nächstes Spiel“ oder „Letztes Spiel“ bezeichnet.
- Keine Änderungen an Grid, Kachelgröße, Kalenderdaten, Navigation, Countdown-Logik oder Highscore.

# Website 4.7.0-RC6-HF2-TEST – Ausrichtung der Spielzeilen – 05.08.2026

- Die Paarungen sämtlicher Spielzeilen verwenden feste, identische Achsen für Heim-Siegel, Vereinsnamen, Trennzeichen und Auswärts-Siegel.
- Unterschiedlich lange Vereinsnamen verschieben die darunterliegenden Begegnungen nicht mehr seitlich.
- Spielstatus werden als kompakte Messingplaketten innerhalb der vorhandenen Statusspalte dargestellt.
- Keine Änderungen an Grid, Kachelgröße, Spieltagsdaten, Navigation oder Spielbetriebslogik.

# Website 4.7.0-RC6-HF1-TEST – Eindeutige LIVE-Anzeige – 04.08.2026

- Die vier Nullfelder des Countdowns werden während laufender Begegnungen ausgeblendet.
- Stattdessen erscheint zentral „JETZT LIVE“ beziehungsweise „N SPIELE LIVE“.
- Infobox, parallele LIVE-Erkennung und automatischer Wechsel zum nächsten Event bleiben unverändert.
- Keine Änderungen an Grid, Kachelgröße, Spieltagsdaten, Navigation oder Highscore.

# Website 4.7.0-RC6-TEST – Belastungstest Spieltagskachel – 04.08.2026

- Vollständiger Bundesliga-Tippspieltag mit 9 Begegnungen als zentraler Testdatenstand aktiviert.
- Verteilung: Freitag 1 Spiel, Samstag 6 Spiele, Sonntag 2 Spiele.
- Simulierter Zeitpunkt: Samstag, 29.08.2026, 16:00 Uhr.
- Freitagsspiel erscheint beendet, fünf Samstagsspiele erscheinen LIVE, das Abend- und die Sonntagsspiele terminiert.
- Team-Siegel, Tagesgruppierung, Sortierung, Scrollbereich, Statusdarstellung und Event-Countdown werden unter hoher Belegung geprüft.
- Smuggleraufträge werden gemäß Architekturregel nicht mit einem eigenständigen Bundesliga-Tippspieltag vermischt.
- Keine Änderung an Grid, Kachelgröße, Navigation, Berechnungslogik oder Highscore-Nullstand.

# Website 4.7.0-RC5-HF1-TEST – Abstand Event-Infobox – 04.08.2026

- Der vertikale Abstand zwischen Countdown-Zähler und Event-Infobox wurde innerhalb der bestehenden Countdown-Kachel vergrößert.
- Keine Änderung an Kachelgröße, Grid, Countdown-Logik, Eventdaten oder Navigation.

# Website 4.7.0-RC5-TEST – Spielzeilen-Siegel und Event-Countdown – 04.08.2026

- Alle Begegnungen der Spieltagsliste zeigen Heim- und Auswärtssiegel aus dem bestehenden Teamregister.
- Der bisherige Bundesliga-Start-Zähler zählt dauerhaft bis zum nächsten zentral bestätigten Event.
- Während eines laufenden Events zeigt der Chronometer „JETZT LIVE“; anschließend wechselt er zum nächsten Termin.
- Ohne weiteren Termin wird ein definierter Saison-/Leerzustand angezeigt.
- Countdown und Spieltagskachel nutzen dieselben zentralen Schedule-Daten aus `website-view.json`.
- Keine Änderungen an Grid, Kachelgrößen, Navigation, Highscore-Berechnung oder Grundlayout.

# Website 4.7.0-RC4-HF2-TEST – Spieltagslogbuch und Ausrichtung – 04.08.2026

- Der vorhandene Button „Spieltagslogbuch“ wird im zentralen Spielbetriebsmodus wieder angezeigt.
- Der zentrale `schedule`-Block enthält den Link und den Buttontext ausdrücklich.
- Der Adapter besitzt zusätzlich robuste Standardwerte, falls ein späterer Admin-Export diese optionalen Angaben nicht liefert.
- Die Paarung in den unteren Spielzeilen der Spieltagskachel wird innerhalb ihrer bestehenden Spalte weiter zentriert.
- Keine Änderungen an Grid, Kachelgröße, Navigation, Kalenderlogik, Siegeln oder Highscore.

# Website 4.7.0-RC4-HF1-TEST – offizieller Tippspielkalender und Statusplakette – 04.08.2026

- Die zentrale Spieltagskachel nutzt nun den vollständigen, aus 4.6.1 übernommenen offiziellen Tippspielkalender.
- Bonusfragen bleiben Tippspieltag Nr. 1; „Smugglerauftrag Auftakt“ ist Tippspieltag Nr. 2.
- Ein Tippspieltag enthält stets alle ihm zugeordneten Spiele; Bundesliga-Spieltage werden vollständig nach Kalendertagen gruppiert.
- Der falsche künstliche Kombinationsspieltag „Bundesliga + Smugglerauftrag“ wurde entfernt.
- Sichtbarer RC4-Testhinweis wurde entfernt.
- Die Statusplakette verhindert Umbrüche wie „LIV / E“.
- Keine Änderungen an Grid, Navigation, Kachelgrößen, Highscore-Berechnung oder Grundlayout.

# Website 4.7.0-RC4-TEST — Zentrale Spielbetriebsintegration

- Spieltagskachel liest primär den neuen `schedule`-Block aus `website-view.json`.
- Highscore und Spieltagskachel verwenden damit dieselbe Website-Momentaufnahme.
- Rückfall auf `spieltag.json`, `spieldaten.json`, `teams.json` und `tippspieltage.json` bleibt erhalten.
- RC4-Testdaten bilden Freitag bis Sonntag, parallelen Smugglerauftrag, mehrere Spiele und Schmugglersiegel ab.
- Keine Änderung an Grid, Kachelgröße, Navigation oder Grundlayout.

# Website 4.7.0 FINAL – freigegebener Referenzstand – 04.08.2026

- Highscore-Grundsystem mit Wettbewerbsauswahl und saisonweiten Gesamtwertungen freigegeben.
- Einzel-, Team- und Bonuswertungen über mehrere Wettbewerbe erfolgreich aggregiert.
- Teamwertung verwendet das arithmetische Mittel als Rangentscheidung und zeigt zusätzlich Punktesumme sowie Mitgliederzahl.
- Startseiten-Highscore, Podium, Suche und 25er-Pagination validiert.
- Hall of Fame bleibt bis zum endgültigen Wettbewerbsabschluss getrennt und ohne künstliche Einträge.
- Produktionsdaten auf den bestätigten Nullstand vor Saisonbeginn zurückgesetzt; RC-Simulationswerte sind nicht enthalten.
- Version 4.7.0 wird als verbindlicher Referenzstand eingefroren.
- Bewusst auf 4.8.0 verschoben: historische Spieltagsnavigation, Nachholspielverwaltung und dynamisches Podium bei Ranggleichstand.

# Website 4.7.0-RC3-HF1-TEST – Spieltagslabel und Team-Podium – 04.08.2026

- Spieltagsbezeichnungen schützen „N. Spieltag“ nun wettbewerbsübergreifend vor einer Trennung zwischen Nummer und Wort.
- Team-Podium zeigt Punktesumme, Durchschnitt und Mitgliederzahl eindeutig getrennt.
- Keine Änderungen an Datenmodell, Grid, Navigation, Kachelgrößen oder Aggregationslogik.

# Website 4.7.0-RC3-TEST – Mehrwettbewerbs-Aggregation – 04.08.2026

- Kontrollierte Nicht-Null-Simulation für Bundesliga und Champions League gleichzeitig.
- Beide Wettbewerbe behalten getrennte Spieltags-, Gesamt- und Teamwertungen.
- Saisonweite Einzel-, Team- und Bonuswertung bildet die Summe beider Wettbewerbe ab.
- Startseiten-Highscore zeigt den zuletzt befüllten Wettbewerb Champions League.
- Hall of Fame bleibt unverändert ohne Sieger.
- Keine Änderungen an Grid, Navigation, Kachelgrößen, Highscore-Code oder Grundlayout.

# Website 4.7.0-RC2-TEST – Wettbewerbstest – 04.08.2026

- Kontrollierte Nicht-Null-Simulation ausschließlich für Bundesliga.
- Spieltags-, Gesamt- und Teamwertung der Bundesliga befüllt.
- Alle übrigen Wettbewerbe bleiben ohne Wertung.
- Saisonweite Gesamtwertungen spiegeln nur die Bundesliga-Simulation.
- Hall of Fame bleibt unverändert ohne Sieger.
- Keine Änderungen an Grid, Navigation, Kachelgrößen oder Grundlayout.

# Website 4.7.0-RC1-HF1-TEST – Rangsortierung und Tabellenkopf – 04.08.2026

- Offizielle Ranglisten werden vor Zusammenfassung, Podium, Tabelle und Pagination stabil nach Rang sortiert.
- Bei gleichem Rang gilt: Punkte absteigend, danach Name alphabetisch.
- Gespeicherte Rangnummern aus dem Datenpaket werden nicht verändert oder neu berechnet.
- Vollständiger Nullstand bleibt alphabetisch sortiert und erzeugt weiterhin kein Podium.
- Die dekorative Registermarke „SCHIFFSREGISTER“ wird in allen Ranglistentabellen ausgeblendet.
- Keine Änderungen an Grid, Navigation, Kachelgrößen, Datenmodell oder Grundlayout.

# Version 4.7.0-a4-HF1-TEST – Startseiten-Highscore Textkorrektur – 04.08.2026

- Bezeichnung „Letzter Spieltag“ in der Highscore-Kachel zu „Aktueller Spieltag“ geändert.
- Smugglerauftrags-Bezeichnung kompakt als `Smuggleraufträge · 1. Spieltag` dargestellt.
- Geschütztes Leerzeichen hält `1. Spieltag` als zusammengehörige Einheit und verhindert einen isolierten Zeilenumbruch der Zahl.
- Keine Änderungen an Grid, Kachelgröße, Navigation, Datenlogik oder Grundlayout.

# Version 4.7.0-a4-TEST – Startseiten-Highscore – 04.08.2026

- Highscore-Kachel der Startseite liest die normalisierte Admin-6.2-Struktur.
- Saisonführender wird aus `overall.individual` übernommen; Nullstand bleibt als Saisonstart gekennzeichnet.
- Letzter verarbeiteter Spieltag und dessen Führender werden aus dem Wettbewerbsblock übernommen.
- Saison-Teamduell liest `overall.team` und zeigt Old gegen New als Durchschnitt `0,0 : 0,0 Punkte`.
- Keine Änderungen an Grid, Kachelgrößen, Navigation, HTML-Struktur oder Grundlayout.

# Version 4.7.0-a3-HF3-TEST – Datenbereitstellung korrigiert – 04.08.2026

- `website-view-test.json` aus Admin 6.2 als `website-view.json` in die Website-Testversion übernommen.
- Datenadapter meldet die tatsächlich verwendete Quelle.
- Rückfall auf `highscore.json` wird sichtbar als Warnung ausgewiesen.
- Gesamt-Teamwertung zeigt die zwei Admin-6.2-Teamzeilen auch bei Nullstand.
- Footer und Versionsdatei auf 4.7.0-a3-HF3-TEST korrigiert.

# Website 4.7.0-a3-HF2-TEST – 04.08.2026

- Saison-Teamwertung liest Teamzeilen robust aus `overall.team`, `gesamt.team` oder `teams.overall`.
- Old und New Smugglers bleiben auch beim Nullstand sichtbar.
- Dekorativer Schriftzug „SCHIFFSREGISTER“ wird in der Teamtabelle ausgeblendet, damit „Durchschnitt“ nicht überlagert wird.
- Keine Änderungen an Grid, Navigation, Kachelgrößen oder Grundlayout.

# Version 4.7.0-a3-HF1-TEST – Gesamt-Teamwertung korrigiert – 04.08.2026

- Admin-6.2-Struktur `highscore.gesamt.team` wird korrekt auf die Website-Struktur übernommen.
- Old Smugglers und New Smugglers bleiben auch bei einem Nullstand sichtbar.
- Trefferanzeige zeigt bei vollständigem Teamdatensatz `2 Teams`.
- Suchfeld heißt in der Teamansicht `Team suchen` und filtert Teamnamen.
- Keine Änderungen an Grid, Navigation, Kachelgrößen oder Grundlayout.

# Version 4.7.0-a3-TEST – Gesamtwertungen – 04.08.2026

- Gesamt-Einzelwertung, Gesamt-Teamwertung und Gesamt-Bonuswertung werden strikt getrennt aus Admin-6.2-Daten gelesen.
- Zusammenfassung passt Bezeichnungen an die jeweilige Wertung an.
- Teamansicht zeigt zwei Teams statt Teilnehmerzahl.
- 25er-Pagination aus a2-HF1 bleibt unverändert erhalten.
- Keine Änderung an Grid, Navigation, Kachelgrößen oder Grundlayout.

# Version 4.7.0-a2-HF1-TEST – Pagination der vollständigen Rangliste – 04.08.2026

- Vollständige Ranglisten werden wieder in 25er-Gruppen angezeigt.
- Seitennavigation oberhalb und unterhalb der Tabelle: Zurück, Seiten 1–4, Weiter.
- Suche setzt auf Seite 1 zurück.
- Wettbewerbs- und Ansichtswechsel setzen auf Seite 1 zurück.
- Keine Änderung an Rangdaten, Sortierung, Podium, Grid oder Grundlayout.

# CHANGELOG


## 4.7.0-RC1-TEST
- Kontrollierte Punktesimulation für Release-Validierung.
- Startseite, Highscore, Bonus- und Teamwertung mit Nicht-Null-Daten prüfbar.
- Hall of Fame bleibt absichtlich leer.

## 4.7.0 FINAL – Gold Master (04.08.2026)

- Freigegebenen FINAL-Stand als unveränderlichen Gold Master gekennzeichnet.
- Produktivsetzung ausdrücklich ausgenommen; separate Freigabe erforderlich.
- `GOLD-MASTER.md` und Integritätsmanifest ergänzt.
- Keine Änderungen an Anwendungslogik, Datenmodell, Layout oder Saison-Nullstand.

## 4.7.0-RC8.5-HF1-TEST
- Startseite kompakter, Ehrenlogbuch historisch vollständig; besondere Leistungen optisch hervorgehoben.
