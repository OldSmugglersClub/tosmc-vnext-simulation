#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const command = args.shift() || "check";
const value = name => { const i=args.indexOf(name); return i>=0 ? args[i+1] : null; };
const root = path.resolve(value("--root") || ".");
const kind = value("--kind") || "auto";
const output = value("--output");
const fail = [];
const ok = [];
const invalidJson = new Set();
const sha = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const exists = file => fs.existsSync(path.join(root,file));
const parseJson = text => JSON.parse(String(text).replace(/^\uFEFF/,""));
const json = file => parseJson(read(file));
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const ignore = rel => /(^|\/)(\.git|backup|backups|Sicherung|releases|previews)(\/|$)/.test(rel) || /(^|\/)SHA256[^/]*\.(txt|json)$/.test(rel);

function walk(dir, base=dir, out=[]) {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const abs=path.join(dir,ent.name), rel=path.relative(base,abs).replaceAll("\\","/");
    if (ignore(rel)) continue;
    if (ent.isDirectory()) walk(abs,base,out); else if (ent.isFile()) out.push(rel);
  }
  return out.sort();
}
function snapshot(dir=root) {
  return Object.fromEntries(walk(dir).map(rel=>[rel,sha(path.join(dir,rel))]));
}
function checkJsonFiles() {
  for (const rel of walk(root).filter(x=>x.endsWith(".json"))) {
    try { parseJson(fs.readFileSync(path.join(root,rel),"utf8")); }
    catch(e) { invalidJson.add(rel); fail.push(`${rel}: ungültiges JSON (${e.message})`); }
  }
  if (!fail.some(x=>x.includes("ungültiges JSON"))) ok.push("Alle aktiven JSON-Dateien sind syntaktisch gültig.");
}
function rowsById(rows) { return new Map((Array.isArray(rows)?rows:[]).map(x=>[String(x?.participantId||x?.teilnehmerId||x?.id||""),x])); }
function canonicalRank(row) { return [Number(row?.rank??row?.platz),Number(row?.totalPoints??row?.punkte),Number(row?.bonusPoints??row?.bonuspunkte),Number(row?.matchdayWins??row?.spieltagssiege)]; }
function checkRankingMirror(doc,label) {
  const a=doc?.individual?.overall, b=doc?.overall?.individual;
  if (!Array.isArray(a)||!Array.isArray(b)) return;
  const bm=rowsById(b);
  const issues=a.filter(x=>!bm.has(String(x.participantId))||!same(canonicalRank(x),canonicalRank(bm.get(String(x.participantId)))));
  if (a.length!==b.length||issues.length) fail.push(`${label}: Gesamtwertungs-Spiegel widersprüchlich (${issues.length} abweichend, ${a.length}/${b.length} Zeilen).`);
  else ok.push(`${label}: Gesamtwertungs-Spiegel konsistent (${a.length} Teilnehmer).`);
  const seen=new Set(), dup=[];
  for(const row of a){const id=String(row?.participantId||""); if(!id||seen.has(id))dup.push(id||"<leer>"); seen.add(id);}
  if(dup.length)fail.push(`${label}: doppelte/leere Teilnehmer-IDs (${[...new Set(dup)].join(", ")}).`);
}
function flattenGames(doc){return (Array.isArray(doc?.saisons)?doc.saisons.flatMap(s=>s?.spiele||[]):Object.values(doc?.saisons||{}).flatMap(s=>s?.spiele||[])).concat(doc?.spiele||[]);}
function checkWebsite(){
  const version=read("VERSION.txt").trim();
  if(!version)fail.push("VERSION.txt ist leer."); else ok.push(`Website-Version: ${version}`);
  const pages=["bundesliga.html","champions-league.html","dfb-pokal.html","dynamo-dresden.html","europa-league.html","piratenkodex.html","relegation.html","weihnachtsregatta.html"];
  for(const asset of ["wettbewerb.js","wettbewerb.css"]){
    const refs=new Map();
    for(const page of pages){const m=read(page).match(new RegExp(`${asset.replace(".","\\.")}\\?v=([^\"']+)`)); const v=m?.[1]||"<fehlt>"; if(!refs.has(v))refs.set(v,[]); refs.get(v).push(page);}
    if(refs.size!==1)fail.push(`${asset}: abweichende Cache-Kennungen: ${[...refs].map(([v,p])=>`${v} (${p.join(",")})`).join("; ")}`);
    else ok.push(`${asset}: gemeinsame Cache-Kennung ${[...refs.keys()][0]}.`);
  }
  if(exists("highscore.json")&&!invalidJson.has("highscore.json"))checkRankingMirror(json("highscore.json"),"highscore.json");
  if(exists("website-view.json")&&!invalidJson.has("website-view.json")){
    const view=json("website-view.json");
    if(view?.highscore)checkRankingMirror(view.highscore,"website-view.json/highscore");
  }
  if(exists("spieldaten.json")&&!invalidJson.has("spieldaten.json")&&exists("assets/team-logos/original-team-logos.json")&&!invalidJson.has("assets/team-logos/original-team-logos.json")){
    const games=flattenGames(json("spieldaten.json")), reg=json("assets/team-logos/original-team-logos.json");
    const entries=reg.teams||reg; const map=new Map((Array.isArray(entries)?entries:Object.entries(entries).map(([id,v])=>({id,...v}))).map(x=>[String(x.id||x.teamId),x]));
    const ids=[...new Set(games.flatMap(g=>[g?.heimTeamId,g?.auswaertsTeamId]).filter(Boolean).map(String))];
    const missing=ids.filter(id=>{const e=map.get(id); const f=e&&(e.file||e.path||e.logo); return !e||e.original===false||!f||!fs.existsSync(path.join(root,f.replace(/^\.\//,"")));});
    if(missing.length)fail.push(`Originalwappen fehlen/ungültig: ${missing.join(", ")}`); else ok.push(`Originalwappen: ${ids.length}/${ids.length} verwendete Teams abgesichert.`);
    if(exists("teams.json")&&!invalidJson.has("teams.json")){
      const teams=json("teams.json")?.teams||[];
      const teamsById=new Map(teams.map(team=>[String(team?.id||""),team]));
      const wrong=[];
      for(const id of ids){
        const team=teamsById.get(id), registered=map.get(id), originalPath=registered&&(registered.path||registered.file||registered.logo);
        if(!team||!String(team.name||"").trim()||team.name==="Team offen"||!originalPath||team.logo!==originalPath)wrong.push(id);
      }
      if(wrong.length)fail.push(`Teamstammdaten verwenden nicht durchgehend offizielle Namen/Originalwappen: ${wrong.join(", ")}`);
      else ok.push(`Teamstammdaten: ${ids.length}/${ids.length} verwendete Teams kanonisch.`);
    }
    if(exists("schedule-data-adapter.js")){
      const adapter=read("schedule-data-adapter.js");
      if(!adapter.includes('fetchJson("./teams.json")')||!adapter.includes("teams: { teams: canonicalTeams }"))fail.push("Startseitenadapter verwendet nicht den kanonischen Teamstammdatenbestand.");
      else ok.push("Startseitenadapter verwendet den kanonischen Teamstammdatenbestand.");
    }
  }
}
function activeAdminVersion(){
  const html=read("admin.html");
  return html.match(/Version\s+([^<]+)/)?.[1]?.trim()||"";
}
function checkAdmin(){
  const active=activeAdminVersion(), files=["VERSION.txt","ADMIN_VERSION.txt"].filter(exists);
  if(!active)fail.push("Aktive Adminversion in admin.html nicht ermittelbar.");
  for(const f of files){const v=read(f).trim(); if(v!==active)fail.push(`${f}=${v}, aktive Oberfläche=${active}.`);}
  if(active&&files.every(f=>read(f).trim()===active))ok.push(`Admin-Version konsistent: ${active}.`);
  if(exists("highscore.json")&&!invalidJson.has("highscore.json"))checkRankingMirror(json("highscore.json"),"highscore.json");
  const src=exists("spieltag-aktualisieren.js")?read("spieltag-aktualisieren.js"):"";
  for(const required of ["assertOfficialOverallIntegrity","assertLogbookHistoryPreserved","assertMonotonicOutputVersions","SHA256-WEBSITE-DATEN.txt","PRUEFPROTOKOLL.json"]){
    if(!src.includes(required))fail.push(`Admin-Schutzfunktion fehlt: ${required}`);
  }
  if(!fail.some(x=>x.startsWith("Admin-Schutzfunktion")))ok.push("Bestehende Abschluss-, Historien-, Versions- und Prüfsummensperren vorhanden.");
}
function runCheck(){
  checkJsonFiles();
  const detected=kind==="auto"?(exists("spieltag-aktualisieren.js")?"admin":"website"):kind;
  if(detected==="admin")checkAdmin(); else checkWebsite();
  const report={schemaVersion:1,tool:"TOSMC Release Guard",createdAt:new Date().toISOString(),root,kind:detected,status:fail.length?"BLOCKED":"OK",checks:ok,errors:fail};
  if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify(report,null,2));
  if(fail.length)process.exitCode=1;
}
function compare(){
  const before=path.resolve(value("--before")||""); const after=path.resolve(value("--after")||""); const planFile=value("--plan");
  if(!before||!after||!planFile)throw new Error("compare benötigt --before, --after und --plan.");
  const plan=JSON.parse(fs.readFileSync(planFile,"utf8"));
  const a=snapshot(before), b=snapshot(after), names=[...new Set([...Object.keys(a),...Object.keys(b)])].sort();
  const changes=names.filter(n=>a[n]!==b[n]).map(n=>({path:n,type:!a[n]?"new":!b[n]?"deleted":"changed",before:a[n]||null,after:b[n]||null}));
  const allowed=plan.allowedPaths||[]; const permits=p=>allowed.some(rule=>rule.endsWith("/**")?p.startsWith(rule.slice(0,-3)):p===rule);
  const unauthorized=changes.filter(x=>!permits(x.path));
  const protectedChanges=changes.filter(x=>(plan.protectedPaths||[]).some(rule=>rule.endsWith("/**")?x.path.startsWith(rule.slice(0,-3)):x.path===rule));
  const protectedAllowed=new Set(plan.explicitlyApprovedProtectedPaths||[]); const blockedProtected=protectedChanges.filter(x=>!protectedAllowed.has(x.path));
  const report={schemaVersion:1,tool:"TOSMC Release Guard",createdAt:new Date().toISOString(),changeType:plan.changeType||"unspecified",status:unauthorized.length||blockedProtected.length?"BLOCKED":"OK",changes,unauthorizedChanges:unauthorized,unapprovedProtectedChanges:blockedProtected,plan};
  const dest=path.resolve(output||"TOSMC-AENDERUNGSNACHWEIS.json"); fs.writeFileSync(dest,JSON.stringify(report,null,2)+"\n"); console.log(JSON.stringify(report,null,2));
  if(report.status!=="OK")process.exitCode=1;
}

if(command==="snapshot"){
  const dest=path.resolve(output||"TOSMC-REFERENZMANIFEST.json");
  fs.writeFileSync(dest,JSON.stringify({schemaVersion:1,tool:"TOSMC Release Guard",createdAt:new Date().toISOString(),root,kind,version:exists("VERSION.txt")?read("VERSION.txt").trim():activeAdminVersion(),files:snapshot()},null,2)+"\n");
  console.log(dest);
} else if(command==="compare") compare(); else runCheck();
