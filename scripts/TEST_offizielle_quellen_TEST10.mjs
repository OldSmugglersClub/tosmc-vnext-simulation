import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compare} from './offizielle-quellen.mjs';

const config=JSON.parse(fs.readFileSync(new URL('../terminwaechter/offizielle-quellen.json',import.meta.url),'utf8'));
const aliases=config.teamAliase;
const fixtures=[
  {heim:'Milan',gast:'Inter',datum:'2026-10-31',anstoss:'20:45',startDate:'2026-10-31T19:45:00Z'},
  {heim:'Inter',gast:'Juventus',datum:'2027-01-10',anstoss:'18:30',startDate:'2027-01-10T17:30:00Z'},
  {heim:'Bologna',gast:'Juventus',datum:'2027-01-03',anstoss:'18:30',startDate:'2027-01-03T17:30:00Z'}
];
const games=[
  {id:'pk-2026-27-02-madonnina',heimTeamId:'ac-mailand',auswaertsTeamId:'inter-mailand',datum:'2026-11-01',anstoss:'18:30'},
  {id:'pk-2026-27-04-ditalia',heimTeamId:'inter-mailand',auswaertsTeamId:'juventus-turin',datum:'2027-01-10',anstoss:'18:30'},
  {id:'wr-2026-27-05',heimTeamId:'fc-bologna',auswaertsTeamId:'juventus-turin',datum:'2027-01-03',anstoss:'18:30'}
];

const findings=games.map(game=>compare(game,fixtures,aliases));
assert.equal(findings[0].status,'ABWEICHUNG');
assert.deepEqual(findings[0].amtlich,{...fixtures[0]});
assert.equal(findings[1].status,'IDENTISCH');
assert.equal(findings[2].status,'IDENTISCH');
assert.equal(compare({...games[0],auswaertsTeamId:'unbekannt'},fixtures,aliases).status,'KEIN_EINDEUTIGES_SPIEL');
console.log('TEST10: 4/4 offizielle Serie-A-Teamzuordnungen bestanden');
