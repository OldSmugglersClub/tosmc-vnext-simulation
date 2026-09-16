import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { validateAndPlan } from "../dynamo-terminimport-core.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const source = fs.readFileSync(path.join(root, "scripts/dynamo-terminimport-core.mjs"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(root, "spieldaten.json"), "utf8"));
const teamsData = JSON.parse(fs.readFileSync(path.join(root, "teams.json"), "utf8"));

// Schutz 1: Die relevanten Sicherheitszweige müssen weiterhin im Core vorhanden sein.
assert(source.includes("const hasLocalWindow="));
assert(source.includes("hasLocalWindow && !dateInWindow"));
assert(source.includes('reason:"OpenLigaDB-Datum außerhalb des lokalen Spieltagfensters"'));
assert(source.includes("matched.size !== 34"));
assert(source.includes('reason: "lokal bereits beendet/mit Ergebnis"'));

// Der Prüfzeitpunkt ist inzwischen bewusst injizierbar. Das ersetzt die alte,
// brittle Prüfung auf den exakten Quelltext "const now=new Date();".
assert.match(source, /validateAndPlan\([^)]*now\s*=\s*new Date\(\)/s);

const teams = Array.isArray(teamsData) ? teamsData : teamsData.teams;
const teamById = new Map(teams.map(team => [team.id, team]));
const allGames = (Array.isArray(data?.saisons) ? data.saisons : [])
  .flatMap(s => Array.isArray(s?.spiele) ? s.spiele : []);
const originals = allGames.filter(game =>
  game?.wettbewerb === "2-bundesliga" &&
  game?.saison === "2026/2027" &&
  (game?.heimTeamId === "dynamo-dresden" || game?.auswaertsTeamId === "dynamo-dresden")
);
assert.equal(originals.length, 34, "Testbasis muss 34 Dynamo-Saisonspiele enthalten");

function teamName(id) {
  const team = teamById.get(id);
  assert(team, `Team ${id} fehlt in teams.json`);
  return team.name;
}

function cloneDataWithOpenDynamo() {
  const copy = structuredClone(data);
  const games = copy.saisons.flatMap(s => s.spiele || []).filter(game =>
    game?.wettbewerb === "2-bundesliga" &&
    game?.saison === "2026/2027" &&
    (game?.heimTeamId === "dynamo-dresden" || game?.auswaertsTeamId === "dynamo-dresden")
  );
  for (const game of games) {
    game.status = "geplant";
    game.heimtore = null;
    game.auswaertstore = null;
    game.terminBestaetigt = false;
    game.anstoss = "";
  }
  return { copy, games };
}

function apiFromGames(games) {
  return games.map((game, index) => {
    const fallbackDate = `2026-${String(9 + Math.floor(index / 10)).padStart(2, "0")}-${String(1 + (index % 10)).padStart(2, "0")}`;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(game.datumVon || "")) ? game.datumVon : fallbackDate;
    return {
      matchID: index + 1,
      group: { groupOrderID: Number(game.spieltagNummer) },
      team1: { teamName: teamName(game.heimTeamId) },
      team2: { teamName: teamName(game.auswaertsTeamId) },
      matchDateTime: `${date}T15:30:00`,
      lastUpdateDateTime: "2026-09-10T10:00:00"
    };
  });
}

const confirmed = new Set(Array.from({ length: 34 }, (_, i) => i + 1));

// Schutz 2: Komplett offener Eintrag OHNE lokales Datumsfenster darf erstmals
// konkretisiert werden. Das ist die HF15-Funktion selbst.
{
  const { copy, games } = cloneDataWithOpenDynamo();
  games[0].datumVon = "";
  games[0].datumBis = "";
  const api = apiFromGames(games);
  api[0].matchDateTime = "2026-10-15T18:30:00";
  const plan = validateAndPlan(copy, teamsData, api, confirmed, new Date("2026-09-10T00:00:00Z"));
  assert(plan.planned.some(item => item.localId === games[0].id), "Offener Dynamo-Termin ohne lokales Fenster muss konkretisierbar bleiben");
}

// Schutz 3: Existiert ein lokales Datumsfenster, darf ein API-Termin außerhalb
// dieses Fensters nicht automatisch übernommen werden.
{
  const { copy, games } = cloneDataWithOpenDynamo();
  games[0].datumVon = "2026-10-10";
  games[0].datumBis = "2026-10-12";
  const api = apiFromGames(games);
  api[0].matchDateTime = "2026-10-20T18:30:00";
  const plan = validateAndPlan(copy, teamsData, api, confirmed, new Date("2026-09-10T00:00:00Z"));
  assert(plan.skipped.some(item => item.localId === games[0].id && item.reason === "OpenLigaDB-Datum außerhalb des lokalen Spieltagfensters"));
}

// Schutz 4: Bereits beendete/mit Ergebnis versehene Spiele dürfen nicht neu
// terminiert werden.
{
  const { copy, games } = cloneDataWithOpenDynamo();
  games[0].status = "beendet";
  games[0].heimtore = 2;
  games[0].auswaertstore = 1;
  const api = apiFromGames(games);
  const plan = validateAndPlan(copy, teamsData, api, confirmed, new Date("2026-09-10T00:00:00Z"));
  assert(plan.skipped.some(item => item.localId === games[0].id && item.reason === "lokal bereits beendet/mit Ergebnis"));
}

// Schutz 5: Eine unvollständige Dynamo-Zuordnung muss fail-safe abbrechen.
{
  const { copy, games } = cloneDataWithOpenDynamo();
  const api = apiFromGames(games).slice(0, 33);
  assert.throws(
    () => validateAndPlan(copy, teamsData, api, confirmed, new Date("2026-09-10T00:00:00Z")),
    /33\/34|unvollständig\/unerwartet/,
    "Unvollständiger Dynamo-Saisonplan muss abgewiesen werden"
  );
}

console.log("HF15_DYNAMO_TERMINAUTOMATIK_OK");
