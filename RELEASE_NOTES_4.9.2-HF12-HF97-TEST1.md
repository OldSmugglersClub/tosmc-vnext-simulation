# Test2v2 4.9.2-HF12-HF97-TEST1

## Ziel
Robuster saisonweiter Torjäger-Fallback für Champions League, Europa League und DFB-Pokal; Regressionsschutz für Vorrunden-/Ligaphasenstatistik und Saisonübersicht.

## Änderungen
- `torjaeger-fallback.js`: Priorität Live-OpenLigaDB > letzter bestätigter Browser-Snapshot > Release-Snapshot.
- Ein leerer/temporär ausgefallener Live-Endpunkt überschreibt keinen bereits bestätigten Torjägerstand.
- `torjaeger-snapshots.json`: bewusst leerer Release-Snapshot-Rahmen; keine erfundenen Statistikwerte. Kann in späteren Website-Releases mit einem verifizierten Stand befüllt werden.
- `wettbewerb.js`: CL/EL/DFB-Torjäger verwenden den Fallback. Bundesliga und Dynamo bleiben unverändert auf ihren bestehenden Datenpfaden.
- Cache-Buster der drei betroffenen Wettbewerbsseiten und der Saisonübersicht auf HF97-TEST1 angehoben.
- Regressionstests für Fallback, Ligaphasen-Erhalt, Saisonübersicht-Scope und Fremdwettbewerbspfad ergänzt.

## Nicht geändert
Produktive TOSMC-Datenbestände (`spieldaten.json`, `spielbetrieb.json`, `teams.json`, `website-view.json`, `highscore.json`, `spieltag-logbuch.json`, `hall-of-fame.json`, `teilnehmer.json`, `wettbewerbe.json`, `import-history.json`) bleiben byte-identisch.
