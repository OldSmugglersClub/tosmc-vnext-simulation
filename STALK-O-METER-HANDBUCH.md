# Stalk-O-Meter – Fach- und Architekturhandbuch

Version: 4.7.2

## 1. Zweck
Das Stalk-O-Meter misst die Nutzungsintensität der öffentlichen Clubwebsite anhand von **Pageviews/Aufrufen**, nicht anhand eindeutiger Besucher. Mehrfache echte Aufrufe derselben Person zählen mehrfach.

## 2. Öffentliche Darstellung
Die Seite `stalk-o-meter.html` zeigt:
- die Summe der freigegebenen Inhaltsseiten,
- eine automatisch nach Aufrufen sortierte Rangliste der einzelnen Bereiche.

Gezählte Bereiche:
1. Startseite (`/`)
2. Saisonübersicht (`/saison-2026-2027.html`)
3. Ranglistenlogbuch (`/highscore.html`)
4. Spieltags-Logbuch (`/logbuch.html`)
5. Ehrenlogbuch (`/hall-of-fame.html`)
6. Bundesliga (`/bundesliga.html`)
7. DFB-Pokal (`/dfb-pokal.html`)
8. Champions League (`/champions-league.html`)
9. Europa League (`/europa-league.html`)
10. Relegation (`/relegation.html`)
11. Smuggleraufträge (`/dynamo-dresden.html`)
12. Piratenkodex (`/piratenkodex.html`)
13. Weihnachtsregatta (`/weihnachtsregatta.html`)

Nicht gezählt bzw. nicht Bestandteil der veröffentlichten Gesamtzahl:
- `impressum.html`
- `datenschutz.html`
- `stalk-o-meter.html`

## 3. Navigationslogik
Desktop: zusätzlicher Hauptmenüpunkt `Stalk-O-Meter` rechts neben `Kummerkasten`.
Mobil: derselbe Link erscheint im bestehenden aufklappbaren Hauptmenü. Es wird keine neue mobile Navigation eingeführt.
Für Desktop wird ausschließlich die Typografie/das horizontale Padding der Hauptnavigation moderat verdichtet. Grid, Kachelgrößen und Grundlayout bleiben unverändert.

## 4. Datenfluss
`öffentliche Inhaltsseite -> direkter GoatCounter-Script-Tag -> https://gc.zgo.at/count.js -> https://oldsmugglersclub.goatcounter.com/count`

Anzeige:
`stalk-o-meter.html -> stalk-o-meter.js -> öffentliche /counter/<PATH>.json-Endpunkte -> Rangliste + Summe`

Es wird kein GoatCounter-API-Key im Browser verwendet.

## 5. GoatCounter-Konfiguration
Konto: `oldsmugglersclub`
- öffentliche Besucher-/Counterfunktion: aktiviert
- Dashboard: nur angemeldete Benutzer
- Sitzungen: deaktiviert
- einzelne Seitenaufrufe: deaktiviert
- Referrer: deaktiviert
- User-Agent: deaktiviert
- Bildschirmgröße: deaktiviert
- Land/Region/Sprache: deaktiviert
- Datenaufbewahrung: 0 / keine zeitliche Löschung der aggregierten Statistik

## 6. Zähllogik
Gezählt wird die tatsächlich geladene Zielseite. Der Navigationsweg ist irrelevant.
Beispiel: `Start -> DFB-Pokal` und `Saisonübersicht -> DFB-Pokal` erhöhen beide denselben DFB-Pokal-Seitenzähler.
Reloads zählen wegen deaktivierter GoatCounter-Sitzungen als weitere Pageviews.

## 7. Ausfallsicherheit
Analytics ist nicht geschäftskritisch.
Der von GoatCounter dokumentierte Script-Tag wird direkt und asynchron auf den dreizehn gezählten Inhaltsseiten geladen. Blockiert ein Adblocker den Dienst oder fällt GoatCounter aus, dürfen Navigation, Wettbewerbe, Highscore, Hall of Fame und alle anderen Website-Funktionen nicht beeinträchtigt werden.
Die Stalk-O-Meter-Seite zeigt bei Abruffehlern einen lokalen Hinweis statt JavaScript-Fehlern.

## 8. Datenschutz
Die Website verwendet nur die für den Zweck erforderliche Seitenaufrufzählung. Zusätzliche GoatCounter-Auswertungsmerkmale wurden im Konto deaktiviert. Die öffentliche Statistik zeigt ausschließlich aggregierte Zählerstände. Die Datenschutzerklärung wurde um die technische Einbindung ergänzt.

## 9. Design
Keine neue Designsprache. `stalk-o-meter.html` verwendet die bestehende Unterseitenbasis `wettbewerb.css` und ergänzt nur die für die Statistik erforderlichen Komponenten in `stalk-o-meter.css`.

## 10. Dateien
Neu:
- `stalk-o-meter.html`
- `stalk-o-meter.css`
- `stalk-o-meter.js`
- `STALK-O-METER-HANDBUCH.md`

Geändert:
- `index.html`
- die 11 weiteren gezählten Inhaltsseiten
- `datenschutz.html`
- `VERSION.txt`

## 11. Pflichtprüfung vor Freigabe
1. Desktop-Navigation bei mehreren Breiten: kein ungewollter Umbruch/Überlauf.
2. Mobile Navigation: Stalk-O-Meter sichtbar und erreichbar.
3. GC-2: echter Pageview erscheint in GoatCounter.
4. GC-3: Reload erzeugt einen zusätzlichen Pageview.
5. GC-4: mindestens zwei Zielseiten werden getrennt gezählt.
6. Stalk-O-Meter: Einzelwerte erscheinen und werden absteigend sortiert.
7. Gesamtwert entspricht der Summe der dreizehn dargestellten Inhaltsseiten.
8. Impressum, Datenschutz und Stalk-O-Meter erhöhen diese fachliche Gesamtzahl nicht.
9. Test mit blockiertem `gc.zgo.at`: restliche Website vollständig funktionsfähig.
10. Desktop und Mobil fachliche Sichtprüfung.

## 12. Handover-Regel
Dieses Dokument ist bei jedem Projekt-Handover zusammen mit dem allgemeinen Projektstand zu übergeben. Offene Tests, GoatCounter-Konfiguration, Zähllogik und betroffene Dateien dürfen nicht nur verkürzt als Notiz übergeben werden.


## 13. TEST2-Korrektur
In TEST1 wurden die GoatCounter-Script-Attribute dynamisch über `analytics.js` erzeugt. GC-2 schlug fehl: Trotz erreichbarem `https://gc.zgo.at/count.js` wurden keine Pageviews registriert.

In 4.7.2-TEST2 wird deshalb auf allen dreizehn gezählten Inhaltsseiten ausschließlich der von GoatCounter dokumentierte direkte Script-Tag verwendet. `analytics.js` wurde vollständig entfernt. Navigation, Stalk-O-Meter-Darstellung, gezählte Zielseiten und Fachlogik bleiben unverändert.


## 14. TEST3 – Korrektur des Startseitenpfads
GoatCounter führt die öffentliche Startseite nach dem realen Tracking-Nachweis als `/index.html`.
Der Stalk-O-Meter hatte dafür noch `/` abgefragt. In 4.7.2-TEST3 wird ausschließlich diese
Zuordnung auf `/index.html` korrigiert.

Das Tracking selbst bleibt gegenüber TEST2 unverändert. TEST2 hat per Browser-Netzwerkanalyse
einen erfolgreichen GoatCounter-Request (HTTP 200) gezeigt; das GoatCounter-Dashboard führte
bereits `/index.html` und `/highscore.html` mit realen Aufrufen.

Hinweis zur Anzeige: Die öffentlichen GoatCounter-Counterantworten können zwischengespeichert
sein. Deshalb können die sichtbaren Stalk-O-Meter-Werte zeitlich hinter dem GoatCounter-Dashboard
liegen. Ein aktuell angezeigter Nullwert ist deshalb nicht automatisch ein Trackingfehler.


## 15. FINAL-Freigabe 4.7.2
Die technische Erfassung wurde im Realbetrieb nachgewiesen:
- GoatCounter-Script geladen.
- `window.goatcounter` vorhanden.
- Filterprüfung liefert `false`.
- `get_data()` liefert korrekte Seitenpfade.
- Netzwerkrequest an GoatCounter wurde mit HTTP 200 bestätigt.
- GoatCounter-Dashboard zeigt reale und getrennte Pageviews mehrerer Zielseiten.
- Mehrfachaufrufe derselben Zielseite werden gezählt.
- Startseite wird korrekt unter `/index.html` geführt.
- Öffentliche Stalk-O-Meter-Zähler lesen GoatCounter-Counterwerte ein.

Bekanntes Betriebsverhalten:
Die öffentlichen GoatCounter-Counterwerte können gegenüber dem internen Dashboard zeitversetzt aktualisiert werden.
Diese Verzögerung ist kein Trackingfehler und wird als akzeptiertes Betriebsverhalten dokumentiert.

Die Version 4.7.2 wurde auf ausdrückliche Nutzerfreigabe trotz noch nicht vollständig abgelaufener
öffentlicher Cache-Beobachtungszeit als FINAL freigegeben. Es besteht kein bekannter Fehler in der
Tracking-Erfassung. Eine spätere Sichtprüfung der nachgezogenen öffentlichen Werte bleibt als
betriebliche Kontrolle sinnvoll, ist aber keine Voraussetzung mehr für die FINAL-Freigabe.
