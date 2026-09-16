# Release Notes 4.0.4

## Zweck

Version 4.0.4 trennt die öffentliche Spielerwebsite vollständig von der Administration.

## Öffentliche Website

Die folgenden internen Seiten und ihre CSS-/JavaScript-Dateien sind nicht mehr Bestandteil des öffentlichen GitHub-Pakets:

- `abgabe-erinnerungen.css`
- `abgabe-erinnerungen.html`
- `abgabe-erinnerungen.js`
- `abgabezuverlaessigkeit.css`
- `abgabezuverlaessigkeit.html`
- `abgabezuverlaessigkeit.js`
- `admin.css`
- `admin.html`
- `admin.js`
- `bonuspflege.css`
- `bonuspflege.html`
- `bonuspflege.js`
- `daten-cockpit.css`
- `daten-cockpit.html`
- `daten-cockpit.js`
- `datenqualitaet.css`
- `datenqualitaet.html`
- `datenqualitaet.js`
- `erinnerungsprotokoll.css`
- `erinnerungsprotokoll.html`
- `erinnerungsprotokoll.js`
- `punkteberechnung.css`
- `punkteberechnung.html`
- `punkteberechnung.js`
- `ranglistenverlauf.css`
- `ranglistenverlauf.html`
- `ranglistenverlauf.js`
- `saisonarchiv.css`
- `saisonarchiv.html`
- `saisonarchiv.js`
- `smugglerpflege.css`
- `smugglerpflege.html`
- `smugglerpflege.js`
- `smugglerwertung.css`
- `smugglerwertung.html`
- `smugglerwertung.js`
- `spielpflege.css`
- `spielpflege.html`
- `spielpflege.js`
- `spieltagwertung.css`
- `spieltagwertung.html`
- `spieltagwertung.js`
- `team-teilnehmerpflege.css`
- `team-teilnehmerpflege.html`
- `team-teilnehmerpflege.js`
- `teamwertung.css`
- `teamwertung.html`
- `teamwertung.js`
- `tippfristen.css`
- `tippfristen.html`
- `tippfristen.js`
- `tipppflege.css`
- `tipppflege.html`
- `tipppflege.js`
- `wettbewerbspflege.css`
- `wettbewerbspflege.html`
- `wettbewerbspflege.js`
- `wettbewerbswertung.css`
- `wettbewerbswertung.html`
- `wettbewerbswertung.js`

Die zugrunde liegenden öffentlichen Spieldaten bleiben erhalten. E-Mail-Adressen sind weiterhin nicht enthalten.

## Lokale Administration

Die vollständige Verwaltung liegt im separaten Paket `the-old-smugglers-club-admin-v4.0.4-lokal.zip`. Dieses Paket darf nicht in das öffentliche GitHub-Repository hochgeladen werden.

- Verbliebenen programmatischen Verweis auf `admin.html` aus `wettbewerb.js` entfernt.
