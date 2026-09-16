(()=>{
  "use strict";
  const clone=value=>value&&typeof value==="object"?structuredClone(value):{};
  async function json(url,fallback={}){try{const r=await fetch(url,{cache:"no-store"});return r.ok?await r.json():fallback}catch{return fallback}}
  function mergeEntry(base,next){
    if(!next||next.freigegeben!==true||!next.name)return base;
    return {...(base||{}),...next,offen:false};
  }
  async function load(){
    const base=clone(await json("./hall-of-fame.json",{}));
    const view=await json("./website-view.json",{});
    const update=view?.hallOfFame;
    const seasonState=update?.aktuelleSaison;
    const releasedSeasonChampion=(seasonState?.status==="abgeschlossen"||seasonState?.status==="abschluss-pruefen")&&seasonState?.gesamtChampion?.freigegeben===true?seasonState.gesamtChampion:null;
    const baseSpecial=Array.isArray(base.besondereLeistungen)?base.besondereLeistungen.filter(x=>x&&x.name&&x.titel&&(x.bestaetigt===true||x.freigegeben===true||x.offen===false)).at(-1):null;
    if(baseSpecial) base.ehrenmitglieder={label:baseSpecial.titel,wert:baseSpecial.name,offen:false};
    if(!update||(update.freigegeben!==true&&!releasedSeasonChampion)){
      base.meta={...(base.meta||{}),runtime:"Historische Ehrungen werden angezeigt."};
      return base;
    }
    const result=clone(base);
    result.aktuellerChampion=mergeEntry(result.aktuellerChampion,releasedSeasonChampion||update.gesamtChampion);
    result.teamChampion=mergeEntry(result.teamChampion,update.gesamtTeamSieger);
    const mapping={bundesliga:"meister","dfb-pokal":"dfbPokal","champions-league":"championsLeague","europa-league":"europaLeague",smugglerauftraege:"smugglerauftraege",bonuswettbewerb:"bonuswettbewerb",weihnachtsregatta:"weihnachtsregatta",piratenkodex:"piratenkodex",relegation:"relegation"};
    for(const [id,key] of Object.entries(mapping)) result[key]=mergeEntry(result[key],update.wettbewerbe?.[id]);
    if(Array.isArray(update.besondereLeistungen)){
      const existing=Array.isArray(result.besondereLeistungen)?result.besondereLeistungen:[];
      const additions=update.besondereLeistungen.filter(x=>x&&x.name&&x.titel&&(x.bestaetigt===true||x.freigegeben===true||x.offen===false));
      result.besondereLeistungen=[...existing,...additions.filter(a=>!existing.some(e=>e.titel===a.titel&&e.name===a.name))];
    }
    if(Array.isArray(update.meisterchronik)) result.meisterchronik=update.meisterchronik.filter(x=>x&&x.freigegeben===true&&x.name&&x.saison);
    if(update.rekorde&&update.rekordeFreigegeben===true){
      const recordSeason=seasonState?.saison||update.saison||"";
      const releasedRecords={};
      for(const [key,entry] of Object.entries(update.rekorde)){
        releasedRecords[key]=entry&&typeof entry==="object"&&entry.offen!==true
          ? {...entry,...(!entry.saison&&recordSeason?{saison:recordSeason}:{})}
          : entry;
      }
      result.rekorde={...(result.rekorde||{}),...releasedRecords};
    }
    const special=Array.isArray(result.besondereLeistungen)?result.besondereLeistungen.filter(x=>x&&x.name&&x.titel&&(x.bestaetigt===true||x.freigegeben===true||x.offen===false)).at(-1):null;
    if(special) result.ehrenmitglieder={label:special.titel,wert:special.name,offen:false};
    result.meta={...(result.meta||{}),runtime:"Das Ehrenlogbuch wurde aktualisiert."};
    return result;
  }
  window.OSCHallOfFame={load};
})();
