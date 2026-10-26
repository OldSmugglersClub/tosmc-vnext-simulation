import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  classifyOfficialMatchdayPage,
  loadOfficialConfirmedMatchdays
} from "../bundesliga-official-schedule.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const importSource = fs.readFileSync(path.join(root, "scripts/bundesliga-terminimport-auto.mjs"), "utf8");

assert(importSource.includes("Offizielle Terminprüfung ab erstem nicht beendeten Bundesliga-Spieltag"));
assert(importSource.includes("startMatchday: firstRelevantMatchday"));
assert(importSource.includes('spiel?.status !== "beendet"'));

function page(matchday, body) {
  return `<html><body>Saison 2026/2027 Spieltag ${matchday} ${body} ${"Inhalt ".repeat(60)}</body></html>`;
}

assert.equal(classifyOfficialMatchdayPage(page(2, "Freitag 20:30 Samstag 15:30"), 2), true);
assert.equal(classifyOfficialMatchdayPage(page(3, "Dieser Spieltag ist noch nicht fix terminiert."), 3), false);

const originalFetch = globalThis.fetch;
let calls = 0;

try {
  globalThis.fetch = async url => {
    calls++;
    const matchday = Number(String(url).match(/\/(\d+)$/)?.[1]);
    const html = calls === 1
      ? page(2, "Antwort ohne Uhrzeit")
      : matchday === 2
        ? page(2, "Freitag 20:30 Samstag 15:30")
        : page(3, "Dieser Spieltag ist noch nicht fix terminiert.");
    return {
      ok: true,
      status: 200,
      url: String(url),
      headers: { get: name => name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : null },
      text: async () => html
    };
  };

  const confirmed = await loadOfficialConfirmedMatchdays("bundesliga", {
    startMatchday: 2,
    fetchAttempts: 3,
    retryDelayMs: 0
  });
  assert.deepEqual([...confirmed], [2]);
  assert.equal(calls, 3, "Ein unplausibler Abruf muss wiederholt werden");

  calls = 0;
  globalThis.fetch = async url => ({
    ok: true,
    status: 200,
    url: String(url),
    headers: { get: () => "text/html" },
    text: async () => page(2, "Antwort dauerhaft ohne Uhrzeit")
  });

  await assert.rejects(
    loadOfficialConfirmedMatchdays("bundesliga", {
      startMatchday: 2,
      fetchAttempts: 3,
      retryDelayMs: 0
    }),
    /nach 3 Versuch\(en\) nicht sicher auswertbar/
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("HF39_OFFICIAL_SCHEDULE_OK");
