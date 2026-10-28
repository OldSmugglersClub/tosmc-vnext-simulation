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
let tippsDoc=null;
let ranglistenverlaufDoc=null;
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
// Startseite: alle abgeschlossenen Wettbewerbsrueckblicke des juengsten Spielwochenendes.
// Datum kommt ausschliesslich von den zugeordneten Spielen, niemals vom Upload-Zeitpunkt.
function weekendFriday(dateStr){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr||"")))return null;
 const date=new Date(`${dateStr}T12:00:00Z`);
 if(!Number.isFinite(date.getTime()))return null;
 const day=date.getUTCDay();
 if(day!==5&&day!==6&&day!==0)return null;
 date.setUTCDate(date.getUTCDate()-(day===0?2:day-5));
 return date.toISOString().slice(0,10);
}
function eventWeekend(entry){
 const days=arr(entry?.spielIds).map(id=>gameById.get(id)).filter(Boolean)
  .map(g=>String(g.datum||g.datumVon||"").slice(0,10));
 const weekends=days.map(weekendFriday).filter(Boolean).sort();
 return weekends.at(-1)||null;
}
function weekendCardsHtml(entries){
 const completed=arr(entries).filter(e=>e?.abgeschlossen===true).map(e=>({entry:e,weekend:eventWeekend(e)})).filter(x=>x.weekend);
 if(!completed.length)return null;
 const lastWeekend=completed.reduce((max,x)=>x.weekend>max?x.weekend:max,"");
 const chosen=completed.filter(x=>x.weekend===lastWeekend);
 const uniq=[...new Map(chosen.map(x=>[x.entry.id,x.entry])).values()];
 uniq.sort((a,b)=>String(a.wettbewerb).localeCompare(String(b.wettbewerb),'de')||String(a.runde).localeCompare(String(b.runde),'de'));
 const toDay=iso=>`${iso.slice(8,10)}.${iso.slice(5,7)}.${iso.slice(0,4)}`;
 const start=new Date(`${lastWeekend}T12:00:00Z`),finish=new Date(start);finish.setUTCDate(finish.getUTCDate()+2);
 const title=`Wochenend-Rückblick · ${toDay(lastWeekend)}–${toDay(finish.toISOString().slice(0,10))}`;
 const cards=uniq.map(entry=>{
  const story=storyFromEntry(entry);
  const stats=[startStat(entry,"kapitaene"),startStat(entry,"gegen-den-strom"),startStat(entry,"volltreffer")].filter(Boolean);
  const against=highlight(entry,"gegen-den-strom");
  const captains=highlight(entry,"kapitaene");
  const link=`./logbuch.html?logbuchId=${encodeURIComponent(entry.id)}`;
  let hero="",headline="",detail="",theme="captains";
  if(against){
   const d=against.daten||{},game=gameById.get(d.spielId)||{};
   const goals=String(d.ergebnis||((Number.isFinite(game.heimtore)&&Number.isFinite(game.auswaertstore))?`${game.heimtore}:${game.auswaertstore}`:""));
   const count=Number(d.meistGetippt?.anzahl||0),submitted=Number(d.abgegeben||0),correct=Number(d.richtigeTendenz?.anzahl||0),exact=Number(d.exakt||0);
   hero=goals?esc(goals.replace(':',' : ')):`${correct}`;
   headline="Überraschung!";
   const home=teamDisplayName(d.heimTeam||game.heimTeamId),away=teamDisplayName(d.auswaertsTeam||game.auswaertsTeamId);
   detail=`<div class="logbook-poster-match">${esc(home)} <span>gegen</span> ${esc(away)}</div><div class="logbook-poster-proof"><strong>${count}${submitted?` von ${submitted}`:""}</strong> tippten anders <span aria-hidden="true">·</span> <strong>${correct}</strong> richtig <span aria-hidden="true">·</span> <strong>${exact}</strong> exakt</div>`;
   theme="sensation";
  }else if(captains){
   const d=captains.daten||{},count=Number(d.anzahl||arr(d.tipper).length||0);
   hero=String(count);headline=count===1?"Kapitän des Spieltags":"Kapitäne teilen die Beute";
   detail=`<div class="logbook-poster-proof"><strong>${Number(d.punkte||0)}</strong> Punkte · beste Spieltagsleistung</div>`;
  }else if(story){
   hero="★";headline=esc(story.title||"Spieltag im Fokus");
   detail=story.text?`<div class="logbook-poster-proof">${esc(story.text)}</div>`:"";
   theme="story";
  }else{
   const stat=stats[0];hero=stat?String(stat.value):"✓";headline=stat?esc(stat.label):"Spieltagsrückblick";
   detail=stat?`<div class="logbook-poster-proof">${esc(stat.copy)}</div>`:"";
  }
  // Lange Wettbewerbsnamen als ganze Woerter erhalten: nie willkuerlich mitten in "El Clasico" trennen.
  const competition=esc(keepSpieltag(entry.bezeichnung||entry.runde||entry.wettbewerb||"Spieltag"));
  return `<article class="logbook-weekend-card logbook-weekend-card--${theme}"><div class="logbook-poster-top"><span class="logbook-poster-competition">${competition}</span><span class="logbook-poster-symbol" aria-hidden="true">✦</span></div><div class="logbook-poster-center"><span class="logbook-poster-headline">${headline}</span><strong class="logbook-poster-hero">${hero}</strong>${detail}</div><a class="logbook-weekend-link" href="${link}" aria-label="Rückblick öffnen: ${competition}">Geschichte entdecken <span aria-hidden="true">›</span></a></article>`;
 }).join("");
 return `<div class="logbook-weekend-title">${esc(title)}</div><div class="logbook-weekend-grid">${cards}</div>`;
}
function renderThirtySeconds(entry,pending){
 const host=$("#logbook-30s"); if(!host) return;
 // Die ausfuehrliche Logbuch-Seite behaelt ihren bisherigen Einzelrueckblick.
 if($(".logbook-teaser")){
  const weekend=weekendCardsHtml(data?.logbuecher);
  if(weekend){host.innerHTML=weekend;return;}
 }
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
// Kapitaene: aus den unveraenderten Punkten der abgeschlossenen Spieltagsrangliste.
// Mindestens vier Tipper; bei Punktgleichstand am vierten Rang alle Gleichplatzierten.
// Die Reihenfolge innerhalb gleicher Punktzahl bleibt wie in der Quellrangliste.
function captainTopFour(entry){
 const block=arr(spieltagpunkteDoc?.spieltage).find(x=>x?.id===entry?.id&&x?.abgeschlossen===true);
 if(!block)return null;
 const seen=new Set();
 const rows=arr(block.rangliste).filter(r=>{
   if(!r?.teilnehmerId||!r?.teilnehmer||typeof r.punkte!=="number"||!Number.isFinite(r.punkte))return false;
   const id=String(r.teilnehmerId);if(seen.has(id))return false;seen.add(id);return true;
 }).map((r,i)=>({...r,_originalIndex:i}));
 if(!rows.length)return null;
 rows.sort((a,b)=>b.punkte-a.punkte||a._originalIndex-b._originalIndex);
 const cutoff=rows[Math.min(3,rows.length-1)].punkte;
 return rows.filter((r,i)=>i<4||r.punkte===cutoff);
}
function outcomeLabel(v){return v==="1"?"Heimsieg":v==="2"?"Auswärtssieg":"Remis"}

function renderHighlight(h,entry){
 const d=h.daten||{};
 if(h.typ==="kapitaene"){
   const count=Number(d.anzahl||0),name=firstTipperName(d.tipper);
   const text=count===1
    ?`${esc(name||"1 Tipper")} holt mit ${Number(d.punkte||0)} Punkten die beste Spieltagsleistung.`
    :`<strong>${count} Tipper</strong> teilen sich mit ${Number(d.punkte||0)} Punkten die beste Spieltagsleistung.`;
   const leaders=captainTopFour(entry);
   const leaderNames=leaders?leaders.map(r=>`<span class="lb-name"><span class="lb-captain-name">${esc(r.teilnehmer)}</span><span class="lb-captain-points">${Number(r.punkte).toLocaleString("de-DE")} P.</span></span>`).join(""):shortNames(d.tipper);
   return `<article class="lb-highlight lb-highlight--wide lb-highlight--captains"><h3>Kapitäne des Spieltags</h3><p>${text}</p><div class="lb-names">${leaderNames}</div></article>`;
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
   return courseMovementCard(entry);
 }
 if(h.typ==="zahlen-aus-der-kombuese") return `<article class="lb-highlight lb-highlight--wide lb-highlight--galley"><h3>Zahlen aus der Kombüse</h3><div class="lb-galley-grid"><div><strong>${Number(d.abgegeben||0)}</strong><span>Abgaben</span></div><div><strong>${Number(d.nichtAbgegeben||0)}</strong><span>Nichtabgaben</span></div><div><strong>${Number(d.exakt||0)}</strong><span>Volltreffer</span></div><div><strong>${Number(d.differenz||0)}</strong><span>Tordifferenz</span></div><div><strong>${Number(d.tendenz||0)}</strong><span>Tendenz</span></div></div></article>`;
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
 const highlights=shown(entry);
 highlights.sort((a,b)=>Number(b?.typ==="zahlen-aus-der-kombuese")-Number(a?.typ==="zahlen-aus-der-kombuese"));
 const crewHighlight=highlights.find(h=>h?.typ==="crewduell");
 const movementHighlight=highlights.find(h=>h?.typ==="kursbewegung");
 const form=formCrewCard(entry);
 const bilanz=spieltagBilanzCard(entry);
 const stackMovement=Boolean(crewHighlight&&form);
 for(const h of highlights){
   if(stackMovement&&h?.typ==="kursbewegung")continue;
   const rendered=renderHighlight(h,entry);
   if(!rendered)continue;
   if(h?.typ==="crewduell"&&stackMovement){
     const movement=movementHighlight?renderHighlight(movementHighlight,entry):"";
     rows.push(`<div class="lb-highlight-stack">${rendered}${movement}${bilanz}</div>`);
     rows.push(form);
   }else{
     rows.push(rendered);
   }
   if(h?.typ==="volltreffer"){
     const coco=cocoLogbookCard(entry);
     if(coco){rows.push(coco);inserted=true;}
   }
 }
 // Auch bei künftigen Eventtypen ohne Crewduell/ohne Kursbewegung: Form und Bilanz anzeigen.
 if(!stackMovement){
   if(form)rows.push(form);
   if(bilanz)rows.push(bilanz);
 }
 if(!inserted){
   const coco=cocoLogbookCard(entry);
   if(coco)rows.push(coco);
 }
 return rows.join("");
}

// TEST7: Bilanz ausschließlich aus dem eindeutig zugeordneten, abgeschlossenen Spieltag.
// Keine aus unterschiedlichen Galley-Teilwerten abgeleiteten Teilnahmequoten.
function spieltagBilanzCard(entry){
 const block=arr(spieltagpunkteDoc?.spieltage).find(x=>x?.id===entry?.id&&x?.abgeschlossen===true);
 if(!block)return "";
 const rows=arr(block.rangliste).filter(r=>r?.teilnehmerId&&typeof r.punkte==="number"&&Number.isFinite(r.punkte));
 const uniqueIds=new Set(rows.map(r=>String(r.teilnehmerId)));
 if(!rows.length||uniqueIds.size!==rows.length)return "";
 const total=rows.reduce((sum,r)=>sum+r.punkte,0);
 const games=new Set(arr(entry?.spielIds).filter(Boolean));
 if(!games.size)return "";
 // Nur echte, gültige Einzel-Tippabgaben zählen. Ein Teilnehmer ohne abgegebenen Tipp
 // bleibt im Gesamtpunktewert enthalten, darf aber nicht den Tipper-Durchschnitt senken.
 const validTips=arr(tippsDoc?.tipps).filter(t=>games.has(t?.spielId)
   &&t?.status==="abgegeben"
   &&Number.isInteger(t?.heimtore)&&Number.isInteger(t?.auswaertstore)
   &&t?.teilnehmerId);
 const activeIds=new Set(validTips.map(t=>String(t.teilnehmerId)));
 if(!activeIds.size)return "";
 const average=total/activeIds.size;
 const de=n=>Number(n).toLocaleString("de-DE");
 const metric=(name,value,note)=>`<div class="lb-bilanz-metric"><span>${name}</span><strong>${value}</strong><small>${note}</small></div>`;
 return `<article class="lb-highlight lb-highlight--bilanz">
  <h3>Spieltagsbilanz</h3>
  <p class="lb-bilanz-intro">Das Ergebnis dieses abgeschlossenen Spieltags auf einen Blick.</p>
  <div class="lb-bilanz-grid">
    ${metric("Spiele",de(games.size),"abgeschlossen")}
    ${metric("Tipper",de(activeIds.size),"mit Tippabgabe")}
    ${metric("Gesamtpunktzahl",de(total),"Punkte aller Teilnehmer zusammen")}
    ${metric("Punktedurchschnitt",average.toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}),"Punkte je aktivem Tipper")}
  </div>
 </article>`;
}

function completedForEntry(entry){
 const completed=arr(spieltagpunkteDoc?.spieltage).filter(x=>x?.abgeschlossen===true);
 const index=completed.findIndex(x=>x?.id===entry?.id);
 return index<0?[]:completed.slice(Math.max(0,index-2),index+1);
}
function formCrewCard(entry){
 const blocks=completedForEntry(entry);
 if(!blocks.length||!tippsDoc||!Array.isArray(tippsDoc.tipps))return "";
 // Form nach tatsächlich erzielten Punkten der letzten bis zu drei Wertungsblöcke.
 // Rangplätze sind nur Zusatzinformation, kein Sortierkriterium.
 const grouped=new Map();
 blocks.forEach(block=>{
   const relatedLog=arr(data?.logbuecher).find(x=>x?.id===block.id&&x?.abgeschlossen===true);
   const gameIds=new Set(arr(relatedLog?.spielIds).filter(Boolean));
   const tippedIds=new Set(arr(tippsDoc?.tipps).filter(t=>gameIds.has(t?.spielId)
     &&t?.status==="abgegeben"&&Number.isInteger(t?.heimtore)&&Number.isInteger(t?.auswaertstore)
     &&t?.teilnehmerId).map(t=>String(t.teilnehmerId)));
   const people=arr(block?.rangliste).filter(r=>r?.teilnehmerId&&Number.isFinite(Number(r?.punkte)));
   people.forEach(r=>{
     const id=r.teilnehmerId;
     const rank=Number(r?.spieltagsplatzierung??r?.platz);
     const tipped=tippedIds.has(String(id));
     const row=grouped.get(id)||{id,name:r?.teilnehmer||id,total:0,ranks:[],appearances:0,tippedCount:0};
     row.name=r?.teilnehmer||row.name;
     row.total+=Number(r.punkte);
     row.ranks.push(Number.isFinite(rank)&&rank>=1?rank:null);
     row.appearances++;
     if(tipped)row.tippedCount++;
     grouped.set(id,row);
   });
 });
 // Vergleichsbasis: Daten in allen betrachteten Wertungsblöcken vorhanden.
 const eligible=[...grouped.values()].filter(r=>r.appearances===blocks.length).map(r=>({
   ...r,
   avgRank:r.ranks.every(x=>x!==null)?r.ranks.reduce((a,b)=>a+b,0)/r.ranks.length:null,
   change:r.ranks[0]!==null&&r.ranks[r.ranks.length-1]!==null?r.ranks[0]-r.ranks[r.ranks.length-1]:null
 }));
 const strongest=[...eligible].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,"de")).slice(0,5);
 const bestIds=new Set(strongest.map(r=>r.id));
 // Flop 5 nur unter Tippern, die in den letzten 3 Spieltagen mindestens einmal tatsächlich abgegeben haben.
 const weakestPool=[...eligible].filter(r=>r.tippedCount>0&&!bestIds.has(r.id));
 const weakest=weakestPool.sort((a,b)=>a.total-b.total||a.name.localeCompare(b.name,"de")).slice(0,5);
 const group=(title,rows,kind)=>`<div class="lb-form-section lb-form-section--${kind}"><h4>${title}</h4><div class="lb-form-list">${rows.map((r,index)=>{
   const move=r.change===null?"kein Rangvergleich":r.change>0?`▲ ${r.change} Plätze`:r.change<0?`▼ ${Math.abs(r.change)} Plätze`:"= 0 Plätze";
   const place=r.avgRank===null?"Ø Platz unbekannt":`Ø Platz ${(Math.round(r.avgRank*10)/10).toLocaleString("de-DE")}`;
   return `<div class="lb-form-row"><span class="lb-form-rank">${index+1}.</span><strong title="${esc(r.name)}">${esc(r.name)}</strong><span class="lb-form-stats"><b>${r.total.toLocaleString("de-DE")} Punkte</b><small>${place} · ${move}</small></span></div>`;
 }).join("")}</div></div>`;
 const labels=blocks.map(b=>esc(b.bezeichnung||b.runde||b.wettbewerb)).join(" · ");
 return `<article class="lb-highlight lb-highlight--form"><h3>Form der Crew</h3>
 <p class="lb-form-lead">${blocks.length} letzte abgeschlossene Spieltage – alle Wettbewerbe.</p>
 ${group("Beste Form – Top 5",strongest,"best")}
 ${group("Schwächste Form – Flop 5",weakest,"worst")}
 <p class="lb-form-explain">Form = Summe der Punkte aus ${blocks.length} Spieltagen. Flop 5 nur mit mindestens 1 abgegebenem Tipp. Ø Platz und ▲/▼ zeigen nur die Platzentwicklung.</p>
 <details class="lb-form-context"><summary>Gewertete Spieltage</summary><p>${labels}</p></details>
 </article>`;
}
function courseMovementCard(entry){
 const logs=arr(data?.logbuecher).filter(x=>x?.abgeschlossen===true);
 const index=logs.findIndex(x=>x?.id===entry?.id);
 if(index<0)return "";
 const current=logs[index],previous=index>0?logs[index-1]:null;
 if(!previous)return `<article class="lb-highlight lb-highlight--movement"><h3>Kursbewegung</h3><p>Kein vorheriger Gesamtstand zum Vergleichen.</p></article>`;
 const comparisons=[];
 arr(ranglistenverlaufDoc?.verlaeufe).forEach(person=>{
   const currentPoint=arr(person?.punkte).find(p=>p?.auftragId===current.id);
   const previousPoint=arr(person?.punkte).find(p=>p?.auftragId===previous.id);
   const now=Number(currentPoint?.platz),before=Number(previousPoint?.platz);
   if(!currentPoint||!previousPoint||!Number.isFinite(now)||!Number.isFinite(before))return;
   comparisons.push({name:person.teilnehmer||person.teilnehmerId,delta:before-now,before,now,
     earned:Number(currentPoint.punkte)-Number(previousPoint.punkte)});
 });
 const maxGain=Math.max(0,...comparisons.map(x=>x.delta));
 const maxLoss=Math.min(0,...comparisons.map(x=>x.delta));
 // Alle tatsaechlich Gleichplatzierten ermitteln; rein visuell 3 Namen anzeigen.
 // Die Vergleichs-/Punkteberechnung bleibt gegenueber TEST12 unveraendert.
 const gain=maxGain>0?comparisons.filter(x=>x.delta===maxGain):[];
 const loss=maxLoss<0?comparisons.filter(x=>x.delta===maxLoss):[];
 const side=(label,rows,type)=>{
   const ordered=[...rows].sort((a,b)=>a.name.localeCompare(b.name,"de"));
   const shown=ordered.slice(0,3);
   const remaining=ordered.length-shown.length;
   const delta=shown.length?Math.abs(shown[0].delta):0;
   const headline=shown.length?`<div class="lb-movement-total is-${type}">${type==="up"?"▲ +":"▼ −"}${delta} Plätze</div>`:"";
   const items=shown.map(row=>`<div class="lb-movement-person"><strong title="${esc(row.name)}">${esc(row.name)}</strong><small>${row.earned>=0?"+":""}${row.earned} Punkte · Gesamtplatz ${row.before} → ${row.now}</small></div>`).join("");
   return `<div class="lb-movement-side is-${type}"><h4>${label}</h4>${shown.length?`${headline}<div class="lb-movement-people">${items}</div>${remaining>0?`<p class="lb-movement-more">+ ${remaining} weitere gleichauf</p>`:""}`:'<span>Keine Platzänderung</span>'}</div>`;
 };
 return `<article class="lb-highlight lb-highlight--movement"><h3>Kursbewegung</h3><p class="lb-form-lead">Wie veränderte der letzte Spieltag die Gesamtwertung?</p>
 <div class="lb-movement-grid">${side("Größter Sprung",gain,"up")}${side("Größter Verlust",loss,"down")}</div>
 <p class="lb-form-explain">Vergleich der Gesamtplatzierung vor und nach diesem Spieltagsabschluss.</p></article>`;
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
 const requestedId=new URLSearchParams(location.search).get("logbuchId");
 const selectedFromLink=source.find(e=>e.id===requestedId)||latest;
 const initialCompetition=competitionKey(selectedFromLink);
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
     const stripped=title.replace(new RegExp(`^${competition.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\s*`,"i"),"").trim();
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
 fillEntries(initialCompetition,selectedFromLink?.id);
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
   const [logDoc,view,matchdays,games,spieltagpunkte,teams,ranglistenverlauf,tipps]=await Promise.all([
     fetchJson("./spieltag-logbuch.json"),fetchJson("./website-view.json"),fetchJson("./tippspieltage.json"),fetchJson("./spieldaten.json"),fetchJson("./spieltagpunkte.json"),fetchJson("./teams.json"),fetchJson("./ranglistenverlauf.json"),fetchJson("./tipps.json")
   ]);
   if(!logDoc)throw Error("spieltag-logbuch.json nicht erreichbar");
   data=logDoc; spieltagpunkteDoc=spieltagpunkte; ranglistenverlaufDoc=ranglistenverlauf; tippsDoc=tipps; gameById=new Map(flattenGames(games).map(g=>[g.id,g])); teamById=new Map(arr(teams?.teams).map(t=>[String(t?.id||""),t])); const latest=(data.logbuecher||[]).at(-1)||null;
   const pending=buildPending(view,matchdays,games,arr(data.logbuecher)); currentPending=pending;
   renderThirtySeconds(latest,pending); renderEntry(latest,pending); archive();
   const st=$("#lb-status"); if(st) st.remove();
 }catch(e){
   const st=$("#lb-status"); if(st) st.textContent="Das Spieltags-Logbuch konnte nicht geladen werden.";
 }
}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init,{once:true}):init();
})();
