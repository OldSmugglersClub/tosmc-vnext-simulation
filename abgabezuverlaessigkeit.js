(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { rows: [], filtered: [], games: new Map(), teams: new Map(), generated: null };
  const now = new Date();
  const load = async (file) => { const r = await fetch(file, {cache:"no-store"}); if(!r.ok) throw new Error(`${file}: HTTP ${r.status}`); return r.json(); };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const download = (name, content, type) => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); };
  const allGames = (data) => (data.saisons || []).flatMap(s => s.spiele || []);
  const gameDate = (g) => g.datum && g.anstoss ? new Date(`${g.datum}T${g.anstoss}:00`) : null;
  const labelFor = (g) => `${state.teams.get(g.heimTeamId)||g.heimTeamId||"?"} – ${state.teams.get(g.auswaertsTeamId)||g.auswaertsTeamId||"?"}`;
  const classify = (evaluated, quote, missing) => {
    if (!evaluated) return {key:"ohne-basis", label:"Noch keine Basis"};
    if (quote >= 98) return {key:"sehr-zuverlaessig", label:"Sehr zuverlässig"};
    if (quote >= 90) return {key:"zuverlaessig", label:"Zuverlässig"};
    if (quote >= 75 || missing <= 2) return {key:"beobachten", label:"Beobachten"};
    return {key:"kritisch", label:"Kritisch"};
  };
  function build(participants, tips, protocol, gameData, teamData){
    (teamData.teams || teamData.mannschaften || []).forEach(t => state.teams.set(t.id, t.name || t.kurzname || t.anzeige || t.id));
    const games = allGames(gameData).filter(g => g.terminBestaetigt === true && gameDate(g) && gameDate(g) < now).sort((a,b)=>gameDate(a)-gameDate(b));
    games.forEach(g => state.games.set(g.id,g));
    const tipSet = new Set((tips.tipps||[]).map(t => `${t.teilnehmerId}|${t.spielId}`));
    const reminderMap = new Map();
    (protocol.eintraege||[]).forEach(e => { const k=e.teilnehmerId; reminderMap.set(k,(reminderMap.get(k)||0)+1); });
    state.rows = (participants.teilnehmer||[]).filter(p=>p.aktiv!==false).map(p=>{
      const misses=[], history=[];
      games.forEach(g=>{ const submitted=tipSet.has(`${p.id}|${g.id}`); history.push(submitted); if(!submitted) misses.push({id:g.id,label:labelFor(g),deadline:gameDate(g).toISOString(),round:g.runde||""}); });
      const submitted=games.length-misses.length, quote=games.length ? Math.round(submitted/games.length*1000)/10 : 0;
      let streak=0; for(let i=history.length-1;i>=0 && history[i];i--) streak++;
      const status=classify(games.length,quote,misses.length);
      return {id:p.id,name:p.name||p.profil?.anzeigename||p.id,evaluated:games.length,submitted,missing:misses.length,quote,reminders:reminderMap.get(p.id)||0,streak,status,misses};
    });
    state.generated={schemaVersion:1,datenVersion:1,aktualisiert:new Date().toISOString(),saison:gameData.saisons?.find(s=>s.aktiv)?.anzeige||"2026/2027",hinweis:"Lesend erzeugte Auswertung bestätigter und bereits abgelaufener Tippfristen.",teilnehmer:state.rows};
  }
  function summary(){
    const withBasis=state.rows.filter(r=>r.evaluated), avg=withBasis.length?Math.round(withBasis.reduce((s,r)=>s+r.quote,0)/withBasis.length*10)/10:0;
    const totalMissing=state.rows.reduce((s,r)=>s+r.missing,0), critical=state.rows.filter(r=>r.status.key==="kritisch").length;
    $("summaryGrid").innerHTML=[
      ["Aktive Teilnehmer",state.rows.length],["Abgelaufene bestätigte Fristen",withBasis[0]?.evaluated||0],["Durchschnittliche Abgabequote",`${avg.toLocaleString("de-DE")} %`],["Fehlende Tipps",totalMissing],["Kritischer Status",critical]
    ].map(([l,v])=>`<article class="admin-card"><span>${esc(l)}</span><strong>${esc(v)}</strong></article>`).join("");
    $("statusBadge").textContent=withBasis.length?"Auswertung verfügbar":"Noch keine abgelaufene Frist";
  }
  function apply(){
    const q=$("searchInput").value.trim().toLowerCase(), sf=$("statusFilter").value, sort=$("sortSelect").value;
    let rows=state.rows.filter(r=>(!q||r.name.toLowerCase().includes(q))&&(sf==="all"||r.status.key===sf));
    rows.sort((a,b)=> sort==="name"?a.name.localeCompare(b.name,"de"):sort==="quote-asc"?a.quote-b.quote:sort==="missing-desc"?b.missing-a.missing:sort==="reminders-desc"?b.reminders-a.reminders:b.quote-a.quote || a.name.localeCompare(b.name,"de"));
    state.filtered=rows; renderRows();
  }
  function renderRows(){
    $("resultCount").textContent=`${state.filtered.length} Teilnehmer`;
    $("participantRows").innerHTML=state.filtered.length?state.filtered.map(r=>`<tr data-id="${esc(r.id)}" tabindex="0"><td><strong>${esc(r.name)}</strong></td><td><span class="status-pill ${r.status.key}">${esc(r.status.label)}</span></td><td><div class="quote-bar"><strong>${r.quote.toLocaleString("de-DE")} %</strong><div class="quote-track"><div class="quote-fill" style="width:${Math.max(0,Math.min(100,r.quote))}%"></div></div></div></td><td>${r.evaluated}</td><td>${r.submitted}</td><td>${r.missing}</td><td>${r.reminders}</td><td>${r.streak}</td></tr>`).join(""):`<tr><td colspan="8">Keine Teilnehmer entsprechen dem Filter.</td></tr>`;
    $("participantRows").querySelectorAll("tr[data-id]").forEach(tr=>{ const open=()=>showDetail(tr.dataset.id); tr.addEventListener("click",open); tr.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}}); });
  }
  function showDetail(id){
    const r=state.rows.find(x=>x.id===id); if(!r)return;
    $("detailBadge").textContent=r.name;
    const missed=r.misses.length?`<h3>Versäumte bestätigte Fristen</h3><ul class="miss-list">${r.misses.slice().reverse().map(m=>`<li><strong>${esc(m.label)}</strong><br>${esc(m.round)} · ${new Date(m.deadline).toLocaleString("de-DE")}</li>`).join("")}</ul>`:"<p>Keine versäumte bestätigte Frist vorhanden.</p>";
    $("detailPanel").innerHTML=`<h3>${esc(r.name)}</h3><div class="detail-grid"><div class="detail-card">Abgabequote<strong>${r.quote.toLocaleString("de-DE")} %</strong></div><div class="detail-card">Abgegeben<strong>${r.submitted}</strong></div><div class="detail-card">Fehlend<strong>${r.missing}</strong></div><div class="detail-card">Erinnerungen<strong>${r.reminders}</strong></div></div>${missed}`;
  }
  function exportJson(){ download("abgabezuverlaessigkeit.json",JSON.stringify(state.generated,null,2)+"\n","application/json"); }
  function exportCsv(){ const lines=[["Teilnehmer","Status","Abgabequote Prozent","Gewertete Fristen","Abgegeben","Fehlend","Erinnerungen","Aktuelle Serie"],...state.rows.map(r=>[r.name,r.status.label,String(r.quote).replace(".",","),r.evaluated,r.submitted,r.missing,r.reminders,r.streak])]; download("abgabezuverlaessigkeit.csv",lines.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n")+"\n","text/csv;charset=utf-8"); }
  async function init(){
    try{
      const [participants,tips,protocol,games,teams]=await Promise.all([load("teilnehmer.json"),load("tipps.json"),load("erinnerungsprotokoll.json"),load("spieldaten.json"),load("teams.json")]);
      build(participants,tips,protocol,games,teams); summary(); apply(); $("jsonButton").disabled=false; $("csvButton").disabled=false;
    }catch(err){ $("statusBadge").textContent="Ladefehler"; $("summaryGrid").innerHTML=`<p>${esc(err.message)}</p>`; }
  }
  ["searchInput","statusFilter","sortSelect"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",apply));
  $("jsonButton").addEventListener("click",exportJson); $("csvButton").addEventListener("click",exportCsv); init();
})();
