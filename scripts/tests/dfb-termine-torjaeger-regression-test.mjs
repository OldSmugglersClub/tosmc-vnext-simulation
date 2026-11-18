import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src=fs.readFileSync(path.join(root,'wettbewerb.js'),'utf8');
const clubs=[
['stuttgart','VfB Stuttgart'],['dynamo-dresden','SG Dynamo Dresden'],['holstein-kiel','Holstein Kiel'],['koeln','1. FC Köln'],
['bayern-muenchen','FC Bayern München'],['hertha-bsc','Hertha BSC'],['moenchengladbach','Borussia Mönchengladbach'],['darmstadt-98','SV Darmstadt 98'],
['leverkusen','Bayer 04 Leverkusen'],['rb-leipzig','RB Leipzig'],['kaiserslautern','1. FC Kaiserslautern'],['freiburg','Sport-Club Freiburg'],
['frankfurt','Eintracht Frankfurt'],['dortmund','Borussia Dortmund'],['bochum','VfL Bochum 1848'],['augsburg','FC Augsburg']
];
const target='  load();\n})();';
assert(src.includes(target));
const injected=src.replace(target,`  currentTeamData={teams:${JSON.stringify(clubs.map(([id,name])=>({id,name})))}};
  globalThis.__fixture={dfbVerifiedRound16Kickoff,dfbPokalInfoCards};\n})();`);
const ctx={location:{pathname:'/dfb-pokal.html'},window:{},document:{},Date,Map,Set,Number,String,Object,Array,console};
vm.runInNewContext(injected,ctx);
const fixtures=[
[0,1,'2026-12-01','18:00'],[2,3,'2026-12-01','18:00'],[4,5,'2026-12-01','20:45'],[6,7,'2026-12-01','20:45'],
[8,9,'2026-12-02','18:00'],[10,11,'2026-12-02','18:00'],[12,13,'2026-12-02','20:45'],[14,15,'2026-12-02','20:45']
];
const match=(home,away,round='Achtelfinale')=>({team1:{teamId:home,teamName:clubs[home][1]},team2:{teamId:away,teamName:clubs[away][1]},group:{groupName:round}});
for(const [h,a,date,time] of fixtures){
  const got=ctx.__fixture.dfbVerifiedRound16Kickoff(match(h,a));
  assert.equal(got?.date,date);
  assert.equal(got?.time,time);
  assert.equal(ctx.__fixture.dfbVerifiedRound16Kickoff(match(a,h)),null,'No reversed pairing');
  assert.equal(ctx.__fixture.dfbVerifiedRound16Kickoff(match(h,a,'Viertelfinale')),null,'Only round of 16');
}
assert.equal(ctx.__fixture.dfbVerifiedRound16Kickoff(match(0,3)),null,'No invented fixture');
assert(src.includes('hasRealApiTime ? apiTime : official?.time || ""'),'New valid OpenLigaDB time wins');
assert(src.includes('openIndex = visibleRounds.findIndex'),'Next opening round logic exists');
assert(!src.includes('if (openIndex < 0) openIndex = Math.max(visibleRounds.length - 1, 0);'),'No automatic past round');
assert(src.includes('round.open = index === openIndex'),'Manual toggling preserved');
assert(src.includes('const leader = entries.find(entry => entry.tore > 0) || null;'),'DFB 0-goal scorer not incorrectly crowned');
const cards=ctx.__fixture.dfbPokalInfoCards([{titel:'Original'}],[{goalGetterName:'A',goalCount:0}]);
assert.equal(cards[0].leader,undefined,'No 0-goal leader');
const scored=ctx.__fixture.dfbPokalInfoCards([{titel:'Original'}],[{goalGetterName:'B',goalCount:2}]);
assert.equal(scored[0].leader.name,'B');
console.log('PASS DFB round-of-16 all 8 verified times, unknown pairing rejected, round focus and 0-goal safeguards');
