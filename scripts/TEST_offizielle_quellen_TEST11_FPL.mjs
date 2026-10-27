import assert from 'node:assert/strict';
import {decodeFpl} from './offizielle-liga-adapter.mjs';

const bootstrap={teams:[{id:1,name:'Liverpool'},{id:2,name:'Manchester United'}]};
const matches=[{id:99,team_h:1,team_a:2,kickoff_time:'2026-11-21T15:00:00Z'}];
const result=decodeFpl(bootstrap,matches);
assert.equal(result.fixtures.length,1);
assert.deepEqual(result.fixtures[0],{heim:'Liverpool',gast:'Manchester United',datum:'2026-11-21',anstoss:'16:00',startDate:'2026-11-21T15:00:00Z',provider:'fpl',fixtureId:99});
assert.equal(result.diagnosis.teams,2);
assert.equal(decodeFpl(bootstrap,[{...matches[0],kickoff_time:null}]).fixtures.length,0);
assert.equal(decodeFpl(bootstrap,[{...matches[0],team_a:999}]).fixtures.length,0);
assert.equal(decodeFpl({},matches).fixtures.length,0);
console.log('TEST11 FPL: 6/6 Schutz- und Zuordnungsprüfungen bestanden');
