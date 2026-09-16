(()=>{
"use strict";
const VERSION="6.5.0-HF13-TEST4-HF29";
const n=v=>Number(v||0);
const arr=v=>Array.isArray(v)?v:[];
const clone=v=>structuredClone(v||{});
const text=v=>String(v??"").trim();
const normalize=id=>text(id).toLocaleLowerCase("de").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replaceAll("ä","ae").replaceAll("ö","oe").replaceAll("ü","ue").replaceAll("ß","ss").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const canonical={"dynamo-dresden":"smugglerauftraege","smugglerauftrag":"smugglerauftraege","smugglerauftraege":"smugglerauftraege"};
const fieldMap={"bundesliga":"meister","dfb-pokal":"dfbPokal","champions-league":"championsLeague","europa-league":"europaLeague","smugglerauftraege":"smugglerauftraege","weihnachtsregatta":"weihnachtsregatta","piratenkodex":"piratenkodex","relegation":"relegation","bonus":"bonuswettbewerb","bonuswettbewerb":"bonuswettbewerb"};
const labels={meister:"Bundesliga",dfbPokal:"DFB-Pokal",championsLeague:"Champions League",europaLeague:"Europa League",smugglerauftraege:"Smuggleraufträge",bonuswettbewerb:"Bonuswettbewerb",weihnachtsregatta:"Weihnachtsregatta",piratenkodex:"Piratenkodex",relegation:"Relegation"};

function rowsAtRankOne(rows,field="rank"){
  return arr(rows).filter(row=>n(row?.[field]??row?.platz)===1);
}
function uniquePositiveLeader(rows,field="rank",pointsField="totalPoints"){
  const leaders=rowsAtRankOne(rows,field);
  if(leaders.length!==1)return null;
  const leader=leaders[0];
  return n(leader?.[pointsField]??leader?.punkte??leader?.points)>0?leader:null;
}
function winnerName(row){return text(row?.name||row?.teilnehmer);}
function winnerId(row){return row?.participantId||row?.teilnehmerId||null;}
function winnerPoints(row){return n(row?.totalPoints??row?.punkte??row?.points);}
function competitionCompletion(competition,master,productiveOrders,{activeCompetitionId=null,activeRound=null}={}){
  const id=normalize(competition?.id);
  const masterId=id==="smugglerauftraege"?"dynamo-dresden":id;
  const config=arr(master?.wettbewerbe).find(item=>normalize(item?.id)===masterId||normalize(item?.id)===id);
  const season=config?.saison||{};
  const target=n(season.wertungstageZiel||season.tippspieltageZiel);
  const explicit=[season.strukturierterStatus,season.status,config?.status].some(value=>normalize(value)==="abgeschlossen");
  const count=arr(productiveOrders).filter(order=>(canonical[normalize(order?.wertung)]||normalize(order?.wertung))===id).length;
  const activeId=canonical[normalize(activeCompetitionId)]||normalize(activeCompetitionId);
  const currentId=canonical[id]||id;
  const roundId=normalize(activeRound);
  const finalRound=Boolean(activeId&&activeId===currentId&&(roundId==="finale"||roundId==="final"));
  const completed=explicit||(target>0&&count>=target)||finalRound;
  const source=explicit?"stammdaten-status":target>0&&count>=target?"wertungstage-ziel":finalRound?"finalrunde":"nicht-entscheidbar";
  return {completed,target:target||null,processed:count,source};
}
function confirmedEntry(previous,season,row,timestamp,label){
  return {...clone(previous),saison:season,name:winnerName(row),offen:false,bestaetigtAm:timestamp,teilnehmerId:winnerId(row),punkte:winnerPoints(row),label:label||previous?.label||""};
}
function baseline(result){
  result.aktuellerChampion=result.aktuellerChampion||{name:"Manuel",wettbewerb:"Gesamtwertung",titel:"Gesamtchampion",jahr:"2025/2026",label:"TOSMC Saison Champion",saison:"2025/2026",offen:false};
  result.teamChampion=result.teamChampion||{saison:null,name:"Keine Vorsaisonwertung",offen:true,erstmals:true,label:"Gesamt-Team-Sieger"};
  result.meister=result.meister||{saison:"2025/2026",name:"Manuel",offen:false,label:"Bundesliga"};
  result.dfbPokal=result.dfbPokal||{saison:"2025/2026",name:"Manuel",offen:false};
  result.championsLeague=result.championsLeague||{saison:"2025/2026",name:"ZweikampfGott",offen:false};
  result.europaLeague=result.europaLeague||{saison:"2025/2026",name:"Marius",offen:false};
  result.bonuswettbewerb=result.bonuswettbewerb||{saison:"2025/2026",name:"Marius",offen:false};
  for(const key of ["smugglerauftraege","weihnachtsregatta","piratenkodex","relegation"]){
    result[key]=result[key]||{saison:"2026/2027",name:"Erstmals 2026/2027",offen:true,erstmals:true};
  }
  result.meisterchronik=arr(result.meisterchronik).filter(x=>x&&x.offen!==true&&text(x.name)&&!/^noch offen$/i.test(text(x.name)));
  if(!result.meisterchronik.some(x=>x.saison==="2025/2026"))result.meisterchronik.unshift({saison:"2025/2026",name:"Manuel",offen:false});
  result.besondereLeistungen=arr(result.besondereLeistungen);
  if(!result.besondereLeistungen.some(x=>normalize(x?.titel)==="champion-der-wm-runde-2026")){
    result.besondereLeistungen.push({jahr:"2026",kategorie:"Sonderchampion",titel:"Champion der WM-Runde 2026",name:"ZweikampfGott",offen:false,bestaetigt:true});
  }
  result.rekorde=result.rekorde||{};
  result.rekorde.gesamtpunkte=result.rekorde.gesamtpunkte||{label:"Gesamtpunkte",wert:346,name:"Manuel",saison:"2025/2026",offen:false};
  result.rekorde.bonuspunkte=result.rekorde.bonuspunkte||{label:"Bonuspunkte",wert:60,name:"ZweikampfGott",saison:"2025/2026",offen:false};
  result.rekorde.exakteTipps=result.rekorde.exakteTipps||{label:"Exakte Tipps",wert:17,name:"Marius",saison:"2025/2026",offen:false};
  result.rekorde.weitere=result.rekorde.weitere||{label:"Weitere Rekorde",wert:"Noch offen",offen:true};
  result.ehrenmitglieder=result.ehrenmitglieder||{label:"Status",wert:"Noch keine Einträge",offen:true};
  return result;
}
function validateWebsiteFields(result){
  const requiredObjects=["aktuellerChampion","teamChampion","meister","dfbPokal","championsLeague","europaLeague","bonuswettbewerb","relegation","rekorde"];
  const requiredArrays=["besondereLeistungen","meisterchronik"];
  const missing=[];
  for(const key of requiredObjects){
    if(!result?.[key]||typeof result[key]!=="object"||Array.isArray(result[key]))missing.push(key);
  }
  for(const key of requiredArrays){
    if(!Array.isArray(result?.[key]))missing.push(key);
  }
  if(!text(result?.aktuellerChampion?.name))missing.push("aktuellerChampion.name");
  if(!text(result?.teamChampion?.name))missing.push("teamChampion.name");
  return {valid:missing.length===0,missing};
}
function updateRecord(result,key,label,candidates,season,timestamp,issues){
  if(!candidates.length)return;
  const max=Math.max(...candidates.map(item=>n(item.value)));
  if(max<=0)return;
  const leaders=candidates.filter(item=>n(item.value)===max);
  if(leaders.length!==1){issues.push(`Rekord ${label}: ${leaders.length} gleichrangige Bestwerte (${max}); keine automatische Ersetzung.`);return;}
  const current=n(result.rekorde?.[key]?.wert);
  if(max<=current)return;
  const leader=leaders[0];
  result.rekorde[key]={label,wert:max,name:leader.name,saison:season,offen:false,bestaetigtAm:timestamp,quelle:leader.source||"Admin-Berechnung"};
}
function exactCandidates(highscore){
  const sums=new Map();
  for(const comp of Object.values(highscore?.competitions||{})){
    for(const row of arr(comp?.overall)){
      const name=winnerName(row);if(!name)continue;
      const current=sums.get(name)||{name,value:0};
      current.value+=n(row.exactHits??row.exakt);
      current.source="Summe Wettbewerbswertungen";
      sums.set(name,current);
    }
  }
  return [...sums.values()];
}
function competitionConfig(master,id){
  const normalized=normalize(id);
  const masterId=normalized==="smugglerauftraege"?"dynamo-dresden":normalized;
  return arr(master?.wettbewerbe).find(item=>normalize(item?.id)===masterId||normalize(item?.id)===normalized)||null;
}
function isSpecialChampionCompetition(config){return config?.wertung?.sonderchampion===true;}
function specialChampionTitle(config,competition){
  return text(config?.wertung?.sonderchampionTitel)||`Champion ${text(competition?.label||config?.label||config?.name||config?.id)}`.trim();
}
function specialChampionYear(config,season){
  const source=[config?.saison?.seasonLabel,config?.saison?.zeitraum,season].map(text).join(" ");
  const match=source.match(/(?:19|20)\d{2}/);
  return match?match[0]:text(config?.saison?.seasonLabel||season);
}
function upsertSpecialChampion(result,config,competition,leader,season,timestamp){
  const title=specialChampionTitle(config,competition);
  const competitionId=text(config?.id||competition?.id);
  const competitionSeason=text(config?.saison?.seasonLabel||season);
  const entry={jahr:specialChampionYear(config,season),saison:competitionSeason,kategorie:"Ehrenchampion Sonderwettbewerb",titel:title,name:winnerName(leader),teilnehmerId:winnerId(leader),punkte:winnerPoints(leader),wettbewerbId:competitionId,offen:false,bestaetigt:true,bestaetigtAm:timestamp};
  const byIdentity=result.besondereLeistungen.findIndex(item=>text(item?.wettbewerbId)===competitionId&&text(item?.saison)===competitionSeason);
  const byLegacyTitle=result.besondereLeistungen.findIndex(item=>normalize(item?.titel)===normalize(title));
  const index=byIdentity>=0?byIdentity:byLegacyTitle;
  if(index>=0) result.besondereLeistungen[index]={...clone(result.besondereLeistungen[index]),...entry};
  else result.besondereLeistungen.push(entry);
  return entry;
}
function buildHallOfFame({previous,highscore,competitionMaster,productiveOrders,season,timestamp,mode,activeCompetitionId=null,activeRound=null}){
  const previousSeasonState=text(previous?.aktuelleSaison?.saison)===text(season)?clone(previous.aktuelleSaison):null;
  const result=baseline(clone(previous));
  result.schemaVersion=3;
  result.datenVersion=n(previous?.datenVersion)+1;
  result.aktualisiertAm=timestamp;
  result.saison=season;
  result.quelle=`Admin ${VERSION} – bestätigte Titel, Bestandsschutz und Website-Zielstruktur`;
  const issues=[];
  const decisions=[];
  const comps=highscore?.competitions||{};
  result.aktuelleSaison={saison:season,wettbewerbe:{},gesamtChampion:null,gesamtTeamSieger:null,status:"laufend"};

  const specialIssues=[];
  const specialDecisions=[];
  for(const [rawId,competition] of Object.entries(comps)){
    const id=normalize(competition?.id||rawId);
    const config=competitionConfig(competitionMaster,id);
    const specialChampion=isSpecialChampionCompetition(config);
    const targetKey=specialChampion?null:(fieldMap[canonical[id]||id]||null);
    const completionNow=competitionCompletion({...competition,id},competitionMaster,productiveOrders,{activeCompetitionId,activeRound});
    const previousEntry=clone(previousSeasonState?.wettbewerbe?.[id]);
    const previouslyCompleted=previousEntry?.status==="abgeschlossen"&&Boolean(text(previousEntry?.sieger?.name));
    const completion=completionNow.completed
      ? completionNow
      : previouslyCompleted
        ? {...clone(previousEntry.abschluss),completed:true,source:previousEntry?.abschluss?.source||"vorheriger-abschluss"}
        : completionNow;
    const leaders=rowsAtRankOne(competition?.overall,"rank");
    const leader=uniquePositiveLeader(competition?.overall,"rank","totalPoints");
    const entry=previouslyCompleted&&!completionNow.completed
      ? {...previousEntry,id,label:competition?.label||previousEntry.label||labels[targetKey]||rawId,status:"abgeschlossen",abschluss:completion}
      : {id,label:competition?.label||labels[targetKey]||rawId,status:completion.completed?"abgeschlossen":competition?.status||"noch-ohne-wertung",abschluss:completion,sieger:null};
    if(completion.completed&&!(previouslyCompleted&&!completionNow.completed)){
      if(leader&&winnerName(leader)){
        entry.sieger={participantId:winnerId(leader),name:winnerName(leader),punkte:winnerPoints(leader),bestaetigtAm:timestamp};
        const activeId=canonical[normalize(activeCompetitionId)]||normalize(activeCompetitionId);
        const currentId=canonical[id]||id;
        const mayWriteCompetitionTitle=!activeId||activeId===currentId;
        if(mode==="produktiv"&&specialChampion&&mayWriteCompetitionTitle){
          const special=upsertSpecialChampion(result,config,competition,leader,season,timestamp);
          specialDecisions.push(`${special.titel}: ${special.name} übernommen.`);
        }else if(mode==="produktiv"&&targetKey&&mayWriteCompetitionTitle){
          result[targetKey]=confirmedEntry(result[targetKey],season,leader,timestamp,labels[targetKey]);
          decisions.push(`${labels[targetKey]}: ${winnerName(leader)} (${season}) übernommen.`);
        }
      }else{
        entry.status="abschluss-nicht-eindeutig";
        const message=`${entry.label}: ${leaders.length>1?"mehrere Erstplatzierte":"kein eindeutiger positiver Einzel-Gesamtsieger"}.`;
        if(specialChampion) specialIssues.push(message); else issues.push(message);
      }
    }
    result.aktuelleSaison.wettbewerbe[id]=entry;
  }

  const required=arr(competitionMaster?.wettbewerbe).filter(c=>c?.wertung?.hallOfFame===true&&c?.wertung?.sonderchampion!==true).map(c=>canonical[normalize(c.id)]||normalize(c.id));
  const completedKeys=new Set(Object.entries(result.aktuelleSaison.wettbewerbe).filter(([,v])=>v.status==="abgeschlossen"&&v.sieger).map(([id])=>canonical[normalize(id)]||normalize(id)));
  const allCompleted=required.length>0&&required.every(key=>completedKeys.has(key));

  if(allCompleted&&mode==="produktiv"){
    const bonusRows=arr(highscore?.overall?.bonus);
    const bonusLeader=uniquePositiveLeader(bonusRows,"rank","bonusPoints");
    const bonusLeaders=rowsAtRankOne(bonusRows,"rank");
    const bonusCheck={erforderlich:true,vorhanden:bonusRows.length>0,gueltig:Boolean(bonusLeader),anzahlErstplatzierte:bonusLeaders.length};
    if(!bonusRows.length){
      issues.push("Bonuswettbewerb: Bonusrangliste fehlt beim Saisonabschluss; bestehender Hall-of-Fame-Eintrag bleibt geschützt.");
    }else if(bonusLeader){
      result.bonuswettbewerb={
        ...clone(result.bonuswettbewerb),
        saison:season,
        name:winnerName(bonusLeader),
        offen:false,
        teilnehmerId:winnerId(bonusLeader),
        punkte:n(bonusLeader.bonusPoints??bonusLeader.totalPoints??bonusLeader.points),
        bestaetigtAm:timestamp,
        quelle:"Kicktipp-Bonusrangliste"
      };
      decisions.push(`Bonuswettbewerb: ${winnerName(bonusLeader)} (${season}) aus der Kicktipp-Bonusrangliste übernommen.`);
    }else{
      issues.push(`Bonuswettbewerb: ${bonusLeaders.length>1?"mehrere Erstplatzierte":"kein eindeutiger positiver Sieger"} in der Bonusrangliste; bestehender Hall-of-Fame-Eintrag bleibt geschützt.`);
    }

    const champion=uniquePositiveLeader(highscore?.overall?.individual,"rank","totalPoints");
    if(champion){
      const sameChampion=text(previous?.aktuellerChampion?.saison)===text(season)&&text(previous?.aktuellerChampion?.name)===winnerName(champion);
      const festgestelltAm=sameChampion?text(previous?.aktuellerChampion?.festgestelltAm||previous?.aktuellerChampion?.bestaetigtAm)||timestamp:timestamp;
      const ausgeloestDurch=sameChampion&&previousSeasonState?.ausgeloestDurch
        ? clone(previousSeasonState.ausgeloestDurch)
        : {wettbewerbId:canonical[normalize(activeCompetitionId)]||normalize(activeCompetitionId)||null,runde:text(activeRound)||null};
      result.aktuellerChampion={name:winnerName(champion),wettbewerb:"Gesamtwertung",titel:"Gesamtchampion",jahr:season,label:"TOSMC Saison Champion",saison:season,offen:false,freigegeben:true,teilnehmerId:winnerId(champion),punkte:winnerPoints(champion),bestaetigtAm:timestamp,festgestelltAm,ausgeloestDurch};
      result.aktuelleSaison.championFestgestelltAm=festgestelltAm;
      result.aktuelleSaison.ausgeloestDurch=clone(ausgeloestDurch);
      const chronikEintrag={saison:season,name:winnerName(champion),offen:false,teilnehmerId:winnerId(champion),punkte:winnerPoints(champion),bestaetigtAm:timestamp};
      const chronikTreffer=result.meisterchronik.map((entry,index)=>({entry,index})).filter(item=>item.entry?.saison===season);
      if(chronikTreffer.length){
        const firstIndex=chronikTreffer[0].index;
        result.meisterchronik[firstIndex]={...clone(result.meisterchronik[firstIndex]),...chronikEintrag};
        result.meisterchronik=result.meisterchronik.filter((entry,index)=>entry?.saison!==season||index===firstIndex);
      }else{
        result.meisterchronik.push(chronikEintrag);
      }
      decisions.push(`Saison-Gesamtchampion: ${winnerName(champion)} (${season}) übernommen.`);
    }else issues.push("Saison: kein eindeutiger positiver Gesamtchampion.");

    const teamLeader=uniquePositiveLeader(highscore?.overall?.team,"rank","averagePoints");
    if(teamLeader){
      result.teamChampion={saison:season,name:winnerName(teamLeader),offen:false,punkte:n(teamLeader.averagePoints??teamLeader.totalPoints),bestaetigtAm:timestamp};
      result.aktuelleSaison.gesamtTeamSieger=clone(result.teamChampion);
    }else issues.push("Saison: Gesamt-Team-Sieger ist nicht eindeutig oder ohne positiven Wert.");

  }

  if(allCompleted&&mode==="produktiv"){
    const overall=arr(highscore?.overall?.individual);
    updateRecord(result,"gesamtpunkte","Gesamtpunkte",overall.map(r=>({name:winnerName(r),value:n(r.totalPoints),source:"Kicktipp-Gesamtwertung"})),season,timestamp,issues);
    updateRecord(result,"bonuspunkte","Bonuspunkte",overall.map(r=>({name:winnerName(r),value:n(r.bonusPoints),source:"Kicktipp-Bonuswertung"})),season,timestamp,issues);
    updateRecord(result,"exakteTipps","Exakte Tipps",exactCandidates(highscore),season,timestamp,issues);
  }

  result.aktuelleSaison.gesamtChampion=allCompleted&&result.aktuellerChampion?.saison===season?clone(result.aktuellerChampion):null;
  if(result.aktuelleSaison.gesamtChampion){
    result.aktuelleSaison.championFestgestelltAm=text(result.aktuelleSaison.championFestgestelltAm||result.aktuelleSaison.gesamtChampion.festgestelltAm)||timestamp;
    result.aktuelleSaison.ausgeloestDurch=clone(result.aktuelleSaison.ausgeloestDurch||result.aktuelleSaison.gesamtChampion.ausgeloestDurch);
  }
  const websiteFields=validateWebsiteFields(result);
  if(!websiteFields.valid)issues.push(`Website-Feldzuordnung unvollständig: ${websiteFields.missing.join(", ")}.`);
  result.aktuelleSaison.status=allCompleted?(issues.length?"abschluss-pruefen":"abgeschlossen"):"laufend";
  const bonusPruefung=allCompleted&&mode==="produktiv"
    ? {
        erforderlich:true,
        vorhanden:arr(highscore?.overall?.bonus).length>0,
        gueltig:Boolean(uniquePositiveLeader(highscore?.overall?.bonus,"rank","bonusPoints")),
        anzahlErstplatzierte:rowsAtRankOne(highscore?.overall?.bonus,"rank").length
      }
    : {erforderlich:false,vorhanden:arr(highscore?.overall?.bonus).length>0,gueltig:true,anzahlErstplatzierte:rowsAtRankOne(highscore?.overall?.bonus,"rank").length};
  result.pruefung={gueltig:issues.length===0,hinweise:issues,entscheidungen:decisions,bestandsschutz:true,websiteFeldzuordnung:websiteFields.valid,fehlendeWebsiteFelder:websiteFields.missing,bonuswettbewerb:bonusPruefung,ehrenchampions:{gueltig:specialIssues.length===0,hinweise:specialIssues,entscheidungen:specialDecisions}};
  result.meta={...(result.meta||{}),titel:"Ehrenlogbuch des Old Smugglers Club",stand:timestamp,hinweis:"Nur bestätigte Titel und Rekorde werden dauerhaft eingetragen.",generatorVersion:VERSION};
  return result;
}
function buildWebsiteView({previous,highscore,hallOfFame,season,timestamp,mode,activeBlocks}){
  const previousAnzeige=clone(previous?.anzeige||{});
  const previousRunning=previousAnzeige?.laufenderWertungsblock;
  const blocks=arr(activeBlocks);
  const runningStillOpen=previousRunning?.aktiv===true && blocks.some(block=>{
    const status=normalize(block?.status);
    return status!=="abgeschlossen"
      && normalize(block?.wertung)===normalize(previousRunning?.wertung)
      && text(block?.runde)===text(previousRunning?.runde);
  });
  const anzeige={
    ...previousAnzeige,
    berechnungInWebsite:false,
    hinweis:"Alle Ranglisten, Teamwerte und Hall-of-Fame-Entscheidungen wurden im Admin erzeugt."
  };
  if(!runningStillOpen)delete anzeige.laufenderWertungsblock;
  return {schemaVersion:2,datenVersion:n(highscore?.meta?.dataVersion)+1,aktualisiertAm:timestamp,saison:season,modus:mode,quelle:`Admin ${VERSION} Website-Adapter`,highscore:{wettbewerbe:highscore?.competitions||{},gesamt:highscore?.overall||{},teams:highscore?.teams||{}},hallOfFame:clone(hallOfFame),anzeige};
}
window.TOSMCWebsiteAdapter={version:VERSION,buildHallOfFame,buildWebsiteView,competitionCompletion};
})();
