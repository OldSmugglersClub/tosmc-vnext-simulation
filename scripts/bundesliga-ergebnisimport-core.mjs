import fs from "node:fs";

export function hasResult(m) {
  return Number.isInteger(m?.heimtore) && Number.isInteger(m?.auswaertstore);
}

export function bundesligaMatches(data) {
  return (Array.isArray(data?.saisons) ? data.saisons : [])
    .flatMap(s => Array.isArray(s?.spiele) ? s.spiele : [])
    .filter(m => m?.wettbewerb === "bundesliga" && m?.saison === "2026/2027");
}

export function applyConfirmedResult(data, localId, home, away, sourceDate) {
  const list = bundesligaMatches(data);
  const target = list.find(m => m?.id === localId);
  if (!target) throw new Error(`Spiel ${localId} nicht gefunden.`);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0)
    throw new Error("Ungültiges Endergebnis.");

  if (hasResult(target)) {
    if (target.heimtore !== home || target.auswaertstore !== away) {
      throw new Error(
        `ERGEBNISKONFLIKT: ${localId} lokal ${target.heimtore}:${target.auswaertstore}, eingehend ${home}:${away}.`
      );
    }
    return 0;
  }

  target.heimtore = home;
  target.auswaertstore = away;
  target.status = "beendet";
  target.quelleStand = sourceDate;
  return 1;
}

export function finalizeBatch(data, changed, sourceDate) {
  if (changed > 0) {
    data.datenVersion = Number(data.datenVersion || 0) + 1;
    data.aktualisiert = sourceDate;
  }
  return changed;
}

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}
