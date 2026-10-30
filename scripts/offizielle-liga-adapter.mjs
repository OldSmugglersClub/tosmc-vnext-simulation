// Official league response adapters: evidence only, never change website data.
// Provider-specific entry recognition; timestamps must be offset-aware.
const aliases={};
const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
const val=(o,paths)=>paths.map(p=>get(o,p)).find(v=>v!==undefined&&v!==null&&v!=='');
const name=x=>typeof x==='string'?x:typeof x==='object'&&x?(x.name||x.displayName||x.teamName||x.fullName||x.officialName||x.shortName||x.clubName||x.description||x.label||x.team?.name||x.club?.name||x.team?.displayName):null;
const timestamp=x=>{
 if(typeof x==='number'&&x>1e12)return new Date(x).toISOString();
 if(typeof x==='number'&&x>1e9)return new Date(x*1000).toISOString();
 if(typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x)))return x;
 return null;
};
const paths={
 seriea:{home:['homeTeam','home_team','home','homeSquad','homeClub','teamHome','teams.home','participants.home','home_team_name'],away:['awayTeam','away_team','away','awaySquad','awayClub','teamAway','teams.away','participants.away','away_team_name'],date:['matchDateUtc','matchDateTimeUTC','kickoffTime','kickOffTime','kickoff','kickOff','startDate','startTime','scheduledStart','dateTime','dateUTC','matchDate','date']},
 premierleague:{home:['homeTeam','home','homeTeamName','homeTeamDisplayName','teamHome','teams.home','participants.home','participants.0.team'],away:['awayTeam','away','awayTeamName','awayTeamDisplayName','teamAway','teams.away','participants.away','participants.1.team'],date:['kickoffTime','kickoff','kickOffTime','kickOff','startDate','startTime','dateTime','eventDate','matchDateTimeUTC','date','utcDate']},
 portugal:{home:['homeTeam','home','home_team','homeClub','homeTeamName','home_team_name','teamHome','homeTeamInfo','teams.home'],away:['awayTeam','away','away_team','awayClub','awayTeamName','away_team_name','teamAway','awayTeamInfo','teams.away'],date:['fixtureDate','dateUTC','matchDateTimeUTC','matchDate','matchDatetime','match_date','kickoffTime','kickOff','startDate','dateTime','startTime','date']},
 france:{home:['home.clubIdentity'],away:['away.clubIdentity'],date:['date']}
};
const idkey=x=>JSON.stringify(x,Object.keys(x||{}).sort()).slice(0,250);
function nodes(data){const results=[], seen=new WeakSet();let count=0;
 function walk(x,depth){if(!x||typeof x!=='object'||seen.has(x)||depth>18||++count>80000)return;seen.add(x);
  if(Array.isArray(x)){for(const v of x.slice(0,5000))walk(v,depth+1);return;}
  results.push(x);for(const [k,v] of Object.entries(x))if(v&&typeof v==='object'&&!/^(news|article|media|statistics|players|comments|stories|advertis)/i.test(k))walk(v,depth+1);
 }walk(data,0);return results;
}
function berlin(iso){const d=new Date(iso);const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));return {datum:`${parts.year}-${parts.month}-${parts.day}`,anstoss:`${parts.hour}:${parts.minute}`};}
export function providerForUrl(url){try{const h=new URL(url).hostname;const p=new URL(url).pathname;
 if(h==='api-sdp.legaseriea.it'&&/\/matches(?:\/|$)/.test(p))return 'seriea';
 if(h==='api.premierleague.com'&&/\/(?:broadcasting\/match-events|football\/fixtures|fixtures|matches)(?:\/|$)/.test(p))return 'premierleague';
 if(h.endsWith('.ligaportugal.pt')&&/\/api\/v1\/competition\/matches(?:\/|$)/.test(p))return 'portugal';
 if(h==='ma-api.ligue1.fr'&&/\/championship-matches\/championship\/1\/game-week\/\d+(?:\/|$)/.test(p))return 'france';
 }catch{}return null;}
export function decodeOfficial(provider,data){if(!paths[provider])return {fixtures:[],diagnosis:{reason:'NICHT_UNTERSTUETZT'}};
 const objects=nodes(data), fixtures=[], seen=new Set(), encountered={},candidateShapes={};let candidates=0;
 for(const o of objects){const h=name(val(o,paths[provider].home)),a=name(val(o,paths[provider].away)),raw=val(o,paths[provider].date),iso=timestamp(raw);
  if(h&&a){candidates++;const shape=Object.keys(o).sort().join('|').slice(0,600);candidateShapes[shape]=(candidateShapes[shape]||0)+1;
   // Preserve the official pairing while withholding every provisional date/time.
   const open=(provider==='portugal'&&Object.prototype.hasOwnProperty.call(o,'fixtureDateIsDefined')&&o.fixtureDateIsDefined!==true)
     ||(provider==='france'&&o.dateTimeUnknown!==false);
   if(open){
    encountered['termin nicht amtlich definiert']=(encountered['termin nicht amtlich definiert']||0)+1;
    const key=[h.toLowerCase(),a.toLowerCase(),'OPEN'].join('|');
    if(!seen.has(key)){seen.add(key);fixtures.push({heim:h,gast:a,datum:null,anstoss:null,startDate:null,terminBestaetigt:false,provider});}
    continue;
   }
   if(!iso){const k=String(raw===undefined?'ohne Zeitfeld':typeof raw);encountered[k]=(encountered[k]||0)+1;continue;}
   const key=[h.toLowerCase(),a.toLowerCase(),new Date(iso).getTime()].join('|');if(seen.has(key))continue;seen.add(key);
   fixtures.push({heim:h,gast:a,...berlin(iso),startDate:iso,provider});
  }
 }
 // report shape only, no API tokens, player data, or potentially sensitive response bodies
 const shape=objects.slice(0,80).map(o=>Object.keys(o).slice(0,30).sort().join('|'));const frequent=Object.entries(shape.reduce((m,s)=>(m[s]=(m[s]||0)+1,m),{})).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([keys,count])=>({keys:keys.slice(0,300),count}));
 const kandidatFeldmuster=Object.entries(candidateShapes).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([keys,count])=>({keys,count}));
 const beispiele=fixtures.slice(0,10).map(({heim,gast,datum,anstoss})=>({heim,gast,datum,anstoss}));
 return {fixtures,diagnosis:{provider,knoten:objects.length,kandidatenMitTeams:candidates,fixtures:fixtures.length,zeitprobleme:encountered,kandidatFeldmuster,beispiele,topFeldmuster:frequent}};
}

export function decodeFpl(bootstrap,fixturesData){
 const teams=Array.isArray(bootstrap?.teams)?bootstrap.teams:[];
 const matches=Array.isArray(fixturesData)?fixturesData:[];
 const names=new Map();
 for(const team of teams){if(Number.isInteger(team?.id)&&typeof team?.name==='string'&&team.name.trim())names.set(team.id,team.name.trim());}
 const fixtures=[];let rejected=0;
 for(const match of matches){
  const home=names.get(match?.team_h),away=names.get(match?.team_a),iso=timestamp(match?.kickoff_time);
  if(!home||!away||!iso){rejected++;continue;}
  fixtures.push({heim:home,gast:away,...berlin(iso),startDate:iso,provider:'fpl',fixtureId:match.id??null});
 }
 return {fixtures,diagnosis:{provider:'fpl',teams:names.size,matches:matches.length,fixtures:fixtures.length,rejected}};
}

