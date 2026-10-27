import assert from 'node:assert/strict';
import {decodeOfficial, providerForUrl} from './offizielle-liga-adapter.mjs';
let n=0;
function check(label,actual,expected){assert.deepEqual(actual,expected,label);n++}
const entry={home:{officialName:'AC Milan'},away:{officialName:'Inter'},matchDateUtc:'2026-10-31T19:45:00Z',matchId:'serieA-1'};
let r=decodeOfficial('seriea',{data:{matches:[entry]}});
check('Serie A UTC time mapped correctly',r.fixtures[0].anstoss,'20:45');
check('Berlin day mapped correctly',r.fixtures[0].datum,'2026-10-31');
check('Serie A team names',r.fixtures[0].heim,'AC Milan');
check('One unique match',r.fixtures.length,1);
check('No timezone -> no fixture',decodeOfficial('seriea',{matches:[{...entry,matchDateUtc:'2026-10-31T19:45:00'}]}).fixtures.length,0);
check('Empty kick-off -> no fixture',decodeOfficial('seriea',{matches:[{...entry,matchDateUtc:null}]}).fixtures.length,0);
check('No team -> no fixture',decodeOfficial('seriea',{matches:[{...entry,home:null}]}).fixtures.length,0);
check('Repeated fixture deduped',decodeOfficial('seriea',{matches:[entry,entry]}).fixtures.length,1);
check('Observed Serie A endpoint',providerForUrl('https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/any/matches'),'seriea');
check('External host not trusted',providerForUrl('https://untrusted.example/v1/serie-a/football/seasons/any/matches'),null);
console.log(`TEST9: ${n}/${n} bestanden`);
