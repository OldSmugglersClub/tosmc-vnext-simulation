import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = fs.readFileSync(path.join(root, "wettbewerb.js"), "utf8");

// TEST2v2 4.9.26: CL-Spielplan seit 4.9.25 aus zentralen TOSMC-Spielen.
// Sicherung gegen doppelte Renderpfade und API-Fallback beibehalten.
const phaseOverview = script.match(/function renderChampionsLeaguePhaseOverview\([\s\S]*?(?=\n  function openLigaDbSafeIconUrl\()/)?.[0];
if (!phaseOverview) throw new Error("CL-Doppellisten-Schutz: renderChampionsLeaguePhaseOverview fehlt");
const requiredPhaseSnippets = [
  'if (slug !== "champions-league") return false;',
  'centralGamesForCompetition(centralGameData, "champions-league")',
  'if (!centralMatches.length) return false;',
  'root.appendChild(section);',
  'return true;'
];
for (const snippet of requiredPhaseSnippets) {
  if (!phaseOverview.includes(snippet)) throw new Error(`CL-Doppellisten-Schutz fehlt: ${snippet}`);
}
if ((phaseOverview.match(/root\.appendChild\(section\)/g) || []).length !== 1) {
  throw new Error("CL-Doppellisten-Schutz: die CL-Spielplan-Sektion muss genau einmal eingefuegt werden");
}
const requiredIntegrationSnippets = [
  'if (!rendered) renderPlaceholderSection(',
  'if (championsLeaguePhaseOverviewRendered && section.typ === "spiele" && section.zentral === true) return;'
];
for (const snippet of requiredIntegrationSnippets) {
  if (!script.includes(snippet)) throw new Error(`CL-Doppellisten-Schutz fehlt: ${snippet}`);
}

const pages = [
  "bundesliga.html",
  "champions-league.html",
  "dfb-pokal.html",
  "dynamo-dresden.html",
  "europa-league.html",
  "piratenkodex.html",
  "relegation.html",
  "weihnachtsregatta.html"
];

let sharedScriptTag = null;
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const match = html.match(/wettbewerb\.js\?v=([^"']+)/);
  if (!match) {
    throw new Error(`${page}: gemeinsame wettbewerb.js-Skriptkennung fehlt`);
  }
  const currentTag = `wettbewerb.js?v=${match[1]}`;
  if (sharedScriptTag === null) {
    sharedScriptTag = currentTag;
  } else if (currentTag !== sharedScriptTag) {
    throw new Error(`${page}: abweichende gemeinsame Skriptkennung ${currentTag}; erwartet ${sharedScriptTag}`);
  }
}

console.log(`CL-Doppellisten-Prüfung bestanden: zentraler CL-Spielplan wird genau einmal angezeigt; bei fehlenden zentralen Spielen bleibt der Platzhalter erhalten; gemeinsame Skriptkennung konsistent (${sharedScriptTag}).`);
