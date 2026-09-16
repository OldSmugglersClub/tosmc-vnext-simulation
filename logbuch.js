(() => {
"use strict";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const arr=v=>Array.isArray(v)?v:[];
const norm=v=>String(v??"").trim().toLowerCase();
const keepSpieltag=v=>String(v??"").replace(/(\d+\.)\s+(Spieltag)/gi,"$1\u00a0$2");
const formatThirtySecondsKicker=v=>esc(keepSpieltag(v)).replace(/(\d+\.)/g,'<span class="logbook-30s-round">$1</span>');
let data=null;
let gameById=new Map();
let teamById=new Map();
let spieltagpunkteDoc=null;
let currentPending={active:false};

function shown(entry){return (entry?.highlights||[]).filter(h=>h?.anzeigen===true)}
function highlight(entry,type){return shown(entry).find(h=>h.typ===type)}

function sensationCases(highlightEntry){
 const limit=Number(highlightEntry?.daten?.grenzeProzent ?? 25);
 return arr(highlightEntry?.daten?.faelle).filter(f=>{
   const actual=String(f?.richtigerAusgang||"");
   const most=String(f?.meistGetippt?.ausgang||"");
   const share=Number(f?.richtigeTendenz?.anteil);
   return (actual==="1"||actual==="2")
     && most
     && actual!==most
     && Number.isFinite(share)
     && share<=limit;
 });
}
function validSmelledHighlight(entry){
 const h=highlight(entry,"wer-hats-gerochen");
 return h&&sensationCases(h).length?h:null;
}
function firstTipperName(rows){
 const first=arr(rows).map(x=>x?.teilnehmer).find(Boolean);
 return first?String(first):"";
}

function anyHighlight(entry,type){return arr(entry?.highlights).find(h=>h?.typ===type)}
function totalExact(entry){
 const galley=anyHighlight(entry,"zahlen-aus-der-kombuese")?.daten||{};
 const value=Number(galley.exakt);
 return Number.isFinite(value)&&value>=0?value:null;
}
function startStat(entry,type){
 const h=highlight(entry,type),d=h?.daten||{};
 if(!h)return null;
 if(type==="kapitaene"){
  const value=Number(d.anzahl||arr(d.tipper).length||0);
  return {label:"Kapitäne",value,copy:value===1?"holt die Beute":"teilen die Beute"};
 }
 if(type==="gegen-den-strom"){
  const value=Number(d.richtigeTendenz?.anzahl||0);
  return {label:"Gegen den Strom",value,copy:value===1?"lag richtig":"lagen richtig"};
 }
 if(type==="volltreffer"){
  const value=totalExact(entry);
  if(value===null)return null;
  return {label:"Volltreffer",value,copy:value===1?"exakter Ergebnistipp":"exakte Ergebnistipps"};
 }
 return null;
}
function teamDisplayName(id){
 const key=String(id||"");
 const team=teamById.get(key);
 if(team?.name)return String(team.name);
 return key?key.split("-").map(part=>part?part.charAt(0).toUpperCase()+part.slice(1):part).join(" "):"Team offen";
}
function storyFromEntry(entry){
 const against=highlight(entry,"gegen-den-strom");
 if(against){
  const d=against.daten||{},game=gameById.get(d.spielId)||{};
  const home=teamDisplayName(d.heimTeam||game.heimTeamId),away=teamDisplayName(d.auswaertsTeam||game.auswaertsTeamId);
  const count=Number(d.meistGetippt?.anzahl||0),submitted=Number(d.abgegeben||0),right=Number(d.richtigeTendenz?.anzahl||0),exact=Number(d.exakt||0);
  const relation=submitted>0?`${count} von ${submitted}`:String(count);
  const result=d.ergebnis||((Number.isFinite(game.heimtore)&&Number.isFinite(game.auswaertstore))?`${game.heimtore}:${game.auswaertstore}`:"");
  return {
   kicker:"Überraschung des Spieltags",
   title:`${home} – ${away}${result?` · ${result}`:""}`,
   text:`${relation} setzten auf ${outcomeLabel(d.meistGetippt?.ausgang)}. Nur ${right} tippten ${outcomeLabel(d.richtigerAusgang)} und lagen damit gegen den Strom richtig. ${exact} davon trafen sogar exakt.`
  };
 }
 const smelled=validSmelledHighlight(entry);
 if(smelled){
  const f=sensationCases(smelled)[0],r=f?.richtigeTendenz||{};
  if(f)return {
   title:`Nur ${Number(r.anzahl||0)} Smuggler rochen die Überraschung.`,
   text:`Bei ${f.heimTeam} – ${f.auswaertsTeam} lag die Außenseiterseite mit ${outcomeLabel(f.richtigerAusgang)} richtig.`
  };
 }
 const captains=highlight(entry,"kapitaene");
 if(captains){
  const d=captains.daten||{},count=Number(d.anzahl||arr(d.tipper).length||0);
  return {
   title:count===1?"Ein Kapitän holte die beste Beute.":`${count} Kapitäne teilten die beste Beute.`,
   text:`Die stärkste Spieltagsleistung lag bei ${Number(d.punkte||0)} Punkten.`
  };
 }
 return null;
}
function thirtySecondsCompletedHtml(entry,withPreviousLabel=false){
 if(!entry)return '<div class="logbook-30s-empty">Noch kein abgeschlossener Spieltag für die Kurzfassung vorhanden.</div>';
 const stats=[startStat(entry,"kapitaene"),startStat(entry,"gegen-den-strom"),startStat(entry,"volltreffer")].filter(Boolean);
 const story=storyFromEntry(entry);
 if(!stats.length&&!story)return '<div class="logbook-30s-empty">Für diesen Spieltag liegen noch keine freigegebenen Kurzmeldungen vor.</div>';
 const previous=withPreviousLabel?'<div class="logbook-30s-previous-label"><span class="logbook-kicker">Zuletzt abgeschlossen</span></div>':'';
 return `${previous}<div class="logbook-30s-head"><span class="logbook-kicker">${formatThirtySecondsKicker(entry.bezeichnung||entry.runde||"Letzter Spieltag")}</span></div>${stats.length?`<div class="logbook-30s-stats">${stats.map(stat=>`<article class="logbook-30s-stat"><span>${esc(stat.label)}</span><strong>${Number(stat.value).toLocaleString("de-DE")}</strong><small>${esc(stat.copy)}</small></article>`).join("")}</div>`:""}${story?`<article class="logbook-30s-story"><span>${esc(story.kicker||"Die Geschichte des Spieltags")}</span><strong>${esc(story.title)}</strong><p>${esc(story.text)}</p></article>`:""}`;
}
function renderThirtySeconds(entry,pending){
 const host=$("#logbook-30s"); if(!host) return;
 const completed=thirtySecondsCompletedHtml(entry,Boolean(pending?.active&&entry));
 if(pending?.active){
  host.innerHTML=`<div class="logbook-30s-pending"><span class="logbook-kicker">${esc(pending.kicker)}</span><strong>${esc(keepSpieltag(pending.title))}</strong><p>${esc(pending.text)}</p>${pending.detail?`<small>${esc(pending.detail)}</small>`:""}</div>${completed}`;
  return;
 }
 host.innerHTML=completed;
}

function shortNames(rows,max=8){
 const names=(rows||[]).map(x=>x.teilnehmer).filter(Boolean);
 return names.slice(0,max).map(n=>`<span class="lb-name">${esc(n)}</span>`).join("")+
   (names.length>max?`<span class="lb-name">+${names.length-max} weitere</span>`:"");
}
function outcomeLabel(v){return v==="1"?"Heimsieg":v==="2"?"Auswärtssieg":"Remis"}

function renderHighlight(h,entry){
 const d=h.daten||{};
 if(h.typ==="kapitaene"){
   const count=Number(d.anzahl||0),name=firstTipperName(d.tipper);
   const text=count===1
    ?`${esc(name||"1 Tipper")} holt mit ${Number(d.punkte||0)} Punkten die beste Spieltagsleistung.`
    :`<strong>${count} Tipper</strong> teilen sich mit ${Number(d.punkte||0)} Punkten die beste Spieltagsleistung.`;
   return `<article class="lb-highlight lb-highlight--wide lb-highlight--captains"><h3>Kapitäne des Spieltags</h3><p>${text}</p><div class="lb-names">${shortNames(d.tipper)}</div></article>`;
 }
 if(h.typ==="gegen-den-strom"){
   const home=teamDisplayName(d.heimTeam),away=teamDisplayName(d.auswaertsTeam);
   const right=Number(d.richtigeTendenz?.anzahl||0),majority=Number(d.meistGetippt?.anzahl||0),exact=Number(d.exakt||0);
   const result=d.ergebnis?` · ${esc(d.ergebnis)}`:"";
   const names=shortNames(d.richtigeTendenz?.tipper);
   return `<article class="lb-highlight lb-highlight--hero"><h3>Gegen den Strom</h3><p><strong>${esc(home)} – ${esc(away)}${result}</strong><br><strong>${right} ${right===1?"Smuggler":"Smuggler"}</strong> ${right===1?"tippte":"tippten"} gegen die größte Tippgruppe und ${right===1?"lag":"lagen"} richtig. ${majority} setzten auf ${esc(outcomeLabel(d.meistGetippt?.ausgang))}. ${exact} ${exact===1?"Tipp traf":"Tipps trafen"} das Ergebnis exakt.</p>${names?`<div class="lb-names">${names}</div>`:""}<div class="lb-scoreline"><div><strong>${Number(d.tippverteilung?.["1"]||0)}</strong><span>Heimsieg</span></div><div><strong>${Number(d.tippverteilung?.X||0)}</strong><span>Remis</span></div><div><strong>${Number(d.tippverteilung?.["2"]||0)}</strong><span>Auswärtssieg</span></div></div></article>`;
 }
 if(h.typ==="wer-hats-gerochen"){
   const cases=sensationCases(h);
   if(!cases.length)return "";
   return `<article class="lb-highlight lb-highlight--wide lb-highlight--smelled"><h3>Wer hat’s gerochen?</h3>${cases.map((f,caseIndex)=>{
     const r=f.richtigeTendenz||{};
     const sorted=arr(r.tipper).map((x,idx)=>({x,idx})).sort((a,b)=>(Number(Boolean(b.x?.exakt))-Number(Boolean(a.x?.exakt)))||(a.idx-b.idx)).map(row=>row.x);
     const shownTipper=sorted.slice(0,5),rest=Math.max(0,sorted.length-shownTipper.length);
     const rows=shownTipper.map(x=>`
       <tr>
         <td class="lb-smelled-name">${esc(x.teilnehmer)}</td>
         <td class="lb-smelled-tip">${esc(x.tipp)}</td>
         <td class="lb-smelled-hit"><span class="lb-hit-badge ${x.exakt?"is-exact":"is-tendency"}"><span class="lb-hit-label lb-hit-label--desktop">${x.exakt?"Sensation exakt":"Tendenz richtig"}</span><span class="lb-hit-label lb-hit-label--mobile">${x.exakt?"Exakt":"Tendenz"}</span></span></td>
       </tr>`).join("");
     const more=rest?`<div class="lb-smelled-more">+${rest} ${rest===1?"weiterer Tipper":"weitere Tipper"}</div>`:"";
     return `<section class="lb-sensation-case">
       ${cases.length>1?`<div class="lb-sensation-number">Überraschung ${caseIndex+1}</div>`:""}
       <p><strong>${esc(f.heimTeam)} – ${esc(f.auswaertsTeam)} · ${esc(f.ergebnis||"")}</strong><br>Nur <strong>${Number(r.anzahl||0)} von ${Number(f.abgegeben||0)} Tippern</strong> (${Number(r.anteil||0).toLocaleString("de-DE",{maximumFractionDigits:1})} %) hatten den ${esc(outcomeLabel(f.richtigerAusgang))} auf dem Zettel. Die Mehrheit tippte auf ${esc(outcomeLabel(f.meistGetippt?.ausgang))}.</p>
       <div class="lb-smelled-table-wrap">
         <table class="lb-smelled-table">
           <thead><tr><th>Tipper</th><th>Tipp</th><th>Wertung</th></tr></thead>
           <tbody>${rows}</tbody>
         </table>
         ${more}
       </div>
     </section>`;
   }).join("")}</article>`;
 }
 if(h.typ==="volltreffer"){
   const total=totalExact(entry),best=Number(d.maxExakt||0),leaders=Number(d.anzahl||arr(d.tipper).length||0);
   const totalText=total===null?"Die Gesamtzahl der exakten Ergebnistipps ist für diesen Eintrag nicht belastbar hinterlegt.":`Insgesamt gab es <strong>${total} ${total===1?"exakten Ergebnistipp":"exakte Ergebnistipps"}</strong>.`;
   const leaderText=leaders===1?`${esc(firstTipperName(d.tipper)||"Ein Tipper")} sammelte mit <strong>${best}</strong> die meisten Volltreffer.`:`<strong>${leaders} Tipper</strong> teilten sich mit je <strong>${best}</strong> die meisten Volltreffer.`;
   return `<article class="lb-highlight lb-highlight--volltreffer"><h3>Treffsicherster Smuggler</h3><p>${totalText} ${leaderText}</p><div class="lb-names">${shortNames(d.tipper)}</div></article>`;
 }
 if(h.typ==="crewduell"){
   const teams=d.teams||[]; const a=teams[0],b=teams[1];
   return `<article class="lb-highlight lb-highlight--crew">
     <div class="lb-crew-head">
       <h3>Crewduell</h3>
       <p>${d.sieger?`<strong>${esc(d.sieger)}</strong> gewinnt das Crewduell.`:"Das Crewduell endet unentschieden."}</p>
     </div>
     <div class="lb-crew-visual" aria-hidden="true"></div>
     ${a&&b?`<div class="lb-crew-scorebar">
       <div class="lb-crew-side lb-crew-side--left">
         <span>${esc(a.team)}</span>
         <strong>${Number(a.durchschnitt||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
       </div>
       <div class="lb-crew-vs">vs.</div>
       <div class="lb-crew-side lb-crew-side--right">
         <strong>${Number(b.durchschnitt||0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
         <span>${esc(b.team)}</span>
       </div>
     </div>
     <div class="lb-crew-scorelabel">Durchschnittspunkte</div>`:""}
     
   </article>`;
 }
 if(h.typ==="kursbewegung"){
   const movementSide=(title,rows,direction)=>{
     const people=arr(rows).slice(0,5);
     const symbol=direction==="up"?"▲":"▼";
     const sign=direction==="up"?"+":"−";
     const names=people.map(row=>{
       const value=Math.abs(Number(row?.veraenderung||0));
       return `<span class="lb-name lb-name--movement is-${direction}"><span>${esc(row?.teilnehmer||"")}</span><strong>${symbol} ${sign}${value} Plätze</strong></span>`;
     }).join("");
     return `<div class="lb-movement-side is-${direction}"><h4>${title}</h4><div class="lb-names lb-movement-names">${names}</div></div>`;
   };
   return `<article class="lb-highlight lb-highlight--movement"><h3>Kursbewegung</h3><div class="lb-movement-grid">${movementSide("Größter Sprung",d.gewinner,"up")}${movementSide("Größter Verlust",d.verlierer,"down")}</div></article>`;
 }
 if(h.typ==="zahlen-aus-der-kombuese") return `<article class="lb-highlight lb-highlight--wide lb-highlight--galley"><h3>Zahlen aus der Kombüse</h3><div class="lb-galley-grid"><div><strong>${Number(d.abgegeben||0)}</strong><span>Abgaben</span></div><div><strong>${Number(d.nichtAbgegeben||0)}</strong><span>Nichtabgaben</span></div><div><strong>${Number(d.exakt||0)}</strong><span>Exakt</span></div><div><strong>${Number(d.differenz||0)}</strong><span>Differenz</span></div><div><strong>${Number(d.tendenz||0)}</strong><span>Tendenz</span></div></div></article>`;
 return "";
}


function cocoLogbookCard(entry){
 const ids=arr(entry?.spielIds).filter(Boolean);
 if(!ids.length||!window.CocoOracle)return "";
 const games=ids.map(id=>gameById.get(id)).filter(Boolean).filter(g=>Number.isFinite(g?.heimtore)&&Number.isFinite(g?.auswaertstore));
 if(!games.length)return "";
 let tendency=0,exact=0;
 for(const g of games){
   const ev=window.CocoOracle.evaluate(window.CocoOracle.predict(g.id),g.heimtore,g.auswaertstore);
   if(ev.tendencyHit)tendency+=1;
   if(ev.exact)exact+=1;
 }
 const quote=(tendency/games.length*100).toFixed(1).replace(".",",");
 return `<article class="lb-highlight lb-highlight--coco"><h3>Cocos Seemannsgarn</h3><p>So schlug sich das Orakel in diesem abgeschlossenen Wertungsblock.</p><div class="lb-scoreline"><div><strong>${tendency}/${games.length}</strong><span>Tendenztreffer</span></div><div><strong>${exact}</strong><span>Volltreffer</span></div><div><strong>${quote} %</strong><span>Trefferquote</span></div></div></article>`;
}
function renderHighlightsWithCoco(entry){
 const rows=[];
 let inserted=false;
 for(const h of shown(entry)){
   const rendered=renderHighlight(h,entry);
   if(rendered)rows.push(rendered);

   if(h?.typ==="crewduell"){
     const form=formCrewCard(entry);
     if(form)rows.push(form);
   }

   if(h?.typ==="volltreffer"){
     const coco=cocoLogbookCard(entry);
     if(coco){rows.push(coco);inserted=true;}
   }
 }
 if(!inserted){
   const coco=cocoLogbookCard(entry);
   if(coco)rows.push(coco);
 }
 return rows.join("");
}


function formCrewCard(entry){
 const matchdays=arr(spieltagpunkteDoc?.spieltage).filter(md=>md?.abgeschlossen!==false);
 const index=matchdays.findIndex(md=>md?.id===entry?.id);
 if(index<=0)return "";

 const current=matchdays[index];
 const previous=matchdays[index-1];
 const prevById=new Map(arr(previous?.rangliste).map(row=>[row?.teilnehmerId,row]));

 const rows=[];
 arr(current?.rangliste).forEach((row,currentOrder)=>{
   const prev=prevById.get(row?.teilnehmerId);
   if(!prev)return;
   const before=Number(prev?.gesamtspieltagssiege);
   const now=Number(row?.gesamtspieltagssiege);
   if(!Number.isFinite(before)||!Number.isFinite(now))return;
   rows.push({
     order:currentOrder,
     name:row?.teilnehmer||row?.teilnehmerId||"",
     before,
     now,
     delta:Number((now-before).toFixed(4))
   });
 });

 // Bei gleichem Delta bleibt die vorhandene Kicktipp-Reihenfolge maßgeblich.
 rows.sort((a,b)=>b.delta-a.delta||a.order-b.order);
 const top=rows.slice(0,5);
 if(!top.length)return "";

 const fmt=value=>Math.abs(value).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:4});
 const body=top.map((row,i)=>{
   const cls=row.delta>0?"is-up":row.delta<0?"is-down":"is-flat";
   const symbol=row.delta>0?"▲":row.delta<0?"▼":"±";
   const value=row.delta===0?" 0,00":` ${row.delta>0?"+":"−"}${fmt(row.delta)}`;
   return `<div class="lb-form-row">
     <span class="lb-form-rank">${i+1}.</span>
     <strong>${esc(row.name)}</strong>
     <span class="lb-form-course ${cls}">${symbol}${value}</span>
   </div>`;
 }).join("");

 return `<article class="lb-highlight lb-highlight--form">
   <h3>Form der Crew</h3>
   <p>Wer bekam beim letzten Wertungsblock den meisten Wind in die Segel?</p>
   <div class="lb-form-list">${body}</div>
   
 </article>`;
}

function renderEntry(entry,pending){
 const host=$("#lb-current"); if(!host) return;
 const pendingHtml=pending?.active?`<section class="lb-entry lb-entry--pending"><header class="lb-entry-head"><span>${esc(pending.kicker)}</span><h2>${esc(keepSpieltag(pending.title))}</h2></header><div class="lb-pending-copy"><p>${esc(pending.text)}</p>${pending.detail?`<strong>${esc(pending.detail)}</strong>`:""}<small>Abgeschlossene Spieltage bleiben weiterhin vollständig abrufbar.</small></div></section>`:"";
 if(!entry){
  host.innerHTML=pendingHtml||'<div class="lb-status">Noch kein abgeschlossenes Logbuch vorhanden.</div>';
  if(pending?.active)document.title="Auswertung läuft | The Old Smugglers Club";
  return;
 }
 const completedHtml=`<section class="lb-entry"><header class="lb-entry-head"><span>${pending?.active?"Zuletzt abgeschlossen · ":""}${esc(entry.wettbewerb||"Spieltag")}</span><h2>${esc(keepSpieltag(entry.bezeichnung||entry.runde||"Logbuch"))}</h2></header><div class="lb-highlight-grid">${renderHighlightsWithCoco(entry)}</div></section>`;
 host.innerHTML=`${pendingHtml}${completedHtml}`;
 document.title=pending?.active?"Auswertung läuft | The Old Smugglers Club":`${entry.bezeichnung||"Logbuch"} | The Old Smugglers Club`;
}
function archive(){
 const host=$("#lb-archive-list"); if(!host) return;
 const source=[...(data?.logbuecher||[])];
 if(!source.length){host.innerHTML='<div class="lb-archive-empty">Noch keine früheren Einträge vorhanden.</div>';return;}

 const competitionKey=e=>String(e?.wettbewerb||e?.typ||"tippspieltag");
 const competitionOrder=[];
 const grouped=new Map();
 source.forEach(entry=>{
   const key=competitionKey(entry);
   if(!grouped.has(key)){grouped.set(key,[]);competitionOrder.push(key);}
   grouped.get(key).push(entry);
 });

 const latest=source.at(-1);
 const initialCompetition=competitionKey(latest);
 host.innerHTML=`
   <div class="lb-archive-field">
     <label for="lb-archive-competition">Wettbewerb</label>
     <select id="lb-archive-competition"></select>
   </div>
   <div class="lb-archive-field">
     <label for="lb-archive-entry">Spieltag / Runde</label>
     <select id="lb-archive-entry"></select>
   </div>`;

 const competitionSelect=$("#lb-archive-competition");
 const entrySelect=$("#lb-archive-entry");
 competitionSelect.innerHTML=competitionOrder.map(key=>`<option value="${esc(key)}">${esc(labelType(key))}</option>`).join("");

 function entryLabel(entry){
   const round=String(entry?.runde||"").trim();
   if(round)return keepSpieltag(round);
   const title=String(entry?.bezeichnung||"").trim();
   if(title){
     const competition=labelType(entry?.wettbewerb||entry?.typ||"");
     const stripped=title.replace(new RegExp(`^${competition.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*`,"i"),"").trim();
     return keepSpieltag(stripped||title);
   }
   return "Logbucheintrag";
 }
 function fillEntries(key,preferredId){
   const entries=[...(grouped.get(key)||[])].reverse();
   entrySelect.innerHTML=entries.map(entry=>`<option value="${esc(entry.id)}">${esc(entryLabel(entry))}</option>`).join("");
   const selected=entries.find(entry=>entry.id===preferredId)||entries[0];
   if(selected){entrySelect.value=selected.id;renderEntry(selected,currentPending);}
 }

 competitionSelect.value=initialCompetition;
 fillEntries(initialCompetition,latest?.id);
 competitionSelect.addEventListener("change",()=>fillEntries(competitionSelect.value,null));
 entrySelect.addEventListener("change",()=>{
   const entry=source.find(x=>x.id===entrySelect.value);
   if(entry)renderEntry(entry,currentPending);
 });
}

async function fetchJson(path){
 try{const r=await fetch(path,{cache:"no-store"});if(!r.ok)return null;return await r.json()}catch(_){return null}
}
function flattenGames(doc){return arr(doc?.saisons).flatMap(s=>arr(s.spiele)).concat(arr(doc?.spiele))}
function activeMatchdays(doc){
 const seasons=arr(doc?.saisons);const active=seasons.find(s=>s?.aktiv===true)||seasons.find(s=>s?.id===doc?.aktiveSaison)||seasons[0];
 return arr(active?.tippspieltage).filter(md=>md?.aktiv!==false);
}
function gameStart(game){
 if(!game?.terminBestaetigt||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(game.datum||""))||!/^[0-9]{2}:[0-9]{2}$/.test(String(game.anstoss||"")))return null;
 if(new Set(["verlegt","abgesagt","ausgefallen","termin-offen","offen"]).has(norm(game.status)))return null;
 const [y,m,d]=game.datum.split("-").map(Number),[hh,mm]=game.anstoss.split(":").map(Number);const dt=new Date(y,m-1,d,hh,mm,0,0);
 return Number.isNaN(dt.getTime())?null:dt;
}
function resolveGames(md,games){
 const byId=new Map(games.map(g=>[g.id,g]));
 if(arr(md?.spielIds).length)return md.spielIds.map(id=>byId.get(id)).filter(Boolean);
 const sel=md?.spielAuswahl||{};
 return games.filter(g=>{
  if(sel.wettbewerb&&g.wettbewerb!==sel.wettbewerb)return false;
  if(sel.spieltagNummer!=null&&Number(g.spieltagNummer)!==Number(sel.spieltagNummer))return false;
  if(sel.runde&&norm(g.runde)!==norm(sel.runde))return false;
  if(sel.teamId&&g.heimTeamId!==sel.teamId&&g.auswaertsTeamId!==sel.teamId)return false;
  return Boolean(sel.wettbewerb||sel.spieltagNummer!=null||sel.runde||sel.teamId);
 });
}
function logCoversGames(logs,games){
 const ids=games.map(g=>g?.id).filter(Boolean);if(!ids.length)return false;
 return logs.some(log=>{const set=new Set(arr(log?.spielIds));return ids.every(id=>set.has(id))});
}
function labelType(v){
 const n=norm(v);
 if(n==="bundesliga")return "Bundesliga";
 if(n==="champions-league")return "Champions League";
 if(n==="europa-league")return "Europa League";
 if(n==="dfb-pokal")return "DFB-Pokal";
 if(n==="smugglerauftrag"||n==="smugglerauftraege")return "Smugglerauftrag";
 if(n==="piratenkodex")return "Piratenkodex";
 if(n==="relegation")return "Relegation";
 return String(v||"Tippspieltag");
}
function descriptor(md,games){
 const starts=games.map(gameStart).filter(Boolean).sort((a,b)=>a-b);
 return {md,games,start:starts[0]||null,label:md?.name||`${labelType(md?.typ)} ${md?.nummer||""}`.trim()};
}
function pendingFromSchedule(logs,matchdayDoc,gameDoc,now){
 const games=flattenGames(gameDoc);if(!games.length)return [];
 return activeMatchdays(matchdayDoc).map(md=>descriptor(md,resolveGames(md,games))).filter(x=>x.start&&x.start<=now&&!logCoversGames(logs,x.games)).sort((a,b)=>a.start-b.start);
}
function explicitRunning(view){
 const b=view?.anzeige?.laufenderWertungsblock;
 if(!b||b.aktiv!==true)return null;
 const label=[labelType(b.wertung),b.runde].filter(Boolean).join(" · ");
 const ended=Number(b.beendet),total=Number(b.gesamt);
 return {label:label||"Aktueller Tippspieltag",detail:Number.isFinite(ended)&&Number.isFinite(total)&&total>0?`${ended} von ${total} Spielen abgeschlossen`:""};
}
function buildPending(view,matchdayDoc,gameDoc,logs){
 const explicit=explicitRunning(view);
 const now=new Date();
 const scheduled=pendingFromSchedule(logs,matchdayDoc,gameDoc,now);
 const names=[];
 if(explicit?.label)names.push(explicit.label);
 scheduled.forEach(x=>{if(!names.some(n=>norm(n)===norm(x.label)))names.push(x.label)});
 if(!names.length)return {active:false};
 const title="Die Beute wird noch gezählt";
 const text=names.length>1
  ?"Mehrere Tippspieltage haben bereits begonnen. Neue Rückblicke erscheinen erst, wenn die jeweiligen Wertungsblöcke vollständig ausgewertet sind."
  :"Der aktuelle Tippspieltag hat bereits begonnen. Sein Rückblick erscheint erst, wenn der Wertungsblock vollständig ausgewertet ist.";
 const detail=explicit?.detail||(names.length?names.join(" · "):"");
 return {active:true,kicker:"Neuer Wertungsblock läuft",title,text,detail};
}

async function init(){
 try{
   const [logDoc,view,matchdays,games,spieltagpunkte,teams]=await Promise.all([
     fetchJson("./spieltag-logbuch.json"),fetchJson("./website-view.json"),fetchJson("./tippspieltage.json"),fetchJson("./spieldaten.json"),fetchJson("./spieltagpunkte.json"),fetchJson("./teams.json")
   ]);
   if(!logDoc)throw Error("spieltag-logbuch.json nicht erreichbar");
   data=logDoc; spieltagpunkteDoc=spieltagpunkte; gameById=new Map(flattenGames(games).map(g=>[g.id,g])); teamById=new Map(arr(teams?.teams).map(t=>[String(t?.id||""),t])); const latest=(data.logbuecher||[]).at(-1)||null;
   const pending=buildPending(view,matchdays,games,arr(data.logbuecher)); currentPending=pending;
   renderThirtySeconds(latest,pending); renderEntry(latest,pending); archive();
   const st=$("#lb-status"); if(st) st.remove();
 }catch(e){
   const st=$("#lb-status"); if(st) st.textContent="Das Spieltags-Logbuch konnte nicht geladen werden.";
 }
}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init,{once:true}):init();
})();
