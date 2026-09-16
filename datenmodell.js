(() => {
  "use strict";
  let cache;
  const sourceState = new Map();
  const safeArray = value => Array.isArray(value) ? value : [];
  const gamesFrom = data => safeArray(data && data.saisons).flatMap(s => safeArray(s && s.spiele)).concat(safeArray(data && data.spiele));
  const matchdaysFrom = data => safeArray(data && data.saisons).flatMap(s => safeArray(s && s.tippspieltage)).concat(safeArray(data && data.tippspieltage));
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

  function matches(game, competition) {
    const filter = competition && competition.filter;
    if (!filter || !game) return false;
    return filter.type === "sonderwertung"
      ? safeArray(game.sonderwertungen).includes(filter.value)
      : game[filter.type] === filter.value;
  }

  function summarize(competition, games, matchdays) {
    const items = games.filter(game => matches(game, competition));
    const completed = items.filter(game => Number.isFinite(game.heimtore) && Number.isFinite(game.auswaertstore));
    const dated = items.filter(game => validDate(game.datum));
    const aliases = {"dynamo-dresden":"smugglerauftrag"};
    const key = aliases[competition.id] || competition.id;
    const days = matchdays.filter(day => day && (day.typ === key || day.wettbewerb === key));
    return { id: competition.id, games: items, total: items.length, completed: completed.length, scheduled: dated.length, open: Math.max(0, items.length - completed.length), matchdays: days.length };
  }

  function duplicateValues(items, selector) {
    const seen = new Set();
    const duplicates = new Set();
    items.forEach(item => {
      const value = selector(item);
      if (!value) return;
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    });
    return [...duplicates];
  }

  function validate({ competitions, games, teams, matchdays }) {
    const issues = [];
    const warnings = [];
    const add = (severity, code, message, details = []) => (severity === "error" ? issues : warnings).push({ severity, code, message, details });

    const duplicateCompetitionIds = duplicateValues(competitions, item => item && item.id);
    const duplicateGameIds = duplicateValues(games, item => item && item.id);
    const duplicateTeamIds = duplicateValues(teams, item => item && item.id);
    const duplicateMatchdayNumbers = duplicateValues(matchdays, item => item && `${item.saison || ""}:${item.nummer ?? ""}`);
    if (duplicateCompetitionIds.length) add("error", "duplicate-competition", "Doppelte Wettbewerbs-IDs", duplicateCompetitionIds);
    if (duplicateGameIds.length) add("error", "duplicate-game", "Doppelte Spiel-IDs", duplicateGameIds);
    if (duplicateTeamIds.length) add("error", "duplicate-team", "Doppelte Team-IDs", duplicateTeamIds);
    if (duplicateMatchdayNumbers.length) add("error", "duplicate-matchday", "Doppelte Tippspieltag-Nummern innerhalb einer Saison", duplicateMatchdayNumbers);

    const teamIds = new Set(teams.map(item => item && item.id).filter(Boolean));
    const gameIds = new Set(games.map(item => item && item.id).filter(Boolean));
    const unknownTeams = new Set();
    const invalidDates = [];
    const invalidRanges = [];
    const partialScores = [];
    const missingGameIds = [];

    games.forEach((game, index) => {
      if (!game || !game.id) missingGameIds.push(`Eintrag ${index + 1}`);
      [game && game.heimTeamId, game && game.auswaertsTeamId].filter(Boolean).forEach(id => { if (!teamIds.has(id)) unknownTeams.add(id); });
      [game && game.datum, game && game.datumVon, game && game.datumBis].filter(Boolean).forEach(value => { if (!validDate(value)) invalidDates.push(`${game.id || `Eintrag ${index + 1}`}: ${value}`); });
      if (game && validDate(game.datumVon) && validDate(game.datumBis) && game.datumVon > game.datumBis) invalidRanges.push(game.id || `Eintrag ${index + 1}`);
      const home = Number.isFinite(game && game.heimtore);
      const away = Number.isFinite(game && game.auswaertstore);
      if (home !== away) partialScores.push(game.id || `Eintrag ${index + 1}`);
    });
    if (missingGameIds.length) add("error", "missing-game-id", "Spiele ohne eindeutige ID", missingGameIds);
    if (unknownTeams.size) add("error", "unknown-team", "Spiele mit unbekannten Team-Referenzen", [...unknownTeams]);
    if (invalidDates.length) add("error", "invalid-date", "Ungültige Datumsangaben", invalidDates);
    if (invalidRanges.length) add("error", "invalid-range", "Datumsbereich endet vor seinem Beginn", invalidRanges);
    if (partialScores.length) add("error", "partial-score", "Unvollständige Endergebnisse", partialScores);

    const missingMatchdayGames = [];
    matchdays.forEach(day => safeArray(day && day.spielIds).forEach(id => { if (!gameIds.has(id)) missingMatchdayGames.push(`${day.name || day.nummer || "Tippspieltag"}: ${id}`); }));
    if (missingMatchdayGames.length) add("error", "missing-matchday-game", "Tippspieltage verweisen auf unbekannte Spiele", missingMatchdayGames);

    const invalidFilters = competitions.filter(item => !item || !item.id || !item.page || !item.filter || !["wettbewerb", "sonderwertung"].includes(item.filter.type) || !item.filter.value).map(item => item && item.id || "Unbenannter Eintrag");
    if (invalidFilters.length) add("error", "invalid-competition", "Unvollständige Wettbewerbsdefinitionen", invalidFilters);

    const emptyCompetitions = competitions.filter(item => item && item.filter && !games.some(game => matches(game, item))).map(item => item.label || item.id);
    if (emptyCompetitions.length) add("warning", "empty-competition", "Wettbewerbe ohne zugeordnete Spiele", emptyCompetitions);

    const status = issues.length ? "error" : warnings.length ? "warning" : "ok";
    return {
      status,
      errors: issues,
      warnings,
      counts: { errors: issues.length, warnings: warnings.length, competitions: competitions.length, games: games.length, teams: teams.length, matchdays: matchdays.length },
      checkedAt: new Date().toISOString()
    };
  }

  async function fetchJson(url, fallback) {
    const startedAt = performance.now();
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      sourceState.set(url, { ok: true, durationMs: Math.round(performance.now() - startedAt), error: "" });
      return data;
    } catch (error) {
      sourceState.set(url, { ok: false, durationMs: Math.round(performance.now() - startedAt), error: String(error.message || error) });
      console.warn(`Zentrale Datenquelle nicht verfügbar: ${url}`, error);
      return fallback;
    }
  }

  async function load() {
    if (cache) return cache;
    cache = (async () => {
      const registry = window.OSCDataRegistry;
      const urls = registry ? await Promise.all([registry.url("wettbewerbe"), registry.url("spiele"), registry.url("teams"), registry.url("tippspieltage")]) : ["./wettbewerbe.json","./spieldaten.json","./teams.json","./tippspieltage.json"];
      const [competitionData, gameData, teamData, matchdayData] = await Promise.all([
        fetchJson(urls[0], {wettbewerbe:[]}), fetchJson(urls[1], {saisons:[]}), fetchJson(urls[2], {teams:[]}), fetchJson(urls[3], {saisons:[]})
      ]);
      const competitions = safeArray(competitionData.wettbewerbe);
      const games = gamesFrom(gameData);
      const teams = safeArray(teamData.teams);
      const matchdays = matchdaysFrom(matchdayData);
      const summaries = Object.fromEntries(competitions.map(item => [item.id, summarize(item, games, matchdays)]));
      const validation = validate({ competitions, games, teams, matchdays });
      const registryStatus = registry && registry.status ? await registry.status() : null;
      const diagnostics = {
        loadedAt: new Date().toISOString(),
        registry: registryStatus,
        sources: Object.fromEntries(sourceState),
        fallbackSources: [...sourceState.entries()].filter(([, state]) => !state.ok).map(([url]) => url)
      };
      return { competitionData, competitions, gameData, games, teamData, teams, matchdayData, matchdays, summaries, validation, diagnostics, updated: competitionData.aktualisiert || gameData.aktualisiert || "" };
    })();
    return cache;
  }

  function reset() { cache = undefined; sourceState.clear(); }
  window.OSCDataModel = { load, reset, summarize, matches, validate };
})();
