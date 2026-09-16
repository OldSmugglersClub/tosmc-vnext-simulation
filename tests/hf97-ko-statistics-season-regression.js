const fs=require('fs');
const assert=require('assert');
const w=fs.readFileSync('wettbewerb.js','utf8');
const s=fs.readFileSync('saisonuebersicht.js','utf8');
const version=fs.readFileSync('VERSION.txt','utf8').trim();

const checks=[];
function check(name, cond){ assert(cond,name); checks.push(name); }
check('CL Ligaphasenfilter vorhanden', /function championsLeaguePhaseMatches[\s\S]*Ligaphase/.test(w));
check('CL Statistik nutzt Ligaphasenfilter', /calculateChampionsLeaguePhaseStatistics[\s\S]*championsLeaguePhaseMatches/.test(w));
check('CL Tabelle nutzt Ligaphasenfilter', /renderChampionsLeagueTable[\s\S]*championsLeaguePhaseMatches/.test(w));
check('CL Form nutzt Ligaphasenfilter', /renderChampionsLeagueFormTable[\s\S]*championsLeaguePhaseMatches/.test(w));
check('EL Ligaphasenfilter vorhanden', /function europaLeaguePhaseMatches[\s\S]*Ligaphase/.test(w));
check('EL Tabelle nutzt Ligaphasenfilter', /renderEuropaLeagueTable[\s\S]*europaLeaguePhaseMatches/.test(w));
check('EL Form nutzt Ligaphasenfilter', /renderEuropaLeagueFormTable[\s\S]*europaLeaguePhaseMatches/.test(w));
check('Torjaeger-Fallback nur DFB-CL-EL verdrahtet', (w.match(/fetchGoalGettersWithFallback\(/g)||[]).length===4 && /"dfb-pokal"/.test(w) && /"champions-league"/.test(w) && /"europa-league"/.test(w));
check('Bundesliga bleibt lokaler Torjaegerpfad', /slug === "bundesliga" \? fetchJson\(bundesligaGoalGetterUrl/.test(w));
check('Dynamo bleibt eigener Matchdatenpfad', /slug === "dynamo-dresden" \? fetchJson\(OPENLIGADB_DYNAMO_MATCHES_URL/.test(w));
check('Saisonuebersicht externe Wettbewerbe exakt DFB-CL-EL', /"dfb-pokal"[\s\S]*"champions-league"[\s\S]*"europa-league"/.test(s));
check('Saisonuebersicht CL zaehlt gesamten externen Wettbewerb', /competitionId === "champions-league"\s*\? matches\s*:\s*matches\.filter/.test(s));
check('Saisonuebersicht EL-DFB auf KO-Runden begrenzt', /matches\.filter\(match => Boolean\(knockoutRoundKey\(match\)\)\)/.test(s));
check('Fremdwettbewerbe bleiben lokale Primaerdaten', /localPrimaryGames = games\.filter\(game => !EXTERNAL_COMPETITIONS\.has/.test(s));
check('Version HF97 Test2', version==='4.9.2-HF12-HF97-TEST2');
console.log(`HF97 KO/Statistik/Saisonuebersicht: ${checks.length}/${checks.length} BESTANDEN`);
