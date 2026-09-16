import fs from "node:fs";
const path = process.env.OSC_SPIELDATEN_PATH || "spieldaten.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
let changed = 0;
for (const s of data.saisons || []) for (const m of s.spiele || []) {
  const isBl = m.wettbewerb === "bundesliga" && m.saison === "2026/2027" && Number(m.spieltagNummer) >= 5;
  const isDyn = m.wettbewerb === "2-bundesliga" && m.saison === "2026/2027" &&
    (m.heimTeamId === "dynamo-dresden" || m.auswaertsTeamId === "dynamo-dresden") && Number(m.spieltagNummer) >= 7;
  if (!isBl && !isDyn) continue;
  if (m.status === "beendet" || (Number.isInteger(m.heimtore) && Number.isInteger(m.auswaertstore))) continue;
  m.datum = null; m.datumVon = null; m.datumBis = null; m.datumAnzeige = "Termin offen"; m.anstoss = null;
  m.terminBestaetigt = false; m.status = "offen"; m.quelleStand = null; changed++;
}
if (changed) { data.datenVersion = Number(data.datenVersion || 0) + 1; data.aktualisiert = new Date().toISOString().slice(0,10); }
fs.writeFileSync(path, JSON.stringify(data,null,2)+"\n");
console.log(`HF16-Bereinigung: ${changed} fälschlich bestätigte Termine auf offen zurückgesetzt.`);
