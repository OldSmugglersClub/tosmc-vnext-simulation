import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeGoalGetters } from "../bundesliga-torjaeger-core.mjs";

const normalized = normalizeGoalGetters([
  { goalGetterName: "B Spieler", goalCount: 1 },
  { goalGetterName: "A Spieler", goalCount: 2 },
  { GoalGetterName: "C Spieler", GoalCount: 1 },
  { goalGetterName: "Ohne Tor", goalCount: 0 }
]);

assert.deepEqual(normalized, [
  { name: "B Spieler", tore: 1 },
  { name: "A Spieler", tore: 2 },
  { name: "C Spieler", tore: 1 }
], "OpenLigaDB-Reihenfolge muss unverändert bleiben.");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "osc-goalgetter-"));
const fixture = path.join(dir, "fixture.json");
const target = path.join(dir, "bundesliga-torjaeger.json");
const games = path.join(dir, "spieldaten.json");

fs.writeFileSync(fixture, JSON.stringify([
  { goalGetterName: "Alpha", goalCount: 1 },
  { goalGetterName: "Beta", goalCount: 1 }
]));
fs.writeFileSync(games, JSON.stringify({
  saisons: [{ spiele: [{ wettbewerb: "bundesliga", heimtore: 5, auswaertstore: 1 }] }]
}));
fs.writeFileSync(target, JSON.stringify({
  schemaVersion: 1, datenVersion: 0, torjaeger: []
}));

const env = {
  ...process.env,
  OSC_GOALGETTERS_FIXTURE_PATH: fixture,
  OSC_GOALGETTERS_PATH: target,
  OSC_SPIELDATEN_PATH: games
};

let result = spawnSync(process.execPath, ["scripts/bundesliga-torjaeger-auto.mjs"], {
  cwd: process.cwd(), env, encoding: "utf8"
});
assert.equal(result.status, 0, result.stderr);

const first = JSON.parse(fs.readFileSync(target, "utf8"));
assert.equal(first.datenVersion, 1);
assert.equal(first.status, "bereit");
assert.deepEqual(first.torjaeger, [
  { name: "Alpha", tore: 1 },
  { name: "Beta", tore: 1 }
]);

result = spawnSync(process.execPath, ["scripts/bundesliga-torjaeger-auto.mjs"], {
  cwd: process.cwd(), env, encoding: "utf8"
});
assert.equal(result.status, 0, result.stderr);

const second = JSON.parse(fs.readFileSync(target, "utf8"));
assert.equal(second.datenVersion, 1, "Unveränderte Sportdaten dürfen datenVersion nicht erhöhen.");

console.log("Bundesliga-Torjäger TEST26: alle Tests bestanden.");
