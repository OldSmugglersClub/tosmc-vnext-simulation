(function(root){
 const STATE=['spielbetrieb.json','teilnehmer.json','import-history.json','spieldaten.json','teams.json'];
 const clone=v=>JSON.parse(JSON.stringify(v));
 const arr=v=>Array.isArray(v)?v:[];
 const canon=v=>JSON.stringify(v);
 function parse(files){const o={};for(const [n,v] of Object.entries(files||{})){try{o[n]=JSON.parse(v.text)}catch{o[n]=null}}return o}
 function idsParticipants(d){return arr(d?.teilnehmer).map(x=>String(x?.id||'')).filter(Boolean)}
 function uniq(a){return new Set(a).size===a.length}
 function prefixEqual(a,b){if(a.length>b.length)return false;for(let i=0;i<a.length;i++)if(canon(a[i])!==canon(b[i]))return false;return true}
 function gameMap(d){const m=new Map();for(const s of arr(d?.saisons))for(const g of arr(s?.spiele))m.set(String(g?.id||''),g);return m}
 function assertContract(before,after,scope={gameIds:[],competitionId:null}){
  const checks=[];const add=(name,ok,detail)=>checks.push({name,ok,detail});
  add('teams.json unverändert',canon(after['teams.json'])===canon(before['teams.json']),'Teamstammdaten dürfen nie aus Abschlussdaten regeneriert oder verändert werden.');
  const bi=arr(before['import-history.json']?.imports),ai=arr(after['import-history.json']?.imports);
  add('import-history append-only',prefixEqual(bi,ai),`${bi.length} Vorbestandseinträge unverändert; ${Math.max(0,ai.length-bi.length)} neuer Eintrag/Einträge angehängt.`);
  const bp=idsParticipants(before['teilnehmer.json']),ap=idsParticipants(after['teilnehmer.json']);const apSet=new Set(ap);const missingP=bp.filter(id=>!apSet.has(id));
  add('Teilnehmer-IDs erhalten',missingP.length===0,missingP.length?`Fehlende Bestands-IDs: ${missingP.slice(0,8).join(', ')}`:`${bp.length} Bestands-IDs erhalten.`);
  add('Teilnehmer-IDs eindeutig',uniq(ap),`${ap.length} Teilnehmer-IDs geprüft.`);
  const allowed=new Set((scope.gameIds||[]).map(String)),bg=gameMap(before['spieldaten.json']),ag=gameMap(after['spieldaten.json']);let foreignChanges=[];for(const [id,g] of bg){if(allowed.has(id))continue;const x=ag.get(id);if(!x||canon(x)!==canon(g))foreignChanges.push(id)}
  add('Fremde Spiele geschützt',foreignChanges.length===0,foreignChanges.length?`Außerhalb Scope verändert/fehlend: ${foreignChanges.slice(0,8).join(', ')}`:`${bg.size-allowed.size} Nicht-Scope-Spiele unverändert; Scope ${allowed.size} Spiele.`);
  const bo=arr(before['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege),ao=arr(after['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege);
  add('Abschlusshistorie append-only',prefixEqual(bo,ao),`${bo.length} Vorbestand; ${Math.max(0,ao.length-bo.length)} Abschluss angehängt.`);
  const br=arr(before['spielbetrieb.json']?.spielbetrieb?.aenderungsprotokoll),ar=arr(after['spielbetrieb.json']?.spielbetrieb?.aenderungsprotokoll);
  add('Änderungsprotokoll append-only',prefixEqual(br,ar),`${br.length} bestehende Protokolleinträge unverändert.`);
  return {ok:checks.every(c=>c.ok),checks};
 }
 function replaceScopeGames(pre,adminDoc,ids){const amap=gameMap(adminDoc),wanted=new Set(ids.map(String));for(const s of arr(pre?.saisons)){for(let i=0;i<arr(s?.spiele).length;i++){const id=String(s.spiele[i]?.id||'');if(wanted.has(id)&&amap.has(id))s.spiele[i]=clone(amap.get(id));}}}
 function build(input){
  const site=parse(input.siteFiles),admin=parse(input.adminFiles);const post={};for(const n of STATE)post[n]=clone(site[n]);
  const completed=arr(site['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege);const target=completed[completed.length-1];
  if(!target) return {ok:false,state:STATE,texts:{},preTexts:{},details:[],checks:[],probes:[],error:'Kein historischer Abschluss für State-Replay gefunden.'};
  const targetId=String(target.id||target.fachlicheId||''), gameIds=arr(target.spiele).map(g=>String(g?.id||'')).filter(Boolean), scope={gameIds,competitionId:target.wertung||null};
  const pre=clone(post);
  // 1) Abschlusszustand um exakt den letzten Abschluss zurücksetzen
  const sb=pre['spielbetrieb.json']?.spielbetrieb||{};
  if(Array.isArray(sb.abgeschlosseneAuftraege)&&sb.abgeschlosseneAuftraege.length&&String(sb.abgeschlosseneAuftraege[sb.abgeschlosseneAuftraege.length-1]?.id||'')===targetId) sb.abgeschlosseneAuftraege=sb.abgeschlosseneAuftraege.slice(0,-1);
  if(Array.isArray(sb.wertungsbloecke)) sb.wertungsbloecke=sb.wertungsbloecke.filter(x=>String(x?.id||x?.fachlicheId||'')!==targetId);
  if(Array.isArray(sb.ranglistenKontrollen)) sb.ranglistenKontrollen=sb.ranglistenKontrollen.filter(x=>String(x?.auftragId||'')!==targetId);
  if(Array.isArray(sb.aenderungsprotokoll)) sb.aenderungsprotokoll=sb.aenderungsprotokoll.filter(x=>String(x?.auftragId||'')!==targetId);
  // 2) letzten Import entfernen, aber nur wenn er zum Abschluss gehört
  const ih=pre['import-history.json']; if(Array.isArray(ih?.imports)&&ih.imports.length){const last=ih.imports[ih.imports.length-1];if(String(last?.id||'').startsWith(targetId))ih.imports=ih.imports.slice(0,-1)}
  // 3) Teilnehmer-Kicktippzustand für bestehende IDs auf Admin-Vorlage zurücksetzen
  const adminParts=new Map(arr(admin['teilnehmer.json']?.teilnehmer).map(p=>[String(p?.id||''),p]));let participantMutations=0;
  for(const p of arr(pre['teilnehmer.json']?.teilnehmer)){const a=adminParts.get(String(p?.id||''));if(a?.kicktipp&&canon(p.kicktipp)!==canon(a.kicktipp)){p.kicktipp=clone(a.kicktipp);participantMutations++;}}
  // 4) ausschließlich Scope-Spiele auf Admin-Vorabschlusszustand zurücksetzen
  replaceScopeGames(pre['spieldaten.json'],admin['spieldaten.json'],gameIds);
  // 5) teams bleibt byte-semantisch unverändert
  const normal=assertContract(pre,post,scope);
  const probes=[]; function probe(name,mutate){const a=clone(post);mutate(a);const r=assertContract(post,a,scope);probes.push({name,blocked:!r.ok,failed:r.checks.filter(x=>!x.ok).map(x=>x.name)})}
  probe('teams.json Mutation',a=>{a['teams.json'].teams[0].name=String(a['teams.json'].teams[0].name||'')+' [MUTATION]'});
  probe('import-history Altbestand ändern',a=>{if(a['import-history.json'].imports[0])a['import-history.json'].imports[0].status='manipuliert'});
  probe('Teilnehmer löschen',a=>{a['teilnehmer.json'].teilnehmer=a['teilnehmer.json'].teilnehmer.slice(1)});
  probe('Teilnehmer-ID duplizieren',a=>{if(a['teilnehmer.json'].teilnehmer.length>1)a['teilnehmer.json'].teilnehmer[1].id=a['teilnehmer.json'].teilnehmer[0].id});
  probe('Fremdspiel ändern',a=>{const m=gameMap(a['spieldaten.json']);const g=[...m.values()].find(x=>!new Set(gameIds).has(String(x?.id||'')));if(g)g.status='__GUARD_PROBE__'});
  probe('Abschlusshistorie ändern',a=>{const x=arr(a['spielbetrieb.json'].spielbetrieb?.abgeschlosseneAuftraege)[0];if(x)x.runde='__GUARD_PROBE__'});
  probe('Änderungsprotokoll verkürzen',a=>{const p=a['spielbetrieb.json'].spielbetrieb;if(Array.isArray(p?.aenderungsprotokoll)&&p.aenderungsprotokoll.length)p.aenderungsprotokoll=p.aenderungsprotokoll.slice(1)});
  const texts={},preTexts={},details=[];for(const n of STATE){texts[n]=JSON.stringify(post[n],null,2)+'\n';preTexts[n]=JSON.stringify(pre[n],null,2)+'\n';details.push({name:n,semanticMatch:true,mode:n==='teams.json'?'IMMUTABLE':n==='import-history.json'?'APPEND_ONLY':'STATE_MUTATION_REPLAY',changed:canon(pre[n])!==canon(post[n])})}
  const summary={targetId,wertung:target.wertung||'',runde:target.runde||'',gameCount:gameIds.length,participantMutations,importBefore:arr(pre['import-history.json']?.imports).length,importAfter:arr(post['import-history.json']?.imports).length,closuresBefore:arr(pre['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege).length,closuresAfter:arr(post['spielbetrieb.json']?.spielbetrieb?.abgeschlosseneAuftraege).length,stateChanged:STATE.filter(n=>canon(pre[n])!==canon(post[n]))};
  return {ok:normal.ok&&probes.every(p=>p.blocked),state:STATE,texts,preTexts,details,checks:normal.checks,probes,scope,summary};
 }
 root.TOSMCStateGuard={STATE,assertContract,build};
})(window);
