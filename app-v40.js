const $=id=>document.getElementById(id);const iconSvg={trophy:'<svg viewBox="0 0 50 50"><path d="M14 8h22v13c0 10-5 16-11 16s-11-6-11-16zM14 13H6v6c0 8 4 13 10 14M36 13h8v6c0 8-4 13-10 14M25 37v7M16 46h18"/></svg>',target:'<svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="18"/><circle cx="25" cy="25" r="10"/><circle cx="25" cy="25" r="3"/><path d="M28 22l14-14M34 8h8v8"/></svg>',star:'<svg viewBox="0 0 50 50"><path d="M25 5l6 13 14 2-10 10 3 14-13-7-13 7 3-14L5 20l14-2z"/></svg>'};function pad(n){return String(n).padStart(2,'0')}async function boot(){
try{
const response=await fetch('./site-data.json?v=40-0',{cache:'no-store'});
if(!response.ok)throw new Error(`HTTP ${response.status}`);
const d=await response.json();const target=new Date(d.kickoff).getTime();const tick=()=>{let x=Math.max(0,target-Date.now());$('days').textContent=pad(Math.floor(x/86400000));$('hours').textContent=pad(Math.floor(x%86400000/3600000));$('minutes').textContent=pad(Math.floor(x%3600000/60000));$('seconds').textContent=pad(Math.floor(x%60000/1000))};tick();setInterval(tick,1000);$('matchGrid').innerHTML=d.matches.map(m=>`<div class="match-card"><small>${m.day}</small><div class="teams"><i class="team-dot" style="background:${m.hc}">${m.home}</i><span class="vs">VS</span><i class="team-dot" style="background:${m.ac};color:#111">${m.away}</i></div><strong>${m.time}</strong><em>${m.venue}</em></div>`).join('');$('tableBody').innerHTML=d.table.map(r=>`<tr><td>${r[0]}</td><td class="team-name"><i class="club-mini" style="background:${r[9]}"></i>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td><td>${r[8]}</td></tr>`).join('');$('statsGrid').innerHTML=d.stats.map(s=>`<div class="stat">${iconSvg[s.icon]}<div><span>${s.title}</span><strong>${s.name}</strong><small>– ${s.unit}</small></div></div>`).join('');$('championName').textContent=d.champion.name;$('championTitle').textContent=d.champion.title;$('cPoints').textContent=d.champion.points;$('cBonus').textContent=d.champion.bonus;$('cExact').textContent=d.champion.exact
}catch(error){
console.error('Seitendaten konnten nicht geladen werden:',error);
const matchGrid=$('matchGrid');
if(matchGrid)matchGrid.innerHTML='<div class="data-error">Spieltagsdaten werden nach Veröffentlichung ergänzt.</div>';
const tableBody=$('tableBody');
if(tableBody)tableBody.innerHTML='<tr><td colspan="9">Die Tabelle erscheint nach dem Saisonstart.</td></tr>';
const statsGrid=$('statsGrid');
if(statsGrid)statsGrid.innerHTML='<div class="data-error">Tippspielstatistiken sind noch nicht verfügbar.</div>';
}
}document.addEventListener('DOMContentLoaded',()=>{$('menuBtn').addEventListener('click',()=>{$('nav').classList.toggle('open')});boot()});