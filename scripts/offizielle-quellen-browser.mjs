// TEST7: read-only official-site browser probe. Never writes site data or ranks.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseStructuredFixtures,parseEmbeddedFixtures,DOMAINS,compare} from './offizielle-quellen.mjs';
import {providerForUrl,decodeOfficial,decodeFpl} from './offizielle-liga-adapter.mjs';
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
export function safeQuery(url){try{const out={};for(const [k,v] of new URL(url).searchParams){if(/token|key|auth|session|secret|password|signature/i.test(k))continue;out[k.slice(0,80)]=v.slice(0,160);}return out;}catch{return {};}}
export function dedupe(fixtures){const map=new Map();for(const f of fixtures)map.set(norm(f.heim)+'|'+norm(f.gast)+'|'+f.startDate,f);return [...map.values()];}
// LaLiga renders its official result/fixture list as a table and converts the
// kick-off to the browser time zone. The browser context is therefore pinned
// to Europe/Berlin below. Accept only rows carrying a full date, exact time and
// exactly two official club links; scores/referees are deliberately ignored.
export function parseLaLigaRows(rows){const out=[];
 for(const row of arr(rows)){
  const date=String(row?.date||'').trim().match(/(?:MON|TUE|WED|THU|FRI|SAT|SUN)\s+(\d{2})\.(\d{2})\.(\d{4})$/i);
  const time=String(row?.time||'').trim().match(/^(\d{2}):(\d{2})$/);
  const clubs=arr(row?.clubs).map(x=>String(x||'').trim()).filter(Boolean);
  if(!date||!time||clubs.length!==2||Number(time[1])>23||Number(time[2])>59)continue;
  const datum=`${date[3]}-${date[2]}-${date[1]}`,anstoss=`${time[1]}:${time[2]}`;
  out.push({heim:clubs[0],gast:clubs[1],datum,anstoss,startDate:`${datum}T${anstoss}:00[Europe/Berlin]`,provider:'laliga-dom'});
 }
 return out;
}
async function fetchLaLigaDom(page){const rows=await page.locator('table tr').evaluateAll(elements=>elements.map(row=>{
 const cells=[...row.querySelectorAll(':scope > td')];if(cells.length<5)return null;
 const clubs=[...cells[4].querySelectorAll('a[href*="/clubs/"][href$="/results"]')].map(a=>(a.textContent||'').replace(/\s+/g,' ').trim());
 return {date:(cells[1]?.textContent||'').replace(/\s+/g,' ').trim(),time:(cells[2]?.textContent||'').replace(/\s+/g,' ').trim(),clubs};
 }).filter(Boolean));return parseLaLigaRows(rows);}
export function franceHtmlDiagnostic(html){
 const scripts=[...String(html||'').matchAll(/<script\b([^>]*)>/gi)].slice(0,120).map(m=>{const a=m[1]||'';return {src:(a.match(/\bsrc=["']([^"']+)["']/i)?.[1]||'').slice(0,240),type:(a.match(/\btype=["']([^"']+)["']/i)?.[1]||'').slice(0,80)};});
 return {zeichen:String(html||'').length,framework:{next:/__NEXT_DATA__|self\.__next_f\.push/i.test(html),nuxt:/__NUXT__|_nuxt\//i.test(html)},scripts:scripts.filter(x=>x.src||x.type).slice(0,40),kennzeichen:{psg:/Paris Saint-Germain/i.test(html),marseille:/Olympique de Marseille/i.test(html),zieldatum:/2027-02-07|07\/02\/2027|7 February 2027/i.test(html)}};
}
export function franceNextFlightDiagnostic(html){
 const bodies=[...String(html||'').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>/self\.__next_f\.push/.test(x));const payloads=[];
 for(const body of bodies){for(const m of body.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?/g)){try{const v=JSON.parse(m[1]);if(typeof v?.[1]==='string')payloads.push(v[1]);}catch{}}}
 const all=payloads.join('\n');const contexts=[];for(const term of ['Paris Saint-Germain','Olympique de Marseille','gameweek','2027-02-07']){let from=0;for(let n=0;n<4;n++){const i=all.toLowerCase().indexOf(term.toLowerCase(),from);if(i<0)break;contexts.push({begriff:term,text:all.slice(Math.max(0,i-220),i+term.length+300).replace(/[\r\n\t]+/g,' ').slice(0,620)});from=i+term.length;}}
 const paths=[...new Set([...all.matchAll(/(?:https:\/\/[^"'\\\s]{1,240}|\/(?:api|graphql)\/[^"'\\\s]{1,220})/gi)].map(m=>m[0].replace(/\\u0026/g,'&').slice(0,260)))].slice(0,40);
 return {flightSkripte:bodies.length,payloads:payloads.length,zeichen:all.length,pfade:paths,kontexte:contexts};
}
async function franceDomDiagnostic(page){return page.evaluate(()=>{
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();const attrs=e=>Object.fromEntries([...e.attributes].filter(a=>/^(?:class|id|data-|aria-|datetime)/i.test(a.name)).slice(0,16).map(a=>[a.name,a.value.slice(0,180)]));
 const candidates=[...document.querySelectorAll('main *,[role="main"] *,body *')].filter(e=>{const t=clean(e.innerText);return t.length>=20&&t.length<=1600&&/Paris Saint-Germain/i.test(t)&&/Olympique de Marseille/i.test(t);});
 const smallest=candidates.filter(e=>![...e.children].some(c=>{const t=clean(c.innerText);return /Paris Saint-Germain/i.test(t)&&/Olympique de Marseille/i.test(t);}));
 return smallest.slice(0,12).map(e=>({tag:e.tagName.toLowerCase(),attribute:attrs(e),text:clean(e.innerText).slice(0,700)}));
 });}
// The official Liga Portugal season response is larger than the generic cap.
// Raise the limit only for the exact allow-listed competition/matches provider.
export function responseBodyLimit(url){return providerForUrl(url)==='portugal'?10_000_000:2_000_000;}
export function serieASeasonId(src){const id=String(src?.seasonProviderId||'');return /^serie-a::Football_Season::[a-f0-9]{32}$/.test(id)?id:null;}
async function fetchSerieASeason(src){const seasonId=serieASeasonId(src);if(!seasonId)throw Error('SERIE_A_SAISONKENNUNG_UNGUELTIG');
 const url=new URL(`https://api-sdp.legaseriea.it/v1/serie-a/football/seasons/${encodeURIComponent(seasonId)}/matches`);url.searchParams.set('matchDayId','');url.searchParams.set('locale','en-GB');
 let last;for(let attempt=1;attempt<=2;attempt++){try{const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TOSMC-Fixture-Check/1.0'},signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('SERIE_A_HTTP_'+response.status);if(!/json/i.test(response.headers.get('content-type')||''))throw Error('SERIE_A_CONTENT_TYPE');const body=Buffer.from(await response.arrayBuffer());if(body.length>2_000_000)throw Error('SERIE_A_ANTWORT_ZU_GROSS_'+body.length);const decoded=decodeOfficial('seriea',JSON.parse(body.toString('utf8')));if(!decoded.fixtures.length)throw Error('SERIE_A_KEINE_SPIELE');return {decoded,endpoint:{host:url.hostname,pfad:url.pathname,parameter:safeQuery(url.href),http:response.status,bytes:body.length,versuch:attempt}};}catch(e){last=e;}}
 throw last||Error('SERIE_A_ABRUF_FEHLER');}
async function fetchFpl(){
 const urls=['https://fantasy.premierleague.com/api/bootstrap-static/','https://fantasy.premierleague.com/api/fixtures/'];
 const responses=await Promise.all(urls.map(url=>fetch(url,{headers:{Accept:'application/json','User-Agent':'TOSMC-Fixture-Check/1.0'},signal:AbortSignal.timeout(18000)})));
 if(responses.some(r=>!r.ok))throw Error('FPL_HTTP_'+responses.map(r=>r.status).join('_'));
 if(responses.some(r=>!/application\/json/i.test(r.headers.get('content-type')||'')))throw Error('FPL_CONTENT_TYPE');
 const [bootstrap,fixtures]=await Promise.all(responses.map(r=>r.json()));
 return {decoded:decodeFpl(bootstrap,fixtures),endpoints:urls.map((url,i)=>({host:new URL(url).hostname,pfad:new URL(url).pathname,http:responses[i].status}))};
}
export function portugalSeasonKey(season){const m=String(season||'').match(/^(\d{4})\/(\d{4})$/);return m?m[1]+m[2]:null;}
export function portugalRoundMetadata(data){const out=[],seen=new WeakSet();let visited=0;
 function walk(x,depth=0){if(!x||typeof x!=='object'||seen.has(x)||depth>16||++visited>30000)return;seen.add(x);if(Array.isArray(x)){for(const v of x.slice(0,5000))walk(v,depth+1);return;}
  const keys=Object.keys(x);if(keys.some(k=>/round|jornada|matchday/i.test(k))){const sample={};for(const [k,v] of Object.entries(x))if((typeof v==='string'||typeof v==='number'||typeof v==='boolean')&&/round|jornada|matchday|date|start|end|number|id|name|title|current/i.test(k))sample[k.slice(0,80)]=String(v).slice(0,160);if(Object.keys(sample).length)out.push(sample);}
  for(const [k,v] of Object.entries(x))if(v&&typeof v==='object'&&!/news|article|media|video|player|statistic/i.test(k))walk(v,depth+1);
 }walk(data);return {knoten:visited,beispiele:out.slice(0,30)};}
// Records only the official Ligue 1 API structure and small fixture-shaped
// samples. Full responses, credentials and session data never enter the report.
export function franceApiDiagnostic(data){const patterns=new Map(),samples=[],arrays=[],seen=new WeakSet();let visited=0;
 const scalar=(x,depth=0)=>{if(!x||typeof x!=='object'||depth>2)return x;if(Array.isArray(x))return x.slice(0,2).map(v=>scalar(v,depth+1));const out={};for(const [k,v] of Object.entries(x).slice(0,40)){if(/token|key|auth|session|secret|password|signature/i.test(k))continue;if(v==null||['string','number','boolean'].includes(typeof v))out[k]=typeof v==='string'?v.slice(0,180):v;else if(depth<2&&/home|away|club|identity|date|time|status|match|game|week/i.test(k))out[k]=scalar(v,depth+1);}return out;};
 function walk(x,path='$',depth=0){if(!x||typeof x!=='object'||seen.has(x)||depth>16||++visited>30000)return;seen.add(x);if(Array.isArray(x)){arrays.push({pfad:path,anzahl:x.length,elementTyp:x.length?(Array.isArray(x[0])?'array':typeof x[0]):'leer'});for(const v of x.slice(0,1000))walk(v,path+'[]',depth+1);return;}const keys=Object.keys(x).sort();const signature=keys.join('|');patterns.set(signature,(patterns.get(signature)||0)+1);if(samples.length<12&&keys.some(k=>/^home$/i.test(k))&&keys.some(k=>/^away$/i.test(k)))samples.push({pfad:path,wert:scalar(x)});for(const [k,v] of Object.entries(x))if(v&&typeof v==='object'&&!/article|news|media|video|player|statistic/i.test(k))walk(v,path+'.'+k,depth+1);}
 walk(data);return {wurzel:Array.isArray(data)?'array':Object.keys(data||{}).slice(0,80),knoten:visited,arrays:[...new Map(arrays.map(x=>[x.pfad,x])).values()].sort((a,b)=>b.anzahl-a.anzahl).slice(0,30),feldmuster:[...patterns.entries()].map(([keys,count])=>({keys:keys.slice(0,900),count})).sort((a,b)=>b.count-a.count).slice(0,20),beispiele:samples};}
async function fetchPortugalRounds(season){
 const seasonKey=portugalSeasonKey(season);if(!seasonKey)throw Error('PORTUGAL_SAISON_UNGUELTIG');
 const url=new URL('https://www.ligaportugal.pt/api/v1/competition/season/rounds');url.searchParams.set('competition','ligaportugalbetclic');url.searchParams.set('season',seasonKey);
 const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TOSMC-Fixture-Check/1.0'},signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('PORTUGAL_RUNDEN_HTTP_'+response.status);if(!/json/i.test(response.headers.get('content-type')||''))throw Error('PORTUGAL_RUNDEN_CONTENT_TYPE');
 const body=Buffer.from(await response.arrayBuffer());if(body.length>2_000_000)throw Error('PORTUGAL_RUNDEN_ZU_GROSS_'+body.length);const diagnosis=portugalRoundMetadata(JSON.parse(body.toString('utf8')));return {diagnosis,endpoint:{host:url.hostname,pfad:url.pathname,parameter:safeQuery(url.href),http:response.status,bytes:body.length}};
}
async function fetchPortugalLeague(season){
 const seasonKey=portugalSeasonKey(season);if(!seasonKey)throw Error('PORTUGAL_SAISON_UNGUELTIG');
 const url=new URL('https://www.ligaportugal.pt/api/v1/competition/matches');
 url.searchParams.set('competition','ligaportugalbetclic');url.searchParams.set('season',seasonKey);
 const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TOSMC-Fixture-Check/1.0'},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('PORTUGAL_HTTP_'+response.status);
 if(!/json/i.test(response.headers.get('content-type')||''))throw Error('PORTUGAL_CONTENT_TYPE');
 const body=Buffer.from(await response.arrayBuffer());const limit=responseBodyLimit(url.href);if(body.length>limit)throw Error('PORTUGAL_ANTWORT_ZU_GROSS_'+body.length);
 const decoded=decodeOfficial('portugal',JSON.parse(body.toString('utf8')));
 return {decoded,endpoint:{host:url.hostname,pfad:url.pathname,parameter:safeQuery(url.href),http:response.status,bytes:body.length}};
}
export function portugalRoundsFromSource(src){const ids=new Set(arr(src?.spielIds)),map=src?.rundenBySpielId||{},rounds=[];for(const [id,value] of Object.entries(map)){if(!ids.has(id))throw Error('PORTUGAL_RUNDE_OHNE_SPIEL:'+id);if(!Number.isInteger(value)||value<1||value>40)throw Error('PORTUGAL_RUNDE_UNGUELTIG:'+id);rounds.push(value);}return [...new Set(rounds)].sort((a,b)=>a-b);}
async function fetchPortugalRound(season,round){
 const seasonKey=portugalSeasonKey(season);if(!seasonKey)throw Error('PORTUGAL_SAISON_UNGUELTIG');
 const url=new URL('https://www.ligaportugal.pt/api/v1/competition/matches');url.searchParams.set('competition','ligaportugalbetclic');url.searchParams.set('season',seasonKey);url.searchParams.set('round',String(round));
 const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TOSMC-Fixture-Check/1.0'},signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('PORTUGAL_RUNDE_HTTP_'+response.status);if(!/json/i.test(response.headers.get('content-type')||''))throw Error('PORTUGAL_RUNDE_CONTENT_TYPE');
 const body=Buffer.from(await response.arrayBuffer());const limit=responseBodyLimit(url.href);if(body.length>limit)throw Error('PORTUGAL_RUNDE_ZU_GROSS_'+body.length);const decoded=decodeOfficial('portugal',JSON.parse(body.toString('utf8')));return {decoded,endpoint:{host:url.hostname,pfad:url.pathname,parameter:safeQuery(url.href),http:response.status,bytes:body.length}};
}
export async function fetchFranceRound(src,season,fetchFn=fetch){
 const round=new URL(src.url).searchParams.get('gameweek');
 if(!/^([1-9]|[12][0-9]|3[0-8])$/.test(round||''))throw Error('FRANKREICH_RUNDE_UNGUELTIG');
 const year=String(season||'').match(/^(\d{4})\/\d{4}$/)?.[1];
 if(!year)throw Error('FRANKREICH_SAISON_UNGUELTIG');
 const read=async(url)=>{
  const r=await fetchFn(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!r.ok)throw Error('FRANKREICH_HTTP_'+r.status);
  const body=await r.text();if(Buffer.byteLength(body)>2_000_000)throw Error('FRANKREICH_ANTWORT_ZU_GROSS');
  return JSON.parse(body);
 };
 const settings=await read('https://ma-api.ligue1.fr/championships-settings');
 if(String(settings?.championships?.['1']?.season)!==year)throw Error('FRANKREICH_SAISON_ABWEICHEND');
 const url='https://ma-api.ligue1.fr/championship-matches/championship/1/game-week/'+round;
 const decoded=decodeOfficial('france',await read(url));
 return {decoded,endpoint:{host:'ma-api.ligue1.fr',pfad:new URL(url).pathname,parameter:{},http:200,saison:year}};
}
export async function run({browserFactory,config,siteGames,timeout=25000}={}){
 const cfg=config||JSON.parse(fs.readFileSync(path.join(root,'terminwaechter/offizielle-quellen.json'),'utf8'));
 const data=siteGames||JSON.parse(fs.readFileSync(path.join(root,'spieldaten.json'),'utf8'));
 if(cfg.datenVersionErwartet!==undefined&&String(cfg.datenVersionErwartet)!==String(data.datenVersion))throw Error('DATENVERSION_ABWEICHEND');
 const games=data.saisons.flatMap(x=>x.spiele||[]);const byId=new Map(games.map(x=>[x.id,x]));
 const factory=browserFactory||(async()=>{const {chromium}=await import('playwright');return chromium.launch({headless:true,args:['--no-sandbox']});});
 const browser=await factory();const report={zeit:new Date().toISOString(),datenVersion:data.datenVersion,modus:'BROWSER_READ_ONLY',quellen:[],befunde:[],automatischeAenderung:false};
 try{for(const src of cfg.quellen){if(!arr(src.spielIds).length){report.quellen.push({name:src.name,status:'NOCH_KEINE_TOSMC_EINZELSPIELE'});continue;}
  const allowed=DOMAINS[src.verband]||[];if(!trustResponse(src.url,src.url,allowed)){report.quellen.push({name:src.name,status:'DOMAIN_NICHT_FREIGEGEBEN'});continue;}
  const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false,timezoneId:'Europe/Berlin'});const page=await context.newPage();const fixtures=[];const endpoints=[];const schemaBefunde=[];let pending=[];
  page.on('response',r=>{const u=r.url();if(!trustResponse(src.url,u,allowed))return;const ct=r.headers()['content-type']||'';const nextJs=src.verband==='frankreich'&&/javascript/i.test(ct)&&/\/_next\/static\/chunks\//.test(new URL(u).pathname);if(!/json/i.test(ct)&&!nextJs)return;if(endpoints.length>=70)return;
   endpoints.push({host:new URL(u).hostname,pfad:new URL(u).pathname.slice(0,180),parameter:safeQuery(u),http:r.status()});
   pending.push((async()=>{try{if(r.status()!==200)return;const body=await r.body();if(nextJs){if(body.length>1_500_000){schemaBefunde.push({provider:'frankreich-nextjs',pfad:new URL(u).pathname,status:'SCRIPT_ZU_GROSS',bytes:body.length});return;}const code=body.toString('utf8');const treffer=[...new Set([...code.matchAll(/(?:https:\/\/[^"'`\\\s]{1,260}|\/(?:api|graphql)\/[^"'`\\\s]{1,220})/gi)].map(m=>m[0].replace(/\\u0026/g,'&').slice(0,280)))].slice(0,60);const begriffe=['gameweek','championship_match','fixture','matchday','ma-api','fr_l1','championshipsids'].filter(x=>code.toLowerCase().includes(x));const kontexte=[];for(const term of begriffe){let from=0;for(let n=0;n<3&&kontexte.length<14;n++){const i=code.toLowerCase().indexOf(term,from);if(i<0)break;kontexte.push({begriff:term,text:code.slice(Math.max(0,i-380),i+term.length+520).replace(/[\r\n\t]+/g,' ').slice(0,950)});from=i+term.length;}}if(treffer.length||begriffe.length)schemaBefunde.push({provider:'frankreich-nextjs',pfad:new URL(u).pathname,bytes:body.length,begriffe,treffer,kontexte});return;}const limit=responseBodyLimit(u);if(body.length>limit){schemaBefunde.push({pfad:new URL(u).pathname.slice(0,180),parameter:safeQuery(u),status:'ANTWORT_ZU_GROSS',bytes:body.length,limit});return;}const obj=JSON.parse(body.toString('utf8'));const provider=providerForUrl(u);if(provider){const decoded=decodeOfficial(provider,obj);fixtures.push(...decoded.fixtures);schemaBefunde.push({pfad:new URL(u).pathname.slice(0,180),parameter:safeQuery(u),bytes:body.length,...decoded.diagnosis});}else{fixtures.push(...fixturesFromJson(obj));if(new URL(u).hostname==='ma-api.ligue1.fr')schemaBefunde.push({provider:'frankreich-api-roh',pfad:new URL(u).pathname,parameter:safeQuery(u),bytes:body.length,diagnose:franceApiDiagnostic(obj)});}}catch{}})());});
  try{await page.goto(src.url,{waitUntil:'domcontentloaded',timeout});
   // Ligue 1 does not initialize its fixture view while the consent notice is
   // open. Reject optional cookies; this is deterministic, privacy-preserving
   // and does not create an account or change website data.
   if(src.verband==='frankreich'){
    const reject=page.getByRole('button',{name:/Tout refuser|Reject all|Refuse all|Decline all/i}).first();
    const appeared=await reject.waitFor({state:'visible',timeout:12000}).then(()=>true).catch(()=>false);
    if(appeared){await reject.click();schemaBefunde.push({provider:'frankreich-consent',status:'OPTIONALE_COOKIES_ABGELEHNT',erkennung:'BUTTON_ROLLE'});}
    else schemaBefunde.push({provider:'frankreich-consent',status:'DIALOG_NICHT_GEFUNDEN'});
   }
   await page.waitForTimeout(5000);const html=await page.content();fixtures.push(...parseStructuredFixtures(html),...parseEmbeddedFixtures(html));await Promise.allSettled(pending);
   if(src.verband==='spanien'){const laliga=await fetchLaLigaDom(page);fixtures.push(...laliga);schemaBefunde.push({provider:'laliga-dom',zeitzone:'Europe/Berlin',fixtures:laliga.length});}
   if(src.verband==='frankreich')try{const france=await fetchFranceRound(src,byId.get(src.spielIds[0])?.saison);fixtures.push(...france.decoded.fixtures);endpoints.push(france.endpoint);schemaBefunde.push({provider:'frankreich-zielrunde',...france.decoded.diagnosis});}catch(e){schemaBefunde.push({provider:'frankreich-zielrunde',fehler:String(e.message)});}
   if(src.verband==='frankreich')schemaBefunde.push({provider:'frankreich-seite',...franceHtmlDiagnostic(html),nextFlight:franceNextFlightDiagnostic(html),dom:await franceDomDiagnostic(page)});
   if(src.verband==='england')try{const fpl=await fetchFpl();fixtures.push(...fpl.decoded.fixtures);endpoints.push(...fpl.endpoints);schemaBefunde.push(fpl.decoded.diagnosis);}catch(e){schemaBefunde.push({provider:'fpl',fehler:String(e.message)});}
   if(src.verband==='italien'&&!fixtures.some(x=>x.provider==='seriea'))try{const serieA=await fetchSerieASeason(src);fixtures.push(...serieA.decoded.fixtures);endpoints.push(serieA.endpoint);schemaBefunde.push({provider:'seriea-direkt',direktAbruf:true,bytes:serieA.endpoint.bytes,versuch:serieA.endpoint.versuch,...serieA.decoded.diagnosis});}catch(e){schemaBefunde.push({provider:'seriea-direkt',fehler:String(e.message)});}
   if(src.verband==='portugal'){const season=byId.get(src.spielIds[0])?.saison;try{const liga=await fetchPortugalLeague(season);fixtures.push(...liga.decoded.fixtures);endpoints.push(liga.endpoint);schemaBefunde.push({pfad:liga.endpoint.pfad,parameter:liga.endpoint.parameter,bytes:liga.endpoint.bytes,direktAbruf:true,...liga.decoded.diagnosis});}catch(e){schemaBefunde.push({provider:'portugal-direkt',fehler:String(e.message)});}try{const rounds=await fetchPortugalRounds(season);endpoints.push(rounds.endpoint);schemaBefunde.push({provider:'portugal-runden',pfad:rounds.endpoint.pfad,parameter:rounds.endpoint.parameter,bytes:rounds.endpoint.bytes,...rounds.diagnosis});}catch(e){schemaBefunde.push({provider:'portugal-runden',fehler:String(e.message)});}try{for(const round of portugalRoundsFromSource(src)){const selected=await fetchPortugalRound(season,round);fixtures.push(...selected.decoded.fixtures);endpoints.push(selected.endpoint);schemaBefunde.push({provider:'portugal-zielrunde',pfad:selected.endpoint.pfad,parameter:selected.endpoint.parameter,bytes:selected.endpoint.bytes,...selected.decoded.diagnosis});}}catch(e){schemaBefunde.push({provider:'portugal-zielrunde',fehler:String(e.message)});}}
   const clean=dedupe(fixtures);
   report.quellen.push({name:src.name,status:clean.length?'SPIELE_EXTRAHIERT':'KEINE_SPIELE_EXTRAHIERT',anzahl:clean.length,antworten:endpoints,schemaBefunde,seite:page.url()});
   for(const id of src.spielIds){const g=byId.get(id);if(!g){report.befunde.push({spielId:id,status:'SPIEL_FEHLT'});continue;}if(g.status==='beendet')continue;
    report.befunde.push({spielId:id,quelle:src.url,...compare(g,clean,cfg.teamAliase||{})});}
  }catch(e){report.quellen.push({name:src.name,status:'BROWSER_FEHLER',fehler:String(e.message).slice(0,220),antworten:endpoints,schemaBefunde});for(const id of src.spielIds)report.befunde.push({spielId:id,status:'BROWSER_FEHLER'});}
  finally{await context.close();}
 }}finally{await browser.close();}
 report.verifiziert=report.befunde.filter(x=>['IDENTISCH','ABWEICHUNG','PAARUNG_GEFUNDEN_TERMIN_OFFEN'].includes(x.status)).length;
 report.termineOffen=report.befunde.filter(x=>x.status==='PAARUNG_GEFUNDEN_TERMIN_OFFEN').length;
 report.status=report.verifiziert===report.befunde.length&&report.befunde.length>0?'GEPRUEFT':'UNVOLLSTAENDIG';
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'BROWSER_QUELLEN_BERICHT.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(out,'BROWSER_QUELLEN_BERICHT.md'),['# TOSMC offizieller Browser-Quellencheck',`Stand: ${report.zeit}`,`Paarungen geprüft: ${report.verifiziert}/${report.befunde.length}`,`Davon Termin offen: ${report.termineOffen}`,`Status: ${report.status}`,'',...report.quellen.map(x=>`- ${x.name}: ${x.status}; erkannte Spiele: ${x.anzahl||0}; JSON-Antworten: ${x.antworten?.length||0}`),'',...report.befunde.map(x=>`- ${x.spielId}: ${x.status}${x.amtlich?' – '+x.amtlich.datum+' '+x.amtlich.anstoss:''}`),'','Keine Website-Dateien geändert.'].join('\n')+'\n');return report;
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)run().then(x=>{console.log(JSON.stringify({status:x.status,verifiziert:x.verifiziert,quellen:x.quellen},null,2));if(x.status!=='GEPRUEFT')process.exitCode=2;}).catch(e=>{console.error(e);process.exitCode=1;});

