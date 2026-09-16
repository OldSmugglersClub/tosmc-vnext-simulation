(function(){
  'use strict';

  const byId=id=>document.getElementById(id);
  const number=value=>Number(value||0);
  const format=(value,digits=0)=>number(value).toLocaleString('de-DE',{
    minimumFractionDigits:digits,
    maximumFractionDigits:digits
  });
  const nameOf=row=>row?.name||row?.team||'–';
  const totalOf=row=>number(row?.totalPoints??row?.points??row?.punkte);
  const averageOf=row=>number(row?.averagePoints??row?.durchschnitt??row?.totalPoints);
  const set=(id,value)=>{const node=byId(id);if(node)node.textContent=value;};

  function overallIndividuals(data){
    return data?.overall?.individual||data?.individual?.overall||[];
  }

  function overallTeams(data){
    return data?.overall?.team||data?.teams?.overall||[];
  }

  function competitions(data){
    return data?.competitions||data?.wettbewerbe||{};
  }

  function currentMatchday(data){
    const entries=Object.values(competitions(data)).filter(item=>item&&typeof item==='object');
    const withLeader=entries.filter(item=>item.matchdayLeader||item.spieltagLeader);
    const withLabel=entries.filter(item=>item.matchdayLabel||item.spieltagLabel);
    const withRows=entries.filter(item=>Array.isArray(item.matchday)&&item.matchday.length);
    const item=withLeader.at(-1)||withLabel.at(-1)||withRows.at(-1)||null;
    const label=data?.meta?.matchday||data?.meta?.lastMatchday||item?.matchdayLabel||item?.spieltagLabel||'Aktueller Spieltag';
    const rows=item?.matchday||[];
    const declared=item?.matchdayLeader||item?.spieltagLeader||null;
    const leader=declared||rows.find(row=>totalOf(row)>0)||null;
    const leaders=rows.filter(row=>Number(row?.rank??row?.platz)===1);
    return {label,leader,leaders};
  }

  function renderIndividuals(data){
    const rows=overallIndividuals(data);
    const leader=rows.find(row=>totalOf(row)>0)||null;
    set('hs-leader-name',leader?nameOf(leader):'Saisonstart');
    set('hs-leader-points',leader?`${format(totalOf(leader))} Punkte`:'Alle starten bei 0 Punkten');
  }

  function compactMatchdayLabel(label){
    return String(label||'Aktueller Spieltag')
      .replace(/(\d+)\.\s*Spieltag/gi,'$1.\u00a0Spieltag');
  }

  const competitionLabels={
    'smugglerauftraege':'Smuggleraufträge',
    'bundesliga':'Bundesliga',
    'champions-league':'Champions League',
    'europa-league':'Europa League',
    'dfb-pokal':'DFB-Pokal',
    'relegation':'Relegation',
    'piratenkodex':'Piratenkodex',
    'weihnachtsregatta':'Weihnachtsregatta'
  };

  function renderCompetitionOverall(data,key){
    const item=competitions(data)?.[key]||{};
    const rows=Array.isArray(item.overall)?item.overall:[];
    // Die Reihenfolge der importierten Kicktipp-Gesamtwertung ist verbindlich.
    // Keine eigene Sortierung/Gleichstandsauflösung im Teaser.
    const leader=rows[0]||null;
    const labelNode=byId('hs-competition-label');
    if(labelNode){
      if(key==='smugglerauftraege'){
        labelNode.innerHTML='Smuggler<br class="hs-desktop-break">Aufträge';
      }else{
        labelNode.textContent=competitionLabels[key]||key;
      }
    }
    set('hs-matchday-name',leader?nameOf(leader):'Gesamtstand');
    set('hs-matchday-winner',leader?`${format(totalOf(leader))} Punkte`:'Noch ohne Wertung');
  }

  function initCompetitionPicker(data){
    const picker=byId('hs-competition-picker');
    const toggle=byId('hs-competition-toggle');
    const menu=byId('hs-competition-menu');
    if(!picker||!toggle||!menu)return;
    const available=Object.entries(competitions(data)).filter(([,item])=>Array.isArray(item?.overall)&&item.overall.length);
    const defaultKey=available.some(([key])=>key==='smugglerauftraege')?'smugglerauftraege':available[0]?.[0];
    if(!defaultKey){ renderCompetitionOverall(data,'smugglerauftraege'); picker.hidden=true; return; }
    menu.replaceChildren();
    available.forEach(([key])=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='hs-competition-option';
      button.textContent=competitionLabels[key]||key;
      button.dataset.competition=key;
      button.setAttribute('role','menuitem');
      button.addEventListener('click',()=>{
        renderCompetitionOverall(data,key);
        menu.hidden=true;
        toggle.setAttribute('aria-expanded','false');
      });
      menu.appendChild(button);
    });
    renderCompetitionOverall(data,defaultKey);
    picker.hidden=available.length<1;
    toggle.addEventListener('click',event=>{
      event.stopPropagation();
      const open=menu.hidden;
      menu.hidden=!open;
      toggle.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',event=>{
      if(!picker.contains(event.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}
    });
  }

  function renderTeams(data){
    const teams=overallTeams(data);
    const oldTeam=teams.find(team=>/old\s*smugglers/i.test(nameOf(team)));
    const newTeam=teams.find(team=>/new\s*smugglers/i.test(nameOf(team)));
    const oldAverage=averageOf(oldTeam);
    const newAverage=averageOf(newTeam);
    const label=oldAverage===newAverage?'Gleichstand':oldAverage>newAverage?'Old Smugglers':'New Smugglers';
    set('hs-team-leader',label);
    set('hs-team-points',label==='Old Smugglers'?`${format(oldAverage,2)} : ${format(newAverage,2)} Punkte`:label==='New Smugglers'?`${format(newAverage,2)} : ${format(oldAverage,2)} Punkte`:`${format(oldAverage,2)} : ${format(newAverage,2)} Punkte`);
  }

  async function init(){
    try{
      const data=await window.OSCHighscoreDataAdapter.loadHighscore();
      renderIndividuals(data);
      initCompetitionPicker(data);
      renderTeams(data);
    }catch(error){
      console.warn('Highscore konnte nicht geladen werden.',error);
    }
  }

  init();
})();
