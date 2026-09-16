import fs from "node:fs";

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function jsonScalar(value) {
  return JSON.stringify(value);
}

function replaceExistingScalar(objectText, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`("${escaped}"\\s*:\\s*)(?:"(?:\\\\.|[^"\\\\])*"|true|false|null|-?\\d+(?:\\.\\d+)?)`);
  if (!re.test(objectText)) {
    throw new Error(`Pflichtfeld '${key}' im Bundesliga-Spielobjekt fehlt. Keine Änderung.`);
  }
  return objectText.replace(re, `$1${jsonScalar(value)}`);
}

function findContainingObject(text, markerIndex) {
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i <= markerIndex; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") stack.push(i);
    else if (ch === "}") stack.pop();
  }

  if (!stack.length) throw new Error("Spielobjekt-Anfang nicht gefunden.");
  const start = stack[stack.length - 1];

  let depth = 0;
  inString = false;
  escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  throw new Error("Spielobjekt-Ende nicht gefunden.");
}

function replaceRootScalar(text, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^([ \\t]*"${escaped}"\\s*:\\s*)(?:"(?:\\\\.|[^"\\\\])*"|true|false|null|-?\\d+(?:\\.\\d+)?)`, "m");
  if (!re.test(text)) throw new Error(`Root-Feld '${key}' fehlt. Keine Änderung.`);
  return text.replace(re, `$1${jsonScalar(value)}`);
}

export function applyPlanToJsonText(originalText, plan, updatedAt) {
  let text = originalText;

  for (const item of plan.planned) {
    const marker = `"id": "${item.localId}"`;
    const markerIndex = text.indexOf(marker);
    if (markerIndex < 0) throw new Error(`Spiel ${item.localId} im Rohtext nicht gefunden.`);
    if (text.indexOf(marker, markerIndex + marker.length) >= 0) {
      throw new Error(`Spiel-ID ${item.localId} ist im Rohtext nicht eindeutig. Keine Änderung.`);
    }

    const span = findContainingObject(text, markerIndex);
    let objectText = text.slice(span.start, span.end);

    objectText = replaceExistingScalar(objectText, "datum", item.datum);
    objectText = replaceExistingScalar(objectText, "datumVon", item.datum);
    objectText = replaceExistingScalar(objectText, "datumBis", item.datum);
    objectText = replaceExistingScalar(objectText, "datumAnzeige", displayDate(item.datum));
    objectText = replaceExistingScalar(objectText, "anstoss", item.anstoss);
    objectText = replaceExistingScalar(objectText, "terminBestaetigt", true);
    objectText = replaceExistingScalar(objectText, "status", "terminiert");
    objectText = replaceExistingScalar(objectText, "quelleStand", item.quelleStand);

    text = text.slice(0, span.start) + objectText + text.slice(span.end);
  }

  if (plan.planned.length > 0) {
    const parsed = JSON.parse(originalText);
    text = replaceRootScalar(text, "datenVersion", Number(parsed.datenVersion || 0) + 1);
    text = replaceRootScalar(text, "aktualisiert", updatedAt);
  }

  // Sicherheitsprüfung: Das Ergebnis muss weiterhin valides JSON sein.
  JSON.parse(text);
  return text;
}

export function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("de")
    .replace(/ß/g, "ss")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[^a-z0-9äöü -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function bundesligaMatches(data) {
  return (Array.isArray(data?.saisons) ? data.saisons : [])
    .flatMap(s => Array.isArray(s?.spiele) ? s.spiele : [])
    .filter(m => m?.wettbewerb === "bundesliga" && m?.saison === "2026/2027");
}

function teamArray(teamsData) {
  return Array.isArray(teamsData) ? teamsData :
    Array.isArray(teamsData?.teams) ? teamsData.teams : [];
}

export function buildAliasIndex(teamsData) {
  const map = new Map();
  for (const team of teamArray(teamsData)) {
    if (!team?.id) continue;
    const aliases = new Set([
      team.id,
      team.name,
      team.kurzname,
      ...(Array.isArray(team.apiAliase) ? team.apiAliase : [])
    ].filter(Boolean));
    for (const alias of aliases) {
      const key = normalize(alias);
      if (!key) continue;
      const existing = map.get(key);
      if (existing && existing !== team.id) {
        throw new Error(`Mehrdeutiger Team-Alias '${alias}': ${existing} / ${team.id}`);
      }
      map.set(key, team.id);
    }
  }
  return map;
}

export function teamIdFromApi(team, aliasIndex) {
  const candidates = [
    team?.teamName, team?.TeamName,
    team?.shortName, team?.ShortName
  ].filter(Boolean);
  for (const candidate of candidates) {
    const id = aliasIndex.get(normalize(candidate));
    if (id) return id;
  }
  return null;
}

function matchday(apiMatch) {
  return Number(apiMatch?.group?.groupOrderID ?? apiMatch?.group?.GroupOrderID ?? 0);
}

function fixtureKey(spieltag, homeId, awayId) {
  return `${Number(spieltag)}|${homeId}|${awayId}`;
}

function parseLocalDateTime(apiMatch) {
  const raw = String(apiMatch?.matchDateTime ?? apiMatch?.MatchDateTime ?? "").trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const date = m[1];
  const time = `${m[2]}:${m[3]}`;
  if (time === "00:00") return null;
  return { date, time };
}

function apiLastUpdateDate(apiMatch) {
  const raw = String(apiMatch?.lastUpdateDateTime ?? apiMatch?.LastUpdateDateTime ?? "").trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function newestSourceDate(localSourceDate, apiSourceDate) {
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

  if (!valid(apiSourceDate)) {
    return valid(localSourceDate) ? localSourceDate : null;
  }
  if (!valid(localSourceDate)) {
    return apiSourceDate;
  }
  return localSourceDate >= apiSourceDate ? localSourceDate : apiSourceDate;
}

function dateInWindow(date, from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(from || ""))) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(to || ""))) return false;
  return date >= from && date <= to;
}

function displayDate(date) {
  const [y,m,d] = date.split("-");
  return `${d}.${m}.${y}`;
}

export function validateAndPlan(data, teamsData, apiMatches, officialConfirmedMatchdays = null, now = new Date()) {
  const local = bundesligaMatches(data);
  if (local.length !== 306) {
    throw new Error(`Lokaler Bundesliga-Saisonplan unvollständig: ${local.length}/306.`);
  }
  if (!Array.isArray(apiMatches) || apiMatches.length !== 306) {
    throw new Error(`OpenLigaDB-Bundesliga-Saisonplan unvollständig/unerwartet: ${Array.isArray(apiMatches) ? apiMatches.length : "kein Array"}/306. Keine Änderung.`);
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error("Ungültiger Prüfzeitpunkt.");
  }

  const aliases = buildAliasIndex(teamsData);
  const localIndex = new Map();
  for (const m of local) {
    const key = fixtureKey(m?.spieltagNummer, m?.heimTeamId, m?.auswaertsTeamId);
    if (localIndex.has(key)) throw new Error(`Doppelter lokaler Bundesliga-Schlüssel: ${key}`);
    localIndex.set(key, m);
  }

  const matched = new Set();
  const mappingErrors = [];
  const planned = [];
  const skipped = [];

  for (const apiMatch of apiMatches) {
    const homeId = teamIdFromApi(apiMatch?.team1, aliases);
    const awayId = teamIdFromApi(apiMatch?.team2, aliases);
    const st = matchday(apiMatch);

    if (!st || !homeId || !awayId) {
      mappingErrors.push({
        matchID: apiMatch?.matchID ?? null,
        spieltag: st || null,
        reason: "Team/Spieltag nicht auflösbar"
      });
      continue;
    }

    const localMatch = localIndex.get(fixtureKey(st, homeId, awayId));
    if (!localMatch) {
      mappingErrors.push({ spieltag: st, homeId, awayId, reason: "Keine lokale Paarung" });
      continue;
    }
    if (matched.has(localMatch.id)) {
      mappingErrors.push({ spieltag: st, localId: localMatch.id, reason: "Doppelte API-Zuordnung" });
      continue;
    }
    matched.add(localMatch.id);

    if (localMatch.status === "beendet" ||
        (Number.isInteger(localMatch.heimtore) && Number.isInteger(localMatch.auswaertstore))) {
      skipped.push({ localId: localMatch.id, reason: "lokal bereits beendet/mit Ergebnis" });
      continue;
    }

    if (!(officialConfirmedMatchdays instanceof Set) || !officialConfirmedMatchdays.has(st)) {
      skipped.push({ localId: localMatch.id, reason: "Spieltag laut offizieller Bundesliga-Quelle noch nicht fix terminiert" });
      continue;
    }

    const exact = parseLocalDateTime(apiMatch);
    const sourceDate = apiLastUpdateDate(apiMatch);
    if (!exact) {
      skipped.push({ localId: localMatch.id, reason: "kein konkreter OpenLigaDB-Zeitpunkt" });
      continue;
    }
    if (!sourceDate) {
      skipped.push({ localId: localMatch.id, reason: "kein OpenLigaDB-Quellenstand" });
      continue;
    }

    const localExact =
      localMatch.terminBestaetigt === true &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(localMatch.datum || "")) &&
      /^\d{2}:\d{2}$/.test(String(localMatch.anstoss || ""));

    if (!localExact) {
      if (!dateInWindow(exact.date, localMatch.datumVon, localMatch.datumBis)) {
        skipped.push({
          localId: localMatch.id,
          reason: "OpenLigaDB-Datum außerhalb des lokalen Spieltagfensters"
        });
        continue;
      }

      planned.push({
        localId: localMatch.id,
        datum: exact.date,
        anstoss: exact.time,
        quelleStand: newestSourceDate(localMatch.quelleStand, sourceDate),
        aenderungsart: "Konkretisierung"
      });
      continue;
    }

    if (localMatch.datum === exact.date && localMatch.anstoss === exact.time) {
      skipped.push({ localId: localMatch.id, reason: "Termin bereits identisch" });
      continue;
    }

    // Bereits bestätigte Termine dürfen nur vor Spielbeginn automatisch verlegt werden.
    // 6 Stunden Sicherheitsabstand verhindern eine kurzfristige automatische Änderung
    // direkt vor dem erwarteten Anstoß.
    const apiKickoff = new Date(`${exact.date}T${exact.time}:00+02:00`);
    const localKickoff = new Date(`${localMatch.datum}T${localMatch.anstoss}:00+02:00`);
    const sixHours = 6 * 60 * 60 * 1000;

    if (Number.isNaN(apiKickoff.getTime()) || Number.isNaN(localKickoff.getTime())) {
      skipped.push({ localId: localMatch.id, reason: "Terminvergleich technisch ungültig" });
      continue;
    }
    if (Math.min(apiKickoff.getTime(), localKickoff.getTime()) - now.getTime() < sixHours) {
      skipped.push({
        localId: localMatch.id,
        reason: "abweichender bestätigter Termin innerhalb 6h-Sicherheitsfenster"
      });
      continue;
    }

    planned.push({
      localId: localMatch.id,
      datum: exact.date,
      anstoss: exact.time,
      quelleStand: newestSourceDate(localMatch.quelleStand, sourceDate),
      aenderungsart: "Verlegung"
    });
  }

  if (mappingErrors.length || matched.size !== 306) {
    throw new Error(
      `Bundesliga-Paarungszuordnung unvollständig: API-Fehler ${mappingErrors.length}, gemappt ${matched.size}/306. Keine Änderung.`
    );
  }

  return {
    localCount: local.length,
    apiCount: apiMatches.length,
    matched: matched.size,
    planned,
    skipped
  };
}

export function applyPlan(data, plan, updatedAt) {
  const index = new Map(bundesligaMatches(data).map(m => [m.id, m]));
  let changed = 0;
  for (const item of plan.planned) {
    const m = index.get(item.localId);
    if (!m) throw new Error(`Spiel ${item.localId} beim Anwenden nicht gefunden.`);
    if (m.status === "beendet" ||
        (Number.isInteger(m.heimtore) && Number.isInteger(m.auswaertstore))) {
      throw new Error(`Schutzverletzung: ${item.localId} ist inzwischen beendet/mit Ergebnis.`);
    }
    m.datum = item.datum;
    m.datumVon = item.datum;
    m.datumBis = item.datum;
    m.datumAnzeige = displayDate(item.datum);
    m.anstoss = item.anstoss;
    m.terminBestaetigt = true;
    m.status = "terminiert";
    m.quelleStand = item.quelleStand;
    changed += 1;
  }
  if (changed > 0) {
    data.datenVersion = Number(data.datenVersion || 0) + 1;
    data.aktualisiert = updatedAt;
  }
  return changed;
}
