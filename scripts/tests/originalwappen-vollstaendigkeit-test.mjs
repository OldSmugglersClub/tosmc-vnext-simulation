import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const data = JSON.parse(fs.readFileSync(path.join(root, "spieldaten.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "assets/team-logos/original-team-logos.json"), "utf8"));
const teamIds = new Set();
const visit = value => {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== "object") return;
  if (typeof value.heimTeamId === "string") teamIds.add(value.heimTeamId);
  if (typeof value.auswaertsTeamId === "string") teamIds.add(value.auswaertsTeamId);
  Object.values(value).forEach(visit);
};
visit(data);

const errors = [];
for (const teamId of [...teamIds].sort()) {
  const entry = registry.teams?.[teamId];
  if (!entry?.path) { errors.push(`${teamId}: kein Registereintrag`); continue; }
  const relative = entry.path.replace(/^\.\//, "");
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) { errors.push(`${teamId}: Datei fehlt (${relative})`); continue; }
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size < 100) errors.push(`${teamId}: Bilddatei ungültig (${relative})`);
  if (!String(entry.status || "").startsWith("local-original")) errors.push(`${teamId}: Status ist nicht local-original`);
}

const syntheticReferences = [];
for (const file of ["team-badge.js", "index.html", "wettbewerb.js"]) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (/createSeal|renderSealFallback/i.test(content)) syntheticReferences.push(file);
}
if (syntheticReferences.length) errors.push(`Fantasiewappen-Logik gefunden: ${syntheticReferences.join(", ")}`);
if (errors.length) {
  console.error("Originalwappen-Prüfung FEHLGESCHLAGEN:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`Originalwappen-Prüfung bestanden: ${teamIds.size}/${teamIds.size} verwendete Teams lokal als Original registriert; keine Fantasiewappen-Logik.`);
