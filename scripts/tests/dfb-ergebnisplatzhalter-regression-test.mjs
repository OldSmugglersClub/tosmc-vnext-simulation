import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src=fs.readFileSync(path.join(root,'wettbewerb.js'),'utf8');
assert(src.includes('const finalScore = openLigaDbFinalResult(match);'));
assert(src.includes('if (slug === "dfb-pokal" && !finalScore) result.hidden = true;'));
const marker='  load();\n})();';
assert(src.includes(marker));
function element(tag) { return {tag, children:[], dataset:{}, textContent:'', hidden:false, append(...v){this.children.push(...v);},appendChild(v){this.children.push(v);},setAttribute(k,v){this[k]=v;}}; }
const ctx={location:{pathname:'/dfb-pokal.html'},window:{},document:{createElement:element},console,Date,Map,Set,Number,String,Object,Array,URL};
vm.runInNewContext(src.replace(marker, '  globalThis.__fixture={createBracketMatch};\n})();'),ctx);
const base={team1:{teamId:1,teamName:'VfB Stuttgart'},team2:{teamId:2,teamName:'Dynamo Dresden'},group:{groupName:'Achtelfinale'},matchDateTime:'2026-12-01T18:00:00',matchResults:[]};
const pending=ctx.__fixture.createBracketMatch(base);
assert.equal(pending.children[1].children[0].hidden,true,'Unfinished DFB result placeholder hidden');
assert.equal(pending.children[1].children[0].textContent,'');
assert.equal(pending.children[1].children[1].textContent,'01.12. · 18:00');
const played=ctx.__fixture.createBracketMatch({...base,matchResults:[{resultTypeID:2,pointsTeam1:2,pointsTeam2:1}]});
assert.equal(played.children[1].children[0].hidden,false);
assert.equal(played.children[1].children[0].textContent,'2:1');
ctx.location.pathname='/europa-league.html'; // independent VM for slug captured at initialization
const el={...ctx,location:{pathname:'/europa-league.html'}};
vm.runInNewContext(src.replace(marker, '  globalThis.__fixture={createBracketMatch};\n})();'),el);
const other=el.__fixture.createBracketMatch(base);
assert.equal(other.children[1].children[0].hidden,false,'Other competitions unchanged');
assert.equal(other.children[1].children[0].textContent,'–');
console.log('PASS DFB pending result hidden; scheduled kickoff retained; finished score and EL unchanged');
