(function(){
  "use strict";

  const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
  const TIME_RE=/^\d{2}:\d{2}$/;
  const OPEN_STATUSES=new Set(["verlegt","abgesagt","ausgefallen","termin-offen","offen"]);

  const norm=v=>String(v??"").trim().toLowerCase();
  const isOpenStatus=game=>OPEN_STATUSES.has(norm(game?.status));
  const hasExactKickoff=game=>Boolean(
    game && game.terminBestaetigt===true && !isOpenStatus(game) &&
    DATE_RE.test(String(game.datum||"")) && TIME_RE.test(String(game.anstoss||""))
  );

  function makeLocalDate(date,time){
    if(!DATE_RE.test(String(date||""))||!TIME_RE.test(String(time||""))) return null;
    const [y,m,d]=date.split("-").map(Number),[hh,mm]=time.split(":").map(Number);
    const value=new Date(y,m-1,d,hh,mm,0,0);
    return Number.isNaN(value.getTime())?null:value;
  }

  function build({matchdays=[],resolveGames,resolveTeamName,liveMinutesDefault=120}){
    const byId=new Map();
    const announcedById=new Map();

    matchdays.filter(md=>md&&md.aktiv!==false).forEach((md,mdIndex)=>{
      (resolveGames(md)||[]).forEach((raw,index)=>{
        if(!raw||!raw.id) return;
        const game={...raw,
          heim:resolveTeamName(raw.heimTeamId,raw.heim),
          auswaerts:resolveTeamName(raw.auswaertsTeamId,raw.auswaerts),
          matchdayName:md.name||`Tippspieltag ${md.nummer}`,
          matchdayNumber:md.nummer,
          matchdayType:md.typ||"",
          _index:index,_matchdayIndex:mdIndex
        };
        if(hasExactKickoff(game)){
          const start=makeLocalDate(game.datum,game.anstoss);
          const liveMinutes=Math.max(1,Number(game.liveDauerMinuten)||liveMinutesDefault);
          byId.set(game.id,{...game,_exact:true,_start:start,_end:new Date(start.getTime()+liveMinutes*60000)});
          announcedById.delete(game.id);
        }else if(!byId.has(game.id)){
          const from=String(game.datumVon||game.datum||"");
          const until=String(game.datumBis||game.datumVon||game.datum||"");
          announcedById.set(game.id,{...game,_exact:false,_dateFrom:from,_dateUntil:until,
            _openReason:isOpenStatus(game)?norm(game.status):"zeit-offen"});
        }
      });
    });

    const exact=[...byId.values()].sort((a,b)=>a._start-b._start||a._matchdayIndex-b._matchdayIndex||a._index-b._index);
    const announced=[...announcedById.values()].sort((a,b)=>
      String(a._dateFrom).localeCompare(String(b._dateFrom))||a._matchdayIndex-b._matchdayIndex||a._index-b._index);
    return {exact,announced};
  }

  function activeAndNext(exact,now){
    const next=exact.find(e=>e._start>now)||null;
    return {live:[],next,focus:next};
  }

  function windowEvents(exact,now,days=7){
    const end=new Date(now.getTime()+Math.max(1,days)*86400000);
    return exact.filter(e=>e._end>now&&e._start<=end);
  }

  window.OSCScheduleTimeline=Object.freeze({hasExactKickoff,build,activeAndNext,windowEvents});
})();

/* vNext-Simulationswebsite 2026-11-08: sichtbare Terminkachel nach Tageswechsel
   und bei erneuter Tab-Aktivierung aktualisieren. Der bestehende Datenadapter
   und der Renderer der Startseite bleiben die einzige Quelle/Anzeigelogik. */
(function(){
  "use strict";

  const formatter=new Intl.DateTimeFormat("sv-SE",{
    timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"
  });
  const dayKey=()=>formatter.format(new Date());
  const berlinClock=()=>new Intl.DateTimeFormat("en-GB",{
    timeZone:"Europe/Berlin",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).format(new Date());
  let lastDay=dayKey();
  let refreshedForDay=lastDay;
  let lastRefreshAt=0;
  let running=false;

  async function refresh(reason){
    // requestMatchdayRefresh ist der vorhandene Re-Render-Einstieg aus
    // index.html und serialisiert bereits laufende/ausstehende Aktualisierungen.
    // Dadurch können Countdownwechsel und Tab-Aktivierung nicht konkurrieren.
    if(typeof window.requestMatchdayRefresh==="function"){
      window.requestMatchdayRefresh();
      refreshedForDay=dayKey();
      lastRefreshAt=Date.now();
      return;
    }
    // Rückfall für ältere Startseiten ohne vorhandene Warteschlange.
    if(running||typeof window.loadMatchdayData!=="function")return;
    running=true;
    try{
      await window.loadMatchdayData();
      refreshedForDay=dayKey();
      lastRefreshAt=Date.now();
    }catch(error){
      console.warn("Terminkachel-Aktualisierung fehlgeschlagen:",reason,error);
    }finally{
      running=false;
    }
  }

  function pollDayChange(){
    const today=dayKey();
    if(today!==lastDay)lastDay=today;
    // Um 00:01 Uhr Berliner Zeit ist die Tagesumschaltung fällig.
    // Falls Hintergrund-Timer gedrosselt wurden, erledigt der nächste
    // sichtbare Tick bzw. die Tab-Aktivierung die Aktualisierung.
    if(today!==refreshedForDay && berlinClock()>="00:01"){
      void refresh("Tageswechsel");
    }
  }

  function onReturn(){
    pollDayChange();
    // Bei kurzer Fokussierungsfolge (focus + visibilitychange + pageshow)
    // wird nur einmal neu geladen. Nach längerer Abwesenheit stets frisch.
    if(Date.now()-lastRefreshAt>=15000)void refresh("Tab erneut aktiv");
  }

  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)onReturn();
  });
  window.addEventListener("focus",onReturn);
  window.addEventListener("pageshow",event=>{
    if(event.persisted)onReturn();
  });
  // Kein Seiten-Reload, keine neue API, keine Änderung von Ergebnis-/Wertungsdaten.
  setInterval(()=>{if(!document.hidden)pollDayChange();},30000);
})();
