import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const games = JSON.parse(fs.readFileSync(path.join(root, "spieldaten.json"), "utf8"));
const teams = JSON.parse(fs.readFileSync(path.join(root, "teams.json"), "utf8"));
const logos = JSON.parse(fs.readFileSync(path.join(root, "assets/team-logos/original-team-logos.json"), "utf8"));
const adapter = fs.readFileSync(path.join(root, "schedule-data-adapter.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const usedIds = new Set();
const visit = value => {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== "object") return;
  if (typeof value.heimTeamId === "string") usedIds.add(value.heimTeamId);
  if (typeof value.auswaertsTeamId === "string") usedIds.add(value.auswaertsTeamId);
  Object.values(value).forEach(visit);
};
visit(games);

const byId = new Map(teams.teams.map(team => [team.id, team]));
const errors = [];
for (const id of [...usedIds].sort()) {
  const team = byId.get(id);
  const original = logos.teams?.[id];
  if (!team) { errors.push(`${id}: Teamstammsatz fehlt`); continue; }
  if (!String(team.name || "").trim() || team.name === "Team offen") errors.push(`${id}: offizieller Anzeigename fehlt`);
  if (!original?.path) errors.push(`${id}: Originalwappen-Registereintrag fehlt`);
  if (team.logo !== original?.path) errors.push(`${id}: Teamlogo verweist nicht auf das verbindliche Originalwappen`);
}
if (!adapter.includes('const teamsDocument = await fetchJson("./teams.json")')) {
  errors.push("Startseitenadapter lädt die zentralen Teamstammdaten nicht");
}
if (!adapter.includes("teams: { teams: canonicalTeams }")) {
  errors.push("Startseitenadapter verwendet nicht die zentralen Teamstammdaten");
}
if (!index.includes("schedule-data-adapter.js?v=4.9.2-HF12-HF62")) {
  errors.push("HF62-Cache-Kennung des Startseitenadapters fehlt");
}
if (errors.length) {
  console.error("Teamstammdaten-Prüfung FEHLGESCHLAGEN:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`Teamstammdaten-Prüfung bestanden: ${usedIds.size}/${usedIds.size} verwendete Teams mit offiziellem Namen und lokalem Originalwappen.`);
