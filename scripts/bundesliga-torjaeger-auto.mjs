import fs from "node:fs";
import { normalizeGoalGetters, sameSportingData } from "./bundesliga-torjaeger-core.mjs";

const TARGET_PATH = process.env.OSC_GOALGETTERS_PATH || "bundesliga-torjaeger.json";
const SPIELDATEN_PATH = process.env.OSC_SPIELDATEN_PATH || "spieldaten.json";
const API_FIXTURE_PATH = process.env.OSC_GOALGETTERS_FIXTURE_PATH || "";
const API_URL = "https://api.openligadb.de/getgoalgetters/bl1/2026";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function berlinDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function bundesligaGames(doc) {
  const seasons = Array.isArray(doc?.saisons) ? doc.saisons : [];
  return seasons
    .flatMap(s => Array.isArray(s?.spiele) ? s.spiele : [])
    .concat(Array.isArray(doc?.spiele) ? doc.spiele : [])
    .filter(game => game?.wettbewerb === "bundesliga");
}

function hasStoredResult(game) {
  return Number.isInteger(game?.heimtore) && Number.isInteger(game?.auswaertstore);
}

async function loadApiData() {
  if (API_FIXTURE_PATH) {
    if (!fs.existsSync(API_FIXTURE_PATH)) {
      throw new Error(`Torjäger-Testfixture fehlt: ${API_FIXTURE_PATH}`);
    }
    console.log(`TESTMODUS: Torjägerdaten aus ${API_FIXTURE_PATH}.`);
    return readJson(API_FIXTURE_PATH);
  }

  let response;
  try {
    response = await fetch(API_URL, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`OpenLigaDB-Torjäger nicht erreichbar: ${error.message}. Keine Änderung.`);
  }

  if (!response.ok) {
    throw new Error(`OpenLigaDB-Torjäger HTTP ${response.status}. Keine Änderung.`);
  }
  return await response.json();
}

if (!fs.existsSync(SPIELDATEN_PATH)) {
  throw new Error(`${SPIELDATEN_PATH} fehlt.`);
}

const games = bundesligaGames(readJson(SPIELDATEN_PATH));
const completed = games.filter(hasStoredResult).length;

if (!completed) {
  console.log("KEIN TORJÄGER-ABRUF: Noch kein lokales Bundesliga-Ergebnis gespeichert.");
  process.exit(0);
}

const apiData = await loadApiData();
const torjaeger = normalizeGoalGetters(apiData);

if (!torjaeger.length) {
  throw new Error(
    `OpenLigaDB liefert trotz ${completed} lokal gespeichertem Bundesliga-Ergebnis keine verwertbaren Torjäger. Bestehende Datei bleibt unverändert.`
  );
}

let existing = {
  schemaVersion: 1,
  datenVersion: 0,
  aktualisiert: null,
  saison: "2026/2027",
  quelle: "OpenLigaDB getgoalgetters/bl1/2026",
  status: "wartet-auf-openligadb",
  torjaeger: []
};

if (fs.existsSync(TARGET_PATH)) {
  existing = { ...existing, ...readJson(TARGET_PATH) };
}

if (sameSportingData(existing.torjaeger, torjaeger)) {
  console.log(`KEINE TORJÄGER-ÄNDERUNG: ${torjaeger.length} Einträge unverändert.`);
  process.exit(0);
}

const output = {
  schemaVersion: 1,
  datenVersion: Number(existing.datenVersion || 0) + 1,
  aktualisiert: berlinDate(),
  saison: "2026/2027",
  quelle: "OpenLigaDB getgoalgetters/bl1/2026",
  status: "bereit",
  torjaeger
};

fs.writeFileSync(TARGET_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`TORJÄGER AKTUALISIERT: ${torjaeger.length} Einträge gespeichert.`);
