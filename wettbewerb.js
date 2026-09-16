(() => {
  "use strict";

  const fileName = location.pathname.split("/").pop() || "bundesliga.html";
  const slug = fileName.replace(/\.html?$/i, "") || "bundesliga";
  const jsonUrl = `./${slug}.json`;
  let gameDataUrl = "./spieldaten.json";
  let teamDataUrl = "./teams.json";
  let bundesligaTableUrl = "./bundesliga-tabelle.json";
  let bundesligaGoalGetterUrl = "./bundesliga-torjaeger.json";

  let competitionConfigUrl = "./wettbewerbe.json";
  const DEFAULT_COMPETITIONS = [
    { id: "bundesliga", label: "Bundesliga", page: "bundesliga.html", filter: { type: "wettbewerb", value: "bundesliga" }, scheduleTitle: "Spiele der Bundesliga" },
    { id: "dfb-pokal", label: "DFB-Pokal", page: "dfb-pokal.html", filter: { type: "wettbewerb", value: "dfb-pokal" }, scheduleTitle: "Spiele des DFB-Pokals" },
    { id: "champions-league", label: "Champions League", page: "champions-league.html", filter: { type: "wettbewerb", value: "champions-league" }, scheduleTitle: "Spiele der Champions League" },
    { id: "europa-league", label: "Europa League", page: "europa-league.html", filter: { type: "wettbewerb", value: "europa-league" }, scheduleTitle: "Spiele der Europa League" },
    { id: "relegation", label: "Relegation", page: "relegation.html", filter: { type: "wettbewerb", value: "relegation" }, scheduleTitle: "Spiele der Relegation" },
    { id: "dynamo-dresden", label: "Dynamo Dresden", page: "dynamo-dresden.html", filter: { type: "sonderwertung", value: "smugglerauftrag" }, scheduleTitle: "Ausgewählte Smuggleraufträge" },
    { id: "piratenkodex", label: "Piratenkodex", page: "piratenkodex.html", filter: { type: "sonderwertung", value: "piratenkodex" }, scheduleTitle: "Ausgewählte Spiele des Piratenkodex" },
    { id: "weihnachtsregatta", label: "Weihnachtsregatta", page: "weihnachtsregatta.html", filter: { type: "sonderwertung", value: "weihnachtsregatta" }, scheduleTitle: "Spiele der Weihnachtsregatta" }
  ];
  let competitionDefinitions = DEFAULT_COMPETITIONS;
  let centralValidation = null;
  let centralModel = null;
  let currentTeamData = { teams: [] };
  let teamResolutionIndex = null;

  function competitionDefinition(id) {
    return competitionDefinitions.find(item => item && item.id === id) || DEFAULT_COMPETITIONS.find(item => item.id === id) || null;
  }

  const $ = (id) => document.getElementById(id);
  const text = (id, value) => {
    const el = $(id);
    if (!el) return;
    el.textContent = value || "";
    el.classList.toggle("is-hidden", !value);
  };

  const safeArray = (value) => Array.isArray(value) ? value : [];

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "";
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  function formatResult(match) {
    const hasHomeScore = Number.isFinite(match.heimtore);
    const hasAwayScore = Number.isFinite(match.auswaertstore);
    if (hasHomeScore && hasAwayScore) return `${match.heimtore}:${match.auswaertstore}`;
    return "";
  }


  function allCentralGames(data) {
    return Array.isArray(data && data.saisons)
      ? data.saisons.flatMap(season => safeArray(season && season.spiele))
      : safeArray(data && data.spiele);
  }

  function numericScore(value) {
    return Number.isFinite(value) ? value : null;
  }

  function calculateBundesligaTable(gameData, teamData, tableData) {
    const teamLookup = createTeamLookup(teamData);
    const games = allCentralGames(gameData).filter(match => match && match.wettbewerb === "bundesliga");
    const rows = new Map();

    const ensureTeam = (teamId, fallback) => {
      if (!teamId) return null;
      if (!rows.has(teamId)) {
        rows.set(teamId, {
          id: teamId,
          name: teamName(teamLookup, teamId, fallback),
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      }
      return rows.get(teamId);
    };

    games.forEach(match => {
      ensureTeam(match.heimTeamId, match.heim);
      ensureTeam(match.auswaertsTeamId, match.auswaerts);

      const homeGoals = numericScore(match.heimtore);
      const awayGoals = numericScore(match.auswaertstore);
      if (homeGoals === null || awayGoals === null) return;

      const home = ensureTeam(match.heimTeamId, match.heim);
      const away = ensureTeam(match.auswaertsTeamId, match.auswaerts);
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (homeGoals < awayGoals) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

    const manualRows = safeArray(tableData && tableData.teams);
    if (manualRows.length) {
      manualRows.forEach(team => {
        if (!team || !team.id) return;
        rows.set(team.id, {
          id: team.id,
          name: teamName(teamLookup, team.id, team.name),
          played: Number(team.spiele || team.played || 0),
          wins: Number(team.siege || team.wins || 0),
          draws: Number(team.unentschieden || team.draws || 0),
          losses: Number(team.niederlagen || team.losses || 0),
          goalsFor: Number(team.tore || team.goalsFor || 0),
          goalsAgainst: Number(team.gegentore || team.goalsAgainst || 0),
          points: Number(team.punkte || team.points || 0)
        });
      });
    }

    const sorted = [...rows.values()].sort((a, b) => {
      const pointDiff = b.points - a.points;
      if (pointDiff) return pointDiff;
      const goalDiff = (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
      if (goalDiff) return goalDiff;
      const goalsDiff = b.goalsFor - a.goalsFor;
      if (goalsDiff) return goalsDiff;
      return a.name.localeCompare(b.name, "de");
    });

    return {
      rows: sorted,
      playedMatches: games.filter(match => numericScore(match.heimtore) !== null && numericScore(match.auswaertstore) !== null).length,
      status: tableData && tableData.status ? tableData.status : ""
    };
  }

  function renderBundesligaTable(gameData, teamData, tableData, root) {
    const standings = calculateBundesligaTable(gameData, teamData, tableData);
    const article = document.createElement("section");
    article.className = "dynamic-section standings-section";

    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "Bundesliga-Tabelle";
    const badge = document.createElement("span");
    badge.className = "data-status-badge";
    badge.textContent = standings.playedMatches
      ? `${standings.playedMatches} Spiele ausgewertet`
      : "Saison noch nicht gestartet";
    headingRow.append(heading, badge);
    article.appendChild(headingRow);

    if (!standings.rows.length) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = standings.status || "Die Tabelle erscheint automatisch, sobald Mannschaften und Ergebnisse vorliegen.";
      article.appendChild(note);
      root.appendChild(article);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    const table = document.createElement("table");
    table.className = "data-table standings-table";
    table.innerHTML = "<thead><tr><th>Pl.</th><th>Verein</th><th>Sp.</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff.</th><th>Pkt.</th></tr></thead>";
    const tbody = document.createElement("tbody");

    standings.rows.forEach((team, index) => {
      const tr = document.createElement("tr");
      const goalDifference = team.goalsFor - team.goalsAgainst;
      const values = [
        index + 1,
        team.name,
        team.played,
        team.wins,
        team.draws,
        team.losses,
        `${team.goalsFor}:${team.goalsAgainst}`,
        goalDifference > 0 ? `+${goalDifference}` : String(goalDifference),
        team.points
      ];
      values.forEach((value, columnIndex) => {
        const cell = document.createElement(columnIndex === 0 ? "th" : "td");
        if (columnIndex === 0) cell.scope = "row";
        if (columnIndex === 1) {
          cell.appendChild(createTeamIdentity("", team.name, "team-identity--table"));
        } else {
          cell.textContent = value;
        }
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    article.appendChild(wrapper);

    root.appendChild(article);
  }


  function completedBundesligaGames(gameData) {
    return allCentralGames(gameData)
      .filter(match => match && match.wettbewerb === "bundesliga")
      .filter(match => numericScore(match.heimtore) !== null && numericScore(match.auswaertstore) !== null)
      .sort((a, b) => `${a.datum || ""}T${a.anstoss || ""}`.localeCompare(`${b.datum || ""}T${b.anstoss || ""}`));
  }

  function calculateBundesligaStatistics(gameData, teamData) {
    const games = completedBundesligaGames(gameData);
    const teamLookup = createTeamLookup(teamData);
    const teams = new Map();

    const ensure = (id, fallback) => {
      if (!id) return null;
      if (!teams.has(id)) {
        teams.set(id, {
          id,
          name: teamName(teamLookup, id, fallback),
          played: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          homePlayed: 0,
          homePoints: 0,
          awayPlayed: 0,
          awayPoints: 0,
          cleanSheets: 0,
          currentRunType: null,
          currentRun: 0,
          longestWinRun: 0,
          form: []
        });
      }
      return teams.get(id);
    };

    let totalGoals = 0;
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let biggestWin = null;
    let highestScoring = null;

    games.forEach(match => {
      const hg = numericScore(match.heimtore);
      const ag = numericScore(match.auswaertstore);
      const home = ensure(match.heimTeamId, match.heim);
      const away = ensure(match.auswaertsTeamId, match.auswaerts);
      if (!home || !away) return;

      totalGoals += hg + ag;
      home.played += 1;
      away.played += 1;
      home.homePlayed += 1;
      away.awayPlayed += 1;
      home.goalsFor += hg;
      home.goalsAgainst += ag;
      away.goalsFor += ag;
      away.goalsAgainst += hg;
      if (ag === 0) home.cleanSheets += 1;
      if (hg === 0) away.cleanSheets += 1;

      let homeResult = "U";
      let awayResult = "U";
      if (hg > ag) {
        homeWins += 1;
        home.points += 3;
        home.homePoints += 3;
        homeResult = "S";
        awayResult = "N";
      } else if (hg < ag) {
        awayWins += 1;
        away.points += 3;
        away.awayPoints += 3;
        homeResult = "N";
        awayResult = "S";
      } else {
        draws += 1;
        home.points += 1;
        away.points += 1;
        home.homePoints += 1;
        away.awayPoints += 1;
      }

      [[home, homeResult], [away, awayResult]].forEach(([team, result]) => {
        team.form.push(result);
        if (team.form.length > 5) team.form.shift();
        if (result === "S") {
          team.currentRun = team.currentRunType === "S" ? team.currentRun + 1 : 1;
          team.currentRunType = "S";
          team.longestWinRun = Math.max(team.longestWinRun, team.currentRun);
        } else {
          team.currentRunType = result;
          team.currentRun = 1;
        }
      });

      const difference = Math.abs(hg - ag);
      if (!biggestWin || difference > biggestWin.difference || (difference === biggestWin.difference && hg + ag > biggestWin.totalGoals)) {
        biggestWin = { match, difference, totalGoals: hg + ag };
      }
      if (!highestScoring || hg + ag > highestScoring.totalGoals) {
        highestScoring = { match, totalGoals: hg + ag };
      }
    });

    const teamRows = [...teams.values()];
    const bestBy = (selector) => teamRows.length
      ? [...teamRows].sort((a, b) => selector(b) - selector(a) || b.points - a.points || a.name.localeCompare(b.name, "de"))[0]
      : null;

    return {
      games,
      totalGoals,
      averageGoals: games.length ? totalGoals / games.length : 0,
      homeWins,
      draws,
      awayWins,
      biggestWin,
      highestScoring,
      bestAttack: bestBy(team => team.goalsFor),
      bestDefense: bestBy(team => -team.goalsAgainst),
      bestHome: bestBy(team => team.homePlayed ? team.homePoints / team.homePlayed : -1),
      bestAway: bestBy(team => team.awayPlayed ? team.awayPoints / team.awayPlayed : -1),
      mostCleanSheets: bestBy(team => team.cleanSheets),
      longestWinRun: bestBy(team => team.longestWinRun),
      formRows: [...teamRows].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || a.name.localeCompare(b.name, "de"))
    };
  }

  function pairingText(match, teamData) {
    if (!match) return "–";
    const lookup = createTeamLookup(teamData);
    const home = teamName(lookup, match.heimTeamId, match.heim);
    const away = teamName(lookup, match.auswaertsTeamId, match.auswaerts);
    return `${home} – ${away} ${match.heimtore}:${match.auswaertstore}`;
  }

  function createStatCard(label, value, detail = "") {
    const card = document.createElement("article");
    card.className = "season-stat-card";
    const labelEl = document.createElement("span");
    labelEl.className = "season-stat-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    card.append(labelEl, valueEl);
    if (detail) {
      const detailEl = document.createElement("small");
      detailEl.textContent = detail;
      card.appendChild(detailEl);
    }
    return card;
  }

  function finalOpenLigaDbResult(match) {
    const results = safeArray(match?.matchResults);
    const finalResult = results.find(result => Number(result?.resultTypeID ?? result?.resultTypeId ?? result?.ResultTypeID ?? -1) === 2)
      || results.find(result => {
        const name = String(result?.resultName ?? result?.resultTypeName ?? "").toLocaleLowerCase("de");
        return name.includes("end") || name.includes("final");
      })
      || results.at(-1);
    if (!finalResult) return null;
    const homeGoals = Number(finalResult?.pointsTeam1 ?? finalResult?.PointsTeam1);
    const awayGoals = Number(finalResult?.pointsTeam2 ?? finalResult?.PointsTeam2);
    if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null;
    return { homeGoals, awayGoals };
  }

  function calculateChampionsLeaguePhaseStatistics(openLigaDbMatches) {
    const games = championsLeaguePhaseMatches(openLigaDbMatches)
      .map(match => ({ match, result: finalOpenLigaDbResult(match) }))
      .filter(entry => entry.result);

    const teams = new Map();
    function ensureTeam(team) {
      const id = String(team?.teamId ?? team?.teamID ?? team?.TeamId ?? team?.TeamID ?? "");
      const name = openLigaDbTeamName(team);
      const key = id || bracketTeamKey(name);
      if (!teams.has(key)) {
        teams.set(key, {
          id, name, played: 0, goalsFor: 0, goalsAgainst: 0,
          homePlayed: 0, homePoints: 0, awayPlayed: 0, awayPoints: 0,
          cleanSheets: 0, currentWinRun: 0, longestWinRun: 0
        });
      }
      return teams.get(key);
    }

    let totalGoals = 0, homeWins = 0, draws = 0, awayWins = 0;
    let biggestWin = null, highestScoring = null;

    games.forEach(({ match, result }) => {
      const { homeGoals, awayGoals } = result;
      const home = ensureTeam(match?.team1);
      const away = ensureTeam(match?.team2);
      home.played += 1; away.played += 1;
      home.homePlayed += 1; away.awayPlayed += 1;
      home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
      totalGoals += homeGoals + awayGoals;

      let homePts = 0, awayPts = 0;
      if (homeGoals > awayGoals) { homeWins += 1; homePts = 3; home.currentWinRun += 1; away.currentWinRun = 0; }
      else if (homeGoals < awayGoals) { awayWins += 1; awayPts = 3; away.currentWinRun += 1; home.currentWinRun = 0; }
      else { draws += 1; homePts = 1; awayPts = 1; home.currentWinRun = 0; away.currentWinRun = 0; }
      home.homePoints += homePts; away.awayPoints += awayPts;
      home.longestWinRun = Math.max(home.longestWinRun, home.currentWinRun);
      away.longestWinRun = Math.max(away.longestWinRun, away.currentWinRun);
      if (awayGoals === 0) home.cleanSheets += 1;
      if (homeGoals === 0) away.cleanSheets += 1;

      const difference = Math.abs(homeGoals - awayGoals);
      if (!biggestWin || difference > biggestWin.difference) biggestWin = { match, difference, homeGoals, awayGoals };
      const scoreTotal = homeGoals + awayGoals;
      if (!highestScoring || scoreTotal > highestScoring.totalGoals) highestScoring = { match, totalGoals: scoreTotal, homeGoals, awayGoals };
    });

    const rows = [...teams.values()];
    const by = (selector, direction = "max") => rows.length
      ? rows.reduce((best, item) => {
          if (!best) return item;
          const a = selector(item), b = selector(best);
          return direction === "min" ? (a < b ? item : best) : (a > b ? item : best);
        }, null)
      : null;

    return {
      games, totalGoals,
      averageGoals: games.length ? totalGoals / games.length : 0,
      homeWins, draws, awayWins,
      bestAttack: by(team => team.goalsFor),
      bestDefense: by(team => team.goalsAgainst, "min"),
      bestHome: by(team => team.homePoints),
      bestAway: by(team => team.awayPoints),
      mostCleanSheets: by(team => team.cleanSheets),
      longestWinRun: by(team => team.longestWinRun),
      biggestWin, highestScoring
    };
  }

  function openLigaDbPairingText(record) {
    const match = record?.match;
    if (!match) return "–";
    const home = openLigaDbTeamName(match?.team1);
    const away = openLigaDbTeamName(match?.team2);
    return `${home} – ${away} ${record.homeGoals}:${record.awayGoals}`;
  }

  function renderChampionsLeagueStatistics(openLigaDbMatches, root) {
    if (slug !== "champions-league") return false;
    const stats = calculateChampionsLeaguePhaseStatistics(openLigaDbMatches);
    if (!stats.games.length) return false;

    const section = document.createElement("section");
    section.className = "dynamic-section bundesliga-statistics champions-league-statistics";
    const heading = document.createElement("h2");
    heading.textContent = "Saisonstatistik und Rekorde";
    section.appendChild(heading);

    const note = document.createElement("p");
    note.className = "data-note";
    note.textContent = "Ligaphase der Champions League";
    section.appendChild(note);

    const overview = document.createElement("div");
    overview.className = "season-stat-grid";
    overview.append(
      createStatCard("Ausgewertete Spiele", String(stats.games.length)),
      createStatCard("Tore", String(stats.totalGoals), `${stats.averageGoals.toFixed(2).replace(".", ",")} pro Spiel`),
      createStatCard("Heimsiege", String(stats.homeWins)),
      createStatCard("Unentschieden", String(stats.draws)),
      createStatCard("Auswärtssiege", String(stats.awayWins))
    );
    section.appendChild(overview);

    const records = document.createElement("div");
    records.className = "record-grid";
    [
      ["Beste Offensive", stats.bestAttack, stats.bestAttack ? `${stats.bestAttack.goalsFor} Tore` : ""],
      ["Beste Defensive", stats.bestDefense, stats.bestDefense ? `${stats.bestDefense.goalsAgainst} Gegentore` : ""],
      ["Heimstärkstes Team", stats.bestHome, stats.bestHome ? `${stats.bestHome.homePoints} Punkte aus ${stats.bestHome.homePlayed} Spielen` : ""],
      ["Auswärtsstärkstes Team", stats.bestAway, stats.bestAway ? `${stats.bestAway.awayPoints} Punkte aus ${stats.bestAway.awayPlayed} Spielen` : ""],
      ["Meiste Zu-null-Spiele", stats.mostCleanSheets, stats.mostCleanSheets ? `${stats.mostCleanSheets.cleanSheets}` : ""],
      ["Längste Siegesserie", stats.longestWinRun, stats.longestWinRun ? `${stats.longestWinRun.longestWinRun} Siege` : ""]
    ].forEach(([label, team, detail]) => records.appendChild(createStatCard(label, team ? team.name : "–", detail)));
    section.appendChild(records);

    const matchRecords = document.createElement("div");
    matchRecords.className = "match-records";
    matchRecords.append(
      createStatCard("Höchster Sieg", openLigaDbPairingText(stats.biggestWin), stats.biggestWin ? `${stats.biggestWin.difference} Tore Unterschied` : ""),
      createStatCard("Torreichstes Spiel", openLigaDbPairingText(stats.highestScoring), stats.highestScoring ? `${stats.highestScoring.totalGoals} Tore` : "")
    );
    section.appendChild(matchRecords);
    root.appendChild(section);
    return true;
  }

  function renderBundesligaStatistics(gameData, teamData, root) {
    const stats = calculateBundesligaStatistics(gameData, teamData);
    const section = document.createElement("section");
    section.className = "dynamic-section bundesliga-statistics";

    const heading = document.createElement("h2");
    heading.textContent = "Saisonstatistik und Rekorde";
    section.appendChild(heading);

    if (!stats.games.length) return;

    const overview = document.createElement("div");
    overview.className = "season-stat-grid";
    overview.append(
      createStatCard("Ausgewertete Spiele", String(stats.games.length)),
      createStatCard("Tore", String(stats.totalGoals), `${stats.averageGoals.toFixed(2).replace(".", ",")} pro Spiel`),
      createStatCard("Heimsiege", String(stats.homeWins)),
      createStatCard("Unentschieden", String(stats.draws)),
      createStatCard("Auswärtssiege", String(stats.awayWins))
    );
    section.appendChild(overview);

    const records = document.createElement("div");
    records.className = "record-grid";
    const recordItems = [
      ["Beste Offensive", stats.bestAttack, stats.bestAttack ? `${stats.bestAttack.goalsFor} Tore` : ""],
      ["Beste Defensive", stats.bestDefense, stats.bestDefense ? `${stats.bestDefense.goalsAgainst} Gegentore` : ""],
      ["Heimstärkstes Team", stats.bestHome, stats.bestHome ? `${stats.bestHome.homePoints} Punkte aus ${stats.bestHome.homePlayed} Spielen` : ""],
      ["Auswärtsstärkstes Team", stats.bestAway, stats.bestAway ? `${stats.bestAway.awayPoints} Punkte aus ${stats.bestAway.awayPlayed} Spielen` : ""],
      ["Meiste Zu-null-Spiele", stats.mostCleanSheets, stats.mostCleanSheets ? `${stats.mostCleanSheets.cleanSheets}` : ""],
      ["Längste Siegesserie", stats.longestWinRun, stats.longestWinRun ? `${stats.longestWinRun.longestWinRun} Siege` : ""]
    ];
    recordItems.forEach(([label, team, detail]) => records.appendChild(createStatCard(label, team ? team.name : "–", detail)));
    section.appendChild(records);

    const matchRecords = document.createElement("div");
    matchRecords.className = "match-records";
    matchRecords.append(
      createStatCard("Höchster Sieg", stats.biggestWin ? pairingText(stats.biggestWin.match, teamData) : "–", stats.biggestWin ? `${stats.biggestWin.difference} Tore Unterschied` : ""),
      createStatCard("Torreichstes Spiel", stats.highestScoring ? pairingText(stats.highestScoring.match, teamData) : "–", stats.highestScoring ? `${stats.highestScoring.totalGoals} Tore` : "")
    );
    section.appendChild(matchRecords);

    root.appendChild(section);
  }

  function renderBundesligaFormTable(gameData, teamData, root) {
    if (slug !== "bundesliga") return;
    const stats = calculateBundesligaStatistics(gameData, teamData);
    const section = document.createElement("section");
    section.className = "dynamic-section bundesliga-form-section";
    const heading = document.createElement("h2");
    heading.textContent = "Formtabelle";
    section.appendChild(heading);

    if (!stats.formRows.length) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = "Die Formtabelle erscheint automatisch, sobald abgeschlossene Ligaspiele vorliegen.";
      section.appendChild(note);
      root.appendChild(section);
      return;
    }

    const formWrapper = document.createElement("div");
    formWrapper.className = "table-scroll";
    const table = document.createElement("table");
    table.className = "data-table form-table";
    table.innerHTML = "<thead><tr><th>Verein</th><th>Form</th><th>Punkte</th><th>Tore</th></tr></thead>";
    const tbody = document.createElement("tbody");
    stats.formRows.forEach(team => {
      const row = document.createElement("tr");
      const teamCell = document.createElement("td");
      teamCell.appendChild(createTeamIdentity(team.id, team.name, "team-identity--table"));
      const formCell = document.createElement("td");
      const form = document.createElement("div");
      form.className = "form-badges";
      team.form.forEach(result => {
        const badge = document.createElement("span");
        badge.className = `form-badge form-${result.toLowerCase()}`;
        badge.textContent = result;
        form.appendChild(badge);
      });
      formCell.appendChild(form);
      const pointsCell = document.createElement("td");
      pointsCell.textContent = String(team.points);
      const goalsCell = document.createElement("td");
      goalsCell.textContent = `${team.goalsFor}:${team.goalsAgainst}`;
      row.append(teamCell, formCell, pointsCell, goalsCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    formWrapper.appendChild(table);
    section.appendChild(formWrapper);
    root.appendChild(section);
  }

  function centralGamesForCompetition(data, competitionSlug) {
    const definition = competitionDefinition(competitionSlug);
    const filter = definition && definition.filter;
    if (!filter) return [];

    const allGames = allCentralGames(data);
    return allGames
      .filter(match => {
        if (!match || typeof match !== "object") return false;
        if (filter.type === "wettbewerb") return match.wettbewerb === filter.value;
        return safeArray(match.sonderwertungen).includes(filter.value);
      })
      .sort((a, b) => {
        const first = `${a.datum || a.datumVon || "9999-12-31"}T${a.anstoss || "23:59"}`;
        const second = `${b.datum || b.datumVon || "9999-12-31"}T${b.anstoss || "23:59"}`;
        return first.localeCompare(second);
      });
  }

  function centralGamesForPage(data) {
    return centralGamesForCompetition(data, slug);
  }

  function createTeamLookup(teamData) {
    return new Map(safeArray(teamData && teamData.teams).map(team => [team.id, team]));
  }

  function teamName(teamLookup, teamId, fallback) {
    return teamLookup.get(teamId)?.name || fallback || "Team offen";
  }

  function normalizeTeamLabel(value) {
    return String(value || "")
      .toLocaleLowerCase("de")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\bsg\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function buildTeamResolutionIndex() {
    const exact = new Map();
    const entries = [];
    safeArray(currentTeamData && currentTeamData.teams).forEach(team => {
      if (!team || !team.id) return;
      const labels = [team.name, team.kurzname, team.id, ...safeArray(team.apiAliase)];
      labels.forEach(label => {
        const normalized = normalizeTeamLabel(label);
        if (!normalized) return;
        if (!exact.has(normalized)) exact.set(normalized, team.id);
        entries.push([normalized, team.id]);
      });
    });
    return { exact, entries };
  }

  function resolveTeamId(teamId, teamNameValue) {
    if (teamId) return teamId;
    const wanted = normalizeTeamLabel(teamNameValue);
    if (!wanted) return "";
    if (!teamResolutionIndex) teamResolutionIndex = buildTeamResolutionIndex();
    const exact = teamResolutionIndex.exact.get(wanted);
    if (exact) return exact;
    const partial = teamResolutionIndex.entries.find(([normalized]) =>
      normalized.length >= 4 && wanted.length >= 4 &&
      (normalized.includes(wanted) || wanted.includes(normalized))
    );
    return partial ? partial[1] : "";
  }

  function createTeamIdentity(teamId, teamNameValue, modifier = "") {
    const wrap = document.createElement("span");
    wrap.className = `team-identity${modifier ? ` ${modifier}` : ""}`;

    const resolvedId = resolveTeamId(teamId, teamNameValue);
    if (resolvedId && window.OSCTeamBadge) {
      const badge = document.createElement("span");
      badge.className = "team-identity__badge";
      window.OSCTeamBadge.render(badge, resolvedId, teamNameValue, { loading: "lazy" });
      wrap.appendChild(badge);
    }

    const name = document.createElement("span");
    name.className = "team-identity__name";
    name.textContent = teamNameValue || "Team offen";
    wrap.appendChild(name);
    return wrap;
  }

  const OPENLIGADB_CL_MATCHES_PROTOTYPE_URL = "https://api.openligadb.de/getmatchdata/ucl/2026";
  const CHAMPIONS_LEAGUE_TEAM_BADGE_IDS = Object.freeze({
    "aek athens": "aek-athen",
    "aek athen": "aek-athen",
    "lask linz": "lask",
    "lask": "lask",
    "club brugge": "club-brugge",
    "club brugge kv": "club-brugge",
    "aston villa": "aston-villa",
    "borussia dortmund": "dortmund",
    "villarreal cf": "villarreal-cf",
    "villarreal": "villarreal-cf",
    "fc porto": "fc-porto",
    "porto": "fc-porto",
    "manchester city": "manchester-city",
    "lille osc": "osc-lille",
    "osc lille": "osc-lille",
    "lille": "osc-lille",
    "real betis seville": "real-betis",
    "real betis": "real-betis",
    "real madrid": "real-madrid",
    "inter milano": "inter-mailand",
    "inter mailand": "inter-mailand",
    "inter": "inter-mailand",
    "fc barcelona": "barcelona",
    "barcelona": "barcelona",
    "feyenoord rotterdam": "feyenoord-rotterdam",
    "feyenoord": "feyenoord-rotterdam",
    "vfb stuttgart": "stuttgart",
    "viking fk": "viking-fk",
    "viking": "viking-fk",
    "liverpool fc": "fc-liverpool",
    "fc liverpool": "fc-liverpool",
    "liverpool": "fc-liverpool",
    "atletico madrid": "atletico-madrid",
    "atletico de madrid": "atletico-madrid",
    "paris saint germain": "paris-saint-germain",
    "paris st germain": "paris-saint-germain",
    "psg": "paris-saint-germain",
    "slovan bratislava": "slovan-bratislava",
    "sk slovan bratislava": "slovan-bratislava",
    "sporting cp": "sporting-lissabon",
    "sporting lissabon": "sporting-lissabon",
    "galatasaray istanbul": "galatasaray",
    "galatasaray": "galatasaray",
    "ssc napoli": "ssc-neapel",
    "napoli": "ssc-neapel",
    "ssc neapel": "ssc-neapel",
    "arsenal fc": "arsenal",
    "arsenal": "arsenal",
    "fenerbahce istanbul": "fenerbahce",
    "fenerbahce sk": "fenerbahce",
    "fenerbahce": "fenerbahce",
    "as roma": "as-rom",
    "as rom": "as-rom",
    "roma": "as-rom",
    "psv eindhoven": "psv-eindhoven",
    "psv": "psv-eindhoven",
    "fc shakhtar donetsk": "schachtar-donezk",
    "shakhtar donetsk": "schachtar-donezk",
    "schachtar donezk": "schachtar-donezk",
    "como 1907": "como-1907",
    "como": "como-1907",
    "rb leipzig": "rb-leipzig",
    "fc bayern munchen": "bayern-muenchen",
    "bayern munich": "bayern-muenchen",
    "bayern munchen": "bayern-muenchen",
    "bodoe glimt": "bod-glimt",
    "bodo glimt": "bod-glimt",
    "bod glimt": "bod-glimt",
    "manchester united": "manchester-united",
    "sabah masazir": "sabah-fc",
    "sabah fc": "sabah-fc",
    "sabah": "sabah-fc",
    "slavia prague": "slavia-prag",
    "slavia prag": "slavia-prag",
    "slavia praha": "slavia-prag",
    "racing club de lens": "rc-lens",
    "rc lens": "rc-lens",
    "lens": "rc-lens"
  });
  const OPENLIGADB_EL_MATCHES_PROTOTYPE_URL = "https://api.openligadb.de/getmatchdata/uel/2026";
  const OPENLIGADB_EL_GOALGETTERS_URL = "https://api.openligadb.de/getgoalgetters/uel/2026";
  const OPENLIGADB_DYNAMO_MATCHES_URL = "https://api.openligadb.de/getmatchdata/bl2/2026";
  const OPENLIGADB_DYNAMO_TEAM_ID = 177;
  const EUROPA_LEAGUE_FALLBACK_PROTOTYPE_URL = "./europa-league-ko-2026.json";
  const OPENLIGADB_DFB_PROTOTYPE_URL = "https://api.openligadb.de/getmatchdata/dfb/2026";
  const OPENLIGADB_DFB_GOALGETTERS_URL = "https://api.openligadb.de/getgoalgetters/dfb/2026";
  const OPENLIGADB_CL_GOALGETTERS_URL = "https://api.openligadb.de/getgoalgetters/ucl/2026";
  const DFB_POKAL_RECENT_WINNERS = Object.freeze([
    { saison: "2025/2026", teamId: "bayern-muenchen", name: "FC Bayern München" },
    { saison: "2024/2025", teamId: "stuttgart", name: "VfB Stuttgart" },
    { saison: "2023/2024", teamId: "leverkusen", name: "Bayer 04 Leverkusen" },
    { saison: "2022/2023", teamId: "rb-leipzig", name: "RB Leipzig" },
    { saison: "2021/2022", teamId: "rb-leipzig", name: "RB Leipzig" }
  ]);
  const CHAMPIONS_LEAGUE_RECENT_WINNERS = Object.freeze([
    { saison: "2025/2026", teamId: "paris-saint-germain", name: "Paris Saint-Germain" },
    { saison: "2024/2025", teamId: "paris-saint-germain", name: "Paris Saint-Germain" },
    { saison: "2023/2024", teamId: "real-madrid", name: "Real Madrid" },
    { saison: "2022/2023", teamId: "manchester-city", name: "Manchester City" },
    { saison: "2021/2022", teamId: "real-madrid", name: "Real Madrid" }
  ]);
  const EUROPA_LEAGUE_RECENT_WINNERS = Object.freeze([
    { saison: "2025/2026", teamId: "aston-villa", name: "Aston Villa" },
    { saison: "2024/2025", teamId: "tottenham-hotspur", name: "Tottenham Hotspur" },
    { saison: "2023/2024", teamId: "atalanta", name: "Atalanta" },
    { saison: "2022/2023", teamId: "sevilla", name: "Sevilla FC" },
    { saison: "2021/2022", teamId: "frankfurt", name: "Eintracht Frankfurt" }
  ]);
  const DFB_BRACKET_ROUNDS = [
    { key: "achtelfinale", label: "Achtelfinale" },
    { key: "viertelfinale", label: "Viertelfinale" },
    { key: "halbfinale", label: "Halbfinale" },
    { key: "finale", label: "Finale" }
  ];

  function normalizeRoundLabel(value) {
    return String(value || "")
      .toLocaleLowerCase("de")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function openLigaDbRoundKey(match) {
    const label = normalizeRoundLabel(
      match?.group?.groupName ??
      match?.group?.GroupName ??
      ""
    );
    if (label.includes("achtelfinale")) return "achtelfinale";
    if (label.includes("viertelfinale")) return "viertelfinale";
    if (label.includes("halbfinale")) return "halbfinale";
    if (label.includes("endspiel") || label === "finale" || label.includes(" finale")) return "finale";
    return "";
  }

  function openLigaDbFinalResult(match) {
    const results = safeArray(match && match.matchResults);
    const final = results.find(result => {
      const name = String(result?.resultName ?? result?.resultTypeName ?? "").toLocaleLowerCase("de");
      const typeId = Number(result?.resultTypeID ?? result?.resultTypeId ?? -1);
      return name.includes("end") || name.includes("final") || typeId === 2;
    }) || results.at(-1);

    if (!final) return "";
    const home = Number(final?.pointsTeam1 ?? final?.PointsTeam1);
    const away = Number(final?.pointsTeam2 ?? final?.PointsTeam2);
    return Number.isFinite(home) && Number.isFinite(away) ? `${home}:${away}` : "";
  }

  function openLigaDbTeamName(team) {
    return String(team?.teamName ?? team?.TeamName ?? "Team offen").trim() || "Team offen";
  }

  function bracketTeamKey(value) {
    return String(value || "")
      .toLocaleLowerCase("de")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function createBracketMatch(match) {
    const card = document.createElement("article");
    card.className = "ko-match";

    const teams = document.createElement("div");
    teams.className = "ko-match__teams";

    const homeName = openLigaDbTeamName(match?.team1);
    const awayName = openLigaDbTeamName(match?.team2);
    card.dataset.team1 = bracketTeamKey(homeName);
    card.dataset.team2 = bracketTeamKey(awayName);

    teams.append(
      createTeamIdentity("", homeName, "ko-team"),
      createTeamIdentity("", awayName, "ko-team")
    );

    const meta = document.createElement("div");
    meta.className = "ko-match__meta";

    const result = document.createElement("strong");
    result.className = "ko-match__result";
    result.textContent = openLigaDbFinalResult(match) || "–";

    const date = document.createElement("span");
    date.className = "ko-match__date";
    const rawDate = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");
    date.textContent = rawDate && /^\d{4}-\d{2}-\d{2}/.test(rawDate)
      ? formatDate(rawDate.slice(0, 10))
      : "Termin offen";

    meta.append(result, date);
    card.append(teams, meta);
    return card;
  }

  function bracketCardTeams(card) {
    return [card?.dataset?.team1, card?.dataset?.team2].filter(Boolean);
  }

  function drawBracketConnections(bracket) {
    if (!bracket) return;
    const oldSvg = bracket.querySelector(".ko-bracket__connections");
    if (oldSvg) oldSvg.remove();

    const rounds = [...bracket.querySelectorAll(".ko-round")];
    if (rounds.length < 2) return;

    const width = Math.max(bracket.scrollWidth, bracket.clientWidth);
    const height = Math.max(bracket.scrollHeight, bracket.clientHeight);
    if (!width || !height) return;

    const baseRect = bracket.getBoundingClientRect();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ko-bracket__connections");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("aria-hidden", "true");

    const connected = new Set();

    for (let roundIndex = 1; roundIndex < rounds.length; roundIndex += 1) {
      const previousCards = [...rounds[roundIndex - 1].querySelectorAll(".ko-match:not(.ko-match--open)")];
      const currentCards = [...rounds[roundIndex].querySelectorAll(".ko-match:not(.ko-match--open)")];

      currentCards.forEach(currentCard => {
        const currentTeams = new Set(bracketCardTeams(currentCard));
        const targetRect = currentCard.getBoundingClientRect();

        previousCards.forEach(previousCard => {
          const sharedTeam = bracketCardTeams(previousCard).find(team => currentTeams.has(team));
          if (!sharedTeam) return;

          const connectionKey = `${roundIndex}:${sharedTeam}:${previousCard.dataset.team1}:${previousCard.dataset.team2}`;
          if (connected.has(connectionKey)) return;
          connected.add(connectionKey);

          const sourceRect = previousCard.getBoundingClientRect();
          const x1 = sourceRect.right - baseRect.left;
          const y1 = sourceRect.top - baseRect.top + sourceRect.height / 2;
          const x2 = targetRect.left - baseRect.left;
          const y2 = targetRect.top - baseRect.top + targetRect.height / 2;
          const middleX = x1 + Math.max(12, (x2 - x1) / 2);

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${x1} ${y1} H ${middleX} V ${y2} H ${x2}`);
          path.setAttribute("class", "ko-bracket__connection");
          svg.appendChild(path);
        });
      });
    }

    bracket.prepend(svg);
  }

  function activateBracketConnections(bracket) {
    const redraw = () => window.requestAnimationFrame(() => drawBracketConnections(bracket));
    redraw();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(redraw);
      observer.observe(bracket);
    } else {
      window.addEventListener("resize", redraw, { passive: true });
    }
  }

  function openLigaDbNumber(row, ...keys) {
    for (const key of keys) {
      const value = Number(row && row[key]);
      if (Number.isFinite(value)) return value;
    }
    return 0;
  }

  function championsLeaguePhaseMatches(openLigaDbMatches) {
    return safeArray(openLigaDbMatches).filter(match => {
      const groupName = normalizeRoundLabel(match?.group?.groupName ?? match?.group?.GroupName ?? "");
      if (groupName === "ligaphase") return true;
      const legacyMatchday = Number(groupName.match(/(\d+)\s*spieltag/i)?.[1]);
      return Number.isFinite(legacyMatchday) && legacyMatchday >= 1 && legacyMatchday <= 8;
    });
  }

  function openLigaDbMatchDate(match) {
    const raw = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");
    const value = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || "";
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  }

  function championsLeagueMatchdayNumber(match) {
    const group = match?.group || {};
    const label = normalizeRoundLabel(group?.groupName ?? group?.GroupName ?? "");
    const fromLabel = Number(label.match(/^(\d+)\s*spieltag$/i)?.[1]);
    if (Number.isInteger(fromLabel) && fromLabel >= 1 && fromLabel <= 8) return fromLabel;

    const fromOrder = Number(
      group?.groupOrderID ?? group?.groupOrderId ?? group?.GroupOrderID ?? group?.GroupOrderId
    );
    return Number.isInteger(fromOrder) && fromOrder >= 1 && fromOrder <= 8 ? fromOrder : null;
  }

  function championsLeagueMatchHasKickoff(match) {
    const raw = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw);
  }

  function championsLeagueClusterIsPlausible(cluster) {
    if (!cluster || safeArray(cluster.matches).length !== 18) return false;
    const teams = new Set();
    for (const match of cluster.matches) {
      if (!championsLeagueMatchHasKickoff(match)) return false;
      const home = String(match?.team1?.teamId ?? match?.team1?.teamID ?? openLigaDbTeamName(match?.team1));
      const away = String(match?.team2?.teamId ?? match?.team2?.teamID ?? openLigaDbTeamName(match?.team2));
      if (!home || !away || teams.has(home) || teams.has(away)) return false;
      teams.add(home); teams.add(away);
    }
    return teams.size === 36;
  }

  function championsLeagueMatchdayClusters(matches) {
    const phaseMatches = safeArray(matches);
    if (!phaseMatches.length) return [];

    // Bevorzugt die explizite OpenLigaDB-Spieltagszuordnung. Damit kann jeder
    // bereits vollständig terminierte Spieltag sofort angezeigt werden, ohne
    // auf die komplette Ligaphase mit 144 Partien warten zu müssen.
    const byMatchday = new Map();
    phaseMatches.forEach(match => {
      const number = championsLeagueMatchdayNumber(match);
      if (!number) return;
      if (!byMatchday.has(number)) byMatchday.set(number, []);
      byMatchday.get(number).push(match);
    });

    const explicit = [...byMatchday.entries()]
      .map(([matchdayNumber, groupedMatches]) => ({
        matchdayNumber,
        dates: [...new Set(groupedMatches.map(openLigaDbMatchDate).filter(Boolean))].sort(),
        matches: groupedMatches
      }))
      .filter(championsLeagueClusterIsPlausible)
      .sort((a, b) => a.matchdayNumber - b.matchdayNumber);

    if (explicit.length) return explicit;

    // Fallback für OpenLigaDB-Datensätze, die weiterhin nur "Ligaphase"
    // liefern: ausschließlich vollständig terminierte 18er-Termincluster
    // übernehmen. Unvollständige oder künstliche Zuordnungen bleiben außen vor.
    const byDate = new Map();
    phaseMatches.forEach(match => {
      if (!championsLeagueMatchHasKickoff(match)) return;
      const date = openLigaDbMatchDate(match);
      if (!date) return;
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date).push(match);
    });
    const dates = [...byDate.keys()].sort();
    if (!dates.length) return [];

    const clusters = [];
    dates.forEach(date => {
      const current = new Date(`${date}T12:00:00`);
      const lastCluster = clusters.at(-1);
      const lastDate = lastCluster ? new Date(`${lastCluster.dates.at(-1)}T12:00:00`) : null;
      const gapDays = lastDate ? Math.round((current - lastDate) / 86400000) : 0;
      if (!lastCluster || gapDays > 4) clusters.push({ dates: [date], matches: [...byDate.get(date)] });
      else {
        lastCluster.dates.push(date);
        lastCluster.matches.push(...byDate.get(date));
      }
    });

    return clusters
      .filter(championsLeagueClusterIsPlausible)
      .slice(0, 8)
      .map((cluster, index) => ({ ...cluster, matchdayNumber: index + 1 }));
  }

  function centralChampionsLeagueMatch(match, centralMatches) {
    const matchId = String(match?.matchID ?? match?.matchId ?? match?.MatchID ?? "").trim();
    if (!matchId) return null;
    return safeArray(centralMatches).find(item =>
      item?.wettbewerb === "champions-league" &&
      String(item.id || "").endsWith(`-${matchId}`)
    ) || null;
  }

  function championsLeagueDisplayMatch(match, matchdayNumber = null, provisional = false, centralMatches = []) {
    const rawDate = openLigaDbMatchDate(match);
    const rawTime = String(match?.matchDateTime ?? match?.MatchDateTime ?? "").match(/T(\d{2}:\d{2})/)?.[1] || "";
    const score = openLigaDbFinalResult(match);
    const homeName = openLigaDbTeamName(match?.team1);
    const awayName = openLigaDbTeamName(match?.team2);
    const centralMatch = centralChampionsLeagueMatch(match, centralMatches);
    return {
      id: centralMatch?.id || (match?.matchID ? `openligadb-cl-${match.matchID}` : ""),
      datum: provisional || !rawDate ? "Terminierung offen" : formatDate(rawDate),
      datumSortierung: provisional || !rawDate ? "9999-12-31" : rawDate,
      datumIso: provisional || !rawDate ? "" : rawDate,
      anstoss: provisional || !rawTime ? "" : rawTime,
      // TEST44: Die allgemeinen Match-Zeilen rendern Wappen ausschließlich über
      // heimTeamId/auswaertsTeamId. TEST42/43 hatten zwar eine CL-spezifische
      // Wappenauflösung ergänzt, die Ansetzungen selbst verloren diese Zuordnung
      // beim Umwandeln der OpenLigaDB-Partien jedoch wieder. Deshalb werden die
      // bereits geprüften lokalen CL-Team-IDs hier direkt mitgegeben.
      heimTeamId: championsLeagueLocalBadgeId(homeName),
      heim: homeName,
      heimTeamSource: match?.team1 || null,
      trenner: "–",
      auswaertsTeamId: championsLeagueLocalBadgeId(awayName),
      auswaerts: awayName,
      auswaertsTeamSource: match?.team2 || null,
      ergebnis: score,
      status: provisional ? "Terminierung offen" : "",
      runde: matchdayNumber ? `${matchdayNumber}. Spieltag` : "Ligaphase",
      spieltagNummer: matchdayNumber,
      terminBestaetigt: !provisional && Boolean(rawDate && rawTime),
      abgeschlossen: match?.matchIsFinished === true && Boolean(score),
      tippverteilung: centralMatch?.tippverteilung && typeof centralMatch.tippverteilung === "object"
        ? centralMatch.tippverteilung
        : null
    };
  }

  function championsLeagueSituationGames(openLigaDbMatches) {
    return safeArray(openLigaDbMatches).map(match => {
      const date = openLigaDbMatchDate(match);
      const rawDateTime = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");
      const time = rawDateTime.match(/T(\d{2}:\d{2})/)?.[1] || "";
      const home = openLigaDbTeamName(match?.team1);
      const away = openLigaDbTeamName(match?.team2);
      const score = openLigaDbFinalResult(match);
      const scoreParts = score.match(/^(\d+):(\d+)$/);
      const matchdayNumber = championsLeagueMatchdayNumber(match);
      const groupName = String(match?.group?.groupName ?? match?.group?.GroupName ?? "").trim();
      if (!date || !home || !away) return null;
      return {
        id: match?.matchID ? `openligadb-cl-${match.matchID}` : "",
        wettbewerb: "champions-league",
        runde: matchdayNumber ? `${matchdayNumber}. Spieltag` : (groupName || "Champions League"),
        datum: date,
        anstoss: time,
        terminBestaetigt: Boolean(date && time),
        heimTeamId: championsLeagueLocalBadgeId(home),
        heim: home,
        auswaertsTeamId: championsLeagueLocalBadgeId(away),
        auswaerts: away,
        heimtore: scoreParts ? Number(scoreParts[1]) : null,
        auswaertstore: scoreParts ? Number(scoreParts[2]) : null,
        status: match?.matchIsFinished === true ? "beendet" : "terminiert"
      };
    }).filter(Boolean);
  }

  function renderChampionsLeaguePhaseOverview(openLigaDbMatches, centralGameData, root) {
    if (slug !== "champions-league") return false;
    const matches = championsLeaguePhaseMatches(openLigaDbMatches);
    const clusters = championsLeagueMatchdayClusters(matches);
    const scheduledMatchdays = clusters.length;
    const scheduleConfirmed = scheduledMatchdays > 0;
    const centralMatches = centralGamesForCompetition(centralGameData, "champions-league");

    if (!matches.length) return false;
    const schedule = document.createElement("section");
    schedule.className = "dynamic-section";
    const title = document.createElement("h2");
    title.textContent = scheduleConfirmed ? "Spiele der Champions League" : "Ligaphase · Paarungen in Vorbereitung";
    schedule.appendChild(title);
    if (!scheduleConfirmed) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = "OpenLigaDB hat bereits Ligaphasen-Paarungen erfasst, aber noch keinen vollständigen terminieren 18er-Spieltag. Deshalb werden keine erfundenen Spieltagsnummern oder Platzhaltertermine angezeigt.";
      schedule.appendChild(note);
    }

    if (scheduleConfirmed) {
      const accordion = document.createElement("div");
      accordion.className = "matchday-accordion";
      clusters.forEach((cluster, index) => {
        const details = document.createElement("details");
        details.className = "matchday-group";
        details.open = index === 0;
        const summary = document.createElement("summary");
        summary.className = "matchday-summary";
        const matchdayNumber = cluster.matchdayNumber || index + 1;
        const label = document.createElement("span"); label.textContent = `${matchdayNumber}. Spieltag`;
        const count = document.createElement("span"); count.className = "matchday-count"; count.textContent = `${cluster.matches.length} Spiele`;
        summary.append(label, count);
        const rows = cluster.matches
          .slice()
          .sort((a, b) => String(a?.matchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? "")))
          .map(match => championsLeagueDisplayMatch(match, matchdayNumber, false, centralMatches));
        details.append(summary, createMatchList(rows, {
          teamIdentityFactory: (teamId, teamName, modifier, match, side) => {
            const sourceTeam = side === "home" ? match?.heimTeamSource : match?.auswaertsTeamSource;
            return createChampionsLeagueTeamIdentity(
              sourceTeam || { teamId, teamName },
              modifier
            );
          }
        }));
        accordion.appendChild(details);
      });
      schedule.appendChild(accordion);
    } else {
      const waiting = document.createElement("p");
      waiting.className = "data-note";
      waiting.textContent = `${matches.length} Paarungen sind bei OpenLigaDB bereits erfasst. Die Besucheransicht schaltet jeden Spieltag einzeln frei, sobald dafür 18 Spiele mit bestätigtem Anstoß und 36 eindeutigen Teams vorliegen.`;
      schedule.appendChild(waiting);
    }
    root.appendChild(schedule);
    return true;
  }

  function openLigaDbSafeIconUrl(team) {
    const raw = String(team?.teamIconUrl ?? team?.TeamIconUrl ?? "").trim();
    if (!raw || raw.startsWith("data:")) return "";
    try {
      const url = new URL(raw, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      if (url.protocol === "http:") url.protocol = "https:";
      return url.href;
    } catch {
      return "";
    }
  }

  function championsLeagueBadgeLookupKeys(teamNameValue) {
    const normalized = normalizeTeamLabel(teamNameValue);
    if (!normalized) return [];

    const keys = new Set([normalized]);
    const prefixes = ["fc", "fk", "sc", "sk", "ac", "as", "cf", "rc", "ssc", "osc", "sv", "vfb", "vfl", "tsg"];
    let reduced = normalized;

    // OpenLigaDB verwendet bei einigen Clubs wechselnde Präfixe, z. B.
    // „FC Arsenal“ statt „Arsenal FC“ oder „FK Bodø/Glimt“. Diese Präfixe
    // dürfen die Zuordnung zum lokalen Badge nicht verhindern.
    for (let i = 0; i < 3; i += 1) {
      const parts = reduced.split(" ").filter(Boolean);
      if (!parts.length || !prefixes.includes(parts[0])) break;
      parts.shift();
      reduced = parts.join(" ").trim();
      if (reduced) keys.add(reduced);
    }

    // Zusätzlich Varianten mit nachgestelltem FC/CF erfassen.
    for (const suffix of [" fc", " cf", " sk", " fk"]) {
      if (normalized.endsWith(suffix)) keys.add(normalized.slice(0, -suffix.length).trim());
    }

    return [...keys].filter(Boolean);
  }

  function championsLeagueLocalBadgeId(teamNameValue) {
    const genericId = resolveTeamId("", teamNameValue);
    if (genericId) return genericId;

    for (const key of championsLeagueBadgeLookupKeys(teamNameValue)) {
      const mapped = CHAMPIONS_LEAGUE_TEAM_BADGE_IDS[key];
      if (mapped) return mapped;
    }
    return "";
  }

  function createChampionsLeagueTeamIdentity(team, modifier = "") {
    const name = openLigaDbTeamName(team);
    const localId = championsLeagueLocalBadgeId(name);
    // Alle Ansichten verwenden ausschließlich das verbindliche lokale
    // Originalwappen-Register. Die Release-Prüfung blockiert jeden Datenstand,
    // in dem ein verwendetes Team noch kein lokal archiviertes Original besitzt.
    if (localId) return createTeamIdentity(localId, name, modifier);

    const wrap = document.createElement("span");
    wrap.className = `team-identity${modifier ? ` ${modifier}` : ""}`;
    const badge = document.createElement("span");
    badge.className = "team-identity__badge";
    const unresolvedId = `cl-${normalizeTeamLabel(name).replace(/\s+/g, "-") || "team"}`;
    window.OSCTeamBadge?.render(badge, unresolvedId, name, { loading: "lazy" });
    wrap.appendChild(badge);

    const label = document.createElement("span");
    label.className = "team-identity__name";
    label.textContent = name;
    wrap.appendChild(label);
    return wrap;
  }

  function renderChampionsLeagueTable(openLigaDbMatches, root) {
    if (slug !== "champions-league") return;

    const leaguePhaseMatches = championsLeaguePhaseMatches(openLigaDbMatches);

    const teams = new Map();

    function ensureTeam(team) {
      const id = String(team?.teamId ?? team?.teamID ?? team?.TeamId ?? team?.TeamID ?? "");
      const name = openLigaDbTeamName(team);
      const key = id || bracketTeamKey(name);
      if (!teams.has(key)) {
        teams.set(key, { id, name, sourceTeam: team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
      }
      return teams.get(key);
    }

    leaguePhaseMatches.forEach(match => {
      const home = ensureTeam(match?.team1);
      const away = ensureTeam(match?.team2);
      const results = safeArray(match?.matchResults);
      const finalResult = results.find(result => Number(result?.resultTypeID ?? result?.resultTypeId ?? result?.ResultTypeID ?? -1) === 2)
        || results.find(result => {
          const name = String(result?.resultName ?? result?.resultTypeName ?? "").toLocaleLowerCase("de");
          return name.includes("end") || name.includes("final");
        })
        || results.at(-1);
      if (!finalResult) return;
      const homeGoals = Number(finalResult?.pointsTeam1 ?? finalResult?.PointsTeam1);
      const awayGoals = Number(finalResult?.pointsTeam2 ?? finalResult?.PointsTeam2);
      if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return;

      home.played += 1; away.played += 1;
      home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
      if (homeGoals > awayGoals) { home.wins += 1; away.losses += 1; home.points += 3; }
      else if (homeGoals < awayGoals) { away.wins += 1; home.losses += 1; away.points += 3; }
      else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
    });

    const rows = [...teams.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name, "de");
    });

    // Ligaphase ist erst vollständig, wenn alle 36 Teams ihre acht Spiele absolviert haben.
    const complete = rows.length >= 36 && rows.every(team => team.played >= 8);

    const section = document.createElement("section");
    section.className = "dynamic-section standings-section";
    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "Champions-League-Tabelle";
    headingRow.append(heading);
    section.appendChild(headingRow);

    if (!rows.length) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = "Aktuelle Daten für die Champions-League-Ligaphase sind momentan nicht verfügbar.";
      section.appendChild(note); root.appendChild(section); return;
    }

    // Keine scheinbar vollständige CL-Tabelle anzeigen, solange OpenLigaDB
    // noch nicht alle 36 Teilnehmer über die Ligaphasen-Paarungen geliefert hat.
    // Die Prüfung läuft bei jedem Laden erneut; ab 36 Teams erscheint die Tabelle automatisch.
    if (rows.length < 36) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = `OpenLigaDB hat derzeit ${rows.length} von 36 Teilnehmern in den erfassten Ligaphasen-Paarungen geliefert. Die vollständige Tabelle wird automatisch eingeblendet, sobald alle 36 Vereine vorhanden sind.`;
      section.appendChild(note);
      root.appendChild(section);
      return;
    }

    const wrapper = document.createElement("div"); wrapper.className = "table-scroll";
    const table = document.createElement("table"); table.className = "data-table standings-table";
    table.innerHTML = "<thead><tr><th>Pl.</th><th>Verein</th><th>Sp.</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff.</th><th>Pkt.</th></tr></thead>";
    const tbody = document.createElement("tbody");
    rows.forEach((team, index) => {
      const tr = document.createElement("tr");
      const gd = team.goalsFor - team.goalsAgainst;
      const values = [index + 1, team.name, team.played, team.wins, team.draws, team.losses, `${team.goalsFor}:${team.goalsAgainst}`, gd > 0 ? `+${gd}` : String(gd), team.points];
      values.forEach((value, columnIndex) => {
        const cell = document.createElement(columnIndex === 0 ? "th" : "td");
        if (columnIndex === 0) cell.scope = "row";
        if (columnIndex === 1) cell.appendChild(createChampionsLeagueTeamIdentity(team.sourceTeam || { teamId: team.id, teamName: team.name }, "team-identity--table"));
        else cell.textContent = value;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrapper.appendChild(table); section.appendChild(wrapper);
    root.appendChild(section);
  }


  function openLigaDbCompletedRows(matches) {
    const teams = new Map();
    const completed = [];

    function ensureTeam(team) {
      const id = String(team?.teamId ?? team?.teamID ?? team?.TeamId ?? team?.TeamID ?? "");
      const name = openLigaDbTeamName(team);
      const key = id || bracketTeamKey(name);
      if (!teams.has(key)) {
        teams.set(key, { key, id, name, sourceTeam: team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, formGames: [] });
      }
      return teams.get(key);
    }

    safeArray(matches)
      .slice()
      .sort((a, b) => String(a?.matchDateTime ?? a?.MatchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? b?.MatchDateTime ?? "")))
      .forEach(match => {
        const score = String(openLigaDbFinalResult(match) || "").match(/^(\d+):(\d+)$/);
        if (!score) return;
        const homeGoals = Number(score[1]);
        const awayGoals = Number(score[2]);
        const home = ensureTeam(match?.team1);
        const away = ensureTeam(match?.team2);
        const date = String(match?.matchDateTime ?? match?.MatchDateTime ?? "");

        home.played += 1; away.played += 1;
        home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
        away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
        let homeResult = "U"; let awayResult = "U";
        if (homeGoals > awayGoals) {
          home.wins += 1; away.losses += 1; home.points += 3; homeResult = "S"; awayResult = "N";
        } else if (homeGoals < awayGoals) {
          away.wins += 1; home.losses += 1; away.points += 3; homeResult = "N"; awayResult = "S";
        } else {
          home.draws += 1; away.draws += 1; home.points += 1; away.points += 1;
        }
        home.formGames.push({ date, result: homeResult, goalsFor: homeGoals, goalsAgainst: awayGoals });
        away.formGames.push({ date, result: awayResult, goalsFor: awayGoals, goalsAgainst: homeGoals });
        completed.push(match);
      });

    const rows = [...teams.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name, "de");
    });
    return { rows, completed };
  }

  function formSummary(team) {
    const games = safeArray(team?.formGames).slice(-5);
    return {
      games,
      points: games.reduce((sum, game) => sum + (game.result === "S" ? 3 : game.result === "U" ? 1 : 0), 0),
      goalsFor: games.reduce((sum, game) => sum + Number(game.goalsFor || 0), 0),
      goalsAgainst: games.reduce((sum, game) => sum + Number(game.goalsAgainst || 0), 0)
    };
  }

  function appendFormBadges(cell, games) {
    const form = document.createElement("div");
    form.className = "form-badges";
    safeArray(games).forEach(game => {
      const badge = document.createElement("span");
      badge.className = `form-badge form-${String(game.result || "").toLowerCase()}`;
      badge.textContent = game.result || "–";
      form.appendChild(badge);
    });
    cell.appendChild(form);
  }

  function renderOpenLigaDbFormTable(title, matches, root, options = {}) {
    const { rows } = openLigaDbCompletedRows(matches);
    const minimumGames = Number(options.minimumGames || 1);
    const formRows = rows
      .map(team => ({ team, summary: formSummary(team) }))
      .filter(item => item.summary.games.length >= minimumGames)
      .sort((a, b) => {
        if (b.summary.points !== a.summary.points) return b.summary.points - a.summary.points;
        const gdA = a.summary.goalsFor - a.summary.goalsAgainst;
        const gdB = b.summary.goalsFor - b.summary.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        if (b.summary.goalsFor !== a.summary.goalsFor) return b.summary.goalsFor - a.summary.goalsFor;
        return a.team.name.localeCompare(b.team.name, "de");
      });

    const section = document.createElement("section");
    section.className = "dynamic-section form-section";
    const heading = document.createElement("h2");
    heading.textContent = title;
    section.appendChild(heading);

    if (!formRows.length) {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = options.emptyText || "Die Formtabelle erscheint automatisch, sobald genügend abgeschlossene Spiele vorliegen.";
      section.appendChild(note);
      root.appendChild(section);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    const table = document.createElement("table");
    table.className = "data-table form-table";
    table.innerHTML = "<thead><tr><th>Verein</th><th>Form</th><th>Punkte</th><th>Tore</th></tr></thead>";
    const tbody = document.createElement("tbody");
    formRows.forEach(({ team, summary }) => {
      const row = document.createElement("tr");
      const teamCell = document.createElement("td");
      teamCell.appendChild(createChampionsLeagueTeamIdentity(team.sourceTeam || { teamId: team.id, teamName: team.name }, "team-identity--table"));
      const formCell = document.createElement("td");
      appendFormBadges(formCell, summary.games);
      const pointsCell = document.createElement("td"); pointsCell.textContent = String(summary.points);
      const goalsCell = document.createElement("td"); goalsCell.textContent = `${summary.goalsFor}:${summary.goalsAgainst}`;
      row.append(teamCell, formCell, pointsCell, goalsCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody); wrapper.appendChild(table); section.appendChild(wrapper); root.appendChild(section);
  }

  function renderChampionsLeagueFormTable(openLigaDbMatches, root) {
    if (slug !== "champions-league") return;
    renderOpenLigaDbFormTable("Formtabelle", championsLeaguePhaseMatches(openLigaDbMatches), root, {
      emptyText: "Die Champions-League-Formtabelle erscheint automatisch, sobald abgeschlossene Ligaphasen-Spiele vorliegen."
    });
  }

  function europaLeaguePhaseMatches(openLigaDbMatches) {
    return safeArray(openLigaDbMatches).filter(match => {
      const groupName = normalizeRoundLabel(match?.group?.groupName ?? match?.group?.GroupName ?? "");
      if (groupName === "ligaphase") return true;
      const legacyMatchday = Number(groupName.match(/(\d+)\s*spieltag/i)?.[1]);
      return Number.isFinite(legacyMatchday) && legacyMatchday >= 1 && legacyMatchday <= 8;
    });
  }

  function renderEuropaLeagueTable(openLigaDbMatches, root) {
    if (slug !== "europa-league") return false;
    const { rows } = openLigaDbCompletedRows(europaLeaguePhaseMatches(openLigaDbMatches));
    // Vor dem realen Start keine leeren Platzhalter zeigen. Die Tabelle wird
    // automatisch eingeblendet, sobald die Ligaphase belastbar mit 36 Teams vorliegt.
    if (rows.length < 36) return false;
    const section = document.createElement("section");
    section.className = "dynamic-section standings-section";
    const heading = document.createElement("h2"); heading.textContent = "Europa-League-Tabelle"; section.appendChild(heading);
    const wrapper = document.createElement("div"); wrapper.className = "table-scroll";
    const table = document.createElement("table"); table.className = "data-table standings-table";
    table.innerHTML = "<thead><tr><th>Pl.</th><th>Verein</th><th>Sp.</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff.</th><th>Pkt.</th></tr></thead>";
    const tbody = document.createElement("tbody");
    rows.forEach((team, index) => {
      const tr = document.createElement("tr");
      const gd = team.goalsFor - team.goalsAgainst;
      [index + 1, team.name, team.played, team.wins, team.draws, team.losses, `${team.goalsFor}:${team.goalsAgainst}`, gd > 0 ? `+${gd}` : String(gd), team.points].forEach((value, columnIndex) => {
        const cell = document.createElement(columnIndex === 0 ? "th" : "td");
        if (columnIndex === 0) cell.scope = "row";
        if (columnIndex === 1) cell.appendChild(createChampionsLeagueTeamIdentity(team.sourceTeam || { teamId: team.id, teamName: team.name }, "team-identity--table"));
        else cell.textContent = value;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrapper.appendChild(table); section.appendChild(wrapper); root.appendChild(section);
    return true;
  }

  function renderEuropaLeagueFormTable(openLigaDbMatches, root) {
    if (slug !== "europa-league") return false;
    const phaseMatches = europaLeaguePhaseMatches(openLigaDbMatches);
    const { completed } = openLigaDbCompletedRows(phaseMatches);
    if (!completed.length) return false;
    renderOpenLigaDbFormTable("Formtabelle", phaseMatches, root, {
      emptyText: "Die Europa-League-Formtabelle erscheint automatisch, sobald abgeschlossene Ligaphasen-Spiele vorliegen."
    });
    return true;
  }

  function renderDynamoTableExcerpt(openLigaDbMatches, root) {
    if (slug !== "dynamo-dresden") return;
    const { rows } = openLigaDbCompletedRows(openLigaDbMatches);
    const index = rows.findIndex(team => Number(team.id) === OPENLIGADB_DYNAMO_TEAM_ID);
    const section = document.createElement("section"); section.className = "dynamic-section standings-section dynamo-standings-excerpt";
    const heading = document.createElement("h2"); heading.textContent = "Dynamo in der Tabelle"; section.appendChild(heading);
    if (index < 0) {
      const note = document.createElement("p"); note.className = "data-note"; note.textContent = "Der aktuelle Tabellenplatz von Dynamo Dresden ist momentan nicht belastbar verfügbar.";
      section.appendChild(note); root.appendChild(section); return;
    }
    const start = Math.max(0, index - 3);
    const end = Math.min(rows.length, index + 4);
    const wrapper = document.createElement("div"); wrapper.className = "table-scroll";
    const table = document.createElement("table"); table.className = "data-table standings-table dynamo-excerpt-table";
    table.innerHTML = "<thead><tr><th>Pl.</th><th>Verein</th><th>Sp.</th><th>Tore</th><th>Diff.</th><th>Pkt.</th></tr></thead>";
    const tbody = document.createElement("tbody");
    rows.slice(start, end).forEach((team, localIndex) => {
      const position = start + localIndex + 1;
      const tr = document.createElement("tr");
      if (Number(team.id) === OPENLIGADB_DYNAMO_TEAM_ID) tr.classList.add("is-highlighted-team");
      const gd = team.goalsFor - team.goalsAgainst;
      [position, team.name, team.played, `${team.goalsFor}:${team.goalsAgainst}`, gd > 0 ? `+${gd}` : String(gd), team.points].forEach((value, columnIndex) => {
        const cell = document.createElement(columnIndex === 0 ? "th" : "td");
        if (columnIndex === 0) cell.scope = "row";
        if (columnIndex === 1) cell.appendChild(createChampionsLeagueTeamIdentity(team.sourceTeam || { teamId: team.id, teamName: team.name }, "team-identity--table"));
        else cell.textContent = value;
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrapper.appendChild(table); section.appendChild(wrapper); root.appendChild(section);
  }

  function renderDynamoDutyForm(leagueMatches, dfbMatches, root) {
    if (slug !== "dynamo-dresden") return;
    const all = [...safeArray(leagueMatches), ...safeArray(dfbMatches)]
      .filter(match => {
        const homeId = Number(match?.team1?.teamId ?? match?.team1?.teamID ?? match?.team1?.TeamId ?? match?.team1?.TeamID);
        const awayId = Number(match?.team2?.teamId ?? match?.team2?.teamID ?? match?.team2?.TeamId ?? match?.team2?.TeamID);
        return homeId === OPENLIGADB_DYNAMO_TEAM_ID || awayId === OPENLIGADB_DYNAMO_TEAM_ID;
      })
      .sort((a, b) => String(a?.matchDateTime ?? a?.MatchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? b?.MatchDateTime ?? "")));
    const completed = all.filter(match => /^\d+:\d+$/.test(openLigaDbFinalResult(match))).slice(-5);
    const section = document.createElement("section"); section.className = "dynamic-section form-section dynamo-duty-form";
    const heading = document.createElement("h2"); heading.textContent = "Form der letzten 5 Pflichtspiele"; section.appendChild(heading);
    if (!completed.length) {
      const note = document.createElement("p"); note.className = "data-note"; note.textContent = "Die Pflichtspiel-Form erscheint automatisch, sobald abgeschlossene Liga- oder DFB-Pokalspiele vorliegen.";
      section.appendChild(note); root.appendChild(section); return;
    }
    let points = 0, goalsFor = 0, goalsAgainst = 0;
    const games = completed.map(match => {
      const score = openLigaDbFinalResult(match).match(/^(\d+):(\d+)$/);
      const homeGoals = Number(score[1]), awayGoals = Number(score[2]);
      const homeId = Number(match?.team1?.teamId ?? match?.team1?.teamID ?? match?.team1?.TeamId ?? match?.team1?.TeamID);
      const isHome = homeId === OPENLIGADB_DYNAMO_TEAM_ID;
      const gf = isHome ? homeGoals : awayGoals;
      const ga = isHome ? awayGoals : homeGoals;
      const result = gf > ga ? "S" : gf < ga ? "N" : "U";
      points += result === "S" ? 3 : result === "U" ? 1 : 0; goalsFor += gf; goalsAgainst += ga;
      return { result, goalsFor: gf, goalsAgainst: ga };
    });
    const wrapper = document.createElement("div"); wrapper.className = "table-scroll";
    const table = document.createElement("table"); table.className = "data-table form-table";
    table.innerHTML = "<thead><tr><th>Verein</th><th>Form</th><th>Punkte</th><th>Tore</th></tr></thead>";
    const tbody = document.createElement("tbody"); const row = document.createElement("tr"); row.classList.add("is-highlighted-team");
    const teamCell = document.createElement("td"); teamCell.appendChild(createTeamIdentity("dynamo-dresden", "Dynamo Dresden", "team-identity--table"));
    const formCell = document.createElement("td"); appendFormBadges(formCell, games);
    const pointsCell = document.createElement("td"); pointsCell.textContent = String(points);
    const goalsCell = document.createElement("td"); goalsCell.textContent = `${goalsFor}:${goalsAgainst}`;
    row.append(teamCell, formCell, pointsCell, goalsCell); tbody.appendChild(row); table.appendChild(tbody); wrapper.appendChild(table); section.appendChild(wrapper); root.appendChild(section);
  }

  function renderPlaceholderSection(title, message, root) {
    const section = document.createElement("section"); section.className = "dynamic-section synchronized-placeholder";
    const heading = document.createElement("h2"); heading.textContent = title; section.appendChild(heading);
    const note = document.createElement("p"); note.className = "data-note"; note.textContent = message; section.appendChild(note);
    root.appendChild(section);
  }

  function championsLeagueKoRoundKey(match) {
    const label = normalizeRoundLabel(match?.group?.groupName ?? match?.group?.GroupName ?? "");
    if (label.includes("playoff")) return "playoffs";
    if (label.includes("achtelfinale")) return "achtelfinale";
    if (label.includes("viertelfinale")) return "viertelfinale";
    if (label.includes("halbfinale")) return "halbfinale";
    if (label.includes("endspiel") || label === "finale" || label.includes(" finale")) return "finale";
    return "";
  }

  function openLigaDbFinalScore(match) {
    const result = openLigaDbFinalResult(match);
    const parts = String(result || "").match(/^(\d+):(\d+)$/);
    return parts ? [Number(parts[1]), Number(parts[2])] : null;
  }

  function aggregateChampionsLeagueRound(matches, roundKey) {
    if (roundKey === "finale") return safeArray(matches);

    const pairs = new Map();
    safeArray(matches).forEach(match => {
      const team1Name = openLigaDbTeamName(match?.team1);
      const team2Name = openLigaDbTeamName(match?.team2);
      const key = [bracketTeamKey(team1Name), bracketTeamKey(team2Name)].sort().join("::");
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(match);
    });

    return [...pairs.values()].map(games => {
      const sorted = games.slice().sort((a, b) => String(a?.matchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? "")));
      const first = sorted[0];
      const firstTeam1Key = bracketTeamKey(openLigaDbTeamName(first?.team1));
      let goals1 = 0;
      let goals2 = 0;
      let complete = sorted.length >= 2;

      sorted.forEach(game => {
        const score = openLigaDbFinalScore(game);
        if (!score) { complete = false; return; }
        const homeKey = bracketTeamKey(openLigaDbTeamName(game?.team1));
        if (homeKey === firstTeam1Key) {
          goals1 += score[0]; goals2 += score[1];
        } else {
          goals1 += score[1]; goals2 += score[0];
        }
      });

      const last = sorted.at(-1);
      return {
        team1: first?.team1,
        team2: first?.team2,
        matchDateTime: last?.matchDateTime ?? first?.matchDateTime ?? "",
        MatchDateTime: last?.MatchDateTime ?? first?.MatchDateTime ?? "",
        matchResults: complete ? [{
          resultTypeID: 2,
          resultName: "Gesamt",
          pointsTeam1: goals1,
          pointsTeam2: goals2
        }] : []
      };
    });
  }

  function renderChampionsLeagueKnockoutPrototype(openLigaDbMatches, root) {
    if (slug !== "champions-league") return;

    const rounds = [
      { key: "playoffs", label: "Playoffs" },
      { key: "achtelfinale", label: "Achtelfinale" },
      { key: "viertelfinale", label: "Viertelfinale" },
      { key: "halbfinale", label: "Halbfinale" },
      { key: "finale", label: "Finale" }
    ];

    const rawGroups = new Map(rounds.map(round => [round.key, []]));
    safeArray(openLigaDbMatches).forEach(match => {
      const key = championsLeagueKoRoundKey(match);
      if (key && rawGroups.has(key)) rawGroups.get(key).push(match);
    });

    const groups = new Map();
    rounds.forEach(round => groups.set(round.key, aggregateChampionsLeagueRound(rawGroups.get(round.key), round.key)));

    const total = [...groups.values()].reduce((sum, matches) => sum + matches.length, 0);
    if (!total) return;

    const section = document.createElement("section");
    section.className = "dynamic-section ko-bracket-section";

    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "Champions League · Turnierbaum";
    headingRow.append(heading);
    section.appendChild(headingRow);

    const scroll = document.createElement("div");
    scroll.className = "ko-bracket-scroll";
    const bracket = document.createElement("div");
    bracket.className = "ko-bracket ko-bracket--champions-league";
    bracket.setAttribute("aria-label", "Champions-League-Turnierbaum");
    bracket.style.gridTemplateColumns = "repeat(5, minmax(250px, 1fr))";
    bracket.style.minWidth = "1370px";

    rounds.forEach(round => {
      const column = document.createElement("section");
      column.className = `ko-round ko-round--${round.key}`;
      const title = document.createElement("h3");
      title.className = "ko-round__title";
      title.textContent = round.label;
      column.appendChild(title);

      const list = document.createElement("div");
      list.className = "ko-round__matches";
      const matches = groups.get(round.key) || [];

      if (!matches.length) {
        const open = document.createElement("div");
        open.className = "ko-match ko-match--open";
        open.textContent = "Noch nicht feststehend";
        list.appendChild(open);
      } else {
        matches.slice()
          .sort((a, b) => String(a?.matchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? "")))
          .forEach(match => list.appendChild(createBracketMatch(match)));
      }

      column.appendChild(list);
      bracket.appendChild(column);
    });

    scroll.appendChild(bracket);
    section.appendChild(scroll);
    activateBracketConnections(bracket);

    root.appendChild(section);
  }

  const EUROPA_LEAGUE_ROUNDS = [
    { key: "achtelfinale", label: "Achtelfinale", expected: 8 },
    { key: "viertelfinale", label: "Viertelfinale", expected: 4 },
    { key: "halbfinale", label: "Halbfinale", expected: 2 },
    { key: "finale", label: "Finale", expected: 1 }
  ];

  function europaLeagueRoundKey(match) {
    const label = normalizeRoundLabel(
      match?.group?.groupName ??
      match?.group?.GroupName ??
      ""
    );
    if (label.includes("achtelfinale")) return "achtelfinale";
    if (label.includes("viertelfinale")) return "viertelfinale";
    if (label.includes("halbfinale")) return "halbfinale";
    if (label.includes("endspiel") || label === "finale" || label.includes(" finale")) return "finale";
    return "";
  }

  function aggregateTwoLegRound(matches, roundKey) {
    if (roundKey === "finale") return safeArray(matches);

    const pairs = new Map();

    safeArray(matches).forEach(match => {
      const a = bracketTeamKey(openLigaDbTeamName(match?.team1));
      const b = bracketTeamKey(openLigaDbTeamName(match?.team2));
      if (!a || !b) return;
      const key = [a, b].sort().join("::");
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(match);
    });

    return [...pairs.values()].map(games => {
      const sorted = games.slice().sort((a, b) =>
        String(a?.matchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? ""))
      );

      const first = sorted[0];
      const firstHomeKey = bracketTeamKey(openLigaDbTeamName(first?.team1));
      let goals1 = 0;
      let goals2 = 0;
      let complete = sorted.length >= 2;

      sorted.forEach(game => {
        const scoreText = openLigaDbFinalResult(game);
        const match = String(scoreText || "").match(/^(\d+):(\d+)$/);
        if (!match) {
          complete = false;
          return;
        }

        const score = [Number(match[1]), Number(match[2])];
        const homeKey = bracketTeamKey(openLigaDbTeamName(game?.team1));

        if (homeKey === firstHomeKey) {
          goals1 += score[0];
          goals2 += score[1];
        } else {
          goals1 += score[1];
          goals2 += score[0];
        }
      });

      const last = sorted.at(-1);
      return {
        team1: first?.team1,
        team2: first?.team2,
        matchDateTime: last?.matchDateTime ?? first?.matchDateTime ?? "",
        matchResults: complete ? [{
          resultTypeID: 2,
          resultName: "Gesamt",
          pointsTeam1: goals1,
          pointsTeam2: goals2
        }] : []
      };
    });
  }

  function manualEuropaLeagueMatch(item, roundKey) {
    const result = String(item?.gesamt || "").match(/(\d+)\s*:\s*(\d+)/);
    return {
      team1: { teamName: item?.team1 || "Team offen" },
      team2: { teamName: item?.team2 || "Team offen" },
      matchDateTime: "",
      matchResults: result ? [{
        resultTypeID: 2,
        resultName: roundKey === "finale" ? "Endergebnis" : "Gesamt",
        pointsTeam1: Number(result[1]),
        pointsTeam2: Number(result[2])
      }] : []
    };
  }

  function europaLeagueRoundFromOpenLigaDb(matches, roundKey, expected) {
    const raw = safeArray(matches).filter(match => europaLeagueRoundKey(match) === roundKey);
    const aggregated = aggregateTwoLegRound(raw, roundKey);

    const valid = aggregated.length === expected &&
      aggregated.every(match => Boolean(openLigaDbFinalResult(match)));

    return valid ? aggregated : null;
  }

  function europaLeagueRoundFromFallback(fallbackData, roundKey, expected) {
    const items = safeArray(fallbackData?.runden?.[roundKey]);
    if (items.length !== expected) return [];
    return items.map(item => manualEuropaLeagueMatch(item, roundKey));
  }

  function europaLeagueRoundHasConflict(openLigaDbRound, fallbackRound) {
    if (!safeArray(openLigaDbRound).length || !safeArray(fallbackRound).length) return false;
    if (openLigaDbRound.length !== fallbackRound.length) return true;

    const byPair = matches => new Map(matches.map(match => {
      const a = bracketTeamKey(openLigaDbTeamName(match?.team1));
      const b = bracketTeamKey(openLigaDbTeamName(match?.team2));
      return [[a, b].sort().join("::"), openLigaDbFinalResult(match)];
    }));

    const automatic = byPair(openLigaDbRound);
    const fallback = byPair(fallbackRound);

    if (automatic.size !== fallback.size) return true;

    for (const [key, fallbackResult] of fallback) {
      if (!automatic.has(key)) return true;
      if (automatic.get(key) !== fallbackResult) return true;
    }

    return false;
  }

  function renderEuropaLeagueKnockoutPrototype(openLigaDbMatches, fallbackData, root) {
    if (slug !== "europa-league") return;

    const groups = new Map();
    const sources = new Map();

    EUROPA_LEAGUE_ROUNDS.forEach(round => {
      const automatic = europaLeagueRoundFromOpenLigaDb(openLigaDbMatches, round.key, round.expected);
      const fallback = europaLeagueRoundFromFallback(fallbackData, round.key, round.expected);

      if (automatic && fallback.length && europaLeagueRoundHasConflict(automatic, fallback)) {
        groups.set(round.key, fallback);
        sources.set(round.key, "Fallback · Datenkonflikt");
      } else if (automatic) {
        groups.set(round.key, automatic);
        sources.set(round.key, "OpenLigaDB");
      } else {
        groups.set(round.key, fallback);
        sources.set(round.key, "Fallback");
      }
    });

    const total = [...groups.values()].reduce((sum, matches) => sum + matches.length, 0);

    const section = document.createElement("section");
    section.className = "dynamic-section ko-bracket-section";

    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";

    const heading = document.createElement("h2");
    heading.textContent = "Europa League · Turnierbaum";

    headingRow.append(heading);
    section.appendChild(headingRow);

    const participationNote = document.createElement("p");
    participationNote.className = "data-note";
    participationNote.textContent = "TOSMC-Wertung ab Achtelfinale – Ligaphase und Zwischenrunde gehören nicht zu unserem Tippspiel.";
    section.appendChild(participationNote);

    if (!total) {
      const empty = document.createElement("div");
      empty.className = "schedule-empty";
      empty.textContent = "Der Turnierbaum wird nach der Achtelfinal-Auslosung automatisch eingeblendet.";
      section.appendChild(empty);
      root.appendChild(section);
      return;
    }

    const scroll = document.createElement("div");
    scroll.className = "ko-bracket-scroll";

    const bracket = document.createElement("div");
    bracket.className = "ko-bracket";
    bracket.setAttribute("aria-label", "Europa-League-Turnierbaum");

    EUROPA_LEAGUE_ROUNDS.forEach(round => {
      const column = document.createElement("section");
      column.className = `ko-round ko-round--${round.key}`;

      const title = document.createElement("h3");
      title.className = "ko-round__title";
      title.textContent = round.label;
      column.appendChild(title);

      const list = document.createElement("div");
      list.className = "ko-round__matches";

      const matches = groups.get(round.key) || [];
      if (!matches.length) {
        const open = document.createElement("div");
        open.className = "ko-match ko-match--open";
        open.textContent = "Noch nicht feststehend";
        list.appendChild(open);
      } else {
        matches.forEach(match => list.appendChild(createBracketMatch(match)));
      }

      column.appendChild(list);
      bracket.appendChild(column);
    });

    scroll.appendChild(bracket);
    section.appendChild(scroll);
    activateBracketConnections(bracket);

    root.appendChild(section);
  }

  function renderDfbKnockoutPrototype(openLigaDbMatches, root) {
    if (slug !== "dfb-pokal") return;

    const section = document.createElement("section");
    section.className = "dynamic-section ko-bracket-section";

    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "DFB-Pokal · Turnierbaum";
    headingRow.append(heading);
    section.appendChild(headingRow);

    const note = document.createElement("p");
    note.className = "data-note";
    note.textContent = "TOSMC-Wertung ab Achtelfinale – die 1. und 2. Hauptrunde gehören nicht zu unserem Tippspiel.";
    section.appendChild(note);

    const groups = new Map(DFB_BRACKET_ROUNDS.map(round => [round.key, []]));
    safeArray(openLigaDbMatches).forEach(match => {
      const key = openLigaDbRoundKey(match);
      if (key && groups.has(key)) groups.get(key).push(match);
    });

    const total = [...groups.values()].reduce((sum, matches) => sum + matches.length, 0);
    if (!total) {
      const empty = document.createElement("div");
      empty.className = "schedule-empty";
      empty.textContent = "Der Turnierbaum wird nach der Achtelfinal-Auslosung automatisch eingeblendet.";
      section.appendChild(empty);
      root.appendChild(section);
      return;
    }

    const scroll = document.createElement("div");
    scroll.className = "ko-bracket-scroll";
    const bracket = document.createElement("div");
    bracket.className = "ko-bracket";
    bracket.setAttribute("aria-label", "DFB-Pokal Turnierbaum");

    DFB_BRACKET_ROUNDS.forEach(round => {
      const column = document.createElement("section");
      column.className = `ko-round ko-round--${round.key}`;
      const title = document.createElement("h3");
      title.className = "ko-round__title";
      title.textContent = round.label;
      column.appendChild(title);

      const matches = groups.get(round.key);
      const list = document.createElement("div");
      list.className = "ko-round__matches";

      if (!matches.length) {
        const open = document.createElement("div");
        open.className = "ko-match ko-match--open";
        open.textContent = "Noch nicht feststehend";
        list.appendChild(open);
      } else {
        matches
          .slice()
          .sort((a, b) => String(a?.matchDateTime ?? "").localeCompare(String(b?.matchDateTime ?? "")))
          .forEach(match => list.appendChild(createBracketMatch(match)));
      }

      column.appendChild(list);
      bracket.appendChild(column);
    });

    scroll.appendChild(bracket);
    section.appendChild(scroll);
    activateBracketConnections(bracket);

    root.appendChild(section);
  }

  function centralGamesSection(data, teamData) {
    const games = centralGamesForPage(data);
    const teamLookup = createTeamLookup(teamData);
    if (!games.length) return null;

    return {
      typ: "spiele",
      titel: competitionDefinition(slug)?.scheduleTitle || "Spiele",
      anzeigen: true,
      spiele: games.map(match => ({
        id: match.id || "",
        datum: match.datumAnzeige || formatDate(match.datum || match.datumVon),
        datumSortierung: match.datum || match.datumVon || "9999-12-31",
        anstoss: match.anstoss || "Uhrzeit offen",
        heimTeamId: match.heimTeamId || "",
        heim: teamName(teamLookup, match.heimTeamId, match.heim || "Heimteam offen"),
        trenner: "–",
        auswaertsTeamId: match.auswaertsTeamId || "",
        auswaerts: teamName(teamLookup, match.auswaertsTeamId, match.auswaerts || "Auswärtsteam offen"),
        ergebnis: formatResult(match),
        status: match.status || "",
        runde: match.runde || "Spiele",
        spieltagNummer: Number.isFinite(match.spieltagNummer) ? match.spieltagNummer : null,
        terminBestaetigt: match.terminBestaetigt === true,
        abgeschlossen: numericScore(match.heimtore) !== null && numericScore(match.auswaertstore) !== null,
        datumIso: match.datum || match.datumVon || null,
        quelleStand: match.quelleStand || "",
        tippverteilung: match.tippverteilung && typeof match.tippverteilung === "object" ? match.tippverteilung : null
      })),
      zentral: true
    };
  }



  function gameTimestamp(match) {
    const date = match && (match.datum || match.datumVon);
    const time = match && match.anstoss;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const normalizedTime = /^\d{2}:\d{2}$/.test(time || "") ? time : "23:59";
    const value = new Date(`${date}T${normalizedTime}:00`);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  function renderCompetitionNavigator(root) {
    const section = document.createElement("nav");
    section.className = "competition-navigator dynamic-section";
    section.setAttribute("aria-label", "Wettbewerbe wechseln");
    const heading = document.createElement("h2");
    heading.textContent = "Wettbewerbs-Navigator";
    const links = document.createElement("div");
    links.className = "competition-links";
    competitionDefinitions.forEach(definition => {
      const { id, label } = definition;
      const link = document.createElement("a");
      link.href = `./${definition.page || `${id}.html`}`;
      link.textContent = label;
      link.className = `competition-link${id === slug ? " is-current" : ""}${id === "weihnachtsregatta" ? " competition-link--weihnachtsregatta" : ""}`;
      if (id === slug) link.setAttribute("aria-current", "page");
      links.appendChild(link);
    });
    section.append(heading, links);
    root.appendChild(section);
  }

  function renderCompetitionFleetDashboard(gameData, root) {
    const section = document.createElement("details");
    section.className = "dynamic-section competition-fleet";

    const summary = document.createElement("summary");
    summary.className = "fleet-summary";
    const summaryTitle = document.createElement("span");
    summaryTitle.className = "fleet-summary-title";
    summaryTitle.textContent = "Gesamtlage aller Wettbewerbe";
    const summaryHint = document.createElement("span");
    summaryHint.className = "fleet-summary-hint";
    summaryHint.textContent = "Zentraler Bereitschaftsstand";
    summary.append(summaryTitle, summaryHint);
    section.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fleet-body";
    const tableWrap = document.createElement("div");
    tableWrap.className = "table-scroll fleet-table-wrap";
    const table = document.createElement("table");
    table.className = "data-table fleet-table";
    table.innerHTML = "<thead><tr><th>Wettbewerb</th><th>Spiele</th><th>Terminiert</th><th>Beendet</th><th>Nächster Eintrag</th><th>Status</th></tr></thead>";
    const tbody = document.createElement("tbody");
    const now = new Date();

    competitionDefinitions.forEach(definition => {
      const { id, label } = definition;
      const games = centralGamesForCompetition(gameData, id);
      const confirmed = games.filter(match => match.terminBestaetigt === true).length;
      const completed = games.filter(match => numericScore(match.heimtore) !== null && numericScore(match.auswaertstore) !== null).length;
      const next = games
        .map(match => ({ match, date: gameTimestamp(match) }))
        .filter(item => numericScore(item.match.heimtore) === null && (!item.date || item.date >= now))
        .sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date - b.date;
        })[0];

      let statusText = "Nicht vorbereitet";
      let statusClass = "fleet-status-empty";
      if (games.length && confirmed === games.length) {
        statusText = completed === games.length && games.length ? "Abgeschlossen" : "Terminbereit";
        statusClass = completed === games.length && games.length ? "fleet-status-complete" : "fleet-status-ready";
      } else if (games.length && confirmed > 0) {
        statusText = "Teilweise terminiert";
        statusClass = "fleet-status-partial";
      } else if (games.length) {
        statusText = "Struktur vorbereitet";
        statusClass = "fleet-status-structure";
      }

      const row = document.createElement("tr");
      if (id === slug) row.classList.add("is-current-competition");

      const competitionCell = document.createElement("th");
      competitionCell.scope = "row";
      const competitionLink = document.createElement("a");
      competitionLink.href = `./${definition.page || `${id}.html`}`;
      competitionLink.textContent = label;
      competitionCell.appendChild(competitionLink);

      const values = [
        String(games.length),
        `${confirmed} von ${games.length}`,
        `${completed} von ${games.length}`,
        next ? formatDate(next.match.datum || next.match.datumVon) : "Noch offen"
      ];
      row.appendChild(competitionCell);
      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = `fleet-status ${statusClass}`;
      status.textContent = statusText;
      statusCell.appendChild(status);
      row.appendChild(statusCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    body.appendChild(tableWrap);
    section.appendChild(body);
    root.appendChild(section);
  }

  function renderCompetitionSituation(gameData, teamData, root, suppliedGames = null) {
    const games = Array.isArray(suppliedGames) ? suppliedGames : centralGamesForPage(gameData);
    const teams = createTeamLookup(teamData);
    const now = new Date();
    const enriched = games.map(match => ({ match, date: gameTimestamp(match) }));
    const completed = enriched
      .filter(item => numericScore(item.match.heimtore) !== null && numericScore(item.match.auswaertstore) !== null)
      .sort((a, b) => (b.date || 0) - (a.date || 0));
    const confirmedUpcoming = enriched
      .filter(item => item.date && item.date >= now && item.match.terminBestaetigt === true && numericScore(item.match.heimtore) === null)
      .sort((a, b) => a.date - b.date);
    const openUpcoming = enriched
      .filter(item => numericScore(item.match.heimtore) === null && item.match.terminBestaetigt !== true)
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date - b.date;
      });
    const rounds = [...new Set(games.map(match => match.runde).filter(Boolean))];

    const pairing = match => match
      ? `${teamName(teams, match.heimTeamId, match.heim)} – ${teamName(teams, match.auswaertsTeamId, match.auswaerts)}`
      : "Keine Partie hinterlegt";
    const dateLabel = match => match
      ? [formatDate(match.datum || match.datumVon), match.anstoss].filter(Boolean).join(" · ")
      : "Noch offen";

    const section = document.createElement("section");
    section.className = "dynamic-section competition-situation";
    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "Aktuelles Wettbewerbslagebild";
    const badge = document.createElement("span");
    badge.className = "data-status-badge";
    badge.textContent = games.length ? `${rounds.length || 1} Abschnitte erfasst` : "Noch ohne Spielplan";
    headingRow.append(heading, badge);
    section.appendChild(headingRow);

    const grid = document.createElement("div");
    grid.className = "situation-grid";
    const cards = [
      ["Letztes Ergebnis", completed[0] && pairing(completed[0].match), completed[0] ? `${dateLabel(completed[0].match)} · ${formatResult(completed[0].match)}` : "Noch kein Endergebnis vorhanden"],
      ["Nächste bestätigte Partie", confirmedUpcoming[0] && pairing(confirmedUpcoming[0].match), confirmedUpcoming[0] ? dateLabel(confirmedUpcoming[0].match) : "Noch kein bestätigter Termin"],
      ["Nächster offener Eintrag", openUpcoming[0] && pairing(openUpcoming[0].match), openUpcoming[0] ? `${openUpcoming[0].match.runde || "Runde offen"} · Termin noch nicht bestätigt` : "Keine offene Paarung vorhanden"],
      ["Wettbewerbsfortschritt", games.length ? `${completed.length} von ${games.length}` : "0 von 0", games.length ? `${Math.round((completed.length / games.length) * 100)} % der erfassten Spiele beendet` : "Fortschritt noch nicht berechenbar"]
    ];

    cards.forEach(([label, value, detail]) => {
      const card = document.createElement("article");
      card.className = "situation-card";
      const small = document.createElement("span");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value || "Noch offen";
      const note = document.createElement("small");
      note.textContent = detail;
      card.append(small, strong, note);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    const note = document.createElement("p");
    note.className = "data-note";
    note.textContent = "";
    section.appendChild(note);
    root.appendChild(section);
  }

function renderCentralValidation(root) {
    const validation = centralValidation;
    if (!validation) return;

    const section = document.createElement("section");
    section.className = `dynamic-section model-validation validation-${validation.status}`;
    const headingRow = document.createElement("div");
    headingRow.className = "section-heading-row";
    const heading = document.createElement("h2");
    heading.textContent = "Zentrale Konsistenzprüfung";
    const badge = document.createElement("span");
    badge.className = `data-status-badge${validation.status === "error" ? " data-status-error" : validation.status === "warning" ? " data-status-warning" : ""}`;
    badge.textContent = validation.status === "error" ? `${validation.counts.errors} Fehler erkannt` : validation.status === "warning" ? `${validation.counts.warnings} Hinweis${validation.counts.warnings === 1 ? "" : "e"}` : "Datenmodell konsistent";
    headingRow.append(heading, badge);
    section.appendChild(headingRow);

    const grid = document.createElement("div");
    grid.className = "validation-summary-grid";
    [
      ["Wettbewerbe", validation.counts.competitions],
      ["Spiele", validation.counts.games],
      ["Teams", validation.counts.teams],
      ["Tippspieltage", validation.counts.matchdays]
    ].forEach(([label, value]) => {
      const card = document.createElement("div");
      card.className = "validation-summary-card";
      const small = document.createElement("span"); small.textContent = label;
      const strong = document.createElement("strong"); strong.textContent = String(value);
      card.append(small, strong); grid.appendChild(card);
    });
    section.appendChild(grid);

    const findings = [...validation.errors, ...validation.warnings];
    if (findings.length) {
      const details = document.createElement("details");
      details.className = "validation-details";
      const summary = document.createElement("summary");
      summary.textContent = `${findings.length} Prüfergebnis${findings.length === 1 ? "" : "se"} anzeigen`;
      details.appendChild(summary);
      const list = document.createElement("div");
      list.className = "validation-findings";
      findings.forEach(finding => {
        const item = document.createElement("article");
        item.className = `validation-finding finding-${finding.severity}`;
        const title = document.createElement("strong"); title.textContent = finding.message;
        const text = document.createElement("p");
        const shown = safeArray(finding.details).slice(0, 6);
        text.textContent = shown.length ? shown.join(" · ") + (finding.details.length > shown.length ? ` · +${finding.details.length - shown.length} weitere` : "") : "Prüfung ohne Detailangabe.";
        item.append(title, text); list.appendChild(item);
      });
      details.appendChild(list); section.appendChild(details);
    } else {
      const note = document.createElement("p");
      note.className = "data-note";
      note.textContent = "IDs, Teamreferenzen, Datumsfelder, Ergebnisse, Tippspieltag-Zuordnungen und Wettbewerbsfilter wurden ohne strukturellen Widerspruch geprüft.";
      section.appendChild(note);
    }
    root.appendChild(section);
  }

function normalizeGoalGetterEntries(goalGetterData) {
    const rawEntries = Array.isArray(goalGetterData)
      ? goalGetterData
      : safeArray(goalGetterData?.goalGetters || goalGetterData?.goalgetters || goalGetterData?.torjaeger || goalGetterData?.entries);

    return rawEntries
      .map(entry => {
        const nested = entry?.goalGetter || entry?.player || null;
        const name = String(
          entry?.goalGetterName ||
          entry?.goalGetterNameShort ||
          nested?.goalGetterName ||
          nested?.name ||
          entry?.name ||
          ""
        ).trim();
        const tore = Number(
          entry?.goalCount ??
          entry?.goals ??
          entry?.goalGetterGoals ??
          entry?.anzahlTore ??
          entry?.tore
        );
        return { name, tore };
      })
      .filter(entry => entry.name && Number.isFinite(entry.tore))
      .sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name, "de"));
  }

  function dfbPokalInfoCards(cards, goalGetterData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "dfb-pokal") return result;

    const entries = normalizeGoalGetterEntries(goalGetterData);
    const leader = entries[0] || null;

    result[0] = leader
      ? {
          ...result[0],
          titel: "Aktueller Torjäger",
          text: "",
          leader: {
            image: "./assets/dfb-pokal-torjaegerkanone.jpg",
            name: leader.name,
            tore: leader.tore
          }
        }
      : {
          ...result[0],
          titel: "Aktueller Torjäger",
          text: "Noch keine Torschützen aus OpenLigaDB verfügbar."
        };

    if (result[1]) {
      result[1] = {
        ...result[1],
        titel: "Die letzten 5 Pokalsieger",
        text: "",
        winners: DFB_POKAL_RECENT_WINNERS
      };
    }

    if (result[2]) {
      result[2] = {
        ...result[2],
        titel: "",
        text: "",
        logo: result[2].logo || "./assets/dfb-pokal-logo.jpg",
        logoAlt: result[2].logoAlt || "DFB-Pokal Logo"
      };
    }

    return result;
  }

  function bundesligaInfoCards(cards, goalData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "bundesliga") return result;

    const entries = safeArray(goalData?.torjaeger)
      .map(entry => ({
        name: String(entry?.name || "").trim(),
        tore: Number(entry?.tore)
      }))
      .filter(entry => entry.name && Number.isInteger(entry.tore) && entry.tore > 0);

    if (!entries.length || result.length < 2) return result;

    // Zwingende Fachregel TEST27:
    // OpenLigaDB liefert die maßgebende Reihenfolge.
    // Eintrag 1 wird ohne eigene Sortierung als Platz 1 angezeigt.
    const leader = entries[0];

    result[0] = {
      ...result[0],
      titel: "Torjäger",
      leader: {
        image: "./assets/bundesliga-torjaegerkanone.jpg",
        name: leader.name,
        tore: leader.tore
      }
    };

    // TEST29: Verfolgerfeld zeigt ausschließlich OpenLigaDB-Plätze 2 bis 5
    // als eigene, vertikal zentrierte Zeilen.
    const chasers = entries.slice(1, 5);

    result[1] = {
      ...result[1],
      titel: "Verfolgerfeld",
      chasers: chasers.map((entry, index) => ({
        platz: index + 2,
        name: entry.name,
        tore: entry.tore
      }))
    };

    return result;
  }

  function championsLeagueInfoCards(cards, goalGetterData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "champions-league") return result;

    const leader = normalizeGoalGetterEntries(goalGetterData)
      .find(entry => entry.tore > 0) || null;

    if (result[0]) {
      result[0] = {
        ...result[0],
        titel: "Aktueller Torjäger",
        text: "",
        leader: leader
          ? {
              image: "./assets/champions-league-torjaegerkanone.jpg",
              name: leader.name,
              tore: leader.tore
            }
          : {
              image: "./assets/champions-league-torjaegerkanone.jpg",
              name: "Noch offen",
              goalsText: "Noch kein Spiel absolviert"
            }
      };
    }

    if (result[1]) {
      result[1] = {
        ...result[1],
        titel: "Die letzten 5\nChampions-League-Sieger",
        text: "",
        winners: CHAMPIONS_LEAGUE_RECENT_WINNERS
      };
    }

    if (result[2]) {
      result[2] = {
        ...result[2],
        titel: "",
        text: "",
        logo: result[2].logo || "./assets/champions-league-logo.png",
        logoAlt: result[2].logoAlt || "UEFA Champions League Logo"
      };
    }

    return result;
  }

  function europaLeagueInfoCards(cards, goalGetterData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "europa-league") return result;

    const leader = normalizeGoalGetterEntries(goalGetterData)
      .find(entry => entry.tore > 0) || null;

    if (result[0]) {
      result[0] = {
        ...result[0],
        titel: "Aktueller Torjäger",
        text: "",
        leader: leader
          ? { image: "./assets/europa-league-torjaegerkanone.jpg", name: leader.name, tore: leader.tore }
          : { image: "./assets/europa-league-torjaegerkanone.jpg", name: "Noch offen", goalsText: "Noch kein Spiel absolviert" }
      };
    }

    if (result[1]) {
      result[1] = { ...result[1], titel: "Letzte 5 Europa-League-Sieger", text: "", winners: EUROPA_LEAGUE_RECENT_WINNERS };
    }

    if (result[2]) {
      result[2] = { ...result[2], titel: "", text: "", logo: result[2].logo || "./assets/europa-league-logo.jpg", logoAlt: result[2].logoAlt || "UEFA Europa League Logo" };
    }

    return result;
  }

  function dynamoDresdenGoalGetters(matchData) {
    const scorers = new Map();

    safeArray(matchData).forEach(match => {
      safeArray(match?.goals).forEach(goal => {
        if (Number(goal?.scoringTeamId) !== OPENLIGADB_DYNAMO_TEAM_ID || goal?.isOwnGoal) return;
        const id = String(goal?.goalGetterID ?? goal?.goalGetterId ?? goal?.goalGetterName ?? "").trim();
        const name = String(goal?.goalGetterName || "").trim();
        if (!id || !name) return;
        const entry = scorers.get(id) || { name, tore: 0 };
        entry.tore += 1;
        scorers.set(id, entry);
      });
    });

    return [...scorers.values()]
      .sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name, "de"));
  }

  function dynamoDresdenInfoCards(cards, matchData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "dynamo-dresden") return result;

    const entries = dynamoDresdenGoalGetters(matchData);
    const topGoals = entries[0]?.tore || 0;
    const leaders = entries.filter(entry => entry.tore === topGoals);

    if (result[0]) {
      result[0] = {
        ...result[0],
        titel: "Aktueller Dynamo-Torjäger",
        text: "",
        leader: topGoals
          ? {
              image: "./assets/dynamo-torjaegerkanone.jpg",
              name: leaders.map(entry => entry.name).join(" · "),
              tore: topGoals
            }
          : {
              image: "./assets/dynamo-torjaegerkanone.jpg",
              name: "Noch offen",
              goalsText: "Noch kein Dynamo-Tor"
            }
      };
    }

    if (result[1]) {
      result[1] = {
        ...result[1],
        titel: "Dynamos größte Erfolge",
        text: "",
        achievements: [
          { value: "8×", label: "DDR-Meister" },
          { value: "7×", label: "FDGB-Pokalsieger" },
          { value: "3×", label: "DDR-Double" },
          { value: "1988/89", label: "UEFA-Cup-Halbfinale" }
        ]
      };
    }

    if (result[2]) {
      result[2] = {
        ...result[2],
        titel: "",
        text: "",
        logo: "./assets/dynamo-dresden-logo.jpg",
        logoAlt: "Logo der SG Dynamo Dresden"
      };
    }

    return result;
  }

  function relegationTeamKey(match, side) {
    const id = side === "home" ? match?.heimTeamId : match?.auswaertsTeamId;
    const name = side === "home" ? match?.heim : match?.auswaerts;
    return String(id || name || "").trim();
  }

  function relegationTeamLabel(match, side) {
    const id = side === "home" ? match?.heimTeamId : match?.auswaertsTeamId;
    const fallback = side === "home" ? match?.heim : match?.auswaerts;
    return teamName(createTeamLookup(currentTeamData), id, fallback);
  }

  function completedRelegationDecision(games, type) {
    const pair = safeArray(games)
      .filter(match => String(match?.notiz || "").toLowerCase().includes(type))
      .sort((a, b) => String(a?.datum || "").localeCompare(String(b?.datum || "")));
    if (pair.length !== 2) return null;
    if (pair.some(match => numericScore(match?.heimtore) === null || numericScore(match?.auswaertstore) === null)) return null;

    const first = pair[0];
    const firstHome = relegationTeamKey(first, "home");
    const firstAway = relegationTeamKey(first, "away");
    const labels = new Map([
      [firstHome, relegationTeamLabel(first, "home")],
      [firstAway, relegationTeamLabel(first, "away")]
    ]);
    if (!firstHome || !firstAway || /16\.|dritter|offen/i.test(`${labels.get(firstHome)} ${labels.get(firstAway)}`)) return null;

    const totals = new Map([[firstHome, 0], [firstAway, 0]]);
    let validPair = true;
    pair.forEach(match => {
      const homeKey = relegationTeamKey(match, "home");
      const awayKey = relegationTeamKey(match, "away");
      if (!totals.has(homeKey) || !totals.has(awayKey)) {
        validPair = false;
        return;
      }
      totals.set(homeKey, totals.get(homeKey) + numericScore(match.heimtore));
      totals.set(awayKey, totals.get(awayKey) + numericScore(match.auswaertstore));
      labels.set(homeKey, relegationTeamLabel(match, "home"));
      labels.set(awayKey, relegationTeamLabel(match, "away"));
    });

    if (!validPair) return null;
    if (totals.get(firstHome) === totals.get(firstAway)) return null;
    const winner = totals.get(firstHome) > totals.get(firstAway) ? firstHome : firstAway;
    const loser = winner === firstHome ? firstAway : firstHome;
    return { winner, loser, labels, firstHome, firstAway };
  }

  function liveRelegationSummary(gameData) {
    const relegationGames = allCentralGames(gameData).filter(match => match?.wettbewerb === "relegation");
    const seasons = [...new Set(relegationGames.map(match => String(match?.saison || "")).filter(Boolean))].sort().reverse();

    for (const season of seasons) {
      const games = relegationGames.filter(match => String(match?.saison || "") === season);
      const bundesliga = completedRelegationDecision(games, "bundesliga-relegation");
      const zweiteLiga = completedRelegationDecision(games, "relegation 2. bundesliga");
      if (!bundesliga || !zweiteLiga) continue;

      const bundesligaIncumbent = bundesliga.firstHome;
      const bundesligaChallenger = bundesliga.firstAway;
      const zweiteLigaChallenger = zweiteLiga.firstHome;
      const zweiteLigaIncumbent = zweiteLiga.firstAway;

      return {
        season: season.replace("/20", "/"),
        rows: [
          bundesliga.winner === bundesligaChallenger
            ? { title: "Ober-Deck", positive: `↑ ${bundesliga.labels.get(bundesliga.winner)}`, negative: `↓ ${bundesliga.labels.get(bundesliga.loser)}` }
            : { title: "Ober-Deck", positive: `${bundesliga.labels.get(bundesligaIncumbent)} bleibt`, negative: `${bundesliga.labels.get(bundesligaChallenger)} bleibt` },
          zweiteLiga.winner === zweiteLigaChallenger
            ? { title: "Unter-Deck", positive: `↑ ${zweiteLiga.labels.get(zweiteLiga.winner)}`, negative: `↓ ${zweiteLiga.labels.get(zweiteLiga.loser)}` }
            : { title: "Unter-Deck", positive: `${zweiteLiga.labels.get(zweiteLigaIncumbent)} bleibt`, negative: `${zweiteLiga.labels.get(zweiteLigaChallenger)} bleibt` }
        ]
      };
    }

    return {
      season: "2025/26",
      rows: [
        { title: "Ober-Deck", positive: "↑ Paderborn", negative: "↓ Wolfsburg" },
        { title: "Unter-Deck", positive: "Fürth bleibt", negative: "Essen bleibt" }
      ]
    };
  }

  function relegationInfoCards(cards, gameData) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "relegation") return result;
    const summary = liveRelegationSummary(gameData);

    if (result[0]) {
      result[0] = {
        ...result[0],
        titel: "",
        text: "",
        logo: "./assets/relegation-gespenst-neu.png",
        logoAlt: "Bundesliga-Relegation mit Gespenst",
        logoClass: "relegation-ghost-image"
      };
    }

    if (result[1]) {
      result[1] = {
        ...result[1],
        titel: `Hoch oder Runter · ${summary.season}`,
        text: "",
        relegationSummary: summary.rows
      };
    }

    if (result[2]) {
      result[2] = {
        ...result[2],
        titel: "",
        text: "",
        logo: "./assets/relegation-logo.webp",
        logoAlt: "Relegation Bundesliga und 2. Bundesliga",
        logoClass: "relegation-event-logo"
      };
    }

    return result;
  }

  function piratenkodexInfoCards(cards) {
    const result = safeArray(cards).map(card => ({ ...card }));
    if (slug !== "piratenkodex") return result;

    if (result[0]) {
      result[0] = {
        ...result[0],
        titel: "",
        text: "",
        featureImage: "./assets/piratenkodex-kronjuwelen.jpg",
        featureImageAlt: "Die Kronjuwelen des Piratenkodex",
        featureImageClass: "feature-image--cover"
      };
    }

    if (result[1]) {
      result[1] = {
        ...result[1],
        titel: "Saison 2025/2026",
        text: "",
        recentMeetings: [
          { home: "FC Barcelona", score: "2:0", away: "Real Madrid", season: "2025/26" },
          { home: "AC Mailand", score: "1:0", away: "Inter Mailand", season: "2025/26" },
          { home: "FC Liverpool", score: "2:3", away: "Manchester United", season: "2025/26" },
          { home: "Inter Mailand", score: "3:2", away: "Juventus Turin", season: "2025/26" },
          { home: "Paris Saint-Germain", score: "5:0", away: "Olympique Marseille", season: "2025/26" },
          { home: "Manchester City", score: "0:2", away: "Manchester United", season: "2025/26" },
          { home: "Manchester City", score: "4:0", away: "FC Liverpool", season: "2025/26" }
        ]
      };
    }

    if (result[2]) {
      result[2] = {
        ...result[2],
        titel: "",
        text: "",
        featureImage: "./assets/piratenkodex-classicos-querformat.png",
        featureImageAlt: "Old Smugglers Classico’s",
        featureImageClass: "feature-image--cover"
      };
    }

    return result;
  }

  function renderCards(cards) {
    const root = $("info-cards");
    root.innerHTML = "";
    safeArray(cards).forEach(card => {
      const article = document.createElement("article");
      article.className = "info-card";
      const h2 = document.createElement("h2");
      h2.textContent = card.titel || "";
      const p = document.createElement("p");
      if (card.featureImage) {
        article.classList.add("info-card--feature-image");
        if (card.featureImageClass === "feature-image--contain") {
          article.classList.add("info-card--feature-contain");
        }
        h2.classList.add("is-hidden");
        const box = document.createElement("div");
        box.className = "feature-image-box";
        box.style.setProperty("--feature-image", `url("${card.featureImage}")`);

        const img = document.createElement("img");
        img.className = "feature-image";
        if (card.featureImageClass) img.classList.add(card.featureImageClass);
        img.src = card.featureImage;
        img.alt = card.featureImageAlt || "Piratenkodex-Motiv";

        box.appendChild(img);
        p.appendChild(box);
      } else if (card.logo) {
        article.classList.add("info-card--competition-logo");
        if (card.logoClass) article.classList.add(card.logoClass);
        h2.classList.add("is-hidden");
        const box = document.createElement("div");
        box.className = "competition-logo-box";

        const img = document.createElement("img");
        img.className = "competition-logo-image";
        img.src = card.logo;
        img.alt = card.logoAlt || "Wettbewerbslogo";

        box.appendChild(img);
        p.appendChild(box);
      } else if (card.leader) {
        if (slug === "dfb-pokal") article.classList.add("info-card--dfb-goalgetter");
        if (slug === "bundesliga") article.classList.add("info-card--bundesliga-goalgetter");
        if (slug === "champions-league") article.classList.add("info-card--champions-league-goalgetter");
        if (slug === "europa-league") article.classList.add("info-card--europa-league-goalgetter");
        if (slug === "dynamo-dresden") article.classList.add("info-card--dynamo-goalgetter");

        const box = document.createElement("div");
        box.className = "goalgetter-leader";

        const img = document.createElement("img");
        img.className = "goalgetter-cannon";
        img.src = card.leader.image;
        img.alt = "Torjäger-Kanone";

        const name = document.createElement("div");
        name.className = "goalgetter-leader-name";
        name.textContent = card.leader.name || "";

        const goals = document.createElement("div");
        goals.className = "goalgetter-leader-goals";
        if (card.leader.goalsText) {
          goals.textContent = card.leader.goalsText;
        } else {
          const count = Number(card.leader.tore);
          goals.textContent = `${count} ${count === 1 ? "Tor" : "Tore"}`;
        }

        box.append(img, name, goals);
        p.appendChild(box);
      } else if (Array.isArray(card.chasers)) {
        article.classList.add("info-card--goalgetter-chasers");
        const box = document.createElement("div");
        box.className = "goalgetter-chasers";

        if (!card.chasers.length) {
          const empty = document.createElement("div");
          empty.className = "goalgetter-chasers-empty";
          empty.textContent = "Noch keine Verfolger.";
          box.appendChild(empty);
        } else {
          card.chasers.forEach(entry => {
            const row = document.createElement("div");
            row.className = "goalgetter-chaser-row";

            const place = document.createElement("span");
            place.className = "goalgetter-chaser-place";
            place.textContent = `${entry.platz}.`;

            const name = document.createElement("span");
            name.className = "goalgetter-chaser-name";
            name.textContent = entry.name || "";

            const goals = document.createElement("span");
            goals.className = "goalgetter-chaser-goals";
            const count = Number(entry.tore);
            goals.textContent = `${count} ${count === 1 ? "Tor" : "Tore"}`;

            row.append(place, name, goals);
            box.appendChild(row);
          });
        }

        p.appendChild(box);
      } else if (Array.isArray(card.recentMeetings)) {
        article.classList.add("info-card--recent-meetings");
        const box = document.createElement("div");
        box.className = "recent-meetings";
        card.recentMeetings.forEach(entry => {
          const row = document.createElement("div");
          row.className = "recent-meeting-row";
          const home = document.createElement("span");
          home.className = "recent-meeting-home";
          home.textContent = entry.home || "";
          const score = document.createElement("strong");
          score.className = "recent-meeting-score";
          score.textContent = entry.score || "–";
          const away = document.createElement("span");
          away.className = "recent-meeting-away";
          away.textContent = entry.away || "";
          row.append(home, score, away);
          box.appendChild(row);
        });
        p.appendChild(box);
      } else if (Array.isArray(card.relegationSummary)) {
        article.classList.add("info-card--relegation-summary");
        const box = document.createElement("div");
        box.className = "relegation-summary";

        card.relegationSummary.forEach(entry => {
          const block = document.createElement("section");
          block.className = "relegation-duel";
          const title = document.createElement("strong");
          title.className = "relegation-duel-title";
          title.textContent = entry.title || "";
          const outcome = document.createElement("div");
          outcome.className = "relegation-outcome";
          const promoted = document.createElement("span");
          promoted.className = "relegation-up";
          promoted.textContent = entry.positive || "";
          const relegated = document.createElement("span");
          relegated.className = "relegation-down";
          relegated.textContent = entry.negative || "";
          outcome.append(promoted, relegated);
          block.append(title, outcome);
          box.appendChild(block);
        });

        p.appendChild(box);
      } else if (Array.isArray(card.achievements)) {
        article.classList.add("info-card--achievements");
        const box = document.createElement("div");
        box.className = "club-achievements";

        card.achievements.forEach(entry => {
          const row = document.createElement("div");
          row.className = "club-achievement-row";
          const value = document.createElement("strong");
          value.className = "club-achievement-value";
          value.textContent = entry.value || "";
          const label = document.createElement("span");
          label.className = "club-achievement-label";
          label.textContent = entry.label || "";
          row.append(value, label);
          box.appendChild(row);
        });

        p.appendChild(box);
      } else if (Array.isArray(card.winners)) {
        article.classList.add("info-card--recent-winners");
        const box = document.createElement("div");
        box.className = "recent-winners";

        if (!card.winners.length) {
          const empty = document.createElement("div");
          empty.className = "recent-winners-empty";
          empty.textContent = "Noch keine Pokalsieger hinterlegt.";
          box.appendChild(empty);
        } else {
          card.winners.forEach(entry => {
            const row = document.createElement("div");
            row.className = "recent-winner-row";

            const identity = createTeamIdentity(entry.teamId || "", entry.name || "");
            identity.classList.add("recent-winner-team");

            const season = document.createElement("span");
            season.className = "recent-winner-season";
            season.textContent = entry.saison || "";

            row.append(identity, season);
            box.appendChild(row);
          });
        }

        p.appendChild(box);
      } else {
        p.textContent = card.text || "";
      }
      article.append(h2, p);
      root.appendChild(article);
    });
    root.classList.toggle("is-hidden", root.children.length === 0);
  }

  function renderTable(section, root) {
    const table = document.createElement("table");
    table.className = "data-table";
    const headers = safeArray(section.spalten);
    const rows = safeArray(section.zeilen);
    if (headers.length) {
      const thead = document.createElement("thead");
      const tr = document.createElement("tr");
      headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
    }
    const tbody = document.createElement("tbody");
    rows.forEach(row => {
      const tr = document.createElement("tr");
      safeArray(row).forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell ?? "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Tabellen dürfen auf kleinen Displays nicht die gesamte Seite verbreitern.
    // Stattdessen bleiben sie innerhalb ihres Bereichs horizontal scrollbar.
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll generic-table-scroll";
    wrapper.appendChild(table);
    root.appendChild(wrapper);
  }

  function matchState(match) {
    if (match && match.abgeschlossen) return "completed";
    if (match && match.terminBestaetigt) return "scheduled";
    return "open";
  }

  const COCO_WINDOW_DAYS = 7;

  function cocoEligible(match) {
    if (!match || !match.id || match.abgeschlossen || match.terminBestaetigt !== true) return false;
    const date = match.datumIso || match.datumSortierung;
    const time = match.anstoss;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time || "")) return false;
    const kickoff = new Date(`${date}T${time}:00`);
    if (Number.isNaN(kickoff.getTime())) return false;
    const now = new Date();
    const limit = new Date(now.getTime() + COCO_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return kickoff > now && kickoff <= limit;
  }

  function cocoMatchAnchor(match) {
    return `spiel-${String(match?.id || "").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function createCocoMatchLink(match) {
    if (!cocoEligible(match)) return null;
    const link = document.createElement("a");
    const anchor = cocoMatchAnchor(match);
    const returnTarget = `${window.location.pathname}${window.location.search}#${anchor}`;
    const params = new URLSearchParams({
      game: match.id,
      competition: slug,
      round: match.runde || "Spiele",
      home: match.heimTeamId || "",
      away: match.auswaertsTeamId || "",
      return: returnTarget
    });
    link.className = "coco-match-link";
    link.href = `./coco/?${params.toString()}`;
    link.textContent = "Coco fragen";
    link.setAttribute("aria-label", `Coco zu ${match.heim} gegen ${match.auswaerts} fragen`);
    return link;
  }


  function createTipDistribution(match) {
    const distribution = match && match.tippverteilung;
    const submitted = Number(distribution && distribution.abgegeben);
    const tendencies = distribution && distribution.tendenzen;
    if (!distribution || !tendencies || !Number.isFinite(submitted) || submitted <= 0) return null;

    const valueFor = key => {
      const entry = tendencies[key] || {};
      const count = Number(entry.anzahl);
      const percent = Number(entry.prozent);
      return {
        count: Number.isFinite(count) && count >= 0 ? count : 0,
        percent: Number.isFinite(percent) && percent >= 0 ? Math.min(percent, 100) : 0
      };
    };

    const wrap = document.createElement("div");
    wrap.className = "tip-distribution";

    const title = document.createElement("strong");
    title.className = "tip-distribution__title";
    title.textContent = "Tippverteilung:";
    wrap.appendChild(title);

    const center = document.createElement("div");
    center.className = "tip-distribution__center";

    [
      ["1", "Heimsieg", "home"],
      ["X", "Remis", "draw"],
      ["2", "Auswärtssieg", "away"]
    ].forEach(([key, label, modifier]) => {
      const value = valueFor(key);

      const item = document.createElement("span");
      item.className = `tip-distribution__item tip-distribution__item--${modifier}`;
      item.title = `${key} · ${label}: ${value.count} Tipp${value.count === 1 ? "" : "s"}`;

      const keyNode = document.createElement("b");
      keyNode.className = "tip-distribution__key";
      keyNode.textContent = key;

      const track = document.createElement("span");
      track.className = "tip-distribution__track";

      const fill = document.createElement("span");
      fill.className = "tip-distribution__fill";
      fill.style.width = `${value.percent}%`;
      track.appendChild(fill);

      const amount = document.createElement("span");
      amount.className = "tip-distribution__amount";
      amount.textContent = `${String(value.percent).replace(".", ",")} %`;

      item.append(keyNode, track, amount);
      center.appendChild(item);
    });

    wrap.appendChild(center);

    const meta = document.createElement("span");
    meta.className = "tip-distribution__meta";

    const missing = Number(distribution.nichtAbgegeben);
    const total = submitted + (Number.isFinite(missing) && missing > 0 ? missing : 0);
    meta.textContent = total > submitted ? `${submitted} von ${total} Tipps` : `${submitted} Tipps`;

    if (Number.isFinite(missing) && missing > 0) {
      meta.title = `${missing} Nichtabgabe${missing === 1 ? "" : "n"}`;
    }

    wrap.appendChild(meta);
    return wrap;
  }

  function createMatchList(matches, options = {}) {
    const list = document.createElement("div");
    list.className = "match-list";
    safeArray(matches).forEach(match => {
      const state = matchState(match);
      const row = document.createElement("div");
      row.className = `match-row match-state-${state}`;
      row.dataset.matchState = state;
      if (match.id) row.id = cocoMatchAnchor(match);

      const meta = document.createElement("span");
      meta.className = "match-meta";
      meta.textContent = [match.datum, match.anstoss].filter(Boolean).join(" · ");

      const pairing = document.createElement("strong");
      pairing.className = "match-pairing";
      const teamIdentityFactory = typeof options.teamIdentityFactory === "function"
        ? options.teamIdentityFactory
        : (teamId, teamName, modifier) => createTeamIdentity(teamId, teamName, modifier);

      pairing.append(
        teamIdentityFactory(match.heimTeamId, match.heim, "team-identity--home", match, "home"),
        Object.assign(document.createElement("span"), { className: "match-pairing__separator", textContent: match.trenner || "–" }),
        teamIdentityFactory(match.auswaertsTeamId, match.auswaerts, "team-identity--away", match, "away")
      );

      const resultWrap = document.createElement("span");
      resultWrap.className = "match-result-wrap";
      const stateBadge = document.createElement("span");
      stateBadge.className = `match-state-badge match-state-badge-${state}`;
      stateBadge.textContent = state === "completed" ? "Beendet" : state === "scheduled" ? "Terminiert" : "Termin offen";
      const result = document.createElement("span");
      result.className = "result";
      result.textContent = match.ergebnis || "";
      resultWrap.append(stateBadge, result);
      const cocoLink = createCocoMatchLink(match);
      if (cocoLink) resultWrap.appendChild(cocoLink);

      row.append(meta, pairing, resultWrap);
      const tipDistribution = createTipDistribution(match);
      if (tipDistribution) row.appendChild(tipDistribution);
      list.appendChild(row);
    });
    if (options.className) list.classList.add(options.className);
    return list;
  }

  function renderScheduleFilter(section, root) {
    const matches = safeArray(section.spiele);
    const counts = matches.reduce((result, match) => {
      result[matchState(match)] += 1;
      return result;
    }, { completed: 0, scheduled: 0, open: 0 });

    const toolbar = document.createElement("div");
    toolbar.className = "schedule-toolbar";
    toolbar.setAttribute("aria-label", "Spielplan filtern");

    const controls = [
      ["all", "Alle", matches.length],
      ["scheduled", "Terminiert", counts.scheduled],
      ["open", "Termin offen", counts.open],
      ["completed", "Beendet", counts.completed]
    ];

    const list = createMatchList(matches, { className: "central-match-list" });
    controls.forEach(([filter, label, count], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `schedule-filter${index === 0 ? " is-active" : ""}`;
      button.dataset.filter = filter;
      button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      button.textContent = `${label} (${count})`;
      button.addEventListener("click", () => {
        toolbar.querySelectorAll(".schedule-filter").forEach(item => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        let visible = 0;
        list.querySelectorAll(".match-row").forEach(row => {
          const show = filter === "all" || row.dataset.matchState === filter;
          row.hidden = !show;
          if (show) visible += 1;
        });
        empty.hidden = visible !== 0;
      });
      toolbar.appendChild(button);
    });

    const empty = document.createElement("p");
    empty.className = "schedule-empty";
    empty.textContent = "Für diesen Status sind derzeit keine Spiele hinterlegt.";
    empty.hidden = true;

    root.append(toolbar, list, empty);
  }

  function renderBundesligaMatchdays(section, root) {
    const groups = new Map();
    safeArray(section.spiele).forEach(match => {
      const key = match.runde || "Spiele";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(match);
    });

    const orderedGroups = [...groups.entries()].sort((a, b) => {
      const aNumber = a[1][0] && a[1][0].spieltagNummer;
      const bNumber = b[1][0] && b[1][0].spieltagNummer;
      if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
      return a[0].localeCompare(b[0], "de");
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    let openIndex = orderedGroups.findIndex(([, matches]) =>
      matches.some(match => (match.datumSortierung || "9999-12-31") >= todayIso)
    );
    if (openIndex < 0) openIndex = Math.max(orderedGroups.length - 1, 0);

    const accordion = document.createElement("div");
    accordion.className = "matchday-accordion";

    orderedGroups.forEach(([round, matches], index) => {
      const details = document.createElement("details");
      details.className = "matchday-group";
      details.open = index === openIndex;

      const summary = document.createElement("summary");
      summary.className = "matchday-summary";

      const title = document.createElement("span");
      title.textContent = round;
      const count = document.createElement("span");
      count.className = "matchday-count";
      count.textContent = `${matches.length} Spiele`;

      summary.append(title, count);
      details.append(summary, createMatchList(matches));
      accordion.appendChild(details);
    });

    root.appendChild(accordion);
  }

  function renderMatches(section, root) {
    if (section.zentral && slug !== "bundesliga") {
      renderScheduleFilter(section, root);
      return;
    }
    if (slug === "bundesliga") {
      renderBundesligaMatchdays(section, root);
      return;
    }
    root.appendChild(createMatchList(section.spiele));
  }


  function competitionNavigation(buttons, position = "mid") {
    const configured = safeArray(buttons).filter(button =>
      button && button.anzeigen !== false && button.text && button.link
    );
    const kicktippButton = configured.find(button => /kicktipp/i.test(button.text) || /kicktipp\.html/i.test(button.link));
    const backButton = configured.find(button =>
      button.link.includes("#wettbewerbe") || /zurück.*wettbewerb/i.test(button.text)
    );

    const navigation = document.createElement("nav");
    navigation.className = `actions competition-nav-actions competition-nav-actions--${position}`;
    navigation.setAttribute("aria-label", position === "mid" ? "Seitennavigation" : "Seitennavigation am Seitenende");

    if (kicktippButton) {
      const kicktipp = document.createElement("a");
      kicktipp.className = "btn competition-nav-btn competition-nav-btn--kicktipp";
      kicktipp.href = kicktippButton.link;
      kicktipp.textContent = "Kicktipp Live Action";
      if (kicktippButton.neuesFenster) {
        kicktipp.target = "_blank";
        kicktipp.rel = "noopener noreferrer";
      }
      navigation.appendChild(kicktipp);
    }

    if (backButton) {
      const back = document.createElement("a");
      back.className = "btn competition-nav-btn competition-nav-btn--back";
      back.href = backButton.link;
      back.textContent = "Zurück zu den Wettbewerben";
      navigation.appendChild(back);
    }

    const top = document.createElement("a");
    top.className = "btn competition-nav-btn competition-nav-btn--top";
    top.href = "#seitenanfang";
    top.textContent = "Nach oben";
    top.addEventListener("click", event => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    });
    navigation.appendChild(top);

    return navigation;
  }

  function renderMidNavigation(buttons, root) {
    root.appendChild(competitionNavigation(buttons, "mid"));
  }

  function insertGenericMidNavigation(buttons, root) {
    const navigation = competitionNavigation(buttons, "mid");
    const children = [...root.children].filter(child => !child.classList.contains("competition-nav-actions"));
    if (!children.length) {
      root.appendChild(navigation);
      return;
    }
    const target = children[Math.max(0, Math.floor(children.length / 2) - 1)];
    target.insertAdjacentElement("afterend", navigation);
  }

  function renderConfiguredSection(section, root) {
    if (!section || section.anzeigen === false) return;
    const article = document.createElement("section");
    article.className = "dynamic-section";
    if (section.titel) {
      const h2 = document.createElement("h2");
      h2.textContent = section.titel;
      article.appendChild(h2);
    }
    switch (section.typ) {
      case "liste": {
        const ul = document.createElement("ul");
        safeArray(section.eintraege).forEach(item => {
          const li = document.createElement("li"); li.textContent = item; ul.appendChild(li);
        });
        article.appendChild(ul); break;
      }
      case "tabelle":
      case "rangliste": renderTable(section, article); break;
      case "spiele": renderMatches(section, article); break;
      default: {
        const p = document.createElement("p"); p.textContent = section.text || ""; article.appendChild(p);
      }
    }
    root.appendChild(article);
  }

  function renderStandardGamesSlot(sections, buttons, root, options = {}) {
    const central = safeArray(sections).find(section => section && section.typ === "spiele" && section.zentral === true);
    if (options.championsLeague) {
      const rendered = renderChampionsLeaguePhaseOverview(options.openLigaDbMatches, options.gameData, root);
      if (!rendered) renderPlaceholderSection(options.title || "Spiele", options.emptyText || "Noch keine belastbaren Spiele verfügbar.", root);
      return rendered;
    }
    if (central) {
      renderConfiguredSection(central, root);
      return false;
    }
    renderPlaceholderSection(options.title || competitionDefinition(slug)?.scheduleTitle || "Spiele", options.emptyText || "Noch keine von euch getippte Runde veröffentlicht.", root);
    return false;
  }

  function renderSections(sections, buttons, gameData, teamData, tableData, openLigaDbDfbMatches, openLigaDbClTable, openLigaDbElMatches, europaLeagueFallback, dynamoMatchData) {
    const root = $("dynamic-sections");
    root.innerHTML = "";
    document.body.classList.add(`page-${slug}`);
    renderCompetitionNavigator(root);

    const coreSections = safeArray(sections);
    const editorial = coreSections.filter(section => !(section && section.typ === "spiele" && section.zentral === true));
    let championsLeaguePhaseOverviewRendered = false;

    if (slug === "champions-league") renderCompetitionSituation(gameData, teamData, root, championsLeagueSituationGames(openLigaDbClTable));
    else renderCompetitionSituation(gameData, teamData, root);

    if (slug === "bundesliga") renderBundesligaStatistics(gameData, teamData, root);

    // Dichte Navigation nur dort, wo mehrere umfangreiche Kernblöcke tatsächlich
    // dauerhaft Inhalt tragen. Kurze/noch vorbereitete Wettbewerbe bleiben bewusst
    // kompakt: eine Zwischenleiste nach den Spielen + die Abschlussleiste.
    if (slug === "bundesliga" || slug === "dynamo-dresden") renderMidNavigation(buttons, root);

    if (slug === "bundesliga") {
      renderStandardGamesSlot(coreSections, buttons, root, { title: "Spiele der Bundesliga" });
      renderMidNavigation(buttons, root);
      renderBundesligaTable(gameData, teamData, tableData, root);
      renderMidNavigation(buttons, root);
      renderBundesligaFormTable(gameData, teamData, root);
    } else if (slug === "champions-league") {
      const knockoutPreview = document.createElement("div");
      renderChampionsLeagueKnockoutPrototype(openLigaDbClTable, knockoutPreview);
      const knockoutAvailable = knockoutPreview.children.length > 0;

      if (!knockoutAvailable) {
        renderChampionsLeagueStatistics(openLigaDbClTable, root);
        renderMidNavigation(buttons, root);
      }

      championsLeaguePhaseOverviewRendered = renderStandardGamesSlot(coreSections, buttons, root, { championsLeague: true, openLigaDbMatches: openLigaDbClTable, gameData, title: "Spiele der Champions League" });
      renderMidNavigation(buttons, root);
      renderChampionsLeagueTable(openLigaDbClTable, root);
      renderMidNavigation(buttons, root);
      renderChampionsLeagueFormTable(openLigaDbClTable, root);

      if (knockoutAvailable) {
        renderMidNavigation(buttons, root);
        while (knockoutPreview.firstChild) root.appendChild(knockoutPreview.firstChild);
        renderMidNavigation(buttons, root);
        renderChampionsLeagueStatistics(openLigaDbClTable, root);
      }
    } else if (slug === "europa-league") {
      renderStandardGamesSlot(coreSections, buttons, root, { title: "Spiele der Europa League", emptyText: "Noch keine von euch getippte Runde veröffentlicht. Die TOSMC-Wertung startet ab dem Achtelfinale." });
      const elDataStart = root.children.length;
      const elTableVisible = renderEuropaLeagueTable(openLigaDbElMatches, root);
      const elFormVisible = renderEuropaLeagueFormTable(openLigaDbElMatches, root);
      const beforeOptional = root.children.length;
      renderEuropaLeagueKnockoutPrototype(openLigaDbElMatches, europaLeagueFallback, root);
      const elKnockoutVisible = root.children.length > beforeOptional;
      // Navigation nur vor tatsächlich sichtbaren Datenblöcken. Keine Leisten vor
      // leeren Vorbereitungs-Platzhaltern.
      if (elTableVisible || elFormVisible || elKnockoutVisible) {
        root.children[elDataStart].insertAdjacentElement("beforebegin", competitionNavigation(buttons, "mid"));
      }
      if (elKnockoutVisible && (elTableVisible || elFormVisible)) {
        root.children[beforeOptional].insertAdjacentElement("beforebegin", competitionNavigation(buttons, "mid"));
      }
    } else if (slug === "dfb-pokal") {
      renderStandardGamesSlot(coreSections, buttons, root, { title: "Spiele des DFB-Pokals", emptyText: "Noch keine von euch getippte Runde veröffentlicht. Die TOSMC-Wertung startet ab dem Achtelfinale." });
      const knockoutPreview = document.createElement("div");
      renderDfbKnockoutPrototype(openLigaDbDfbMatches, knockoutPreview);
      // DFB-Pokal ist ein K.-o.-Wettbewerb: bewusst keine Liga-/Formtabelle und
      // keine zusätzliche Zwischen-Navigation vor dem Turnierbaum.
      while (knockoutPreview.firstChild) root.appendChild(knockoutPreview.firstChild);
    } else if (slug === "dynamo-dresden") {
      renderStandardGamesSlot(coreSections, buttons, root, { title: "Spiele von Dynamo Dresden" });
      renderMidNavigation(buttons, root);
      renderDynamoTableExcerpt(dynamoMatchData, root);
      renderDynamoDutyForm(dynamoMatchData, openLigaDbDfbMatches, root);
    } else if (["piratenkodex", "weihnachtsregatta", "relegation"].includes(slug)) {
      // Diese Wettbewerbe besitzen bewusst keine Liga-/Formtabellen. Keine
      // Platzhalter und keine künstliche Zwischen-Navigation erzeugen.
      renderStandardGamesSlot(coreSections, buttons, root, { title: competitionDefinition(slug)?.scheduleTitle || "Spiele" });
    } else {
      renderStandardGamesSlot(coreSections, buttons, root, { title: competitionDefinition(slug)?.scheduleTitle || "Spiele" });
    }

    editorial.forEach(section => {
      if (championsLeaguePhaseOverviewRendered && section.typ === "spiele" && section.zentral === true) return;
      renderConfiguredSection(section, root);
    });
    root.classList.toggle("is-hidden", root.children.length === 0);
  }

  function renderButtons(buttons) {
    const root = $("actions");
    root.innerHTML = "";
    root.appendChild(competitionNavigation(buttons, "bottom"));
    root.classList.toggle("is-hidden", false);
  }

  async function fetchGoalGettersWithFallback(competitionId, liveUrl) {
    if (window.TOSMCGoalGetterFallback?.load) {
      const result = await window.TOSMCGoalGetterFallback.load({ competitionId, liveUrl });
      if (result.stale) {
        console.warn(`Torjäger ${competitionId}: letzter bestätigter Stand wird verwendet (${result.source}).`);
      }
      return result.data;
    }
    return fetchJson(liveUrl, false);
  }

  async function fetchJson(url, required = true) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (required) throw error;
      console.warn(`Optionale Datei konnte nicht geladen werden: ${url}`, error);
      return { spiele: [] };
    }
  }

  async function loadFooterVersion() {
    const target = $("legal-version");
    if (!target) return;
    try {
      const versionUrl = window.OSCDataRegistry
        ? await window.OSCDataRegistry.url("version")
        : "./VERSION.txt";
      const response = await fetch(versionUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`VERSION.txt: HTTP ${response.status}`);
      const version = (await response.text()).trim();
      target.textContent = version ? `Version ${version}` : "Version nicht verfügbar";
    } catch (error) {
      console.warn("Versionsstand konnte nicht geladen werden.", error);
      target.textContent = "Version nicht verfügbar";
    }
  }

  async function load() {
    try {
      if (!document.body.id) document.body.id = "seitenanfang";
      if (window.OSCDataRegistry) {
        [gameDataUrl, teamDataUrl, bundesligaTableUrl, bundesligaGoalGetterUrl, competitionConfigUrl] = await Promise.all([
          window.OSCDataRegistry.url("spiele"),
          window.OSCDataRegistry.url("teams"),
          window.OSCDataRegistry.url("bundesligaTabelle"),
          window.OSCDataRegistry.url("bundesligaTorjaeger"),
          window.OSCDataRegistry.url("wettbewerbe")
        ]);
      }
      const [data, centralGameData, teamData, bundesligaTableData, bundesligaGoalGetterData, dfbGoalGetterData, championsLeagueGoalGetterData, europaLeagueGoalGetterData, dynamoMatchData, competitionConfig, openLigaDbDfbMatches, openLigaDbClTable, openLigaDbElMatches, europaLeagueFallback] = await Promise.all([
        fetchJson(jsonUrl, true),
        fetchJson(gameDataUrl, false),
        fetchJson(teamDataUrl, false),
        slug === "bundesliga" ? fetchJson(bundesligaTableUrl, false) : Promise.resolve({ teams: [] }),
        slug === "bundesliga" ? fetchJson(bundesligaGoalGetterUrl, false) : Promise.resolve({ torjaeger: [] }),
        slug === "dfb-pokal" ? fetchGoalGettersWithFallback("dfb-pokal", OPENLIGADB_DFB_GOALGETTERS_URL) : Promise.resolve([]),
        slug === "champions-league" ? fetchGoalGettersWithFallback("champions-league", OPENLIGADB_CL_GOALGETTERS_URL) : Promise.resolve([]),
        slug === "europa-league" ? fetchGoalGettersWithFallback("europa-league", OPENLIGADB_EL_GOALGETTERS_URL) : Promise.resolve([]),
        slug === "dynamo-dresden" ? fetchJson(OPENLIGADB_DYNAMO_MATCHES_URL, false) : Promise.resolve([]),
        fetchJson(competitionConfigUrl, false),
        (slug === "dfb-pokal" || slug === "dynamo-dresden")
          ? fetchJson(OPENLIGADB_DFB_PROTOTYPE_URL, false)
          : Promise.resolve([]),
        slug === "champions-league"
          ? fetchJson(OPENLIGADB_CL_MATCHES_PROTOTYPE_URL, false)
          : Promise.resolve([]),
        slug === "europa-league"
          ? fetchJson(OPENLIGADB_EL_MATCHES_PROTOTYPE_URL, false)
          : Promise.resolve([]),
        slug === "europa-league"
          ? fetchJson(EUROPA_LEAGUE_FALLBACK_PROTOTYPE_URL, false)
          : Promise.resolve({ runden: {} })
      ]);

      currentTeamData = teamData && typeof teamData === "object" ? teamData : { teams: [] };
      teamResolutionIndex = null;
      if (window.OSCTeamBadge) await window.OSCTeamBadge.load();

      const sharedModel = window.OSCDataModel ? await window.OSCDataModel.load() : null;
      centralModel = sharedModel || null;
      centralValidation = sharedModel && sharedModel.validation ? sharedModel.validation : null;
      const configuredCompetitions = safeArray((sharedModel && sharedModel.competitions) || (competitionConfig && competitionConfig.wettbewerbe))
        .filter(item => item && item.id && item.label && item.filter && item.filter.type && item.filter.value);
      competitionDefinitions = configuredCompetitions.length ? configuredCompetitions : DEFAULT_COMPETITIONS;

      document.title = `${data.titel || "Wettbewerb"} | The Old Smugglers Club`;
      text("eyebrow", data.bereich);
      text("status-plaque", data.statusSchild);
      text("title", data.titel);
      text("description", data.beschreibung);

      const preparedCards = slug === "bundesliga"
        ? bundesligaInfoCards(data.karten, bundesligaGoalGetterData)
        : slug === "dfb-pokal"
          ? dfbPokalInfoCards(data.karten, dfbGoalGetterData)
          : slug === "champions-league"
            ? championsLeagueInfoCards(data.karten, championsLeagueGoalGetterData)
            : slug === "europa-league"
              ? europaLeagueInfoCards(data.karten, europaLeagueGoalGetterData)
            : slug === "dynamo-dresden"
              ? dynamoDresdenInfoCards(data.karten, dynamoMatchData)
              : slug === "relegation"
                ? relegationInfoCards(data.karten, centralGameData)
                : slug === "piratenkodex"
                  ? piratenkodexInfoCards(data.karten)
                  : data.karten;
      renderCards(preparedCards);

      const statusBox = $("status-box");
      const showStatus = Boolean(data.aktuellerStandTitel || data.aktuellerStand);
      statusBox.classList.toggle("is-hidden", !showStatus);
      text("status-title", data.aktuellerStandTitel);
      text("status-text", data.aktuellerStand);

      const centralSection = centralGamesSection(centralGameData, teamData);
      const editorialSections = safeArray(data.bereiche);
      const sections = centralSection
        ? (slug === "dynamo-dresden"
            ? [...editorialSections, centralSection]
            : [centralSection, ...editorialSections])
        : editorialSections;

      renderSections(sections, data.buttons, centralGameData, teamData, bundesligaTableData, openLigaDbDfbMatches, openLigaDbClTable, openLigaDbElMatches, europaLeagueFallback, dynamoMatchData);
      renderButtons(data.buttons);
      text("footer-text", data.fusszeile);
      await loadFooterVersion();
    } catch (error) {
      console.error(error);
      const box = $("error");
      box.textContent = "Die Wettbewerbsdaten sind momentan nicht verfügbar. Bitte versuche es später erneut.";
      box.classList.remove("is-hidden");
      await loadFooterVersion();
    }
  }

  load();
})();
