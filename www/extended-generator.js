(function(root){
 const EXT=['wettbewerbspunkte.json','smugglerpunkte.json','teampunkte.json','ranglistenverlauf.json','highscore.json'];
 const arr=v=>Array.isArray(v)?v:[];
 const clone=v=>JSON.parse(JSON.stringify(v));
 function parse(files){const o={};for(const [n,v] of Object.entries(files||{})){try{o[n]=JSON.parse(v.text)}catch{o[n]=null}}return o}
 function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o}return v}
 const canon=v=>JSON.stringify(stable(v));
 function calcTeams(rows,participants){
  const active=arr(participants).filter(p=>p&&p.aktiv!==false),byId=new Map(active.map(p=>[p.id,p.team||null]));
  const counts={'Old Smugglers Team':0,'New Smugglers Team':0},sums={'Old Smugglers Team':0,'New Smugglers Team':0};
  active.forEach(p=>{if(Object.prototype.hasOwnProperty.call(counts,p.team))counts[p.team]++});
  arr(rows).forEach(r=>{const team=byId.get(r.teilnehmerId);if(Object.prototype.hasOwnProperty.call(sums,team))sums[team]+=Number(r.punkte||0)});
  const out=Object.keys(sums).map(team=>({team,mitglieder:counts[team],punktesumme:Number(sums[team].toFixed(2)),durchschnitt:counts[team]?Number((sums[team]/counts[team]).toFixed(2)):0})).sort((a,b)=>b.durchschnitt-a.durchschnitt||a.team.localeCompare(b.team,'de'));
  let last=null,rank=0;out.forEach((r,i)=>{if(last===null||r.durchschnitt!==last)rank=i+1;r.platz=r.durchschnitt===0?null:rank;last=r.durchschnitt});return out
 }
 function rankRows(rows){
  const sorted=[...rows].sort((a,b)=>Number(b.points||0)-Number(a.points||0)||Number(b.exact||0)-Number(a.exact||0)||Number(b.difference||0)-Number(a.difference||0)||String(a.name||'').localeCompare(String(b.name||''),'de'));
  let lastKey=null,rank=0;sorted.forEach((row,index)=>{const key=`${row.points||0}:${row.exact||0}:${row.difference||0}`;if(key!==lastKey)rank=index+1;row.rank=rank;lastKey=key});return sorted
 }
 function buildHistory(site){
  const out=clone(site['ranglistenverlauf.json']),orders=[...arr(site['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege)].sort((a,b)=>String(a.gespeichertAm||'').localeCompare(String(b.gespeichertAm||''))),participants=arr(site['teilnehmer.json']?.teilnehmer),pby=new Map(participants.map(p=>[p.id,p])),cumulative=new Map(),history=new Map();
  for(const order of orders){
   for(const detail of arr(order.punkte)){
    const cur=cumulative.get(detail.teilnehmerId)||{participantId:detail.teilnehmerId,name:pby.get(detail.teilnehmerId)?.name||detail.teilnehmer||detail.teilnehmerId,points:0,exact:0,difference:0,tendency:0};
    cur.points+=Number(detail.punkte||0);if(detail.stufe==='exakt')cur.exact++;else if(detail.stufe==='differenz')cur.difference++;else if(detail.stufe==='tendenz')cur.tendency++;cumulative.set(detail.teilnehmerId,cur)
   }
   const rows=[...cumulative.values()],zero=!rows.length||rows.every(x=>x.points===0),ranked=zero?rows.map(x=>({...x,rank:null})):rankRows(rows);
   for(const row of ranked){const list=history.get(row.participantId)||[];list.push({zeitpunkt:order.gespeichertAm||null,wettbewerb:order.wertung,runde:order.runde,auftragId:order.fachlicheId||order.id,platz:zero?null:row.rank,punkte:row.points});history.set(row.participantId,list)}
  }
  const orderMap=new Map(arr(site['ranglistenverlauf.json']?.verlaeufe).map((x,i)=>[x.teilnehmerId,i]));
  out.verlaeufe=[...history.entries()].map(([id,punkte])=>({teilnehmerId:id,teilnehmer:pby.get(id)?.name||id,punkte})).sort((a,b)=>(orderMap.get(a.teilnehmerId)??99999)-(orderMap.get(b.teilnehmerId)??99999));
  return out
 }
 function buildTeams(site){
  const out=clone(site['teampunkte.json']),participants=arr(site['teilnehmer.json']?.teilnehmer),overall=calcTeams(arr(site['punkte.json']?.rangliste),participants),latest=arr(site['spieltagpunkte.json']?.spieltage).at(-1)||{},matchday=calcTeams(arr(latest.rangliste),participants);
  const oldOverall=new Map(arr(out.gesamt).map(x=>[x.team,x]));
  out.gesamt=overall.map(x=>Object.assign({},clone(oldOverall.get(x.team)||{}),x,{berechneterDurchschnitt:x.durchschnitt,kicktippKontrollwert:x.durchschnitt,abweichung:0,validiert:true}));
  const oldDay=new Map(arr(out.spieltag).map(x=>[x.team,x]));
  out.spieltag=matchday.map(x=>Object.assign({},clone(oldDay.get(x.team)||{}),x,{kicktippKontrollwert:x.durchschnitt,abweichung:0,validiert:true}));
  out.kontrolle={gueltig:true,abweichungen:[]};
  const pby=new Map(participants.map(p=>[p.id,p]));
  out.mitglieder=arr(site['punkte.json']?.rangliste).filter(r=>{const p=pby.get(r.teilnehmerId);return p&&p.aktiv!==false&&['Old Smugglers Team','New Smugglers Team'].includes(p.team)}).map(r=>({teilnehmerId:r.teilnehmerId,teilnehmer:r.teilnehmer,team:pby.get(r.teilnehmerId).team,punkte:Number(r.punkte||0)}));
  return out
 }
 function buildHighscore(site,wettbewerbe,teams){
  const out=clone(site['highscore.json']),points=site['punkte.json']||{},latest=arr(site['spieltagpunkte.json']?.spieltage).at(-1)||{};
  const oldOverall=new Map(arr(out.individual?.overall).map(x=>[x.participantId,x]));
  out.individual.overall=arr(points.rangliste).map(r=>Object.assign({},clone(oldOverall.get(r.teilnehmerId)||{}),{rank:r.platz,participantId:r.teilnehmerId,name:r.teilnehmer,bonusPoints:Number(r.bonuspunkte||0),matchdayWins:Number(r.spieltagssiege||0),totalPoints:Number(r.punkte||0)}));
  const oldDay=new Map(arr(out.individual?.matchday).map(x=>[x.participantId,x]));
  out.individual.matchday=arr(latest.rangliste).map(r=>Object.assign({},clone(oldDay.get(r.teilnehmerId)||{}),{rank:r.platz,participantId:r.teilnehmerId,name:r.teilnehmer,points:Number(r.punkte||0),bonusPoints:Number(r.bonuspunkte||0),totalPoints:Number(r.gesamtpunkte||0),matchdayWins:Number(r.gesamtspieltagssiege||0),matchdayRank:Number(r.spieltagsplatzierung||r.platz||0),exactHits:Number(r.exakt||0),differenceHits:Number(r.differenz||0),tendencyHits:Number(r.tendenz||0)}));
  const oldTeams=new Map(arr(out.teams?.overall).map(x=>[x.name,x]));
  out.teams.overall=arr(teams.gesamt).map(r=>Object.assign({},clone(oldTeams.get(r.team)||{}),{rank:r.platz,name:r.team,memberCount:r.mitglieder,pointsSum:r.punktesumme,totalPoints:r.durchschnitt,averagePoints:r.durchschnitt,calculatedAveragePoints:r.berechneterDurchschnitt,kicktippControlValue:r.kicktippKontrollwert,validated:r.validiert}));
  const oldTeamDay=new Map(arr(out.teams?.matchday).map(x=>[x.name,x]));
  out.teams.matchday=arr(teams.spieltag).map(r=>Object.assign({},clone(oldTeamDay.get(r.team)||{}),{rank:r.platz,name:r.team,memberCount:r.mitglieder,pointsSum:r.punktesumme,points:r.durchschnitt,totalPoints:r.durchschnitt,averagePoints:r.durchschnitt,kicktippControlValue:r.kicktippKontrollwert,validated:r.validiert}));
  out.overall.individual=clone(out.individual.overall);out.overall.team=clone(out.teams.overall);
  const aliases={'smugglerauftrag':'smugglerauftraege','dynamo-dresden':'smugglerauftraege'},slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  for(const c of arr(wettbewerbe.wettbewerbe)){
   const raw=slug(c.wettbewerb),id=aliases[raw]||raw,target=out.competitions?.[id];if(!target)continue;
   const oldC=new Map(arr(target.overall).map(x=>[x.participantId,x]));
   target.overall=arr(c.rangliste).map(r=>Object.assign({},clone(oldC.get(r.teilnehmerId)||{}),{rank:r.platz,participantId:r.teilnehmerId,name:r.teilnehmer,totalPoints:Number(r.punkte||0),matchdayWins:Number(r.spieltagssiege||0),exactHits:Number(r.exakt||0),differenceHits:Number(r.differenz||0),tendencyHits:Number(r.tendenz||0)}));
   const sourceTeam=id==='bundesliga'?arr(teams.spieltag):arr(c.teamwertung),oldCT=new Map(arr(target.team).map(x=>[x.name,x]));
   target.team=sourceTeam.map(r=>Object.assign({},clone(oldCT.get(r.team)||{}),{rank:r.platz,name:r.team,memberCount:Number(r.mitglieder||0),pointsSum:Number(r.punktesumme||0),averagePoints:Number(r.durchschnitt||0),totalPoints:Number(r.durchschnitt||0)}));
  }
  return out
 }
 function build(input,coreStage){
  const site=parse(input.siteFiles);
  for(const n of coreStage?.core||[])if(coreStage.docs?.[n])site[n]=clone(coreStage.docs[n]);
  const comp=TOSMCStage080.replayCompetitions(site),wettbewerbe=clone(site['wettbewerbspunkte.json']);wettbewerbe.wettbewerbe=clone(comp.aggregate.competitionDocs);
  const smuggler=clone(site['smugglerpunkte.json']),smComp=comp.aggregate.competitionDocs.find(c=>/smuggler|dynamo/.test(c.wettbewerb)),smOrders=comp.aggregate.sortedOrders.filter(o=>/smuggler|dynamo/.test(o.wertung));
  smuggler.auftraegeGesamt=smOrders.length;smuggler.auftraegeAbgeschlossen=smOrders.length;smuggler.wertungen=clone(comp.aggregate.smugglerDetails);smuggler.rangliste=clone(smComp?.rangliste||[]);
  const teams=buildTeams(site),history=buildHistory(site);site['wettbewerbspunkte.json']=wettbewerbe;site['smugglerpunkte.json']=smuggler;site['teampunkte.json']=teams;site['ranglistenverlauf.json']=history;
  const highscore=buildHighscore(site,wettbewerbe,teams);
  const docs={'wettbewerbspunkte.json':wettbewerbe,'smugglerpunkte.json':smuggler,'teampunkte.json':teams,'ranglistenverlauf.json':history,'highscore.json':highscore},details=[];let ok=true;
  for(const n of EXT){const same=canon(docs[n])===canon(parse(input.siteFiles)[n]);if(!same)ok=false;details.push({name:n,semanticMatch:same,bytes:JSON.stringify(docs[n],null,2).length})}
  const texts={};for(const n of EXT)texts[n]=JSON.stringify(docs[n],null,2)+'\n';
  return {ok,extended:EXT,docs,texts,details}
 }
 root.TOSMCExtendedGenerator={EXT,build};
})(window);
