# 4.9.2-HF12-HF90

- Live-Übernahme des in Test2v2 abgenommenen Stands `4.9.2-HF12-HF90-TEST1`.
- Desktop: Inhalte der Counter-Kachel werden über die verfügbare Höhe gleichmäßig verteilt.
- Mobil: Schnellzugriffe der Startzentrale als 2×2-Raster mit 52 px Mindesthöhe und größerem Innenabstand.
- Desktop-Schnellzugriffe, mobile Counter-Kachel und funktionale Datenpfade unverändert.

# 4.9.2-HF12-HF89

- Live-Übernahme des in Test2v2 abgenommenen Stands `4.9.2-HF12-HF89-TEST2`.
- Desktop-Kachel „Der Hohe Schmugglerrat“ auf 455 px Mindesthöhe korrigiert.
- Redundante Schnelllinks in dieser Kachel auf Desktop ausgeblendet.
- „Kicktipp Live Action“ auf Desktop um 4 px nach unten feinjustiert.
- Mobile Darstellung und funktionale Datenpfade unverändert.

# 4.9.2-HF12-HF44

- Live-Übernahme von `4.9.2-HF12-HF43-TEST50`.
- Rechte Bundesliga-Kachel: vollständiges Nutzer-Logo statt Infotext, groß und exakt zentriert.
- Linke und mittlere Bundesliga-Kachel sowie Datenlogik unverändert.

# 4.9.2-HF12-HF43-TEST50

- Bundesliga: rechtes Fenster verwendet jetzt vollständig das vom Nutzer bereitgestellte Bundesliga-Logo.
- Logo horizontal und vertikal mittig zentriert und großflächig eingepasst.
- Linke und mittlere Bundesliga-Kachel unverändert.

# 4.9.2-HF12-HF43-TEST49

- Bundesliga: Logo in der rechten Infokachel deutlich größer und weiterhin exakt horizontal/vertikal zentriert.
- Dezente rote Flächenwirkung im rechten Fenster für bessere optische Ausfüllung.
- Torjäger und Verfolgerfeld unverändert.

# 4.9.2-HF12-HF43-TEST48

- Bundesliga: rechte Infokachel zeigt nun mittig das Bundesliga-Logo statt des bisherigen Datenzentrale-Texts.
- Torjäger und Verfolgerfeld unverändert.

# 4.9.2-HF12-HF43 – DFB-Pokal/Europa-League-Turnierbaum

- Live-Übernahme des in Test2v2 abgenommenen TEST47-Stands.
- DFB-Pokal und Europa League zeigen den Turnierbaum-Bereich bereits vor der Achtelfinal-Auslosung als Vorbereitung an.
- Beide Wettbewerbe weisen direkt am Turnierbaum sichtbar auf den TOSMC-Wertungsstart ab Achtelfinale hin.
- Keine funktionale Änderung gegenüber TEST47.

# 4.9.2-HF12-HF42 – Champions-League-Ansetzungen/Wappen

- Live-Übernahme des in Test2v2 abgenommenen TEST46-Stands.
- CL-Ansetzungen verwenden denselben Wappen-Renderer wie die Tabelle.
- Vollständige OpenLigaDB-Teamobjekte bleiben bis zur Matchdarstellung erhalten.
- Keine Änderung an Counter, Wertungen, Tabellenlogik, Spieltagserkennung oder Datenquellen gegenüber TEST46.

# TEST44 – Champions-League-Wappen in Ansetzungen

- CL-Ansetzungen übergeben jetzt die geprüften lokalen Team-IDs an die bestehende Matchzeilen-Wappenlogik.
- Dadurch werden bekannte Originalwappen bzw. der bestehende lokale Fallback auch in den OpenLigaDB-Ansetzungen zuverlässig gerendert.
- Keine Änderung an Spieltags-, Tabellen-, Wertungs-, Counter- oder Datenlogik.

# Test2v2 4.9.2-HF12-HF41-TEST43

## Ziel

Die in TEST42 weiterhin teilweise leer gebliebenen Wappenpositionen der Champions-League-Ansetzungen zuverlässig schließen.

## Ursache

Die OpenLigaDB-Bildquelle wurde bei Teams ohne lokales Originalwappen direkt in die Badge-Fläche eingesetzt. Wenn die Fremdquelle im Browser blockiert, sehr langsam oder technisch unbrauchbar antwortet, blieb die 34x34-Pixel-Badge sichtbar, aber optisch leer. Zusätzlich verwendete `champions-league.html` noch einen alten Cache-Buster (`wettbewerb.js?v=4.9.2-HF12-HF24`), sodass ein Browser nach TEST41 weiterhin eine ältere JS-Fassung aus dem Cache verwenden konnte.

## Geändert

- Lokaler Team-Badge wird bei CL-Teams jetzt sofort gerendert.
- Ein OpenLigaDB-Wappen ersetzt diesen lokalen Fallback nur noch nach erfolgreichem Vorladen als tatsächlich lesbares Bild.
- Fehler, Blockierung oder Hängen der externen Bildquelle können dadurch keine leeren Wappenpositionen mehr erzeugen.
- Der Cache-Buster der Champions-League-Seite wurde auf `4.9.2-HF12-HF41-TEST43` gesetzt, damit die aktuelle `wettbewerb.js` sicher geladen wird.
- Vorhandene lokale Originalwappen behalten unverändert Vorrang.

## Bestandsschutz

Unverändert bleiben insbesondere:
- TEST41-Spieltagserkennung und OpenLigaDB-Datenquelle `ucl/2026`
- Champions-League-Tabellenberechnung
- Counter und Spieltagskachel der Startseite
- Kicktipp-Logik und Wertungen
- GitHub Actions und Automationen
- Navigation, Coco-Logik und Admin-Systeme

## Technische Prüfung

- `node --check wettbewerb.js`: bestanden.
- Nur Champions-League-Wappenfallback und CL-JS-Cache-Buster funktional betroffen.
- Keine CSS-/Layoutänderung.

## Teststatus

Technische Vorprüfung bestanden; visueller Realtest im Test2v2-Repo durch den Nutzer steht aus.

---

# Test2v2 4.9.2-HF12-HF41-TEST42

## Ziel

Fehlende Vereinskennzeichen in der Champions-League-Paarungs- und Tabellenanzeige schließen, ohne die funktionierende OpenLigaDB-Spielplanlogik aus TEST41 anzutasten.

## Geändert

- Champions-League-spezifische Teamauflösung für alle 36 aktuellen Ligaphasen-Teilnehmer ergänzt.
- Bereits vorhandene lokale Originalwappen behalten Vorrang.
- Für Teams ohne lokales Originalwappen wird weiterhin zuerst das sichere OpenLigaDB-Wappen verwendet.
- Falls das externe OpenLigaDB-Wappen fehlt oder nicht geladen werden kann, wird jetzt automatisch das bereits im Projekt vorhandene lokale Schmugglersiegel des richtigen Vereins eingesetzt.
- Die Ersatzgrafik wird in derselben `team-identity__badge`-Position gerendert; Datum, Teamnamen, Status und Coco-Link bleiben unverändert ausgerichtet.
- Aliasvarianten aus OpenLigaDB (u. a. englische/deutsche Vereinsnamen) werden gezielt auf die vorhandenen lokalen Badge-IDs aufgelöst.

## Bestandsschutz

Unverändert bleiben insbesondere:
- TEST41-Spieltagserkennung und OpenLigaDB-Datenquelle `ucl/2026`
- Champions-League-Tabellenberechnung
- Counter und Spieltagskachel der Startseite
- Kicktipp-Logik und Wertungen
- Datenpfade außerhalb der Champions-League-Seite
- GitHub Actions und Automationen
- Navigation, Coco-Logik und Admin-Systeme

## Technische Prüfung

- JavaScript-Syntaxprüfung `wettbewerb.js`: bestanden.
- Alle 36 aktuellen CL-Teamnamen gegen die neue Zuordnung geprüft.
- Für jede Zuordnung existiert ein lokaler Badge-Fallback im Schmugglersiegel-Register.
- Vorhandene lokale Originalwappen werden weiterhin bevorzugt.

## Teststatus

Technische Vorprüfung bestanden; visueller Realtest im Test2v2-Repo durch den Nutzer steht aus.

---

# Test2v2 4.9.2-HF12-HF41-TEST41

## Ziel

Champions-League-Kachel wieder in den vorgesehenen automatischen Betrieb bringen, ohne auf die vollständige Ligaphase mit 144 Partien zu warten.

## Geändert

- Champions-League-Datenquelle auf den strukturierten OpenLigaDB-Datensatz `ucl/2026` umgestellt.
- Die bisherige 144-Spiele-/8-Spieltage-Gesamtfreigabe entfernt.
- Jeder Spieltag wird jetzt einzeln freigeschaltet, sobald OpenLigaDB dafür 18 vollständig terminierte Spiele mit 36 eindeutigen Teams liefert.
- Explizite OpenLigaDB-Spieltagsnummern 1–8 haben Vorrang.
- Für Datensätze ohne explizite Spieltagsnummer bleibt ein konservativer Termincluster-Fallback erhalten.
- Die Statuskachel zeigt nun den aktuell erkannten Teilstand (`x von 8 Spieltagen erkannt`).
- Weitere vollständig terminierte Spieltage erscheinen automatisch beim Neuladen, ohne erneuten Website-Fix.
- Die Champions-League-Tabelle bleibt aus OpenLigaDB-Spieldaten berechnet und kann bereits erscheinen, sobald alle 36 Teilnehmer im gelieferten Ligaphasen-Datensatz vorhanden sind.

## Bestandsschutz

Unverändert bleiben insbesondere:
- Counter und Spieltagskachel der Startseite
- Kicktipp-Logik und Wertungen
- Datenpfade außerhalb der Champions-League-Seite
- GitHub Actions und sonstige Automationen
- Navigation
- Coco-Logik
- Admin-Systeme

## Teststatus

Technische Vorprüfung bestanden; Realtest im Test2v2-Repo durch den Nutzer steht aus.

---

# Live-Website 4.9.2-HF12-HF41

## Geändert

- Die in Test2-v2 TEST40 abgenommene visuelle Coco-Überarbeitung wurde kontrolliert auf den aktuellen Live-Stand HF40 übertragen.
- Coco-Bereich auf Desktop harmonischer proportioniert.
- Coco-Bild erhält mehr Präsenz, ohne die Informationsspalte zu verdrängen.
- Coco's Bilanz und Orakel-Kodex wurden visuell vereinheitlicht.
- Statistikfelder sind gleichmäßig angeordnet und besser lesbar.
- Der Button `Coco befragen` wurde visuell stärker gewichtet.
- Auswahlfelder und Panels erhalten eine dezente Premium-Politur über CSS.

## Bestandsschutz

- Keine Änderung an Coco-Logik oder Bilanzberechnung.
- Keine Änderung an `coco.js` oder `coco-engine.js`.
- Keine Änderung an JSON-Daten, Datenpfaden oder Automationen.
- Keine Änderung an Kicktipp-Verknüpfung, Navigation, Startseiten-Kacheln, Counter oder Spieltagskachel.
- Alle übrigen Funktionen und Dateien der Live-Baseline HF40 bleiben erhalten.

---

# CHANGELOG
- HF40: Abgenommene zeitgesteuerte Website-Mitteilung auf der Startseite ergänzt.
- Mallorca-Mitteilung vom 25.09.2026 00:00 Uhr bis 28.09.2026 06:00 Uhr vorkonfiguriert.
- Fehlende oder ungültige Konfiguration blockiert die Website nicht.
- Bestätigung gilt pro Browser-Sitzung und Mitteilungs-ID.
- Vorschau unabhängig vom Zeitraum über `?hinweis-vorschau=1` möglich.
- Drei Live-Auto-Workflows ohne Funktionsänderung neu gespeichert.
- Ausschließlich Kommentar zur Scheduler-Neuregistrierung ergänzt.
- Cron-Zeiten, Jobs, Berechtigungen und Fachlogik unverändert.

## 4.9.2-HF12-HF43
- DFB-Pokal/Europa League: Turnierbaum-Vorbereitung vereinheitlicht und Wertungsstart ab Achtelfinale direkt am Turnierbaum sichtbar gemacht.

## 4.9.2-HF12-HF44-TEST51
- DFB-Pokal: rechte Informationskachel auf das vom Nutzer bereitgestellte, vollständig zentrierte Logo umgestellt; bisherige Überschrift und Wertungstext entfernt.

## 4.9.2-HF12-HF45
- DFB-Pokal: abgenommenen TEST51-Stand live übernommen.
- Rechte Informationskachel zeigt ausschließlich das vom Nutzer bereitgestellte DFB-Pokal-Logo.
- Überschrift „Wertung“ und Wertungstext entfernt.
- Logo vollständig sowie horizontal und vertikal zentriert.
- Linke und mittlere Informationskachel unverändert.
