(function(){
  'use strict';
  const cache=new Map();

  async function readJson(path){
    if(cache.has(path)) return cache.get(path);
    const promise=fetch(path,{cache:'no-store'}).then(response=>{
      if(!response.ok) throw new Error(path+' konnte nicht geladen werden: '+response.status);
      return response.json();
    });
    cache.set(path,promise);
    return promise;
  }

  async function first(paths){
    let lastError;
    for(const path of paths){
      try{return {path,data:await readJson(path)}}catch(error){lastError=error}
    }
    throw lastError||new Error('Keine Datenquelle verfügbar.');
  }

  function firstArray(){
    for(const value of arguments){if(Array.isArray(value)&&value.length)return value;}
    for(const value of arguments){if(Array.isArray(value))return value;}
    return [];
  }

  function normalizeHighscore(input,sourcePath){
    const envelope=input||{};
    const root=(envelope.highscore&&typeof envelope.highscore==='object')?envelope.highscore:envelope;
    const gesamt=root.gesamt||{};
    const legacyOverall=root.overall||{};
    const teamSources=root.teams||envelope.teams||{};
    const normalized={...root};

    normalized.overall={
      individual:firstArray(legacyOverall.individual,gesamt.individual,root.individual?.overall,envelope.individual?.overall),
      team:firstArray(legacyOverall.team,gesamt.team,teamSources.overall,root.teamOverall,envelope.teamOverall),
      bonus:firstArray(legacyOverall.bonus,gesamt.bonus,root.individual?.bonus,envelope.individual?.bonus)
    };
    normalized.teams=teamSources;
    normalized.competitions=root.competitions||root.wettbewerbe||{};
    normalized.meta={
      ...(root.meta||{}),
      season:root.meta?.season||envelope.saison||'',
      participantCount:root.meta?.participantCount||normalized.overall.individual.length
    };
    normalized.adapterDiagnostics={
      sourcePath,
      fallbackUsed:sourcePath!=='./website-view.json',
      overallTeams:normalized.overall.team.length,
      sourceHasGesamtTeam:Array.isArray(gesamt.team),
      sourceHasTeamsOverall:Array.isArray(teamSources.overall),
      warning:sourcePath!=='./website-view.json'
        ? 'Aktuelle Ranglistendaten sind nicht vollständig verfügbar.'
        : ''
    };
    return normalized;
  }

  function legacyHall(data){
    if(!data||!data.aktuelleSaison)return data||{};
    const season=data.aktuelleSaison.saison||data.saison||'2026/2027';
    const competitions=data.aktuelleSaison.wettbewerbe||{};
    const map=id=>{const item=competitions[id]||{};return {saison:season,jahr:String(season).slice(0,4),name:item.sieger?.name||'Noch offen',offen:!item.sieger};};
    return {
      meta:{hinweis:data.pruefung?.gueltig===false?'Ehrenlogbuch mit Prüfhinweisen geladen.':'Ehrenlogbuch geladen.'},
      aktuellerChampion:data.aktuelleSaison.gesamtChampion?{name:data.aktuelleSaison.gesamtChampion.name,wettbewerb:'Gesamtwertung',titel:'Champion',jahr:String(season).slice(0,4),label:'Old Smugglers Champion'}:{name:'Noch offen',wettbewerb:'Saison '+season,titel:'Champion',jahr:'',label:'Old Smugglers Champion'},
      teamChampion:{saison:season,name:data.aktuelleSaison.gesamtTeamSieger?.name||'Noch offen',offen:!data.aktuelleSaison.gesamtTeamSieger},
      meister:map('bundesliga'),dfbPokal:map('dfb-pokal'),championsLeague:map('champions-league'),europaLeague:map('europa-league'),
      smugglerauftraege:map('smugglerauftraege'),bonuswettbewerb:{saison:season,name:'Noch offen',offen:true},weihnachtsregatta:map('weihnachtsregatta'),piratenkodex:map('piratenkodex'),
      meisterchronik:[],rekorde:{},ehrenmitglieder:{label:'Status',wert:'Noch keine Einträge'}
    };
  }

  window.OSCHighscoreDataAdapter={
    version:'4.7.0',
    async loadHighscore(){
      const result=await first(['./website-view.json','./highscore.json']);
      return normalizeHighscore(result.data,result.path);
    },
    async loadHallOfFame(){
      if(window.OSCHallOfFame?.load)return window.OSCHallOfFame.load();
      const result=await first(['./hall-of-fame.json']);
      return result.data||{};
    },
    clear(){cache.clear()}
  };
})();
