# Test2v2 4.9.2-HF12-HF97-TEST2

## Anlass
HF97-TEST1 wurde von der Schutzarchitektur blockiert, weil die gemeinsam genutzten Assets `wettbewerb.js` und `wettbewerb.css` auf den acht Wettbewerbsseiten unterschiedliche Cache-Kennungen hatten.

## Korrektur
- Einheitliche Cache-Kennung `4.9.2-HF12-HF97-TEST2` auf allen acht Wettbewerbsseiten für `wettbewerb.js` und `wettbewerb.css`.
- `torjaeger-fallback.js` auf CL, Europa League und DFB-Pokal ebenfalls auf TEST2 gekennzeichnet.
- Keine fachliche oder optische Änderung gegenüber HF97-TEST1.
- Keine produktiven JSON-Daten geändert.

## Schutz
Die Release-Guard-Prüfung muss danach `status: OK` liefern.
