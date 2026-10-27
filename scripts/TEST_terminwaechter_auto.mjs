import assert from 'node:assert/strict';
import {planOfficialChanges,applyOfficialChanges} from './terminwaechter-auto-core.mjs';

const game={id:'pk-2026-27-02-madonnina',wettbewerb:'piratenkodex',datum:'2026-11-01',datumVon:'2026-11-01',datumBis:'2026-11-01',datumAnzeige:'01.11.2026',anstoss:'18:30',terminBestaetigt:true,status:'terminiert',quelleStand:'2026-07-30',heimtore:null,auswaertstore:null,heimTeamId:'ac-mailand',auswaertsTeamId:'inter-mailand',sonderwertungen:['piratenkodex'],historie:{bleibt:true}};
const base={datenVersion:82,aktualisiert:'alt',hallOfFame:{unveraendert:true},saisons:[{spiele:[game]}]};
const report={quellen:[{name:'Italien offiziell',status:'SPIELE_EXTRAHIERT'}],befunde:[{spielId:game.id,status:'ABWEICHUNG',quellenName:'Italien offiziell',quelle:'https://en.legaseriea.it/',amtlich:{datum:'2026-10-31',anstoss:'20:45'}}]};
const plan=planOfficialChanges(base,report,{now:new Date('2026-10-27T12:00:00Z')});
assert.equal(plan.planned.length,1);
const next=applyOfficialChanges(base,plan,{updatedAt:'2026-10-27T12:00:00.000Z'});
const changed=next.saisons[0].spiele[0];
assert.deepEqual([changed.datum,changed.datumVon,changed.datumBis,changed.datumAnzeige,changed.anstoss],['2026-10-31','2026-10-31','2026-10-31','31.10.2026','20:45']);
assert.equal(next.datenVersion,83);assert.deepEqual(next.hallOfFame,base.hallOfFame);assert.deepEqual(changed.historie,game.historie);assert.deepEqual(base.saisons[0].spiele[0],game);
assert.throws(()=>planOfficialChanges(base,{quellen:[{name:'Italien offiziell',status:'BROWSER_FEHLER'}],befunde:report.befunde},{now:new Date('2026-10-27T12:00:00Z')}),/QUELLE_NICHT_FREIGEGEBEN/);
const ended=structuredClone(base);ended.saisons[0].spiele[0].status='beendet';ended.saisons[0].spiele[0].heimtore=1;
assert.throws(()=>planOfficialChanges(ended,report,{now:new Date('2026-10-27T12:00:00Z')}),/ABGESCHLOSSENES_SPIEL/);
const ambiguous={...report,befunde:[...report.befunde,...report.befunde]};assert.throws(()=>planOfficialChanges(base,ambiguous,{now:new Date('2026-10-27T12:00:00Z')}),/DOPPELTER_BEFUND/);
console.log('Terminwaechter-Automatik: 12/12 Schutzpruefungen bestanden');
