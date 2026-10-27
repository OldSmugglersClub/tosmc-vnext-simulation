// TEST7: read-only official-site browser probe. Never writes site data or ranks.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseStructuredFixtures,parseEmbeddedFixtures,DOMAINS,compare} from './offizielle-quellen.mjs';
import {providerForUrl,decodeOfficial} from './offizielle-liga-adapter.mjs';
const root=path.resolve(process.env.TOSMC_ROOT||'.');
const out=path.resolve(process.env.TOSMC_OFFICIAL_OUT||'terminwaechter-bericht');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const arr=x=>Array.isArray(x)?x:x?[x]:[];
function tzDate(s){if(typeof s!=='string'|| !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(s))return null;const d=new Date(s);if(!Number.isFinite(d.getTime()))return null;const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(x=>[x.type,x.value]));return {datum:`${p.year}-${p.month}-${p.day}`,anstoss:`${p.hour}:${p.minute}`};}
// Accept only a full tuple of two named teams and an offset-aware instant.
export function fixturesFromJson(json){const out=[],seen=new Set();let count=0;
 const name=x=>typeof x==='string'?x:(x?.name||x?.displayName||x?.teamName||x?.shortName||x?.fullName);
 function visit(x,depth=0){if(!x||typeof x!=='object'||depth>20||++count>120000)return;
  if(Array.isArray(x)){for(const v of x.slice(0,10000))visit(v,depth+1);return;}
  const home=name(x.homeTeam??x.home_team??x.home??x.teamHome??x.homeParticipant);
  const away=name(x.awayTeam??x.away_team??x.away??x.teamAway??x.awayParticipant);
  const iso=x.startDate??x.kickoffTime??x.kickoff??x.utcDate??x.matchDateTimeUTC??x.dateTime??x.startTime??x.kickOffTime;
  const time=tzDate(iso);
  if(typeof home==='string'&&typeof away==='string'&&time){const k=norm(home)+'|'+norm(away)+'|'+iso;if(!seen.has(k)){out.push({heim:home,gast:away,...time,startDate:iso});seen.add(k);}}
  for(const [k,v] of Object.entries(x))if(v&&typeof v==='object'&&!/^(news|articles|stories|posts|comments|statistics|players)$/i.test(k))visit(v,depth+1);
 }visit(json);return out;
}
export function trustResponse(pageUrl,responseUrl,allowed){try{const u=new URL(responseUrl),p=new URL(pageUrl);return u.protocol==='https:' && allowed.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)) && (u.hostname===p.hostname||allowed.some(d=>p.hostname===d||p.hostname.endsWith('.'+d)));}catch{return false;}}
export function dedupe(fixtures){const map=new Map();for(const f of fixtures)map.set(norm(f.heim)+'|'+norm(f.gast)+'|'+f.startDate,f);return [...map.values()];}
export async function run({browserFactory,config,siteGames,timeout=25000}={}){
 const cfg=config||JSON.parse(fs.readFileSync(path.join(root,'terminwaechter/offizielle-quellen.json'),'utf8'));
 const data=siteGames||JSON.parse(fs.readFileSync(path.join(root,'spieldaten.json'),'utf8'));
 if(cfg.datenVersionErwartet!==undefined&&String(cfg.datenVersionErwartet)!==String(data.datenVersion))throw Error('DATENVERSION_ABWEICHEND');
 const games=data.saisons.flatMap(x=>x.spiele||[]);const byId=new Map(games.map(x=>[x.id,x]));
 const factory=browserFactory||(async()=>{const {chromium}=await import('playwright');return chromium.launch({headless:true,args:['--no-sandbox']});});
 const browser=await factory();const report={zeit:new Date().toISOString(),datenVersion:data.datenVersion,modus:'BROWSER_READ_ONLY',quellen:[],befunde:[],automatischeAenderung:false};
 try{for(const src of cfg.quellen){if(!arr(src.spielIds).length){report.quellen.push({name:src.name,status:'NOCH_KEINE_TOSMC_EINZELSPIELE'});continue;}
  const allowed=DOMAINS[src.verband]||[];if(!trustResponse(src.url,src.url,allowed)){report.quellen.push({name:src.name,status:'DOMAIN_NICHT_FREIGEGEBEN'});continue;}
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});const page=await context.newPage();const fixtures=[];const endpoints=[];const schemaBefunde=[];let pending=[];
  page.on('response',r=>{const u=r.url();if(!trustResponse(src.url,u,allowed))return;const ct=r.headers()['content-type']||'';if(!/json/i.test(ct)||endpoints.length>=70)return;
   endpoints.push({host:new URL(u).hostname,pfad:new URL(u).pathname.slice(0,180),http:r.status()});
   pending.push((async()=>{try{if(r.status()!==200)return;const body=await r.body();if(body.length>2_000_000)return;const obj=JSON.parse(body.toString('utf8'));const provider=providerForUrl(u);if(provider){const decoded=decodeOfficial(provider,obj);fixtures.push(...decoded.fixtures);schemaBefunde.push({pfad:new URL(u).pathname.slice(0,180),...decoded.diagnosis});}else{fixtures.push(...fixturesFromJson(obj));}}catch{}})());});
  try{await page.goto(src.url,{waitUntil:'domcontentloaded',timeout});await page.waitForTimeout(4500);const html=await page.content();fixtures.push(...parseStructuredFixtures(html),...parseEmbeddedFixtures(html));await Promise.allSettled(pending);const clean=dedupe(fixtures);
   report.quellen.push({name:src.name,status:clean.length?'SPIELE_EXTRAHIERT':'KEINE_SPIELE_EXTRAHIERT',anzahl:clean.length,antworten:endpoints,schemaBefunde,seite:page.url()});
   for(const id of src.spielIds){const g=byId.get(id);if(!g){report.befunde.push({spielId:id,status:'SPIEL_FEHLT'});continue;}if(g.status==='beendet')continue;
    report.befunde.push({spielId:id,quelle:src.url,...compare(g,clean,cfg.teamAliase||{})});}
  }catch(e){report.quellen.push({name:src.name,status:'BROWSER_FEHLER',fehler:String(e.message).slice(0,220),antworten:endpoints,schemaBefunde});for(const id of src.spielIds)report.befunde.push({spielId:id,status:'BROWSER_FEHLER'});}
  finally{await context.close();}
 }}finally{await browser.close();}
 report.verifiziert=report.befunde.filter(x=>['IDENTISCH','ABWEICHUNG'].includes(x.status)).length;
 report.status=report.verifiziert===report.befunde.length&&report.befunde.length>0?'GEPRUEFT':'UNVOLLSTAENDIG';
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER_QUELLEN_BERICHT.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(out,'BROWSER_QUELLEN_BERICHT.md'),['# TOSMC offizieller Browser-Quellencheck',`Stand: ${report.zeit}`,`Verifiziert: ${report.verifiziert}/${report.befunde.length}`,`Status: ${report.status}`,'',...report.quellen.map(x=>`- ${x.name}: ${x.status}; erkannte Spiele: ${x.anzahl||0}; JSON-Antworten: ${x.antworten?.length||0}`),'',...report.befunde.map(x=>`- ${x.spielId}: ${x.status}${x.amtlich?' – '+x.amtlich.datum+' '+x.amtlich.anstoss:''}`),'','Keine Website-Dateien geändert.'].join('\n')+'\n');return report;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)run().then(x=>{console.log(JSON.stringify({status:x.status,verifiziert:x.verifiziert,quellen:x.quellen},null,2));if(x.status!=='GEPRUEFT')process.exitCode=2;}).catch(e=>{console.error(e);process.exitCode=1;});
