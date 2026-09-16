import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = fs.readFileSync(path.join(root, "wettbewerb.js"), "utf8");

const requiredSnippets = [
  'if (slug !== "champions-league") return false;',
  'if (!matches.length) return false;',
  'root.appendChild(schedule);\n    return true;',
  'if (championsLeaguePhaseOverviewRendered && section.typ === "spiele" && section.zentral === true) return;'
];

for (const snippet of requiredSnippets) {
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

console.log(`CL-Doppellisten-Prüfung bestanden: obere Ligaphasenansicht ersetzt die zentrale Doppelliste; Fallback bleibt erhalten; gemeinsame Skriptkennung konsistent (${sharedScriptTag}).`);
