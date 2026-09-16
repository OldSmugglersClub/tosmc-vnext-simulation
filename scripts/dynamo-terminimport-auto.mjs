import { loadOfficialConfirmedMatchdays } from "./bundesliga-official-schedule.mjs";
import fs from "node:fs";
import {
  readJson,
  validateAndPlan,
  applyPlanToJsonText
} from "./dynamo-terminimport-core.mjs";

const SPIELDATEN_PATH = process.env.OSC_SPIELDATEN_PATH || "spieldaten.json";
const TEAMS_PATH = process.env.OSC_TEAMS_PATH || "teams.json";
const API_FIXTURE_PATH = process.env.OSC_API_FIXTURE_PATH || "";
const API_URL = "https://api.openligadb.de/getmatchdata/bl2/2026";

function berlinDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day}`;
}

async function loadApiMatches() {
  if (API_FIXTURE_PATH) {
    if (!fs.existsSync(API_FIXTURE_PATH)) throw new Error(`API-Testfixture fehlt: ${API_FIXTURE_PATH}`);
    console.log(`TESTMODUS: OpenLigaDB-Daten aus ${API_FIXTURE_PATH}.`);
    return readJson(API_FIXTURE_PATH);
  }
  let response;
  try {
    response = await fetch(API_URL, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`OpenLigaDB nicht erreichbar: ${error.message}. Keine Änderung.`);
  }
  if (!response.ok) throw new Error(`OpenLigaDB HTTP ${response.status}. Keine Änderung.`);
  return await response.json();
}

if (!fs.existsSync(SPIELDATEN_PATH)) throw new Error(`${SPIELDATEN_PATH} fehlt.`);
if (!fs.existsSync(TEAMS_PATH)) throw new Error(`${TEAMS_PATH} fehlt.`);

const originalSpieldatenText = fs.readFileSync(SPIELDATEN_PATH, "utf8");
const data = JSON.parse(originalSpieldatenText);
const teams = readJson(TEAMS_PATH);
const apiMatches = await loadApiMatches();
const saisonSpiele = (Array.isArray(data?.saisons) ? data.saisons : [])
  .flatMap(s => Array.isArray(s?.spiele) ? s.spiele : []);
const dynamoSpiele = saisonSpiele.filter(spiel =>
  spiel?.wettbewerb === "2-bundesliga" &&
  (spiel?.heimTeamId === "dynamo-dresden" || spiel?.auswaertsTeamId === "dynamo-dresden")
);
const offeneSpieltage = dynamoSpiele
  .filter(spiel => spiel?.status !== "beendet")
  .map(spiel => Number(spiel?.spieltagNummer))
  .filter(Number.isFinite);
const firstRelevantMatchday = offeneSpieltage.length ? Math.min(...offeneSpieltage) : 34;
console.log(`Offizielle Terminprüfung ab erstem nicht beendeten Dynamo-Spieltag: ${firstRelevantMatchday}`);
const officialConfirmedMatchdays = await loadOfficialConfirmedMatchdays("2-bundesliga", {
  startMatchday: firstRelevantMatchday
});
console.log(`Offiziell fix terminierte Spieltage: ${[...officialConfirmedMatchdays].join(", ")}`);
const plan = validateAndPlan(data, teams, apiMatches, officialConfirmedMatchdays, new Date());

const skipGruende = Object.fromEntries(
  [...new Set(plan.skipped.map(item => item.reason))]
    .sort((a, b) => a.localeCompare(b, "de"))
    .map(reason => [reason, plan.skipped.filter(item => item.reason === reason).length])
);

console.log(JSON.stringify({
  lokaleDynamoSpiele: plan.localCount,
  openLigaDbDynamoSpiele: plan.apiDynamoCount,
  eindeutigZugeordnet: plan.matched,
  neueExakteTermine: plan.planned,
  uebersprungen: plan.skipped.length,
  uebersprungenNachGrund: skipGruende
}, null, 2));

if (!plan.planned.length) {
  console.log("KEINE TERMINÄNDERUNG: Keine neuen, sicher konkretisierbaren Dynamo-Termine.");
  process.exit(0);
}

const updatedText = applyPlanToJsonText(originalSpieldatenText, plan, berlinDate());
if (updatedText === originalSpieldatenText) {
  console.log("KEINE TERMINÄNDERUNG.");
  process.exit(0);
}

fs.writeFileSync(SPIELDATEN_PATH, updatedText, "utf8");
console.log(`TERMINIMPORT ERFOLGREICH: ${plan.planned.length} Dynamo-Termin(e) konkretisiert; datenVersion exakt +1; JSON-Struktur außerhalb der Zielfelder byte-nah erhalten.`);
