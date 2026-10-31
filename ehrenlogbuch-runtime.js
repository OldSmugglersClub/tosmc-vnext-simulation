(()=>{
"use strict";
const $=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[],txt=v=>String(v??"").trim();
const norm=v=>txt(v).toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=txt(value);return n};
const add=(parent,tag,cls,value)=>{const n=el(tag,cls,value);parent.appendChild(n);return n};
const pkey=p=>`name:${norm(p?.name)}`,value=i=>[i?.wert,i?.einheit].filter(v=>txt(v)).join(" ");
const bestNames=item=>arr(item?.halter).length?item.halter.map(x=>x.name).filter(Boolean).join(" / "):txt(item?.name);
const competitionLabels={"bundesliga":"Bundesliga","champions-league":"Champions League","europa-league":"Europa League","dfb-pokal":"DFB-Pokal","relegation":"Relegation","piratenkodex":"Piratenkodex","smugglerauftraege":"Smuggleraufträge","smugglerauftrag":"Smuggleraufträge","weihnachtsregatta":"Weihnachtsregatta","bonuswettbewerb":"Bonuswettbewerb"};
let data=null,participants=[],availableCompetitions=new Map();
function row(label,content){const n=el("div","row");add(n,"span","",label);add(n,"strong","",content||"–");return n}
const empty=message=>el("div","empty",message);
function fill(select,items,placeholder){select.replaceChildren();const first=el("option","",placeholder);first.value="";select.appendChild(first);for(const item of items){const option=el("option","",item.label);option.value=item.value;select.appendChild(option)}}
// Die Ehrenchampions-Historie liegt in der Titelchronik. Die Startseite zeigt nur die neueste Ehrung.

function renderRecords(){const target=$("recordGrid");target.replaceChildren();if(!arr(data.ewigeRekorde).length)return target.appendChild(empty("Noch keine absoluten Rekorde vorhanden."));for(const item of data.ewigeRekorde){const card=el("article","record-card");add(card,"h3","",item.label);add(card,"strong","record-value",value(item));const holders=add(card,"div","record-holders");for(const holder of arr(item.halter))add(holders,"p","",`${holder.name}${holder.saison?` · ${holder.saison}`:""}`);if(arr(item.entwicklung).length>1)add(card,"p","record-history",`${item.entwicklung.length} bestätigte Rekordstände dokumentiert`);target.appendChild(card)}}
const season=()=>arr(data.saisons).find(x=>x.id===$("seasonSelect").value)||arr(data.saisons)[0]||null;
function renderSeason(){const target=$("seasonContent"),item=season();target.replaceChildren();if(!item)return target.appendChild(empty("Noch keine abgeschlossene Saison archiviert."));if(item.status!=="abgeschlossen")add(target,"p","archive-open","Laufende Saison: nur bereits abgeschlossene und bestätigte Wettbewerbe. Gesamtchampion und Saisonbestwerte werden erst nach Saisonabschluss archiviert.");const banner=el("div","season-banner");for(const block of [{label:"Gesamtchampion",entry:item.gesamtChampion},{label:"Gesamt-Team-Sieger",entry:item.gesamtTeamSieger}]){const card=el("article","summary-card");add(card,"h3","",block.label);add(card,"strong","",item.status!=="abgeschlossen"?"Saison läuft":block.entry?.name||"Nicht vergeben / nicht erfasst");add(card,"p","",item.status!=="abgeschlossen"?item.label:block.entry?.punkte!==undefined?`${block.entry.punkte} Punkte`:item.label);banner.appendChild(card)}target.appendChild(banner);add(target,"p","archive-open","Die Wettbewerbssieger dieser Saison findest du in der Titelchronik weiter unten. Dort lassen sie sich nach Saison und Wettbewerb filtern.");add(target,"h3","subhead","Saisonbestwerte");const best=add(target,"div","list");if(item.status==="abgeschlossen")for(const record of arr(item.saisonbestwerte))best.appendChild(row(record.label,`${value(record)} · ${bestNames(record)}`));if(!best.children.length)best.appendChild(empty(item.status==="abgeschlossen"?"Keine Saisonbestwerte erfasst.":"Erst nach Saisonabschluss verfügbar."))}
function competitions(){const map=new Map(availableCompetitions);for(const s of arr(data.saisons))for(const w of arr(s.wettbewerbssieger)){const id=txt(w.wettbewerbId)||norm(w.wettbewerb);if(id&&!map.has(id))map.set(id,w.wettbewerb)}for(const h of arr(data.ehrenchampions)){if(h?.bestaetigt===false||!txt(h?.name))continue;const c=honorCompetition(h);if(c.id&&!map.has(c.id))map.set(c.id,c.label)}return [...map].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,"de"))}
// Titelhistorie und offene Wettbewerbe gemeinsam zeigen. "Noch offen" ist keine Ehrung.
// Bereits bestätigte Titel haben Vorrang; niemals einen laufenden Tabellenführer als Sieger ausgeben.
function honorCompetition(h){
 const id=txt(h?.wettbewerbId);
 if(id==="champion-der-wm-runde-2026")return {id,label:"WM-Runde 2026"};
 if(competitionLabels[id])return {id,label:competitionLabels[id]};
 return {id:id||norm(h?.titel),label:txt(h?.titel).replace(/^Champion(?: der| des)?\s+/i,"")||"Sonderwettbewerb"};
}
function titleRowsForDisplay(archive,available,filter="",seasonFilter=""){
 const items=[],history=new Set();
 for(const s of arr(archive?.saisons))for(const w of arr(s.wettbewerbssieger)){
  const id=txt(w.wettbewerbId)||norm(w.wettbewerb);
  if(!id||(filter&&id!==filter)||(seasonFilter&&s.label!==seasonFilter))continue;
  items.push({saison:s.label,wettbewerb:w.wettbewerb,name:w.name,punkte:w.punkte,offen:false,id});
  history.add(`${s.label}|${id}`);
 }
 // Einmalige historische Sonder-Ehrenchampions (einschl. WM 2026).
 // Ein bereits als Wettbewerbssieger vorhandener Titel wird nicht dupliziert.
 for(const honor of arr(archive?.ehrenchampions)){
  if(honor?.bestaetigt===false||!txt(honor?.name)||!txt(honor?.titel))continue;
  const comp=honorCompetition(honor),label=txt(honor.saison||honor.jahr);
  if(!comp.id||!label||(filter&&comp.id!==filter)||(seasonFilter&&label!==seasonFilter)||history.has(`${label}|${comp.id}`))continue;
  items.push({saison:label,wettbewerb:comp.label,name:honor.name,punkte:honor.punkte,offen:false,id:comp.id});
  history.add(`${label}|${comp.id}`);
 }
 // Offene Wettbewerbe nur in laufender Saison sichtbar, nie als Sieger.
 for(const s of arr(archive?.saisons).filter(x=>x.status==="laufend")){
  if(seasonFilter&&s.label!==seasonFilter)continue;
  for(const [id,label] of available){
   if((filter&&id!==filter)||history.has(`${s.label}|${id}`))continue;
   items.push({saison:s.label,wettbewerb:label,name:"Noch offen",offen:true,id});
  }
 }
 items.sort((a,b)=>b.saison.localeCompare(a.saison,"de")||a.wettbewerb.localeCompare(b.wettbewerb,"de")||Number(a.offen)-Number(b.offen));
 return items;
}
function renderTitles(){
 const target=$("titleRows"),filter=$("competitionSelect").value,seasonFilter=$("titleSeasonSelect").value;
 const items=titleRowsForDisplay(data,availableCompetitions,filter,seasonFilter);
 target.replaceChildren();
 if(!items.length){const tr=el("tr"),td=el("td","","Keine passenden Wettbewerbe vorhanden.");td.colSpan=4;tr.appendChild(td);return target.appendChild(tr)}
 for(const item of items){
  const tr=el("tr");if(item.offen)tr.className="title-row--open";
  add(tr,"td","",item.saison);add(tr,"td","",item.wettbewerb);
  const cell=add(tr,"td");
  if(item.offen)add(cell,"span","",item.name);else add(cell,"strong","",item.name);
  add(tr,"td","",item.offen?"–":item.punkte!==undefined?`${item.punkte} Punkte`:"–");
  target.appendChild(tr);
 }
}
function titleSeasons(){
 const labels=new Set(arr(data.saisons).map(s=>txt(s.label)).filter(Boolean));
 for(const h of arr(data.ehrenchampions))if(h?.bestaetigt!==false&&txt(h?.name))labels.add(txt(h.saison||h.jahr));
 return [...labels].sort((a,b)=>b.localeCompare(a,"de")).map(v=>({value:v,label:`Saison ${v}`}));
}

function people(){const map=new Map(),put=p=>{if(!txt(p?.name))return;const key=pkey(p);if(!map.has(key))map.set(key,{value:key,label:p.name})};participants.forEach(put);for(const s of arr(data.saisons)){put(s.gesamtChampion);arr(s.platzierungen).forEach(put);arr(s.wettbewerbssieger).forEach(put);for(const best of arr(s.saisonbestwerte)){if(arr(best.halter).length)best.halter.forEach(put);else put(best)}}for(const r of arr(data.ewigeRekorde))arr(r.halter).forEach(put);arr(data.ehrenchampions).forEach(put);return [...map.values()].sort((a,b)=>a.label.localeCompare(b.label,"de"))}
function renderPerson(){const target=$("personContent"),key=$("personSelect").value,items=[],placements=[];target.replaceChildren();if(!key)return target.appendChild(empty("Tipper auswählen, um seine archivierten Platzierungen und Erfolge anzuzeigen."));for(const s of arr(data.saisons)){for(const place of arr(s.platzierungen))if(pkey(place)===key)placements.push({...place,saison:s.label});if(pkey(s.gesamtChampion)===key)items.push([s.label,"Gesamtchampion"]);for(const w of arr(s.wettbewerbssieger))if(pkey(w)===key)items.push([s.label,`Sieger ${w.wettbewerb}${w.punkte!==undefined?` · ${w.punkte} Punkte`:""}`]);for(const b of arr(s.saisonbestwerte)){const holders=arr(b.halter).length?b.halter:[b];if(holders.some(h=>pkey(h)===key))items.push([s.label,`${b.label}: ${value(b)}`])}}for(const h of arr(data.ehrenchampions))if(pkey(h)===key)items.push([h.saison||h.jahr,h.titel]);for(const r of arr(data.ewigeRekorde))for(const h of arr(r.halter))if(pkey(h)===key)items.push([h.saison||"Alle Saisons",`Absoluter Rekord: ${r.label} (${value(r)})`]);placements.sort((a,b)=>Number(a.platz)-Number(b.platz)||txt(b.saison).localeCompare(txt(a.saison),"de"));const summary=el("article","summary-card personal-best");add(summary,"h3","","Beste archivierte Saison-Gesamtplatzierung");if(placements.length){const best=placements[0],ties=placements.filter(x=>Number(x.platz)===Number(best.platz));add(summary,"strong","",`${best.platz}. Platz`);add(summary,"p","",ties.map(x=>`${x.saison}${x.punkte!==undefined?` · ${x.punkte} Punkte`:""}`).join(" / "))}else{add(summary,"strong","","Noch keine Platzierung verfügbar");add(summary,"p","","Die vollständige Rangliste 2025/2026 liegt im vorhandenen Datenbestand nicht vor. Saison-Gesamtplatzierungen werden erst nach abgeschlossener Archivierung angezeigt.")}target.appendChild(summary);if(placements.length>1){add(target,"h3","subhead","Alle archivierten Saisonplatzierungen");const placementList=add(target,"div","list");for(const place of placements)placementList.appendChild(row(place.saison,`${place.platz}. Platz${place.punkte!==undefined?` · ${place.punkte} Punkte`:""}`))}add(target,"h3","subhead","Titel, Bestwerte und Ehrungen");const list=add(target,"div","list");for(const item of items)list.appendChild(row(item[0],item[1]));if(!items.length)list.appendChild(empty("Noch keine bestätigten Titel, Bestwerte oder Ehrungen vorhanden."))}
// Nur eindeutige Sieger der bestehenden Wettbewerbs-Highscore, niemals einen Tabellenfuehrer
// vor bestaetigtem Abschluss als Champion ausweisen. Historische Archivdaten bleiben bestehen.
const specialIds=new Set(["weihnachtsregatta","piratenkodex","smugglerauftraege"]);
const seasonLabel=v=>{const m=String(v||"").match(/^(\d{4})[-/](\d{2}|\d{4})$/);if(!m)return "";const y=Number(m[1]),end=m[2].length===2?Math.floor(y/100)*100+Number(m[2]):Number(m[2]);return end===y+1?`${y}/${end}`:""};
function mergeConfirmedWinners(archive,view){
 const src=view?.hallOfFame?.aktuelleSaison;
 const label=seasonLabel(src?.saison||view?.saison);
 if(!src?.wettbewerbe||!label)return;
 const id=label.replace("/","-"),winners=[];
 for(const [compId,record] of Object.entries(src.wettbewerbe)){
  if(!competitionLabels[compId]||record?.status!=="abgeschlossen"||record?.abschluss?.completed!==true)continue;
  const league=view?.highscore?.wettbewerbe?.[compId],rows=arr(league?.overall);
  const leaders=rows.filter(r=>Number(r?.rank)===1&&txt(r?.name)&&txt(r?.participantId));
  if(leaders.length!==1)continue;
  const champion=leaders[0],approved=record.sieger;
  if(approved?.freigegeben===false||approved?.bestaetigt===false||approved?.offen===true)continue;
  if(approved?.teilnehmerId&&approved.teilnehmerId!==champion.participantId)continue;
  if(approved?.name&&approved.name!==champion.name)continue;
  const winner={wettbewerbId:compId,wettbewerb:txt(record.label)||competitionLabels[compId],name:champion.name,teilnehmerId:champion.participantId};
  if(Number.isFinite(champion.totalPoints))winner.punkte=champion.totalPoints;
  winners.push(winner);
  if(specialIds.has(compId)){
   const honorId=`auto-${id}-${compId}`;
   if(!arr(archive.ehrenchampions).some(h=>h.id===honorId||h.wettbewerbId===compId&&h.saison===label)){
    if(!Array.isArray(archive.ehrenchampions))archive.ehrenchampions=[];
    archive.ehrenchampions.push({id:honorId,wettbewerbId:compId,titel:`Champion ${winner.wettbewerb}`,jahr:id.slice(0,4),saison:label,name:winner.name,teilnehmerId:winner.teilnehmerId,bestaetigt:true});
   }
  }
 }
 if(!winners.length)return;
 let season=arr(archive.saisons).find(x=>x.id===id);
 if(!season){season={id,label,status:src.status==="abgeschlossen"?"abgeschlossen":"laufend",wettbewerbssieger:[],platzierungen:[],saisonbestwerte:[]};archive.saisons.push(season)}
 for(const w of winners)if(!arr(season.wettbewerbssieger).some(x=>(txt(x.wettbewerbId)||norm(x.wettbewerb))===w.wettbewerbId))season.wettbewerbssieger.push(w);
}
// Das Dropdown zeigt bereits die aktiven Wettbewerbe; Sieger bleiben bis zum Abschluss verborgen.
function addActiveCompetitions(view){
 const available=view?.highscore?.wettbewerbe||{};
 for(const [id,record] of Object.entries(available)){
  if(!competitionLabels[id])continue;
  availableCompetitions.set(id,txt(record?.label)||competitionLabels[id]);
 }
}
function addActiveSeasonPlaceholder(archive,view){
 const state=view?.hallOfFame?.aktuelleSaison;
 const label=seasonLabel(state?.saison||view?.saison);
 if(!label)return;
 const id=label.replace("/","-");
 if(arr(archive.saisons).some(s=>s.id===id))return;
 archive.saisons.push({id,label,status:"laufend",wettbewerbssieger:[],platzierungen:[],saisonbestwerte:[]});
}
async function load(){const [response,peopleResponse,viewResponse]=await Promise.all([fetch("./ehrenlogbuch-archiv.json",{cache:"no-store"}),fetch("./teilnehmer.json",{cache:"no-store"}).catch(()=>null),fetch("./website-view.json",{cache:"no-store"}).catch(()=>null)]);if(!response.ok)throw Error("Archivdatei nicht erreichbar");data=await response.json();participants=peopleResponse?.ok?arr((await peopleResponse.json())?.teilnehmer):[];if(Number(data?.schemaVersion)!==1)throw Error("Unbekannte Archivversion");data.saisons=arr(data.saisons).filter(x=>x.status==="abgeschlossen"||arr(x.wettbewerbssieger).length>0);if(viewResponse?.ok){const view=await viewResponse.json();addActiveCompetitions(view);mergeConfirmedWinners(data,view);addActiveSeasonPlaceholder(data,view);}data.saisons.sort((a,b)=>txt(b.label).localeCompare(txt(a.label),"de"));renderRecords();fill($("seasonSelect"),data.saisons.map(x=>({value:x.id,label:`Saison ${x.label}${x.status!=="abgeschlossen"?" · laufend (bestätigte Titel)":""}`})),"Keine Saison verfügbar");if(data.saisons[0])$("seasonSelect").value=data.saisons[0].id;fill($("competitionSelect"),competitions(),"Alle Wettbewerbe");fill($("titleSeasonSelect"),titleSeasons(),"Alle Saisons");fill($("personSelect"),people(),"Tipper auswählen");renderSeason();renderTitles();renderPerson();$("seasonSelect").addEventListener("change",renderSeason);$("competitionSelect").addEventListener("change",renderTitles);$("titleSeasonSelect").addEventListener("change",renderTitles);$("personSelect").addEventListener("change",renderPerson);$("dataStatus").textContent=data.meta?.hinweis||"Ehrenlogbuch geladen."}
window.TOSMCEhrenlogbuch={load};
})();
