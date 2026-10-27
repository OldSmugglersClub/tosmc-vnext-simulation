import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeFpl} from './offizielle-liga-adapter.mjs';
import {compare} from './offizielle-quellen.mjs';

const bootstrap={teams:[{id:1,name:'Liverpool'},{id:2,name:'Manchester United'}]};
const matches=[{id:99,team_h:1,team_a:2,kickoff_time:'2026-11-21T15:00:00Z'}];
const result=decodeFpl(bootstrap,matches);
assert.equal(result.fixtures.length,1);
assert.deepEqual(result.fixtures[0],{heim:'Liverpool',gast:'Manchester United',datum:'2026-11-21',anstoss:'16:00',startDate:'2026-11-21T15:00:00Z',provider:'fpl',fixtureId:99});
assert.equal(result.diagnosis.teams,2);
assert.equal(decodeFpl(bootstrap,[{...matches[0],kickoff_time:null}]).fixtures.length,0);
assert.equal(decodeFpl(bootstrap,[{...matches[0],team_a:999}]).fixtures.length,0);
assert.equal(decodeFpl({},matches).fixtures.length,0);
const aliases=JSON.parse(fs.readFileSync(new URL('../terminwaechter/offizielle-quellen.json',import.meta.url),'utf8')).teamAliase;
const official=[
 {heim:'Liverpool',gast:'Man Utd',datum:'2026-11-21',anstoss:'16:00'},
 {heim:'Man City',gast:'Man Utd',datum:'2027-03-20',anstoss:'16:00'},
 {heim:'Man City',gast:'Liverpool',datum:'2027-05-08',anstoss:'16:00'},
 {heim:'Man Utd',gast:"Nott'm Forest",datum:'2026-12-26',anstoss:'16:00'},
 {heim:'Aston Villa',gast:'Liverpool',datum:'2026-12-30',anstoss:'21:00'},
 {heim:'Man City',gast:'Spurs',datum:'2027-01-02',anstoss:'16:00'}
];
const local=[
 ['fc-liverpool','manchester-united'],['manchester-city','manchester-united'],
 ['manchester-city','fc-liverpool'],['manchester-united','nottingham-forest'],
 ['aston-villa','fc-liverpool'],['manchester-city','tottenham-hotspur']
];
for(let i=0;i<local.length;i++)assert.notEqual(compare({heimTeamId:local[i][0],auswaertsTeamId:local[i][1],datum:official[i].datum,anstoss:official[i].anstoss},official,aliases).status,'KEIN_EINDEUTIGES_SPIEL');
console.log('TEST11 FPL: 12/12 Schutz- und Zuordnungsprüfungen bestanden');
