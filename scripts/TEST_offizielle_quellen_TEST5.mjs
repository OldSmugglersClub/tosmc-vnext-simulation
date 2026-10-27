import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {run} from './offizielle-quellen.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'tosmc-q5-'));const out=path.join(root,'out');
try {
 fs.mkdirSync(path.join(root,'terminwaechter'));
 fs.writeFileSync(path.join(root,'spieldaten.json'),JSON.stringify({datenVersion:82,saisons:[{spiele:[{id:'test1',wettbewerb:'piratenkodex',heimTeamId:'liverpool',auswaertsTeamId:'manchester-united',datum:'2026-11-22',anstoss:'17:30',status:'terminiert'}]}]}));
 fs.writeFileSync(path.join(root,'terminwaechter/offizielle-quellen.json'),JSON.stringify({datenVersionErwartet:82,quellen:[{name:'PL',verband:'england',url:'https://www.premierleague.com/en/fixtures',spielIds:['test1']}],teamAliase:{liverpool:['Liverpool'], 'manchester-united':['Manchester United']}}));
 const good='<html><head><title>Fixtures</title><script type="application/ld+json">'+JSON.stringify({'@type':'SportsEvent',homeTeam:{name:'Liverpool'},awayTeam:{name:'Manchester United'},startDate:'2026-11-22T16:30:00Z'})+'</script></head></html>';
 const fake=(body,status=200)=>async()=>({ok:status===200,status,headers:{get:()=> 'text/html'},text:async()=>body});
 const verified=await run({root,out,fetchFn:fake(good)});assert.equal(verified.status,'GEPRUEFT');assert.equal(verified.abdeckung.identisch,1);assert.equal(verified.quellen[0].diagnose.jsonLdBloecke,1);
 const opaque=await run({root,out,fetchFn:fake('<html><title>Client application</title><script>window.__NEXT_DATA__={}</script></html>')});assert.equal(opaque.status,'UNVOLLSTAENDIG');assert.equal(opaque.quellen[0].diagnose.kennzeichen.javascriptApp,true);
 const blocked=await run({root,out,fetchFn:fake('<html><title>Just a moment</title>Cloudflare CAPTCHA</html>')});assert.equal(blocked.quellen[0].diagnose.kennzeichen.challenge,true);assert.equal(blocked.status,'UNVOLLSTAENDIG');
 const down=await run({root,out,fetchFn:fake('',503)});assert.equal(down.status,'UNVOLLSTAENDIG');assert.equal(down.quellen[0].status,'ABRUF_FEHLER');
 console.log('TEST5 4/4 Diagnoseszenarien bestanden');
}finally{fs.rmSync(root,{recursive:true,force:true});}
