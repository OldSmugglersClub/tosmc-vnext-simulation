// Official-site fixture inspector. Read-only, no OpenLigaDB, no match mutation.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(process.env.TOSMC_ROOT||'.');
const OUT=path.resolve(process.env.TOSMC_OFFICIAL_OUT||'terminwaechter-bericht');
export const DOMAINS={uefa:['uefa.com'],dfb:['dfb.de'],england:['premierleague.com'],italien:['legaseriea.it','inter.it','acmilan.com'],spanien:['laliga.com','rfef.es'],frankreich:['ligue1.com','lfp.fr'],portugal:['ligaportugal.pt'],deutschland:['bundesliga.com','dfb.de']};
const canon=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
const local=iso=>{const dt=new Date(iso);if(!Number.isFinite(dt.getTime()))return null;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(dt).map(p=>[p.type,p.value]));return {datum:`${parts.year}-${parts.month}-${parts.day}`,anstoss:`${parts.hour}:${parts.minute}`};};
const arr=x=>Array.isArray(x)?x:x?[x]:[];
function pageDiagnostic(html,resp){
 const types=[...html.matchAll(/<script\b[^>]*type\s*=\s*["']([^"']+)["']/gi)].reduce((acc,m)=>(acc[m[1].toLowerCase()]=(acc[m[1].toLowerCase()]||0)+1,acc),{});
 return {httpStatus:resp.status,contentType:resp.headers?.get?.('content-type')||null,zeichen:html.length,
   htmlTitel:(html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1]||'').trim().slice(0,180),
   skriptTypen:types,jsonLdBloecke:[...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/gi)].length,
   kennzeichen:{challenge:/captcha|cloudflare|just a moment|access denied|enable javascript/i.test(html.slice(0,10000)),
     javascriptApp:/__NEXT_DATA__|__NUXT__|__INITIAL_STATE__|window\.__data|data-reactroot/i.test(html),
     tabellen:/(<table\b)/i.test(html)}
 };
}

export function parseStructuredFixtures(html){
 const fixtures=[];const blocks=[...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 function scan(node){if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.forEach(scan);const types=arr(node['@type']);if(types.some(x=>['SportsEvent','Event'].includes(x))){const h=node.homeTeam?.name||node.homeTeam,a=node.awayTeam?.name||node.awayTeam;const instant=node.startDate;if(typeof h==='string'&&typeof a==='string'&&typeof instant==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(instant)){const t=local(instant);if(t)fixtures.push({heim:h,gast:a,...t,startDate:instant});}}for(const v of Object.values(node))if(typeof v==='object')scan(v);}
 for(const [,body] of blocks){try{scan(JSON.parse(body));}catch{/* untrusted invalid markup */}}
 return fixtures;
}

// Supplemental official-page adapters. Inspect hydrated JSON only; never infer fixture dates
// from free text, news articles or a pair of unassociated club names.
export function parseEmbeddedFixtures(html){
 const results=[];const jsonScripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 const accept=(home,away,date)=>{
  const h=typeof home==='string'?home:home?.name||home?.shortName||home?.displayName||home?.teamName;
  const a=typeof away==='string'?away:away?.name||away?.shortName||away?.displayName||away?.teamName;
  if(typeof h!=='string'||typeof a!=='string'||!h.trim()||!a.trim()||typeof date!=='string')return;
  // Must carry an explicit timezone; local naive times are unsafe at DST boundaries.
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(date))return;
  const t=local(date);if(t)results.push({heim:h,gast:a,...t,startDate:date});
 };
 let visited=0;
 function walk(node,depth=0){
  if(!node||typeof node!=='object'||depth>24||++visited>150000)return;
  if(Array.isArray(node)){for(const v of node.slice(0,20000))walk(v,depth+1);return;}
  const home=node.homeTeam??node.home_team??node.home??node.teamHome;
  const away=node.awayTeam??node.away_team??node.away??node.teamAway;
  const date=node.startDate??node.kickoffTime??node.kickoff??node.utcDate??node.matchDateTimeUTC??node.dateTime;
  if(home&&away&&date)accept(home,away,date);
  // Explicitly prevent processing arbitrary article/news arrays as match evidence.
  for(const [k,v] of Object.entries(node))if(v&&typeof v==='object'&&!/^(?:news|articles|stories|posts)$/i.test(k))walk(v,depth+1);
 }
 for(const [,attrs,body] of jsonScripts){
  if(!/(?:type\s*=\s*["'](?:application\/json|application\/ld\+json)["']|id\s*=\s*["']__NEXT_DATA__["'])/i.test(attrs))continue;
  if(body.length>3_000_000)continue;
  try{walk(JSON.parse(body));}catch{/*not JSON*/}
 }
 const seen=new Set();return results.filter(x=>{const key=canon(x.heim)+'|'+canon(x.gast)+'|'+x.startDate;if(seen.has(key))return false;seen.add(key);return true;});
}
export async function fetchOfficial(url,fetchFn,options={}){
 const attempts=[];const allowed=options.allowed||[];
 let current=url;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const resp=await fetchFn(current,{headers:{Accept:'text/html,application/xhtml+xml', 'User-Agent':'Mozilla/5.0 (compatible; TOSMC-Fixture-Check/1.0)'},signal:AbortSignal.timeout(18000),redirect:'manual'});
   if([301,302,303,307,308].includes(resp.status)){
    const target=new URL(resp.headers?.get?.('location')||'',current);
    if(target.protocol!=='https:'||!allowed.some(d=>target.hostname===d||target.hostname.endsWith('.'+d)))throw Error('UMLEITUNG_NICHT_FREIGEGEBEN');
    current=target.href;attempts.push({attempt:attempt+1,status:resp.status,redirect:target.origin});continue;
   }
   if(!resp.ok)throw Error('HTTP '+resp.status);
   return {resp,attempts,finalUrl:current};
  }catch(e){attempts.push({attempt:attempt+1,fehler:e.message});if(attempt===2)throw Object.assign(new Error(e.message),{versuche:attempts});}
 }
 throw Object.assign(new Error('ZU_VIELE_UMLEITUNGEN'),{versuche:attempts});
}
export function compare(game,fixtures,aliases={}){
 const names=id=>[id,...arr(aliases[id])].filter(Boolean).map(canon);
 const h=names(game.heimTeamId),a=names(game.auswaertsTeamId);
 const found=fixtures.filter(f=>h.includes(canon(f.heim))&&a.includes(canon(f.gast)));
 if(found.length!==1)return {status:found.length?'MEHRDEUTIG':'KEIN_EINDEUTIGES_SPIEL',count:found.length};
 const x=found[0];return game.datum===x.datum&&game.anstoss===x.anstoss?{status:'IDENTISCH',amtlich:x}:{status:'ABWEICHUNG',bisher:{datum:game.datum,anstoss:game.anstoss},amtlich:x};
}
export async function run({root=ROOT,out=OUT,fetchFn=fetch,configPath=process.env.TOSMC_OFFICIAL_CONFIG||'terminwaechter/offizielle-quellen.json'}={}){
 const conf=JSON.parse(fs.readFileSync(path.resolve(root,configPath),'utf8'));
 const data=JSON.parse(fs.readFileSync(path.join(root,'spieldaten.json'),'utf8'));
 const games=(data.saisons||[]).flatMap(s=>s.spiele||[]);
 if(conf.datenVersionErwartet!==undefined && String(conf.datenVersionErwartet)!==String(data.datenVersion))throw Error('DATENVERSION_ABWEICHEND: Konfiguration muss auf aktuellen Datenstand neu erstellt werden');
 const actualIds=new Set(games.map(g=>g.id));
 const seenIds=new Set();
 for(const source of arr(conf.quellen))for(const id of arr(source.spielIds)){
  if(seenIds.has(id))throw Error('DOPPELTE_SPIELZUORDNUNG: '+id);
  seenIds.add(id);
  if(!actualIds.has(id))throw Error('SPIEL_NICHT_IM_AKTUELLEN_DATENSTAND: '+id);
  const g=games.find(g=>g.id===id);
  if(['bundesliga','champions-league','2-bundesliga'].includes(g.wettbewerb))throw Error('GESCHUETZTER_WETTBEWERB: '+id);
 }
 const report={stand:new Date().toISOString(),datenVersion:data.datenVersion,quellen:[],befunde:[],abdeckung:{konfigurierteSpiele:0,verifizierteSpiele:0,unbekannteSpiele:0,fehlerquellen:0},automatischeAenderung:false};
 const sources=arr(conf.quellen);
 for(const src of sources){
  report.abdeckung.konfigurierteSpiele+=arr(src.spielIds).length;
  if(!arr(src.spielIds).length){report.quellen.push({name:src.name,status:'NOCH_KEINE_TOSMC_EINZELSPIELE',url:src.url});continue;}
  const allowed=DOMAINS[src.verband]||[];
  let url;try{url=new URL(src.url);if(url.protocol!=='https:'||!allowed.some(d=>url.hostname===d||url.hostname.endsWith('.'+d)))throw Error('Domain nicht freigegeben');}catch(e){report.quellen.push({name:src.name,status:'QUELLE_ABGELEHNT',grund:String(e.message)});continue;}
  try{
   const fetched=await fetchOfficial(url.href,fetchFn,{allowed});const resp=fetched.resp;
   const html=await resp.text();if(html.length>4_000_000)throw Error('Antwort zu gross');const diagnose=pageDiagnostic(html,resp);
   const fixtureMap=new Map();for(const x of [...parseStructuredFixtures(html),...parseEmbeddedFixtures(html)])fixtureMap.set(canon(x.heim)+"|"+canon(x.gast)+"|"+x.startDate,x);const fixtures=[...fixtureMap.values()];
   report.quellen.push({name:src.name,url:url.href,status:fixtures.length?'STRUKTURIERTE_SPIELE_GELESEN':'KEINE_STRUKTURIERTEN_SPIELE',anzahl:fixtures.length,diagnose,abrufversuche:fetched.attempts,endUrl:fetched.finalUrl});
   if(!fixtures.length){for(const id of arr(src.spielIds))report.befunde.push({spielId:id,status:'QUELLE_NICHT_AUSWERTBAR',quelle:url.href});continue;}
   for(const id of arr(src.spielIds)){
    const g=games.find(g=>g.id===id);if(!g){report.befunde.push({spielId:id,status:'SPIEL_NICHT_VORHANDEN'});continue;}
    if(g.status==='beendet'||Number.isInteger(g.heimtore)&&Number.isInteger(g.auswaertstore))continue;
    report.befunde.push({spielId:id,wettbewerb:g.wettbewerb,quelle:url.href,...compare(g,fixtures,conf.teamAliase||{})});
   }
  }catch(e){report.quellen.push({name:src.name,url:url.href,status:'ABRUF_FEHLER',grund:String(e.message),fehlerTyp:e?.name||'Error',abrufversuche:e?.versuche||[]});for(const id of arr(src.spielIds))report.befunde.push({spielId:id,status:'ABRUF_FEHLER',quelle:url.href});}
 }
 report.abdeckung.verifizierteSpiele=report.befunde.filter(x=>['IDENTISCH','ABWEICHUNG'].includes(x.status)).length;
 report.abdeckung.unbekannteSpiele=report.befunde.filter(x=>!['IDENTISCH','ABWEICHUNG'].includes(x.status)).length;
 report.abdeckung.fehlerquellen=report.quellen.filter(x=>!['STRUKTURIERTE_SPIELE_GELESEN','NOCH_KEINE_TOSMC_EINZELSPIELE'].includes(x.status)).length;
 const nochOffen=games.filter(g=>['piratenkodex','weihnachtsregatta','europa-league','dfb-pokal'].includes(g.wettbewerb)&&g.status!=='beendet');
 report.abdeckung.offeneRelevanteSpiele=nochOffen.length;
 report.abdeckung.nichtZugeordneteSpiele=nochOffen.filter(g=>!seenIds.has(g.id)).map(g=>g.id);
 report.status=report.abdeckung.unbekannteSpiele||report.abdeckung.fehlerquellen||report.abdeckung.nichtZugeordneteSpiele.length||report.abdeckung.verifizierteSpiele!==nochOffen.length?'UNVOLLSTAENDIG':'GEPRUEFT';
 report.abdeckung.abweichungen=report.befunde.filter(x=>x.status==='ABWEICHUNG').length;
 report.abdeckung.identisch=report.befunde.filter(x=>x.status==='IDENTISCH').length;
 report.abdeckung.ueberwachungsquellenOhneEinzelspiele=report.quellen.filter(x=>x.status==='NOCH_KEINE_TOSMC_EINZELSPIELE').map(x=>x.name);
 report.aenderungsvorschlaege=report.befunde.filter(x=>x.status==='ABWEICHUNG').map(x=>({spielId:x.spielId,wettbewerb:x.wettbewerb,bisher:x.bisher,amtlich:x.amtlich,quelle:x.quelle,status:'NICHT_AUTOMATISCH_UEBERNOMMEN'}));
 report.freigabe='KEINE_AUTOMATISCHE_VEROEFFENTLICHUNG';
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'OFFIZIELLE_QUELLEN_BERICHT.json'),JSON.stringify(report,null,2)+'\n');
 const lines=['# TOSMC täglicher Termincheck','',`Prüfzeit: ${report.stand}`,`Datenversion: ${report.datenVersion}`,`Ergebnis: **${report.status}**`,'',`Eindeutig geprüft: ${report.abdeckung.verifizierteSpiele} / ${report.abdeckung.offeneRelevanteSpiele}`,`Abweichungen: ${report.abdeckung.abweichungen}`,`Nicht verifizierbar: ${report.abdeckung.unbekannteSpiele}`,`Fehlerhafte Quellen: ${report.abdeckung.fehlerquellen}`,'','## Quellstatus'];
 for(const q of report.quellen){lines.push(`- ${q.name}: ${q.status}${q.grund?' – '+q.grund:''}`);if(q.diagnose)lines.push(`  - HTTP ${q.diagnose.httpStatus}, Content-Type: ${q.diagnose.contentType||'unbekannt'}, Titel: ${q.diagnose.htmlTitel||'leer'}, JSON-LD: ${q.diagnose.jsonLdBloecke}, JS-App: ${q.diagnose.kennzeichen.javascriptApp}, Blockierungshinweis: ${q.diagnose.kennzeichen.challenge}`);}
 lines.push('','## Spiele');for(const b of report.befunde)lines.push(`- ${b.spielId}: ${b.status}${b.amtlich?' – amtlich '+b.amtlich.datum+' '+b.amtlich.anstoss:''}`);
 lines.push('','Es wurden keine Website-Dateien, Tipps oder Ergebnisse geändert.');
 fs.writeFileSync(path.join(out,'OFFIZIELLE_QUELLEN_BERICHT.md'),lines.join('\n')+'\n');return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))run().then(r=>{console.log(JSON.stringify({status:r.status,quellen:r.quellen,befunde:r.befunde.length,abdeckung:r.abdeckung},null,2));if(r.status!=='GEPRUEFT')process.exitCode=2;}).catch(e=>{console.error(e);process.exitCode=1});
