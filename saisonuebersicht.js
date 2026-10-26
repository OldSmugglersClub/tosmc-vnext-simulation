(() => {
  "use strict";
  const DATA_VERSION = "4.9.2-HF12-HF54";
  const OPENLIGADB_URLS = Object.freeze({
    "dfb-pokal": "https://api.openligadb.de/getmatchdata/dfb/2026",
    "champions-league": "https://api.openligadb.de/getmatchdata/ucl/2026",
    "europa-league": "https://api.openligadb.de/getmatchdata/uel/2026"
  });
  const EXTERNAL_COMPETITIONS = new Set(Object.keys(OPENLIGADB_URLS));
  const freshUrl = url => `${url}${url.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;


  const $ = id => document.getElementById(id);
  const safeArray = value => Array.isArray(value) ? value : [];

  function centralGames(data) {
    return safeArray(data && data.saisons).flatMap(season => safeArray(season && season.spiele));
  }

  function centralMatchdays(data) {
    return safeArray(data && data.saisons).flatMap(season => safeArray(season && season.tippspieltage));
  }

  function matchingGames(games, competition) {
    const filter = competition && competition.filter;
    if (!filter) return [];
    if (filter.type === "sonderwertung") {
      return games.filter(game => safeArray(game && game.sonderwertungen).includes(filter.value));
    }
    return games.filter(game => game && game[filter.type] === filter.value);
  }

  function matchingMatchdays(matchdays, competition) {
    const aliases = {
      "dynamo-dresden": "smugglerauftrag",
      "champions-league": "champions-league",
      "europa-league": "europa-league",
      "dfb-pokal": "dfb-pokal",
      bundesliga: "bundesliga",
      piratenkodex: "piratenkodex",
      weihnachtsregatta: "weihnachtsregatta",
      relegation: "relegation"
    };
    const type = aliases[competition.id];
    return matchdays.filter(day => day && (day.typ === type || day.wettbewerb === type));
  }

  function normalizeRoundLabel(value) {
    return String(value || "")
      .toLocaleLowerCase("de")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function knockoutRoundKey(match) {
    const label = normalizeRoundLabel(match?.group?.groupName ?? match?.group?.GroupName ?? "");
    if (label.includes("achtelfinale")) return "achtelfinale";
    if (label.includes("viertelfinale")) return "viertelfinale";
    if (label.includes("halbfinale")) return "halbfinale";
    if (label.includes("endspiel") || label === "finale" || label.includes(" finale")) return "finale";
    return "";
  }

  function openLigaDbResult(match) {
    const results = safeArray(match?.matchResults ?? match?.MatchResults);
    const final = results.find(result => {
      const name = String(result?.resultName ?? result?.resultTypeName ?? "").toLocaleLowerCase("de");
      const typeId = Number(result?.resultTypeID ?? result?.resultTypeId ?? -1);
      return name.includes("end") || name.includes("final") || typeId === 2;
    }) || results.at(-1);
    if (!final) return null;
    const home = Number(final?.pointsTeam1 ?? final?.PointsTeam1);
    const away = Number(final?.pointsTeam2 ?? final?.PointsTeam2);
    return Number.isFinite(home) && Number.isFinite(away) ? [home, away] : null;
  }

  function normalizeOpenLigaDbGame(match, competitionId) {
    const dateTime = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");
    const dateMatch = dateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    const result = openLigaDbResult(match);
    return {
      id: `openligadb-${competitionId}-${match?.matchID ?? match?.matchId ?? match?.MatchID ?? dateTime}`,
      wettbewerb: competitionId,
      datum: dateMatch?.[1] || "",
      anstoss: dateMatch?.[2] || "",
      terminBestaetigt: Boolean(dateMatch),
      heimtore: result?.[0],
      auswaertstore: result?.[1],
      status: match?.matchIsFinished || match?.MatchIsFinished ? "beendet" : String(match?.status ?? "")
    };
  }

  function relevantOpenLigaDbGames(competitionId, data) {
    const matches = safeArray(data);
    const relevant = competitionId === "champions-league"
      ? matches
      : matches.filter(match => Boolean(knockoutRoundKey(match)));
    return relevant.map(match => normalizeOpenLigaDbGame(match, competitionId));
  }

  async function fetchOptionalJson(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ok: true, data: await response.json(), error: "" };
    } catch (error) {
      console.warn(`Optionale Live-Datenquelle nicht verfügbar: ${url}`, error);
      return { ok: false, data: [], error: String(error?.message || error) };
    }
  }

  function competitionGames(competition, localGames, externalResults) {
    const external = externalResults[competition.id];
    if (external?.ok) return relevantOpenLigaDbGames(competition.id, external.data);
    return matchingGames(localGames, competition);
  }

  function displayCount(target, actual, suffix) {
    if (actual > 0) {
      const detail = Number.isFinite(target) && actual !== target
        ? `<small>von ${target} angelegt</small>`
        : !Number.isFinite(target) ? "<small>aktuell bekannt</small>" : "";
      return `<span class="season-count">${actual}${detail}</span>`;
    }
    if (Number.isFinite(target)) return `<span class="season-count">0<small>von ${target} angelegt</small></span>`;
    return `<span class="season-count">automatisch<small>${suffix}</small></span>`;
  }

  function hasConfirmedKickoff(game) {
    return Boolean(
      game &&
      /^\d{4}-\d{2}-\d{2}$/.test(game.datum || "") &&
      /^\d{2}:\d{2}$/.test(game.anstoss || "") &&
      game.terminBestaetigt !== false
    );
  }

  function hasResult(game) {
    return Number.isFinite(game && game.heimtore) && Number.isFinite(game && game.auswaertstore);
  }

  function deriveCompetitionStatus(competitionGames, fallbackStatus) {
    if (!competitionGames.length) return fallbackStatus || "wartet auf Spielplan";

    const completed = competitionGames.filter(hasResult).length;
    const scheduled = competitionGames.filter(hasConfirmedKickoff).length;
    const live = competitionGames.some(game => String(game && game.status || "").toLowerCase() === "live");

    if (completed === competitionGames.length) return "abgeschlossen";
    if (live || completed > 0) return "läuft";
    if (scheduled === competitionGames.length) return "terminiert";
    if (scheduled > 0) return "teilweise terminiert";
    return fallbackStatus || "geplant";
  }

  function gameDate(game) {
    const value = game?.datum || game?.datumVon || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  }

  function formatGermanDate(value) {
    const [year, month, day] = String(value).split("-");
    return year && month && day ? `${day}.${month}.${year}` : value;
  }

  function deriveCompetitionPeriod(competitionGames, fallbackPeriod) {
    const dates = competitionGames.map(gameDate).filter(Boolean).sort();
    if (!dates.length) return fallbackPeriod || "Noch offen";
    const first = formatGermanDate(dates[0]);
    const last = formatGermanDate(dates.at(-1));
    return first === last ? first : `${first} – ${last}`;
  }

  function uniqueGames(games) {
    const seen = new Set();
    return games.filter((game, index) => {
      const key = game?.id || `${gameDate(game)}:${game?.anstoss || ""}:${index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function loadFooterVersion() {
    const target = $("footer-version");
    if (!target) return;
    try {
      const registry = window.OSCDataRegistry;
      const versionUrl = registry ? await registry.url("version") : "./VERSION.txt";
      const response = await fetch(versionUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Versionsdatei konnte nicht geladen werden (${response.status})`);
      const version = (await response.text()).trim();
      if (!version) throw new Error("Versionsdatei ist leer");
      target.textContent = `Version ${version}`;
    } catch (error) {
      console.warn("Footer-Version konnte nicht dynamisch geladen werden.", error);
      target.textContent = "Version nicht verfügbar";
    }
  }

  async function init() {
    try {
      const registry = window.OSCDataRegistry;
      const [overviewUrl, competitionsUrl, gamesUrl, matchdaysUrl] = registry
        ? await Promise.all([
            registry.url("saisonuebersicht"), registry.url("wettbewerbe"),
            registry.url("spiele"), registry.url("tippspieltage")
          ])
        : ["./saison-2026-2027.json", "./wettbewerbe.json", "./spieldaten.json", "./tippspieltage.json"];
      const responses = await Promise.all([
        fetch(freshUrl(overviewUrl), { cache: "no-store" }),
        fetch(freshUrl(competitionsUrl), { cache: "no-store" }),
        fetch(freshUrl(gamesUrl), { cache: "no-store" }),
        fetch(freshUrl(matchdaysUrl), { cache: "no-store" })
      ]);
      if (responses.some(response => !response.ok)) throw new Error("Saisondaten konnten nicht vollständig geladen werden.");

      const [overview, competitionData, gameData, matchdayData] = await Promise.all(responses.map(response => response.json()));
      const sharedModel = window.OSCDataModel ? await window.OSCDataModel.load() : null;
      const competitions = safeArray((sharedModel && sharedModel.competitions) || competitionData.wettbewerbe).filter(item => item && item.saison);
      const games = sharedModel ? sharedModel.games : centralGames(gameData);
      const matchdays = sharedModel ? sharedModel.matchdays : centralMatchdays(matchdayData);
      const externalEntries = await Promise.all(Object.entries(OPENLIGADB_URLS).map(async ([id, url]) => [id, await fetchOptionalJson(url)]));
      const externalResults = Object.fromEntries(externalEntries);
      const gamesByCompetition = Object.fromEntries(competitions.map(competition => [
        competition.id,
        competitionGames(competition, games, externalResults)
      ]));

      $("season-title").textContent = overview.titel || "Saisonübersicht 2026/2027";
      $("season-subtitle").textContent = overview.untertitel || "";
      $("competition-count").textContent = competitions.length;
      const actualMatchdays = competitions.reduce((sum, competition) => sum + matchingMatchdays(matchdays, competition).length, 0);
      const localPrimaryGames = games.filter(game => !EXTERNAL_COMPETITIONS.has(game?.wettbewerb));
      const externalGames = [...EXTERNAL_COMPETITIONS].flatMap(id => gamesByCompetition[id] || []);
      const actualGames = uniqueGames([...localPrimaryGames, ...externalGames]);
      const scheduledGames = actualGames.filter(hasConfirmedKickoff).length;

      $("matchday-total").textContent = String(actualMatchdays);
      $("matchday-note").textContent = "aktuell angelegte Wertungstage";
      $("game-total").textContent = String(actualGames.length);
      $("game-note").textContent = "aktuell bekannte Begegnungen";
      $("stored-games").textContent = String(scheduledGames);

      const tbody = $("season-table-body");
      tbody.replaceChildren();
      competitions.forEach(competition => {
        const season = competition.saison;
        const currentGames = gamesByCompetition[competition.id] || [];
        const actualGames = currentGames.length;
        const actualMatchdays = matchingMatchdays(matchdays, competition).length;
        const derivedStatus = deriveCompetitionStatus(currentGames, season.status);
        const derivedPeriod = deriveCompetitionPeriod(currentGames, season.zeitraum);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><a class="season-competition-link" href="./${competition.page}">${season.seasonLabel || competition.label}</a></td>
          <td>${displayCount(season.tippspieltageZiel, actualMatchdays, "nach Auslosung")}</td>
          <td>${displayCount(season.spieleZiel, actualGames, "nach Auslosung")}</td>
          <td>${derivedPeriod}</td>
          <td><span class="season-status-pill">${derivedStatus}</span></td>`;
        tbody.appendChild(row);
      });

      const failedSources = Object.entries(externalResults).filter(([, result]) => !result.ok).map(([id]) => id);
      const checkedAt = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
      }).format(new Date());
      $("data-state").textContent = failedSources.length
        ? `Geprüft ${checkedAt} · Live-Daten teilweise nicht verfügbar`
        : `Live geprüft ${checkedAt}`;
    } catch (error) {
      $("data-state").textContent = "Aktualisierung nicht verfügbar";
      const box = $("season-error");
      box.textContent = error.message;
      box.classList.remove("is-hidden");
    }
  }

  loadFooterVersion();
  init();
  window.setInterval(() => {
    if (document.visibilityState === "visible") {
      if (window.OSCDataModel?.reset) window.OSCDataModel.reset();
      init();
    }
  }, 15 * 60 * 1000);
})();
