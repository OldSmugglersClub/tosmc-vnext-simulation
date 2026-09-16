
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const status=$("duel-status"), board=$("duel-board"), selectA=$("duel-a"), selectB=$("duel-b");
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat("de-DE",{maximumFractionDigits:2}).format(n):"–";
const clean=s=>String(s??"").trim();

let state={participants:[], days:[], highscore:new Map()};

async function loadJson(path){
  const r=await fetch(path,{cache:"no-store"});
  if(!r.ok) throw new Error(path+" konnte nicht geladen werden");
  return r.json();
}
function activeParticipants(doc){
  const list=Array.isArray(doc?.teilnehmer)?doc.teilnehmer:[];
  return list.filter(p=>p && p.aktiv!==false && clean(p.id) && clean(p.name))
    .sort((a,b)=>clean(a.name).localeCompare(clean(b.name),"de",{sensitivity:"base"}));
}
function completedDays(doc){
  return (Array.isArray(doc?.spieltage)?doc.spieltage:[])
    .filter(d=>d?.abgeschlossen && Array.isArray(d.rangliste))
    .map((d,index)=>({...d,_index:index}));
}
function hsMap(doc){
  const rows=Array.isArray(doc?.individual?.overall)?doc.individual.overall:[];
  return new Map(rows.map(r=>[clean(r.participantId),r]));
}
function dayRow(day,id){
  return day.rangliste.find(r=>clean(r.teilnehmerId)===id) || null;
}
function statsFor(id){
  const rows=state.days.map(day=>({day,row:dayRow(day,id)})).filter(x=>x.row);
  const totalDetail=rows.reduce((a,x)=>a+(Number(x.row.punkte)||0),0);
  const current=state.highscore.get(id);
  const total=Number(current?.totalPoints);
  const rankOne=rows.filter(x=>Number(x.row.spieltagsplatzierung ?? x.row.platz)===1).length;
  return {
    rows,
    total:Number.isFinite(total)?total:totalDetail,
    avg:rows.length?totalDetail/rows.length:0,
    rankOne,
    exakt:rows.reduce((a,x)=>a+(Number(x.row.exakt)||0),0),
    differenz:rows.reduce((a,x)=>a+(Number(x.row.differenz)||0),0),
    tendenz:rows.reduce((a,x)=>a+(Number(x.row.tendenz)||0),0)
  };
}
function commonDays(idA,idB){
  return state.days.map(day=>{
    const a=dayRow(day,idA),b=dayRow(day,idB);
    return a&&b?{day,a,b}:null;
  }).filter(Boolean);
}
function compare(a,b){
  if(a>b)return 1;if(a<b)return -1;return 0;
}
function setBetter(elA,elB,a,b,higher=true){
  elA.classList.remove("is-better");elB.classList.remove("is-better");
  if(a===b)return;
  const aBetter=higher?a>b:a<b;
  (aBetter?elA:elB).classList.add("is-better");
}
function metric(label,a,b,format=fmt,higher=true){
  const row=document.createElement("div");row.className="duel-metric";
  const va=document.createElement("div");va.className="duel-metric-value";va.textContent=format(a);
  const lab=document.createElement("div");lab.className="duel-metric-label";lab.textContent=label;
  const vb=document.createElement("div");vb.className="duel-metric-value";vb.textContent=format(b);
  setBetter(va,vb,a,b,higher);
  row.append(va,lab,vb);return row;
}
function shortRound(day){
  const s=clean(day.runde||day.bezeichnung);
  const m=s.match(/(\d+)\.\s*Spieltag/i);
  return m?`${m[1]}. ST`:s.slice(0,10)||"Spieltag";
}
function renderForm(container,entries,side){
  container.innerHTML="";
  const last=entries.slice(-5);
  const pad=Math.max(0,5-last.length);
  for(let i=0;i<pad;i++){
    const e=document.createElement("div");e.className="duel-form-chip is-empty";e.innerHTML="<strong>–</strong><span>noch offen</span>";container.append(e);
  }
  last.forEach(x=>{
    const own=side==="a"?Number(x.a.punkte)||0:Number(x.b.punkte)||0;
    const opp=side==="a"?Number(x.b.punkte)||0:Number(x.a.punkte)||0;
    const c=compare(own,opp);
    const e=document.createElement("div");e.className="duel-form-chip "+(c>0?"is-win":c<0?"is-loss":"is-draw");
    e.innerHTML=`<strong>${fmt(own)}</strong><span>${shortRound(x.day)}<br>${c>0?"Sieg":c<0?"Niederlage":"Remis"}</span>`;
    container.append(e);
  });
}
function render(){
  const idA=clean(selectA.value),idB=clean(selectB.value);
  if(!idA||!idB){board.hidden=true;return}
  if(idA===idB){
    status.textContent="Wähle zwei verschiedene Freibeuter.";status.className="duel-status is-error";board.hidden=true;return;
  }
  const pa=state.participants.find(p=>p.id===idA),pb=state.participants.find(p=>p.id===idB);
  if(!pa||!pb)return;
  const a=statsFor(idA),b=statsFor(idB),common=commonDays(idA,idB);
  let winsA=0,winsB=0,draws=0;
  common.forEach(x=>{const c=compare(Number(x.a.punkte)||0,Number(x.b.punkte)||0);if(c>0)winsA++;else if(c<0)winsB++;else draws++;});

  $("duel-name-a").textContent=pa.name;$("duel-name-b").textContent=pb.name;
  $("duel-team-a").textContent=clean(pa.team)||"Ohne Teamzuordnung";$("duel-team-b").textContent=clean(pb.team)||"Ohne Teamzuordnung";
  $("duel-wins-a").textContent=`${winsA} ${winsA===1?"Sieg":"Siege"}`;
  $("duel-wins-b").textContent=`${winsB} ${winsB===1?"Sieg":"Siege"}`;
  $("duel-draws").textContent=`${draws} ${draws===1?"Remis":"Remis"}`;

  const metrics=$("duel-metrics");metrics.innerHTML="";
  metrics.append(
    metric("Gesamtpunkte",a.total,b.total),
    metric("Ø Punkte / Spieltag",a.avg,b.avg,n=>fmt(n)),
    metric("Rang-1-Spieltage",a.rankOne,b.rankOne),
    metric("Exakte Treffer",a.exakt,b.exakt),
    metric("Differenztreffer",a.differenz,b.differenz),
    metric("Tendenztreffer",a.tendenz,b.tendenz)
  );

  $("duel-form-name-a").textContent=pa.name;$("duel-form-name-b").textContent=pb.name;
  renderForm($("duel-form-a"),common,"a");renderForm($("duel-form-b"),common,"b");
  $("duel-form-hint").textContent=`${Math.min(common.length,5)} von 5 Form-Spieltagen verfügbar · ${common.length} gemeinsame abgeschlossene Spieltage insgesamt.`;

  let verdict;
  if(!common.length) verdict=`Für ${pa.name} und ${pb.name} gibt es derzeit noch keinen gemeinsam abgeschlossenen Spieltag.`;
  else if(winsA>winsB) verdict=`${pa.name} führt nach gemeinsamen Spieltagen: ${winsA} ${winsA===1?"Sieg":"Siege"}, ${draws} Remis, ${winsB} ${winsB===1?"Sieg":"Siege"} für ${pb.name}.`;
  else if(winsB>winsA) verdict=`${pb.name} führt nach gemeinsamen Spieltagen: ${winsB} ${winsB===1?"Sieg":"Siege"}, ${draws} Remis, ${winsA} ${winsA===1?"Sieg":"Siege"} für ${pa.name}.`;
  else if(draws===common.length) verdict=`Das Duell ist ausgeglichen. Alle ${draws} gemeinsamen Spieltage endeten punktgleich.`;
  else verdict=`Das Duell ist ausgeglichen: ${winsA} ${winsA===1?"Sieg":"Siege"} für ${pa.name}, ${draws} Remis und ${winsB} ${winsB===1?"Sieg":"Siege"} für ${pb.name}.`;
  $("duel-verdict-text").textContent=verdict;

  status.textContent=`Vergleich aus ${common.length} gemeinsamen abgeschlossenen Spieltag${common.length===1?"":"en"}.`;
  status.className="duel-status";
  board.hidden=false;
}
function populate(){
  const sorted=[...state.participants].sort((a,b)=>
    a.name.localeCompare(b.name,"de",{sensitivity:"base"})
  );
  const makeOptions=()=>sorted.map(p=>{
    const o=document.createElement("option");o.value=p.id;o.textContent=p.name;return o;
  });
  selectA.replaceChildren(...makeOptions());selectB.replaceChildren(...makeOptions());
  if(sorted.length>1){selectA.value=sorted[0].id;selectB.value=sorted[1].id;}
}
Promise.all([loadJson("./teilnehmer.json"),loadJson("./spieltagpunkte.json"),loadJson("./highscore.json")])
  .then(([participants,days,highscore])=>{
    state.participants=activeParticipants(participants);
    state.days=completedDays(days);
    state.highscore=hsMap(highscore);
    if(state.participants.length<2) throw new Error("Zu wenige aktive Teilnehmer für ein Duell.");
    populate();render();
  })
  .catch(err=>{
    console.error(err);status.textContent="Duell-Daten konnten nicht vollständig geladen werden.";status.className="duel-status is-error";board.hidden=true;
  });
selectA.addEventListener("change",render);selectB.addEventListener("change",render);
})();
