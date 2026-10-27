// Automatische Terminpflege fuer offene Sonderwettbewerbe ausschliesslich
// im Repository tosmc-vnext-simulation.
// Kicktipp-, Ergebnis-, Wertungs- und Historiedaten werden niemals verarbeitet.
import fs from 'node:fs';
import path from 'node:path';
import {run as inspectOfficialSources} from './offizielle-quellen-browser.mjs';
import {planOfficialChanges,applyOfficialChanges,updateScheduleSnapshot,writeIfChanged} from './terminwaechter-auto-core.mjs';

const root=path.resolve(process.env.TOSMC_ROOT||'.');
if(process.env.GITHUB_ACTIONS==='true' && !String(process.env.GITHUB_REPOSITORY||'').endsWith('/tosmc-vnext-simulation')){
  throw Error('FALSCHES_SCHREIBZIEL: Terminwaechter darf nur in tosmc-vnext-simulation laufen');
}
const dataPath=path.join(root,'spieldaten.json');
const configPath=path.join(root,'terminwaechter/offizielle-quellen.json');
const data=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
delete config.datenVersionErwartet;
delete config.spielbestandSHA256;

const report=await inspectOfficialSources({config,siteGames:data});
for(const finding of report.befunde){
  const source=config.quellen.find(q=>q.spielIds?.includes(finding.spielId));
  finding.quellenName=source?.name||null;
}
const plan=planOfficialChanges(data,report);
if(!plan.planned.length){console.log('Terminwaechter: keine sichere Terminaenderung.');process.exit(0);}
const next=applyOfficialChanges(data,plan);
writeIfChanged(dataPath,next);
const snapshotPath=path.join(root,'schedule-terminstand.json');
const snapshot=fs.existsSync(snapshotPath)?JSON.parse(fs.readFileSync(snapshotPath,'utf8')):{schemaVersion:1,updatedAt:null,entries:{}};
writeIfChanged(snapshotPath,updateScheduleSnapshot(snapshot,next,plan.planned.map(x=>x.id)));
fs.mkdirSync(path.join(root,'terminwaechter-bericht'),{recursive:true});
fs.writeFileSync(path.join(root,'terminwaechter-bericht','TERMINAENDERUNGEN.json'),JSON.stringify({stand:new Date().toISOString(),aenderungen:plan.planned},null,2)+'\n');
console.log(`Terminwaechter: ${plan.planned.length} sichere Aenderung(en): ${plan.planned.map(x=>x.id).join(', ')}`);
