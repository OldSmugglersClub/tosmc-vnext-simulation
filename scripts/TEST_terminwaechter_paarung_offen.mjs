import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeOfficial} from './offizielle-liga-adapter.mjs';
import {compare} from './offizielle-quellen.mjs';
import {fetchFranceRound} from './offizielle-quellen-browser.mjs';
import {planOfficialChanges,applyOfficialChanges} from './terminwaechter-auto-core.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url)));
const data=read('../spieldaten.json'),config=read('../terminwaechter/offizielle-quellen.json');
const games=data.saisons.flatMap(s=>s.spiele);
const cases=[['france','pk-2026-27-05-le-classique','france-round19.json'],['portugal','wr-2026-27-02','portugal-round16.json']];
for(const [provider,id,file] of cases){
 const raw=read('./fixtures/terminwaechter/'+file),decoded=decodeOfficial(provider,raw);
 const game=games.find(g=>g.id===id),finding=compare(game,decoded.fixtures,config.teamAliase);
 assert.equal(decoded.fixtures.length,9);
 assert.equal(finding.status,'PAARUNG_GEFUNDEN_TERMIN_OFFEN');
 for(const f of decoded.fixtures){assert.equal(f.terminBestaetigt,false);assert.equal(f.datum,null);assert.equal(f.anstoss,null);}
 const plan=planOfficialChanges(data,{befunde:[{spielId:id,...finding}],quellen:[]},{now:new Date('2026-12-01T12:00:00Z')});
 assert.deepEqual(plan.planned,[]);
 assert.deepEqual(applyOfficialChanges(data,plan),data);
 assert.equal(compare({...game,auswaertsTeamId:'missing'},decoded.fixtures,config.teamAliase).status,'KEIN_EINDEUTIGES_SPIEL');
 assert.equal(compare(game,[...decoded.fixtures,...decoded.fixtures],config.teamAliase).status,'MEHRDEUTIG');
}
// Validate exact round routing and reject an unrelated season before matching.
const src=config.quellen.find(s=>s.verband==='frankreich');
const raw=read('./fixtures/terminwaechter/france-round19.json');
const calls=[];
const fake=async url=>{calls.push(url);return {ok:true,status:200,text:async()=>JSON.stringify(url.endsWith('championships-settings')?{championships:{1:{season:2026}}}:raw)};};
const direct=await fetchFranceRound(src,'2026/2027',fake);
assert.equal(direct.decoded.fixtures.length,9);
assert.ok(calls[1].endsWith('/game-week/19'));
await assert.rejects(()=>fetchFranceRound(src,'2025/2026',fake),/SAISON_ABWEICHEND/);
// A real future confirmation must become a candidate; open placeholders never do.
const confirmed={homeTeam:{name:'SL Benfica'},awayTeam:{name:'Sporting CP'},fixtureDate:'2026-12-27T20:15:00Z',fixtureDateIsDefined:true};
const match=decodeOfficial('portugal',{matches:[confirmed]}).fixtures[0];
assert.equal(match.anstoss,'21:15');
const game=games.find(g=>g.id==='wr-2026-27-02');
const finding={spielId:game.id,quellenName:'Portugal offiziell',...compare(game,[match],config.teamAliase)};
assert.equal(finding.status,'ABWEICHUNG');
const plan=planOfficialChanges(data,{befunde:[finding],quellen:[{name:'Portugal offiziell',status:'SPIELE_EXTRAHIERT'}]},{now:new Date('2026-12-01T12:00:00Z')});
assert.equal(plan.planned.length,1);
assert.throws(()=>planOfficialChanges(data,{befunde:[{...finding,amtlich:{...match,terminBestaetigt:false}}],quellen:[{name:'Portugal offiziell',status:'SPIELE_EXTRAHIERT'}]},{now:new Date('2026-12-01T12:00:00Z')}),/TERMIN_NICHT_BESTAETIGT/);
const next=applyOfficialChanges(data,plan);
assert.equal(next.saisons.flatMap(s=>s.spiele).find(g=>g.id===game.id).anstoss,'21:15');
console.log('PASS: real source captures, both open pairings, no placeholder writes, exact French round/season, ambiguity, later confirmation');
