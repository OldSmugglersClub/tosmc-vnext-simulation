# Live Website 4.9.2-HF12-HF97

## Grundlage
Port des in Test2v2 als 4.9.2-HF12-HF97-TEST2 browserseitig bestätigten Statistik-/Torjäger-Fallback-Blocks auf den aktuellen Live-Ausgangsstand 4.9.2-HF12-HF96.

## Änderungen
- Saisonweiter Torjäger-Fallback für Champions League, Europa League und DFB-Pokal: Live OpenLigaDB -> letzter bestätigter Browser-Snapshot -> optionaler Release-Snapshot.
- Leere/fehlgeschlagene Live-Antworten überschreiben keinen vorhandenen bestätigten Browser-Snapshot.
- Bestehende Torjäger-Kacheln, Bilder und sichtbare Gestaltung unverändert.
- Einheitliche Cache-Kennung 4.9.2-HF12-HF97 für wettbewerb.js/wettbewerb.css auf allen acht Wettbewerbsseiten.
- Saisonübersicht erhält nur einen neuen Cache-Buster; keine Funktionsänderung.
- Keine produktiven Bestands-JSON-Dateien verändert.

## Schutz
- Bundesliga, Dynamo Dresden/Smuggleraufträge, Piratenkodex, Weihnachtsregatta und Relegation bleiben auf ihren bisherigen Datenpfaden.
- HF96 Highscore-/Bonus-Pagination bleibt unberührt.
