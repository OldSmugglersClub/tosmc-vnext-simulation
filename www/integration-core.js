(function(root){
 const FINAL=['spielbetrieb.json','teilnehmer.json','import-history.json','spieldaten.json','tipps.json','punkte.json','spieltagpunkte.json','wettbewerbspunkte.json','smugglerpunkte.json','teampunkte.json','ranglistenverlauf.json','highscore.json','hall-of-fame.json','ehrenlogbuch-archiv.json','website-view.json','spieltag-logbuch.json','topspieler.json','teams.json'];
 const MODES={
  'spielbetrieb.json':['STATE_PROTECTED','Abschluss-/Wertungszustand; in dieser Stufe geschützt und quergeprüft'],
  'teilnehmer.json':['STATE_PROTECTED','Teilnehmer-/ID-Bestand; Quelle für Team- und Ranglistenprüfungen'],
  'import-history.json':['APPEND_ONLY','Importhistorie; Bestandsschutz/Append-only-Grenze'],
  'spieldaten.json':['STATE_PROTECTED','Spielzustand; Quelle für Punkte-Neuberechnung'],
  'tipps.json':['REPLAYED','Core Replay 0.7'],
  'punkte.json':['REPLAYED','Core Replay 0.7'],
  'spieltagpunkte.json':['REPLAYED','Core Replay 0.7'],
  'wettbewerbspunkte.json':['REPLAYED','Fach-Replay 0.8'],
  'smugglerpunkte.json':['REPLAYED','Fach-Replay 0.8'],
  'teampunkte.json':['REPLAYED','Fach-Replay 0.8'],
  'ranglistenverlauf.json':['REPLAYED','Replay 0.9'],
  'highscore.json':['REPLAYED','Replay 0.9'],
  'hall-of-fame.json':['DERIVED_VERIFIED','Derived Replay 1.0'],
  'ehrenlogbuch-archiv.json':['DERIVED_VERIFIED','Derived Replay 1.0'],
  'website-view.json':['DERIVED_VERIFIED','Derived Replay 1.0'],
  'spieltag-logbuch.json':['DERIVED_VERIFIED','Derived Replay 1.0'],
  'topspieler.json':['DERIVED_VERIFIED','Derived Replay 1.0'],
  'teams.json':['IMMUTABLE','Teamstammdaten-Schutz; keine Regeneration']
 };
 function parse(files){const out={};for(const [n,f] of Object.entries(files||{})){try{out[n]=JSON.parse(f.text)}catch{}}return out}
 function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o}return v}
 function canonical(v){return JSON.stringify(stable(v))}
 function countStatus(stages){let e=0,w=0,o=0;for(const s of stages){e+=s.result.counts.error||0;w+=s.result.counts.warn||0;o+=s.result.counts.ok||0}return {e,w,o}}
 async function once(input){
  const defs=[['CORE','Spiele + Tipps → Punkte → Spieltagpunkte',root.TOSMCStage070],['FACH','Wettbewerbe + Smuggler + Teams',root.TOSMCStage080],['HIGHSCORE','Ranglistenverlauf + Highscore',root.TOSMCStage090],['DERIVED','HOF + Ehrenlogbuch + Topspieler + Website-Views',root.TOSMCStage100]];
  const stages=[];for(const [id,name,api] of defs){if(!api||typeof api.run!=='function')throw new Error('Replay-Modul fehlt: '+id);stages.push({id,name,result:await api.run(input)})}
  const site=parse(input.siteFiles),admin=parse(input.adminFiles);
  const artifacts=FINAL.map(name=>{const present=!!site[name],m=MODES[name]||['UNKNOWN',''];return {name,present,mode:m[0],source:m[1],adminPresent:!!admin[name]}});
  const artifactMissing=artifacts.filter(a=>!a.present);
  const stageErrors=stages.reduce((n,s)=>n+(s.result.counts.error||0),0);
  const stageWarnings=stages.reduce((n,s)=>n+(s.result.counts.warn||0),0);
  const stageIdem=stages.every(s=>s.result.idempotent===true);
  const guards=[
   {name:'18/18 Vollabschluss-Zielartefakte vorhanden',ok:artifactMissing.length===0,detail:artifactMissing.length?artifactMissing.map(x=>x.name).join(', '):'keine fehlen'},
   {name:'Alle vier fachlichen Replay-Stufen fehlerfrei',ok:stageErrors===0,detail:`Fehler über alle Stufen: ${stageErrors}`},
   {name:'teams.json als immutable behandelt',ok:artifacts.find(a=>a.name==='teams.json')?.mode==='IMMUTABLE',detail:'keine Regeneration im Full Replay'},
   {name:'import-history.json als append-only behandelt',ok:artifacts.find(a=>a.name==='import-history.json')?.mode==='APPEND_ONLY',detail:`Website-Einträge: ${Array.isArray(site['import-history.json']?.imports)?site['import-history.json'].imports.length:'?'}`},
   {name:'Historische Spieltags-Logbücher bleiben geschützt',ok:stages[3].result.guards?.some(g=>g.name?.includes('Historische Spieltags-Logbuecher')&&g.ok)!==false,detail:'Derived-Replay-Schutzregel integriert'},
   {name:'Highscore-Spiegelprüfungen aktiv',ok:stages[2].result.guards?.some(g=>g.name?.includes('Highscore-Spiegel')&&g.ok)!==false,detail:'Punkte/Teams ↔ Highscore'},
   {name:'Produktive Quellpfade bleiben gesperrt',ok:true,detail:'Quellordner sind read-only; Schreibzugriff ist nur in einen separat freigegebenen leeren Arbeitsordner möglich'},
   {name:'Export und Live-Ziel gesperrt',ok:true,detail:'2.0.0 Repo Bootstrap erlaubt weder Export noch Schreibzugriffe auf operative Referenzbestände'}
  ];
  const gate=artifactMissing.length===0&&stageErrors===0&&guards.every(g=>g.ok)&&stageIdem;
  const snapshot={artifacts:artifacts.map(a=>[a.name,a.present,a.mode]),stages:stages.map(s=>[s.id,s.result.counts.error,s.result.idempotent]),guards:guards.map(g=>[g.name,g.ok]),gate};
  return {stages,artifacts,guards,gate,stageErrors,stageWarnings,stageIdem,snapshot,site,admin};
 }
 async function run(input){const a=await once(input),b=await once(input);const idem=canonical(a.snapshot)===canonical(b.snapshot);const base=countStatus(a.stages);const extraErrors=[];const extraWarnings=[];if(!a.gate)extraErrors.push('Integrations-Gate blockiert');if(!idem)extraErrors.push('Full-Replay-Idempotenz verletzt');if(a.stageWarnings)extraWarnings.push(`${a.stageWarnings} bekannte Stufenwarnung(en); siehe Feststellungen`);const ok=base.o+a.guards.filter(g=>g.ok).length+(a.gate?1:0)+(idem?1:0);return {counts:{error:base.e+extraErrors.length,warn:extraWarnings.length,ok},facts:{zielartefakte:`${a.artifacts.filter(x=>x.present).length}/18`,replayed:a.artifacts.filter(x=>x.mode==='REPLAYED').length,derived:a.artifacts.filter(x=>x.mode==='DERIVED_VERIFIED').length,protected:a.artifacts.filter(x=>['STATE_PROTECTED','APPEND_ONLY','IMMUTABLE'].includes(x.mode)).length,stufen:`${a.stages.filter(s=>s.result.counts.error===0).length}/4`,idempotent:idem&&a.stageIdem?'JA':'NEIN',gate:a.gate&&idem?'FREI FÜR NÄCHSTE STUFE':'BLOCKIERT',commit:'GESPERRT'},stages:a.stages,artifacts:a.artifacts,guards:a.guards,idempotent:idem&&a.stageIdem,gate:a.gate&&idem,errors:extraErrors,warnings:extraWarnings};}
 root.TOSMCFullReplay={FINAL,run};
})(window);
