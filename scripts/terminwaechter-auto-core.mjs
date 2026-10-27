import fs from 'node:fs';

const SCHEDULE_FIELDS=['datum','datumVon','datumBis','datumAnzeige','anstoss','terminBestaetigt','status','quelleStand'];
const ROOT_FIELDS=['datenVersion','aktualisiert'];

const isoDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));
const clock=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||''));
const displayDate=date=>{const [y,m,d]=date.split('-');return `${d}.${m}.${y}`;};
const day=date=>Math.floor(Date.parse(`${date}T12:00:00Z`)/86400000);
const clone=value=>JSON.parse(JSON.stringify(value));

function allGames(data){return (data.saisons||[]).flatMap(s=>Array.isArray(s.spiele)?s.spiele:[]);}
function protectedProjection(data){
  const copy=clone(data);
  for(const key of ROOT_FIELDS)delete copy[key];
  for(const game of allGames(copy))for(const key of SCHEDULE_FIELDS)delete game[key];
  return copy;
}

export function planOfficialChanges(data,report,{now=new Date(),windowDays=56,maxChanges=12}={}){
  if(!data||!Array.isArray(data.saisons))throw Error('SPIELDATEN_UNGUELTIG');
  if(!report||!Array.isArray(report.befunde))throw Error('QUELLENBERICHT_UNGUELTIG');
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('PRUEFZEIT_UNGUELTIG');
  const today=now.toISOString().slice(0,10), start=day(today)-1, end=day(today)+windowDays;
  const games=new Map(allGames(data).map(g=>[g.id,g]));
  const sourceState=new Map((report.quellen||[]).map(q=>[q.name,q.status]));
  const planned=[];
  for(const finding of report.befunde){
    if(finding.status!=='ABWEICHUNG')continue;
    const game=games.get(finding.spielId);
    if(!game)throw Error(`SPIEL_FEHLT:${finding.spielId}`);
    if(game.status==='beendet'||Number.isInteger(game.heimtore)||Number.isInteger(game.auswaertstore))throw Error(`ABGESCHLOSSENES_SPIEL:${game.id}`);
    const official=finding.amtlich;
    if(!isoDate(official?.datum)||!clock(official?.anstoss))throw Error(`AMTLICHER_TERMIN_UNGUELTIG:${game.id}`);
    const officialDay=day(official.datum);
    if(officialDay<start||officialDay>end)continue;
    if(!finding.quellenName||sourceState.get(finding.quellenName)!=='SPIELE_EXTRAHIERT')throw Error(`QUELLE_NICHT_FREIGEGEBEN:${game.id}`);
    planned.push({id:game.id,datum:official.datum,anstoss:official.anstoss,quelleStand:today,quellenName:finding.quellenName,quelle:finding.quelle});
  }
  const ids=new Set();for(const item of planned){if(ids.has(item.id))throw Error(`DOPPELTER_BEFUND:${item.id}`);ids.add(item.id);}
  if(planned.length>maxChanges)throw Error(`ZU_VIELE_AENDERUNGEN:${planned.length}/${maxChanges}`);
  return {today,planned};
}

export function applyOfficialChanges(data,plan,{updatedAt=new Date().toISOString()}={}){
  const before=protectedProjection(data), next=clone(data), games=new Map(allGames(next).map(g=>[g.id,g]));
  for(const item of plan.planned){
    const game=games.get(item.id);if(!game)throw Error(`SPIEL_FEHLT:${item.id}`);
    for(const key of ['datum','datumVon','datumBis','datumAnzeige','anstoss','terminBestaetigt','status','quelleStand'])if(!(key in game))throw Error(`PFLICHTFELD_FEHLT:${item.id}:${key}`);
    game.datum=item.datum;game.datumVon=item.datum;game.datumBis=item.datum;game.datumAnzeige=displayDate(item.datum);
    game.anstoss=item.anstoss;game.terminBestaetigt=true;game.status='terminiert';game.quelleStand=item.quelleStand;
  }
  if(plan.planned.length){next.datenVersion=Number(data.datenVersion||0)+1;next.aktualisiert=updatedAt;}
  if(JSON.stringify(before)!==JSON.stringify(protectedProjection(next)))throw Error('SCHUTZVERLETZUNG_AUSSERHALB_TERMINFELDER');
  return next;
}

export function writeIfChanged(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n','utf8');}
