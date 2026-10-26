const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0);const fmt=(v,d=0)=>num(v).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});const fmtMatchdayWins=v=>{const n=num(v);return Number.isInteger(n)?fmt(n):n.toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:2});};
const catalog=[['overall','Gesamtwertung'],['bundesliga','Bundesliga'],['champions-league','Champions League'],['europa-league','Europa League'],['dfb-pokal','DFB-Pokal'],['relegation','Relegation'],['piratenkodex','Piratenkodex'],['smugglerauftraege','Smuggleraufträge'],['weihnachtsregatta','Weihnachtsregatta']];
let source={};let teamOverallData=null;let teamOverallError='';let teamOverallPromise=null;let scope='overall';let view='individual';let query='';let page=1;const pageSize=25;
window.OSCHighscoreGoToPage=function(requested){
 requested=Number.parseInt(requested,10);
 if(!Number.isInteger(requested)||requested<1||requested===page)return false;
 page=requested;
 renderTable();
 const panel=$('table-panel');
 if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});
 return false;
};
const $=id=>document.getElementById(id);
function firstNonEmptyArray(...values){for(const value of values){if(Array.isArray(value)&&value.length)return value;}for(const value of values){if(Array.isArray(value))return value;}return [];}function normalizeLegacy(d){d=d||{};const overall=d.overall||{};d.overall={individual:firstNonEmptyArray(overall.individual,d.individual?.overall),team:firstNonEmptyArray(overall.team,d.gesamt?.team,d.teams?.overall,d.teamOverall),bonus:firstNonEmptyArray(overall.bonus,d.individual?.bonus)};d.competitions=d.competitions||d.wettbewerbe||{};return d;}
// Team-Gesamtwertung: historische Ranglistenteilnehmer einschliesslich inzwischen inaktiver Mitglieder zuordnen.
// Nur die Team-Gesamtansicht liest die jeweils aktuelle Teilnehmerzuordnung nach.
// Keine Speicherung von kumulierten Werten in der Spieltags-Teamwertung.
function computeEventTeamOverall(db,highscore){
 const members=db?.stammdaten?.teilnehmer;
 if(!Array.isArray(members))throw new Error('Teamzuordnungen fehlen in spielbetrieb.json.');
 const memberById=new Map();
 for(const m of members){if(m?.id&&['Old Smugglers Team','New Smugglers Team'].includes(m.team)){
  if(memberById.has(m.id))throw new Error('Teilnehmer-ID mehrfach vorhanden.');
  memberById.set(m.id,m.team);
 }}
 const result={};
 for(const [key,competition] of Object.entries(highscore.competitions||{})){
  const standings=competition?.overall;
  if(!Array.isArray(standings)||standings.length===0){result[key]=[];continue;}
  const totals=new Map([['New Smugglers Team',{name:'New Smugglers Team',memberCount:0,pointsSum:0}],['Old Smugglers Team',{name:'Old Smugglers Team',memberCount:0,pointsSum:0}]]);
  const seen=new Set();let invalid=false;
  for(const row of standings){
   const id=row?.participantId,team=memberById.get(id),points=row?.totalPoints;
   if(!id||seen.has(id)||!team||typeof points!=='number'||!Number.isFinite(points)){invalid=true;break;}
   seen.add(id);const t=totals.get(team);t.memberCount++;t.pointsSum+=points;
  }
  // Fehlende Spieler, doppelte Kennungen oder unbekannte Teamzuordnungen nie still ersetzen.
  if(invalid||[...totals.values()].some(t=>t.memberCount===0)){
   result[key]=[];continue;
  }
  result[key]=[...totals.values()].map(t=>({...t,averagePoints:Math.round(t.pointsSum/t.memberCount*100)/100,source:'Berechnet aus Einzel-Gesamtwertung'}))
    .sort((a,b)=>b.averagePoints-a.averagePoints||a.name.localeCompare(b.name,'de'))
    .map((t,i)=>({...t,rank:i+1}));
 }
 return result;
}
async function loadEventTeamOverall(){
 if(teamOverallData||teamOverallPromise)return teamOverallPromise;
 teamOverallError='';
 teamOverallPromise=fetch('./spielbetrieb.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Spielbetriebsdaten nicht verfügbar.');return r.json();})
 .then(db=>{teamOverallData=computeEventTeamOverall(db,source);})
 .catch(e=>{teamOverallError=e?.message||'Daten konnten nicht gelesen werden.';})
 .finally(()=>{teamOverallPromise=null;if(view==='teamOverall')render();});
 return teamOverallPromise;
}
function current(){if(scope==='overall')return source.overall||{};return source.competitions?.[scope]||{id:scope,label:catalog.find(x=>x[0]===scope)?.[1]||scope,matchday:[],overall:[],team:[]};}
function views(){return scope==='overall'?[['individual','Gesamt-Einzelwertung'],['team','Gesamt-Teamwertung'],['bonus','Gesamt-Bonuswertung']]:[['matchday','Spieltagswertung'],['individual','Gesamtwertung'],['team','Spieltags-Teamwertung'],['teamOverall','Gesamt-Teamwertung']];}
function rows(){const c=current();if(scope==='overall'){if((view==='team'||view==='teamOverall'))return firstNonEmptyArray(c.team,source.teams?.overall,source.gesamt?.team,source.teamOverall);if(view==='bonus')return c.bonus||[];return c.individual||[];}if(view==='matchday')return c.matchday||[];if(view==='team')return c.team||[];if(view==='teamOverall')return teamOverallData?.[scope]||[];return c.overall||[];}
function rowRank(r,i){return r.rank??r.platz??i+1;}function rowName(r){return r.name||r.teilnehmer||r.team||'–';}function rowPoints(r){if((view==='team'||view==='teamOverall')||view==='teamOverall')return r.averagePoints??r.durchschnitt??r.totalPoints??0;if(view==='bonus')return r.bonusPoints??r.points??0;if(view==='matchday')return r.points??r.punkte??0;return r.totalPoints??r.punkte??0;}
function allZero(list){return !list.length||list.every(r=>rowPoints(r)===0);}
function rankBonusRows(list){
 const copy=[...(Array.isArray(list)?list:[])].map((row,index)=>({...row,__sourceIndex:index,bonusPoints:Number(row?.bonusPoints??row?.points??0)}));
 copy.sort((a,b)=>Number(b.bonusPoints||0)-Number(a.bonusPoints||0)||a.__sourceIndex-b.__sourceIndex);
 let previous=null,currentRank=0;
 return copy.map((row,index)=>{const bonus=Number(row.bonusPoints||0);if(index===0||bonus!==previous)currentRank=index+1;previous=bonus;const {__sourceIndex,...clean}=row;return {...clean,rank:currentRank};});
}
function sortedRows(list){
 const copy=[...(Array.isArray(list)?list:[])];
 if(view==='bonus')return rankBonusRows(copy);
 if(allZero(copy))return copy.sort((a,b)=>rowName(a).localeCompare(rowName(b),'de',{sensitivity:'base'}));
 return copy;
}
function renderTabs(){
 $('competition-tabs').innerHTML=catalog.map(([id,label])=>`<button class="hs-main-tab ${scope===id?'is-active':''}" data-scope="${id}" aria-pressed="${scope===id}">${esc(label)}</button>`).join('');
 const allowed=views();if(!allowed.some(x=>x[0]===view))view=allowed[0][0];
 $('view-tabs').classList.toggle('hs-view-tabs--event',scope!=='overall');
 $('view-tabs').innerHTML=scope==='overall'
   ? allowed.map(([id,label])=>`<button class="hs-chip ${view===id?'is-active':''}" data-view="${id}" aria-pressed="${view===id}">${esc(label)}</button>`).join('')
   : `<button class="hs-chip ${view==='matchday'?'is-active':''}" data-view="matchday" aria-pressed="${view==='matchday'}">Spieltagswertung</button><button class="hs-chip ${view==='individual'?'is-active':''}" data-view="individual" aria-pressed="${view==='individual'}">Gesamtwertung</button><label class="hs-team-select-wrap ${(view==='team'||view==='teamOverall')?'is-active':''}"><span class="sr-only">Teamwertung auswählen</span><span class="hs-team-select-mobile-label" aria-hidden="true"><span>Teamwertung</span><small>${view==='team'?'Spieltag':view==='teamOverall'?'Gesamt':'Auswählen'}</small></span><select class="hs-team-select" id="hs-team-select" aria-label="Teamwertung auswählen"><option value="" disabled ${(view!=='team'&&view!=='teamOverall')?'selected':''}>Teamwertung auswählen</option><option value="team" ${view==='team'?'selected':''}>Spieltags-Teamwertung</option><option value="teamOverall" ${view==='teamOverall'?'selected':''}>Gesamt-Teamwertung</option></select></label>`;
 $('competition-tabs').querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;view=scope==='overall'?'individual':'matchday';query='';page=1;$('player-search').value='';render();});
 $('view-tabs').querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;query='';page=1;$('player-search').value='';render();if(view==='teamOverall')loadEventTeamOverall();});
 const teamSelect=$('hs-team-select');if(teamSelect)teamSelect.onchange=()=>{if(!['team','teamOverall'].includes(teamSelect.value))return;view=teamSelect.value;query='';page=1;$('player-search').value='';render();if(view==='teamOverall')loadEventTeamOverall();};
}
function renderSummary(list){
 const c=current(),scopeLabel=scope==='overall'?'Saison gesamt':c.label||catalog.find(x=>x[0]===scope)?.[1]||scope;
 const viewLabel=views().find(x=>x[0]===view)?.[1]||view;
 $('summary-scope').textContent=scopeLabel;$('summary-view').textContent=viewLabel;
 const zero=allZero(list),leader=zero?null:list[0];
 const sharedLeaders=!zero&&view!=='team'&&view!=='teamOverall'&&view!=='bonus'?list.filter(r=>Number(rowRank(r,0))===1):[];
 const shared=sharedLeaders.length>1;
 $('summary-leader-label').textContent=(view==='team'||view==='teamOverall')?'Führendes Team':view==='bonus'?'Bonusführer':shared?'Gemeinsam Führende':'Führender';
 $('summary-leader').textContent=shared?`${sharedLeaders.length} Spieler`:leader?rowName(leader):'Noch offen';
 $('summary-leader-points').textContent=shared?`je ${fmt(rowPoints(sharedLeaders[0]))} Punkte`:leader?`${fmt(rowPoints(leader),(view==='team'||view==='teamOverall')?2:0)} Punkte`:'Noch ohne Wertung';
 const teams=(scope==='overall'?source.overall?.team:view==='teamOverall'?teamOverallData?.[scope]:c.team)||[];
 const old=teams.find(x=>/old/i.test(rowName(x))),neu=teams.find(x=>/new/i.test(rowName(x)));
 const a=num(old?.averagePoints??old?.durchschnitt??old?.totalPoints),b=num(neu?.averagePoints??neu?.durchschnitt??neu?.totalPoints);
 $('summary-team-label').textContent=scope==='overall'?'Saison-Teamduell':'Teamduell';
 $('summary-team').textContent=a===b?'Gleichstand':a>b?'Old Smugglers':'New Smugglers';
 $('summary-team-points').textContent=a===b?`${fmt(a,2)} : ${fmt(b,2)} Punkte`:a>b?`${fmt(a,2)} : ${fmt(b,2)} Punkte`:`${fmt(b,2)} : ${fmt(a,2)} Punkte`;
 const count=(view==='team'||view==='teamOverall')?list.length:(source.meta?.participantCount||source.overall?.individual?.length||list.length);
 $('summary-count-label').textContent=(view==='team'||view==='teamOverall')?'Teams':'Teilnehmer';
 $('summary-participants').textContent=String(count);
 $('summary-count-subtitle').textContent=(view==='team'||view==='teamOverall')?'im direkten Vergleich':'aktive Smuggler';
}
function podiumCard(r,pos,zero){
 const isTeam=(view==='team'||view==='teamOverall');
 const score=isTeam?fmt(rowPoints(r),2):fmt(rowPoints(r));
 const scoreLabel=isTeam?'Durchschnitt':'Punkte';
 const detailLine=zero?'Noch ohne Wertung':isTeam?`${fmt(r.pointsSum??r.punktesumme??r.totalPoints??0,1)} gesamt · ${num(r.memberCount??r.mitglieder)} Mitglieder`:view==='bonus'?'Bonuswertung':'Aktueller Rang';
 const medalClass=pos===1?'gold':pos===2?'silver':'bronze';
 return `<article class="hs-rank-card hs-rank-card--${medalClass} hs-rank-card--place-${pos}">
   <div class="hs-rank-medal" aria-hidden="true">${zero?'–':pos}</div>
   <strong class="hs-rank-name">${esc(rowName(r))}</strong>
   <div class="hs-rank-score"><b>${score}</b><span>${scoreLabel}</span></div>
   <small>${detailLine}</small>
 </article>`;
}
function leaderCard(r){
 const score=fmt(rowPoints(r));
 const rank=Number(rowRank(r,0));
 return `<article class="hs-tie-card">
   <div class="hs-tie-rank" aria-hidden="true">${rank}</div>
   <strong class="hs-tie-name">${esc(rowName(r))}</strong>
   <div class="hs-tie-score"><b>${score}</b><span>Punkte</span></div>
 </article>`;
}
function renderPodium(list){
 document.body.dataset.view=view;
 const podium=$('podium');
 const zero=allZero(list);
 $('ranking-notice').textContent='';
 $('ranking-notice').hidden=true;

 if(zero){
   podium.className='hs-podium hs-podium--empty';
   podium.innerHTML='<div class="hs-podium-empty-state"><strong>Das Führungsdeck ist noch unbesetzt.</strong><span>Nach der ersten bestätigten Wertung erscheint hier die aktuelle Spitze.</span></div>';
   return;
 }

 // Top 3 bezeichnet Rangplaetze, nicht maximal drei Personen.
 // Bei Gleichstand alle Spieler mit offiziellem Rang 1, 2 oder 3 anzeigen.
 // Teamkarten nutzen weiterhin die bestehende gesonderte Darstellung.
 const isIndividual=view!=='team'&&view!=='teamOverall';
 const topRanks=isIndividual?list.filter(r=>{
   const rank=Number(rowRank(r,0));
   return Number.isInteger(rank)&&rank>=1&&rank<=3;
 }):[];
 const tiedRanks=isIndividual&&topRanks.some((r,i)=>topRanks.findIndex(x=>Number(rowRank(x,0))===Number(rowRank(r,0)))!==i);
 if(tiedRanks){
   const rankGroups=[1,2,3].map(rank=>({rank,rows:topRanks.filter(r=>Number(rowRank(r,0))===rank)})).filter(group=>group.rows.length);
   const tieInfo=rankGroups.filter(group=>group.rows.length>1).map(group=>`${group.rows.length} ${group.rows.length===1?'Freibeuter':'Freibeuter'} teilen sich Rang ${group.rank}`).join(' · ');
   podium.className='hs-podium hs-podium--simple hs-podium--tie';
   podium.innerHTML=`<div class="hs-simple-deck">
     <header class="hs-simple-banner"><span>Das Führungsdeck</span><strong>${esc(tieInfo)}</strong><small>Alle Spieler auf den Rängen 1 bis 3</small></header>
     <div class="hs-tie-grid">${topRanks.map(leaderCard).join('')}</div>
   </div>`;
   return;
 }

 const top=list.slice(0,3);
 const count=top.length;
 podium.className=`hs-podium hs-podium--simple hs-podium--ranked hs-podium--count-${count}`;
 podium.innerHTML=top.length?`<div class="hs-simple-deck">
   <header class="hs-simple-banner"><span>Das Führungsdeck</span><small>Die aktuelle Spitze der Highscore</small></header>
   <div class="hs-rank-grid hs-rank-grid--count-${count}">${top.map((r,i)=>podiumCard(r,i+1,false)).join('')}</div>
 </div>`:'<p class="hs-empty">Noch keine Daten vorhanden.</p>';
}
function paginationHtml(total){
 const pages=Math.max(1,Math.ceil(total/pageSize));
 page=Math.min(Math.max(1,page),pages);
 if(total<=pageSize)return '';
 const button=(label,target,disabled=false,active=false,aria='')=>`<button class="hs-page-btn ${active?'is-active':''}" type="button" data-page="${target}" onclick="return window.OSCHighscoreGoToPage(${target})" ${disabled?'disabled':''} ${aria}>${label}</button>`;
 const nums=Array.from({length:pages},(_,i)=>i+1).map(n=>button(String(n),n,false,n===page,`aria-label="Seite ${n}" aria-current="${n===page?'page':'false'}"`)).join('');
 return `<nav class="hs-pagination" aria-label="Ranglistenseiten">${button('Zurück',page-1,page===1)}<span>Einträge ${(page-1)*pageSize+1}–${Math.min(page*pageSize,total)} von ${total}</span><div class="hs-page-numbers">${nums}</div>${button('Weiter',page+1,page===pages)}</nav>`;
}
function paginationButtonFromEvent(event,container){
 const target=event?.target;
 if(!target)return null;
 const element=target.nodeType===1?target:target.parentElement;
 const button=element?.closest?.('button[data-page]');
 return button&&container.contains(button)?button:null;
}
function bindPagination(){
 ['pagination-top','pagination-bottom'].forEach(id=>{
  const container=$(id);
  if(!container)return;
  container.onpointerup=null;
  container.onclick=null;
 });
}

function renderTable(){
 const list=rows();
 const team=(view==='team'||view==='teamOverall');
 const bonus=view==='bonus';
 const matchday=view==='matchday';
 const competitionOverall=scope!=='overall'&&view==='individual';
 const tableWrap=$('ranking-body').closest('.hs-table-wrap');
 if(tableWrap){
   tableWrap.classList.toggle('is-team-table',team);
   tableWrap.classList.toggle('is-individual-table',view==='individual');
   tableWrap.classList.toggle('is-matchday-table',matchday);
   tableWrap.classList.toggle('is-bonus-table',bonus);
   tableWrap.classList.toggle('is-competition-overall-table',competitionOverall);
 }
 $('search-box').hidden=false;
 const searchLabel=$('search-box').querySelector('span');
 if(searchLabel)searchLabel.textContent=team?'Team suchen':'Spieler suchen';
 let base=sortedRows(list);
 let filtered=base.filter(r=>rowName(r).toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 page=Math.min(page,pages);
 const shown=team?filtered:filtered.slice((page-1)*pageSize,page*pageSize);
 $('toolbar-count').textContent=`${filtered.length} ${team?'Teams':'Spieler'}`;

 $('ranking-head').innerHTML=
   team?'<tr><th>Rang</th><th>Team</th><th>Mitglieder</th><th>Punktesumme</th><th>Durchschnitt</th></tr>':
   bonus?'<tr><th>Rang</th><th>Spieler</th><th>Bonuspunkte</th></tr>':
   matchday?'<tr><th>Rang</th><th>Spieler</th><th>Punkte</th><th>Exakt</th><th>Differenz</th><th>Tendenz</th></tr>':
   competitionOverall?'<tr><th>Rang</th><th>Spieler</th><th>Exakt</th><th>Differenz</th><th>Tendenz</th><th>Spieltagsiege</th><th>Gesamtpunkte</th></tr>':
   '<tr><th>Rang</th><th>Spieler</th><th>Bonuspunkte</th><th>Spieltagsiege</th><th>Gesamtpunkte</th></tr>';

 $('ranking-body').innerHTML=shown.map((r,i)=>{
   const absoluteIndex=team?i:(page-1)*pageSize+i;
   return team?
     `<tr><td>${esc(rowRank(r,absoluteIndex))}</td><td>${esc(rowName(r))}</td><td>${num(r.memberCount??r.mitglieder)}</td><td>${fmt(r.pointsSum??r.punktesumme??0,1)}</td><td>${fmt(rowPoints(r),2)}</td></tr>`:
   bonus?
     `<tr><td>${esc(rowRank(r,absoluteIndex))}</td><td>${esc(rowName(r))}</td><td>${fmt(rowPoints(r))}</td></tr>`:
   matchday?
     `<tr><td>${esc(rowRank(r,absoluteIndex))}</td><td>${esc(rowName(r))}</td><td>${fmt(rowPoints(r))}</td><td>${fmt(r.exactHits??r.exakt)}</td><td>${fmt(r.differenceHits??r.differenz)}</td><td>${fmt(r.tendencyHits??r.tendenz)}</td></tr>`:
   competitionOverall?
     `<tr><td>${esc(rowRank(r,absoluteIndex))}</td><td>${esc(rowName(r))}</td><td>${fmt(r.exactHits??r.exakt)}</td><td>${fmt(r.differenceHits??r.differenz)}</td><td>${fmt(r.tendencyHits??r.tendenz)}</td><td>${fmtMatchdayWins(r.matchdayWins)}</td><td>${fmt(rowPoints(r))}</td></tr>`:
     `<tr><td>${esc(rowRank(r,absoluteIndex))}</td><td>${esc(rowName(r))}</td><td>${fmt(r.bonusPoints)}</td><td>${fmtMatchdayWins(r.matchdayWins)}</td><td>${fmt(rowPoints(r))}</td></tr>`;
 }).join('')||'<tr><td colspan="7">Keine passenden Einträge.</td></tr>';

 const nav=team?'':paginationHtml(filtered.length);
 $('pagination-top').innerHTML=nav;
 $('pagination-bottom').innerHTML=nav;

 const labels=
   team?['Rang','Team','Mitglieder','Punktesumme','Durchschnitt']:
   bonus?['Rang','Spieler','Bonuspunkte']:
   matchday?['Rang','Spieler','Punkte','Exakt','Differenz','Tendenz']:
   competitionOverall?['Rang','Spieler','Exakt','Differenz','Tendenz','S','Punkte']:
   ['Rang','Spieler','Bonus','S','Punkte'];

 $('ranking-body').querySelectorAll('tr').forEach(tr=>tr.querySelectorAll('td').forEach((td,index)=>{if(labels[index])td.dataset.label=labels[index];}));
 bindPagination();
}
function render(){renderTabs();const list=sortedRows(rows());const c=current(),scopeLabel=scope==='overall'?'Saison gesamt':c.label||catalog.find(x=>x[0]===scope)?.[1]||scope,viewLabel=views().find(x=>x[0]===view)?.[1]||view;const displayTitle=scope==='overall'?viewLabel:`${scopeLabel} · ${viewLabel}`;$('ranking-title').textContent=displayTitle;$('table-title').textContent=displayTitle;$('ranking-caption').textContent=scope!=='overall'&&(view==='matchday'||view==='team')?(c.matchdayLabel||'Aktueller Spieltag'):view==='teamOverall'?'Kumulierte Teamwertung des Wettbewerbs · aus Einzel-Gesamtpunkten berechnet':'Aktueller bestätigter Datenstand';$('toolbar-scope').textContent=scopeLabel;$('toolbar-view').textContent=viewLabel;renderSummary(list);renderPodium(list);renderTable();const diag=source.adapterDiagnostics||{};const missingTeams=scope==='overall'&&(view==='team'||view==='teamOverall')&&list.length===0;const missingEventTeam=scope!=='overall'&&view==='teamOverall'&&!list.length;const warning=diag.warning||(missingTeams?'Für diese Auswahl sind derzeit keine vollständigen Teamdaten verfügbar.':missingEventTeam?(teamOverallError||'Für diesen Wettbewerb sind noch keine vollständigen Team-Gesamtwerte verfügbar.'):'');$('hs-system-status').className=warning?'hs-system-status is-error':'hs-system-status is-ready';$('hs-system-status').innerHTML=`<strong>${warning?'Daten nicht vollständig':'Daten geladen'}</strong><span>${warning?esc(warning):'Aktuelle Ranglisten verfügbar.'}</span>`;}
$('player-search').addEventListener('input',e=>{query=e.target.value;page=1;renderTable();});
window.OSCHighscoreDataAdapter.loadHighscore().then(d=>{source=normalizeLegacy(d);render();}).catch(e=>{$('hs-system-status').className='hs-system-status is-error';$('hs-system-status').innerHTML=`<strong>Highscore nicht verfügbar</strong><span>${esc(e.message)}</span>`;});
