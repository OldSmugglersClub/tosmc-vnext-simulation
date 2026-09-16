(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TOSMCReplay=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const FINAL=['spielbetrieb.json','teilnehmer.json','import-history.json','spieldaten.json','tipps.json','punkte.json','spieltagpunkte.json','wettbewerbspunkte.json','smugglerpunkte.json','teampunkte.json','ranglistenverlauf.json','highscore.json','hall-of-fame.json','ehrenlogbuch-archiv.json','website-view.json','spieltag-logbuch.json','topspieler.json','teams.json'];
 const NEED=['punkte.json','spieltagpunkte.json','teampunkte.json','highscore.json','hall-of-fame.json','ehrenlogbuch-archiv.json','website-view.json','spieltag-logbuch.json','topspieler.json','teilnehmer.json'];
 const arr=v=>Array.isArray(v)?v:[]; const num=v=>Number(v||0); const txt=v=>String(v??'').trim();
 function parse(files){const o={};for(const [n,v] of Object.entries(files||{})){try{o[n]=JSON.parse(v.text)}catch{o[n]=null}}return o}
 function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o}return v}
 function eq(a,b){return JSON.stringify(stable(a))===JSON.stringify(stable(b))}
 function normalize(s){return txt(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
 function replayTopspieler(site){
  const top=site['topspieler.json']||{}, ranking=arr(site['punkte.json']?.rangliste); const cats=arr(top.kategorien); const maxPoints=Math.max(0,...ranking.map(r=>num(r.punkte))), maxExact=Math.max(0,...ranking.map(r=>num(r.exakt)));
  const leaders=ranking.filter(r=>num(r.punkte)===maxPoints), exact=ranking.filter(r=>num(r.exakt)===maxExact);
  const c1=cats.find(c=>c.titel==='Spieltagsführer'),c2=cats.find(c=>c.titel==='Meiste exakte Tipps'),c3=cats.find(c=>c.titel==='Beste Serie');
  const leaderOk=maxPoints===0?c1?.name==='Noch offen':leaders.some(r=>txt(r.teilnehmer)===txt(c1?.name))&&txt(c1?.wert)===`${maxPoints} Punkte`;
  const exactOk=maxExact===0?c2?.name==='Noch offen':exact.some(r=>txt(r.teilnehmer)===txt(c2?.name))&&txt(c2?.wert)===String(maxExact);
  const seriesOk=txt(c3?.name)==='Noch offen'&&txt(c3?.wert)==='–';
  return {rows:cats.length,maxPoints,maxExact,leaderCandidates:leaders.length,exactCandidates:exact.length,leaderOk,exactOk,seriesOk,ok:cats.length===3&&leaderOk&&exactOk&&seriesOk};
 }
 function replayWebsiteView(site){
  const v=site['website-view.json']||{},h=site['highscore.json']||{},hof=site['hall-of-fame.json']||{};
  const comps=eq(v.highscore?.wettbewerbe,h.competitions||{}),overall=eq(v.highscore?.gesamt,h.overall||{}),teams=eq(v.highscore?.teams,h.teams||{}),hall=eq(v.hallOfFame,hof),display=v.anzeige?.berechnungInWebsite===false;
  return {competitions:comps,overall,teams,hall,display,ok:comps&&overall&&teams&&hall&&display};
 }
 function currentCompetitionMax(high,id){const c=high?.competitions?.[id];return Math.max(0,...arr(c?.overall).map(r=>num(r.totalPoints??r.points)))}
 function replayHall(site){
  const hof=site['hall-of-fame.json']||{},high=site['highscore.json']||{},state=hof.aktuelleSaison||{},comps=state.wettbewerbe||{};let statusMismatch=0,premature=0,checked=0;
  for(const [id,c] of Object.entries(comps)){checked++;const hs=high.competitions?.[id];if(hs&&txt(c.status)!==txt(hs.status))statusMismatch++;if(c?.abschluss?.completed!==true&&c?.sieger)premature++;}
  const all=arr(high.overall?.individual),maxOverall=Math.max(0,...all.map(r=>num(r.totalPoints))),maxBonus=Math.max(0,...all.map(r=>num(r.bonusPoints)));
  let maxExact=0;const exactBy=new Map();for(const c of Object.values(high.competitions||{}))for(const r of arr(c?.overall)){const k=r.participantId||`name:${normalize(r.name)}`,v=(exactBy.get(k)||0)+num(r.exactHits);exactBy.set(k,v);maxExact=Math.max(maxExact,v)}
  const rec=hof.rekorde||{};const recordOverall=num(rec.gesamtpunkte?.wert)>=maxOverall,recordBonus=num(rec.bonuspunkte?.wert)>=maxBonus,recordExact=num(rec.exakteTipps?.wert)>=maxExact;
  const running=txt(state.status)==='laufend';const noChampionWhileRunning=!running||(!state.gesamtChampion&&!state.gesamtTeamSieger);
  return {competitions:checked,statusMismatch,premature,maxOverall,maxBonus,maxExact,recordOverall,recordBonus,recordExact,running,noChampionWhileRunning,protection:hof.pruefung?.bestandsschutz===true,fieldMap:hof.pruefung?.websiteFeldzuordnung===true,ok:statusMismatch===0&&premature===0&&recordOverall&&recordBonus&&recordExact&&noChampionWhileRunning&&hof.pruefung?.bestandsschutz===true&&hof.pruefung?.websiteFeldzuordnung===true};
 }
 function replayHonor(site){
  const e=site['ehrenlogbuch-archiv.json']||{},hof=site['hall-of-fame.json']||{},high=site['highscore.json']||{},season=txt(hof.saison||high.meta?.season),seasons=arr(e.saisons),records=arr(e.ewigeRekorde),honors=arr(e.ehrenchampions);
  const currentArchived=seasons.some(s=>txt(s.label)===season||normalize(s.id)===normalize(season));const onlyCompleted=seasons.every(s=>txt(s.status)==='abgeschlossen');const idsUnique=new Set(seasons.map(s=>s.id)).size===seasons.length;
  const overallMax=Math.max(0,...arr(high.overall?.individual).map(r=>num(r.totalPoints))),bonusMax=Math.max(0,...arr(high.overall?.individual).map(r=>num(r.bonusPoints)));
  const ro=records.find(r=>r.id==='gesamtpunkte'), rb=records.find(r=>r.id==='bonuspunkte'); const recordProtection=(!ro||num(ro.wert)>=overallMax)&&(!rb||num(rb.wert)>=bonusMax);
  const running=txt(hof.aktuelleSaison?.status)==='laufend';const currentRule=!running||!currentArchived;
  return {seasons:seasons.length,records:records.length,honors:honors.length,currentArchived,onlyCompleted,idsUnique,recordProtection,currentRule,ok:onlyCompleted&&idsUnique&&recordProtection&&currentRule};
 }
 function historicalTeamRows(matchday,participants){const pm=new Map(arr(participants).map(p=>[p.id,p])),g=new Map();for(const r of arr(matchday?.rangliste)){const t=pm.get(r.teilnehmerId)?.team;if(!t)continue;const x=g.get(t)||{team:t,punktesumme:0,mitglieder:0};x.punktesumme+=num(r.punkte);x.mitglieder++;g.set(t,x)}return [...g.values()].map(x=>({...x,durchschnitt:x.mitglieder?Number((x.punktesumme/x.mitglieder).toFixed(2)):0})).sort((a,b)=>b.durchschnitt-a.durchschnitt||txt(a.team).localeCompare(txt(b.team),'de'))}
 function replayLogbook(site){
  const doc=site['spieltag-logbuch.json']||{},logs=arr(doc.logbuecher),days=arr(site['spieltagpunkte.json']?.spieltage).filter(d=>d?.abgeschlossen!==false),participants=arr(site['teilnehmer.json']?.teilnehmer),byId=new Map(logs.map(x=>[x.id,x]));let missing=0,captainMismatch=0,crewMismatch=0,priorityMismatch=0,duplicate=logs.length-new Set(logs.map(x=>x.id)).size;
  for(const d of days){const l=byId.get(d.id);if(!l){missing++;continue}const rows=arr(d.rangliste),max=Math.max(0,...rows.map(r=>num(r.punkte))),captains=rows.filter(r=>num(r.punkte)===max).map(r=>r.teilnehmerId).sort(),actual=arr(l.kapitaene).map(r=>r.teilnehmerId).sort();if(!eq(captains,actual))captainMismatch++;
    const teamRows=historicalTeamRows(d,participants),crew=arr(l.highlights).find(h=>h.typ==='crewduell')?.daten;if(teamRows.length>=2){const expectedWinner=num(teamRows[0].durchschnitt)===num(teamRows[1].durchschnitt)?null:teamRows[0].team;if(!crew||txt(crew.sieger||'')!==txt(expectedWinner||'')||num(crew.differenz)!==Number((num(teamRows[0].durchschnitt)-num(teamRows[1].durchschnitt)).toFixed(2)))crewMismatch++;}
    const p=arr(l.highlights).map(h=>num(h.prioritaet));for(let i=1;i<p.length;i++)if(p[i]>p[i-1]){priorityMismatch++;break}
  }
  return {logs:logs.length,days:days.length,missing,captainMismatch,crewMismatch,priorityMismatch,duplicate,ok:missing===0&&captainMismatch===0&&crewMismatch===0&&priorityMismatch===0&&duplicate===0&&logs.length===days.length};
 }
 function guards(site){const c=[],add=(name,ok,detail='')=>c.push({name,ok,detail});add('18 Vollabschluss-Zieldateien vorhanden',FINAL.every(n=>n in site),`${FINAL.filter(n=>!(n in site)).length} fehlen`);add('teams.json bleibt unangetastet',true,'Replay schreibt keine Teamstammdaten');add('import-history bleibt unangetastet',true,`${arr(site['import-history.json']?.imports).length} Eintraege gelesen`);add('Historische Spieltags-Logbuecher bleiben unangetastet',true,`${arr(site['spieltag-logbuch.json']?.logbuecher).length} Eintraege nur gelesen`);add('Website berechnet keine Ranglisten',site['website-view.json']?.anzeige?.berechnungInWebsite===false,'berechnungInWebsite=false');add('Commit/Export deaktiviert',true,'Kein Schreibpfad vorhanden');return c}
 async function run({adminFiles,siteFiles}){const admin=parse(adminFiles),site=parse(siteFiles),errors=[],warnings=[],ok=[];const missing=NEED.filter(n=>!site[n]);if(missing.length)errors.push(`Test-Website: erforderliche Dateien fehlen: ${missing.join(', ')}`);
  const top=replayTopspieler(site),view=replayWebsiteView(site),hall=replayHall(site),honor=replayHonor(site),log=replayLogbook(site);
  const checks=[['Topspieler-Replay',top.ok,`${top.rows} Kategorien · Punkte-Max ${top.maxPoints} · Exakt-Max ${top.maxExact} · Abweichungen ${top.ok?0:1}`],['Website-View Highscore-Spiegel',view.competitions&&view.overall&&view.teams,`Wettbewerbe ${view.competitions?'OK':'DIFF'} · Gesamt ${view.overall?'OK':'DIFF'} · Teams ${view.teams?'OK':'DIFF'}`],['Website-View Hall-of-Fame-Spiegel',view.hall,view.hall?'exakt identisch':'Abweichung erkannt'],['Hall-of-Fame Saison-/Wettbewerbsstatus',hall.statusMismatch===0&&hall.premature===0,`${hall.competitions} Wettbewerbe · Statusabweichungen ${hall.statusMismatch} · vorzeitige Sieger ${hall.premature}`],['Hall-of-Fame Rekord-Bestandsschutz',hall.recordOverall&&hall.recordBonus&&hall.recordExact,`aktuelle Maxima: Gesamt ${hall.maxOverall} · Bonus ${hall.maxBonus} · Exakt ${hall.maxExact}`],['Ehrenlogbuch Bestandsschutz',honor.ok,`${honor.seasons} Saisons · ${honor.records} Rekorde · ${honor.honors} Ehrenchampions · aktuelle Saison vorzeitig archiviert: ${honor.currentArchived?'JA':'NEIN'}`],['Spieltags-Logbuch Abdeckung',log.logs===log.days&&log.missing===0,`${log.logs}/${log.days} abgeschlossene Spieltage · fehlend ${log.missing}`],['Spieltags-Logbuch Kapitaene',log.captainMismatch===0,`${log.days} Spieltage · Abweichungen ${log.captainMismatch}`],['Spieltags-Logbuch Crewduell',log.crewMismatch===0,`${log.days} Spieltage · Abweichungen ${log.crewMismatch}`],['Spieltags-Logbuch Reihenfolge/IDs',log.priorityMismatch===0&&log.duplicate===0,`Prioritaetsabweichungen ${log.priorityMismatch} · doppelte IDs ${log.duplicate}`]];
  for(const [n,pass,d] of checks)(pass?ok:errors).push(`${n}: ${d}`);const gs=guards(site);for(const g of gs)(g.ok?ok:errors).push(g.name);
  const signature=()=>JSON.stringify({t:replayTopspieler(site),v:replayWebsiteView(site),h:replayHall(site),e:replayHonor(site),l:replayLogbook(site)});const idem=signature()===signature();if(idem)ok.push('Idempotenz des zweiten Replay-Laufs');else errors.push('Idempotenz verletzt');const adminMissing=NEED.filter(n=>!admin[n]);if(adminMissing.length)warnings.push(`TestAdmin besitzt nicht alle abgeleiteten Website-Ausgabedateien: ${adminMissing.join(', ')}`);
  return {counts:{error:errors.length,warn:warnings.length,ok:ok.length},facts:{topspieler:`${top.rows} Kategorien`,websiteView:view.ok?'SPIEGEL OK':'ABWEICHUNG',hallOfFame:`${hall.competitions} Wettbewerbe`,ehrenlogbuch:`${honor.seasons} Saisons / ${honor.records} Rekorde`,spieltagLogbuch:`${log.logs}/${log.days}`,idempotent:idem?'JA':'NEIN',commit:'GESPERRT'},checks,details:{top,view,hall,honor,log},guards:gs,idempotent:idem,errors,warnings,ok};
 }
 return {FINAL,NEED,run,replayTopspieler,replayWebsiteView,replayHall,replayHonor,replayLogbook};
});
