(() => {
  'use strict';

  const DATA_PATH = '../spieldaten.json';
  const TEAMS_PATH = '../teams.json';
  const ORIGINAL_LOGOS_PATH = '../assets/team-logos/original-team-logos.json';
  const COMPETITIONS_PATH = '../wettbewerbe.json';
  const OPENLIGADB_SOURCES = Object.freeze([
    { id: 'dfb-pokal', label: 'DFB-Pokal', url: 'https://api.openligadb.de/getmatchdata/dfb/2026' },
    { id: 'champions-league', label: 'Champions League', url: 'https://api.openligadb.de/getmatchdata/ucl/2026' },
    { id: 'europa-league', label: 'Europa League', url: 'https://api.openligadb.de/getmatchdata/uel/2026' }
  ]);
  const BERLIN_TZ = 'Europe/Berlin';

  const els = {};
  let games = [];
  let teams = new Map();
  let originalLogos = new Map();
  let competitionChoices = [];
  let selectedGame = null;
  let deepLinkedGameId = '';
  let revealing = false;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindEls();
    bindEvents();
    try {
      const [schedule, teamData, originalLogoData, competitionData, ...remoteSchedules] = await Promise.all([
        fetchJson(DATA_PATH),
        fetchJson(TEAMS_PATH),
        fetchJson(ORIGINAL_LOGOS_PATH),
        fetchJson(COMPETITIONS_PATH),
        ...OPENLIGADB_SOURCES.map(source => fetchJsonOptional(source.url))
      ]);
      const season = (schedule.saisons || []).find(s => s.id === schedule.aktiveSaison) || (schedule.saisons || [])[0];
      games = (season?.spiele || []).filter(hasRealTeams);
      teams = new Map((teamData.teams || []).map(team => [team.id, team]));
      originalLogos = new Map(Object.entries(originalLogoData.teams || {}));
      competitionChoices = buildCompetitionChoices(competitionData);
      appendRemoteSchedules(remoteSchedules);
      populateCompetitions();
      configureReturnLink();
      applyDeepLinkedGame();
      renderStats();
      if (!selectedGame) setStatus('Wähle einen Wettbewerb und eine Partie.');
    } catch (error) {
      console.error(error);
      setStatus('Coco findet den Spielplan nicht. Testmodul über einen lokalen Webserver öffnen.', true);
      els.query.disabled = true;
    }
  }

  function bindEls() {
    for (const id of ['competition','round','match','homeLogo','awayLogo','homeName','awayName','matchMeta','query','status','tipPanel','tipScore','tipLabel','cocoStage','hmmm','stats','resultState','whyCoco','whyText']) {
      els[id] = document.getElementById(id);
    }
  }

  function bindEvents() {
    els.competition.addEventListener('change', () => { populateRounds(); clearSelection(); });
    els.round.addEventListener('change', () => { populateMatches(); clearSelection(); });
    els.match.addEventListener('change', selectMatch);
    els.whyCoco.addEventListener('click', () => {
      if (!selectedGame) return;
      const pred = CocoOracle.predict(selectedGame.id);
      els.whyText.textContent = cocoReason(pred);
      els.whyText.hidden = false;
    });
    els.query.addEventListener('click', reveal);
  }

  async function fetchJson(path) {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function fetchJsonOptional(path) {
    try {
      return await fetchJson(path);
    } catch (error) {
      console.warn(`Coco: optionale Spielplanquelle nicht erreichbar: ${path}`, error);
      return [];
    }
  }

  function buildCompetitionChoices(data) {
    return (data?.wettbewerbe || []).map(entry => ({
      value: entry.id === 'dynamo-dresden' ? '2-bundesliga' : entry.id,
      label: entry.label || entry.id
    }));
  }

  function normalize(value) {
    return String(value || '')
      .toLocaleLowerCase('de')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function openLigaDbRound(match, competitionId) {
    const group = match?.group || {};
    const raw = String(group.groupName ?? group.GroupName ?? '').trim();
    const clean = normalize(raw);
    const order = Number(group.groupOrderID ?? group.groupOrderId ?? group.GroupOrderID ?? group.GroupOrderId);
    if ((competitionId === 'champions-league' || competitionId === 'europa-league') && Number.isInteger(order) && order >= 1 && order <= 8) {
      return `${order}. Spieltag`;
    }
    if (clean.includes('achtelfinale')) return 'Achtelfinale';
    if (clean.includes('viertelfinale')) return 'Viertelfinale';
    if (clean.includes('halbfinale')) return 'Halbfinale';
    if (clean.includes('finale') || clean.includes('endspiel')) return 'Finale';
    return raw || 'Ohne Runde';
  }

  function localTeamIdByName(name) {
    const key = normalize(name);
    for (const [id, team] of teams) {
      const names = [team.id, team.name, team.kurzname, ...(team.apiAliase || []), ...(team.kicktippAliase || [])];
      if (names.some(candidate => normalize(candidate) === key)) return id;
    }
    return '';
  }

  function registerOpenLigaDbTeam(rawTeam) {
    const name = String(rawTeam?.teamName ?? rawTeam?.TeamName ?? '').trim();
    const localId = localTeamIdByName(name);
    if (localId) return localId;
    const externalId = String(rawTeam?.teamId ?? rawTeam?.teamID ?? rawTeam?.TeamId ?? normalize(name).replace(/ /g, '-'));
    const id = `openligadb-${externalId}`;
    if (!teams.has(id)) {
      teams.set(id, {
        id,
        name: name || 'Unbekannt',
        kurzname: String(rawTeam?.shortName ?? rawTeam?.ShortName ?? name).trim(),
        logo: String(rawTeam?.teamIconUrl ?? rawTeam?.TeamIconUrl ?? '')
      });
    }
    return id;
  }

  function convertOpenLigaDbMatch(match, source) {
    const rawDate = String(match?.matchDateTime ?? match?.MatchDateTime ?? match?.matchDateTimeUTC ?? '');
    const date = rawDate.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '';
    const time = rawDate.match(/T(\d{2}:\d{2})/)?.[1] || '';
    const matchId = match?.matchID ?? match?.matchId ?? match?.MatchID;
    const home = match?.team1 ?? match?.Team1;
    const away = match?.team2 ?? match?.Team2;
    if (!matchId || !date || !time || !home || !away) return null;
    return {
      id: `openligadb-${source.id}-${matchId}`,
      wettbewerb: source.id,
      wettbewerbAnzeige: source.label,
      runde: openLigaDbRound(match, source.id),
      datum: date,
      anstoss: time,
      terminBestaetigt: true,
      heimTeamId: registerOpenLigaDbTeam(home),
      auswaertsTeamId: registerOpenLigaDbTeam(away),
      heimtore: null,
      auswaertstore: null,
      ergebnisNach90MinutenBestaetigt: false,
      status: 'terminiert'
    };
  }

  function gameSignature(game) {
    return [game.wettbewerb, game.datum, game.anstoss, game.heimTeamId, game.auswaertsTeamId].join('|');
  }

  function appendRemoteSchedules(remoteSchedules) {
    const signatures = new Set(games.map(gameSignature));
    OPENLIGADB_SOURCES.forEach((source, index) => {
      const rows = Array.isArray(remoteSchedules[index]) ? remoteSchedules[index] : [];
      rows.map(match => convertOpenLigaDbMatch(match, source)).filter(Boolean).forEach(game => {
        const signature = gameSignature(game);
        if (!signatures.has(signature)) {
          games.push(game);
          signatures.add(signature);
        }
      });
    });
  }

  function hasRealTeams(game) {
    return Boolean(game.id && game.heimTeamId && game.auswaertsTeamId && game.terminBestaetigt && game.datum && game.anstoss);
  }

  function gameTime(game) {
    return zonedTimeToDate(game.datum, game.anstoss, BERLIN_TZ);
  }

  function zonedTimeToDate(dateStr, timeStr, timeZone) {
    const [y,m,d] = dateStr.split('-').map(Number);
    const [hh,mm] = timeStr.split(':').map(Number);
    let guess = Date.UTC(y, m - 1, d, hh, mm, 0);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    });
    for (let i = 0; i < 3; i += 1) {
      const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
      const represented = Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day), Number(parts.hour), Number(parts.minute));
      const desired = Date.UTC(y,m-1,d,hh,mm);
      const delta = desired - represented;
      if (!delta) break;
      guess += delta;
    }
    return new Date(guess);
  }

  function gameState(game) {
    const now = new Date();
    const kickoff = gameTime(game);
    if (game.ergebnisNach90MinutenBestaetigt === true && Number.isFinite(Number(game.heimtore)) && Number.isFinite(Number(game.auswaertstore))) return 'finished';
    if (now >= kickoff) return 'started';
    return 'upcoming';
  }

  const ORACLE_WINDOW_DAYS = 7;

  function oracleGames() {
    const now = new Date();
    const limit = new Date(now.getTime() + ORACLE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return games.filter(game => {
      if (deepLinkedGameId && game.id === deepLinkedGameId) return true;
      const kickoff = gameTime(game);
      return kickoff > now && kickoff <= limit;
    });
  }

  function configureReturnLink() {
    const link = document.querySelector('.coco-back');
    if (!link) return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get('return');
    const isSafeInternalTarget = typeof target === 'string'
      && target.startsWith('/')
      && !target.startsWith('//')
      && !target.includes('://');

    if (isSafeInternalTarget) {
      link.href = target;
      link.textContent = 'Zurück zum Spiel';
      link.setAttribute('aria-label', 'Zurück zur zuvor ausgewählten Partie');
    } else {
      link.href = '../';
      link.textContent = 'Zurück an Deck';
      link.setAttribute('aria-label', 'Zurück zur Startseite');
    }
  }

  function applyDeepLinkedGame() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    if (!gameId) return;
    const competition = params.get('competition');
    const round = params.get('round');
    const home = params.get('home');
    const away = params.get('away');
    const game = games.find(item => item.id === gameId) || games.find(item =>
      (!competition || item.wettbewerb === competition) &&
      (!round || (item.runde || 'Ohne Runde') === round) &&
      (!home || item.heimTeamId === home) &&
      (!away || item.auswaertsTeamId === away)
    );
    if (!game) {
      setStatus('Diese Partie kann Coco derzeit nicht befragen.', true);
      return;
    }
    deepLinkedGameId = game.id;
    populateCompetitions();
    els.competition.value = game.wettbewerb;
    populateRounds();
    els.round.value = game.runde || 'Ohne Runde';
    populateMatches();
    els.match.value = game.id;
    selectMatch();
  }

  function populateCompetitions() {
    const configured = competitionChoices.map(entry => [entry.value, entry.label]);
    const discovered = oracleGames().map(game => [game.wettbewerb, game.wettbewerbAnzeige || game.wettbewerb]);
    const all = new Map(configured);
    discovered.forEach(([value, label]) => {
      if (!all.has(value)) all.set(value, label);
    });
    const comps = [...all.entries()];
    fillSelect(els.competition, comps, 'Wettbewerb wählen');
    populateRounds();
  }

  function populateRounds() {
    const comp = els.competition.value;
    const rounds = [...new Set(oracleGames().filter(g => g.wettbewerb === comp).map(g => g.runde || 'Ohne Runde'))]
      .map(r => [r,r]);
    fillSelect(els.round, rounds, 'Runde / Spieltag wählen');
    populateMatches();
  }

  function populateMatches() {
    const comp = els.competition.value;
    const round = els.round.value;
    const list = oracleGames().filter(g => g.wettbewerb === comp && (g.runde || 'Ohne Runde') === round)
      .sort((a,b) => gameTime(a) - gameTime(b));
    const opts = list.map(g => [g.id, `${teamName(g.heimTeamId)} – ${teamName(g.auswaertsTeamId)} · ${formatKickoff(g)}`]);
    fillSelect(els.match, opts, 'Partie wählen');
  }

  function fillSelect(select, entries, placeholder) {
    select.innerHTML = '';
    const p = document.createElement('option'); p.value = ''; p.textContent = placeholder; select.appendChild(p);
    entries.forEach(([value,label]) => { const o=document.createElement('option'); o.value=value; o.textContent=label; select.appendChild(o); });
    select.disabled = entries.length === 0;
  }

  function teamName(id) {
    const t = teams.get(id);
    return t?.kurzname || t?.name || id || 'Unbekannt';
  }

  function teamLogo(id) {
    const original = originalLogos.get(id)?.path;
    if (original) return `../${original.replace(/^\.\//,'')}`;
    const fallback = teams.get(id)?.logo;
    if (/^https?:\/\//i.test(fallback || '')) return fallback;
    return fallback ? `../${fallback.replace(/^\.\//,'')}` : '';
  }

  function formatKickoff(game) {
    return new Intl.DateTimeFormat('de-DE', { timeZone: BERLIN_TZ, day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(gameTime(game));
  }

  function selectMatch() {
    selectedGame = games.find(g => g.id === els.match.value) || null;
    resetReveal();
    renderStats();
    if (!selectedGame) return clearSelection();

    els.homeName.textContent = teamName(selectedGame.heimTeamId);
    els.awayName.textContent = teamName(selectedGame.auswaertsTeamId);
    setLogo(els.homeLogo, selectedGame.heimTeamId);
    setLogo(els.awayLogo, selectedGame.auswaertsTeamId);
    els.matchMeta.textContent = `${selectedGame.wettbewerbAnzeige || selectedGame.wettbewerb} · ${selectedGame.runde || ''} · ${formatKickoff(selectedGame)}`;

    const state = gameState(selectedGame);
    if (state === 'upcoming') {
      els.query.disabled = false;
      els.query.textContent = 'Coco befragen';
      setStatus('Coco hat seinen Tipp bereits im Gefieder. Noch ist er geheim.');
    } else {
      els.query.disabled = true;
      showPrediction(false);
      setStatus(state === 'finished' ? 'Die Partie ist beendet – Cocos Tipp wird ausgewertet.' : 'Anpfiff war bereits – Cocos vorher feststehender Tipp ist sichtbar.');
    }
  }

  function setLogo(img, id) {
    const src = teamLogo(id);
    img.src = src;
    img.alt = teamName(id);
    img.hidden = !src;
  }

  function clearSelection() {
    selectedGame = null;
    els.homeName.textContent = 'Heimteam'; els.awayName.textContent = 'Auswärtsteam';
    els.homeLogo.hidden = true; els.awayLogo.hidden = true;
    els.matchMeta.textContent = 'Noch keine Partie ausgewählt';
    els.query.disabled = true;
    resetReveal();
  }

  function resetReveal() {
    els.tipPanel.hidden = true;
    els.whyCoco.hidden = true;
    els.whyText.hidden = true;
    els.whyText.textContent = '';
    els.resultState.textContent = '';
    els.hmmm.classList.remove('show');
    els.cocoStage.classList.remove('thinking');
    revealing = false;
  }

  async function reveal() {
    if (!selectedGame || revealing || gameState(selectedGame) !== 'upcoming') return;
    revealing = true;
    els.query.disabled = true;
    els.tipPanel.hidden = true;
    setStatus('Coco lauscht dem Wind …');
    playCocoMacawCall();
    els.cocoStage.classList.add('thinking');
    await wait(700);
    els.hmmm.classList.add('show');
    setStatus('Hmmm … Coco denkt nach.');
    await wait(1500);
    els.hmmm.classList.remove('show');
    await wait(450);
    els.cocoStage.classList.remove('thinking');
    showPrediction(true);
    els.query.disabled = false;
    els.query.textContent = 'Cocos Tipp erneut enthüllen';
    setStatus('Coco hat gesprochen. Derselbe Tipp gilt für diese Partie immer.');
    revealing = false;
  }

  function showPrediction(animate) {
    const pred = CocoOracle.predict(selectedGame.id);
    els.tipScore.textContent = pred.score;
    els.tipLabel.textContent = pred.pirate ? 'Piratenmut!' : tendencyText(pred.tendency);
    els.tipPanel.hidden = false;
    els.whyCoco.hidden = false;
    els.whyText.hidden = true;
    els.whyText.textContent = '';
    els.tipPanel.classList.toggle('reveal', Boolean(animate));
    window.setTimeout(() => els.tipPanel.classList.remove('reveal'), 900);

    if (gameState(selectedGame) === 'finished') {
      const ev = CocoOracle.evaluate(pred, selectedGame.heimtore, selectedGame.auswaertstore);
      els.resultState.textContent = `${ev.label} · Ergebnis 90 Min.: ${selectedGame.heimtore}:${selectedGame.auswaertstore}`;
      els.resultState.dataset.state = ev.exact ? 'exact' : ev.tendencyHit ? 'tendency' : 'miss';
    } else {
      els.resultState.textContent = 'Tipp nach 90 Minuten inkl. Nachspielzeit';
      els.resultState.dataset.state = '';
    }
  }

  function cocoReason(pred) {
    const home = Number(pred?.home);
    const away = Number(pred?.away);
    const diff = Math.abs(home - away);
    const total = home + away;
    const seed = Math.abs((home * 31) + (away * 17) + (pred?.tendency === 'H' ? 3 : pred?.tendency === 'A' ? 7 : 11));
    const pick = (items) => items[seed % items.length];

    if (pred?.tendency === 'X') {
      if (total === 0) return pick([
        'Coco riecht Flaute auf beiden Decks. Viel Gerangel, aber keiner bringt die Kugel über die Planke.',
        'Die Kristallkugel bleibt torlos. Coco sieht zwei Crews, die sich gegenseitig den Wind aus den Segeln nehmen.'
      ]);
      if (total <= 2) return pick([
        'Coco wittert eine enge Fahrt. Beide Crews halten dagegen – am Ende teilt man die Beute.',
        'Keiner bekommt für Coco entscheidend Wind in die Segel. Das riecht nach geteilter Beute.'
      ]);
      return pick([
        'Coco erwartet Kanonendonner auf beiden Seiten, aber keinen Sieger. Die Beute wird geteilt.',
        'Hier fliegen für Coco die Fetzen, doch keine Crew setzt sich ab. Am Ende bleibt Gleichstand.'
      ]);
    }

    const homeWin = pred?.tendency === 'H';
    const crew = homeWin ? 'Heimcrew' : 'Auswärtscrew';

    if (diff >= 3) return pick([
      `Coco hisst die Flagge klar für die ${crew}. In seiner Kugel ist das kein Duell auf Messers Schneide, sondern ein deutlicher Beutezug.`,
      `Die Kristallkugel zeigt Coco klare See für die ${crew}. Er erwartet, dass sie dem Gegner deutlich den Wind aus den Segeln nimmt.`
    ]);
    if (diff === 2) return pick([
      `Coco sieht die ${crew} auf sicherem Kurs. Der Gegner leistet Widerstand, doch die Beute geht für ihn mit Abstand an diese Crew.`,
      `Der Wind bläst für Coco spürbar zugunsten der ${crew}. Kein Spaziergang – aber ein Kurs mit ordentlichem Vorsprung.`
    ]);
    return pick([
      `Coco riecht einen knappen Beutezug der ${crew}. Gegenwehr gibt es reichlich, doch am Ende bleibt sie eine Kanonenkugel voraus.`,
      `Das wird für Coco eine Fahrt auf Messers Schneide. Trotzdem setzt er seinen letzten Rum auf die ${crew}.`
    ]);
  }

  function tendencyText(t) { return t === 'H' ? 'Coco setzt auf Heim' : t === 'A' ? 'Coco setzt auf Auswärts' : 'Coco riecht ein Remis'; }
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function playCocoMacawCall() {
    try {
      const audio = new Audio('coco-macaw-call.wav');
      audio.volume = 0.9;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  function renderStats() {
    const finished = games.filter(g => gameState(g) === 'finished').sort((a,b) => gameTime(a)-gameTime(b));
    let tendency = 0, exact = 0;
    const sequence = [];
    for (const g of finished) {
      const ev = CocoOracle.evaluate(CocoOracle.predict(g.id), g.heimtore, g.auswaertstore);
      if (ev.tendencyHit) tendency += 1;
      if (ev.exact) exact += 1;
      sequence.push(ev.tendencyHit);
    }
    let streak = 0, streakType = '–';
    if (sequence.length) {
      const last = sequence[sequence.length - 1]; streakType = last ? 'Treffer' : 'Fehler';
      for (let i=sequence.length-1; i>=0 && sequence[i]===last; i-=1) streak += 1;
    }
    let bestStreak = 0, runningStreak = 0;
    for (const hit of sequence) {
      runningStreak = hit ? runningStreak + 1 : 0;
      bestStreak = Math.max(bestStreak, runningStreak);
    }

    const recent = sequence.slice(-5);
    const recentHits = recent.filter(Boolean).length;
    const formText = recent.length ? `${recentHits}/${recent.length}` : '–';

    const pct = (n,d) => d ? `${(n/d*100).toFixed(1).replace('.',',')} %` : '–';

    let teamStats = '';
    if (selectedGame) {
      teamStats = [selectedGame.heimTeamId, selectedGame.auswaertsTeamId].map(teamId => {
        const teamGames = finished.filter(g => g.heimTeamId === teamId || g.auswaertsTeamId === teamId);
        const hits = teamGames.filter(g =>
          CocoOracle.evaluate(CocoOracle.predict(g.id), g.heimtore, g.auswaertstore).tendencyHit
        ).length;
        return `<div><strong>${teamGames.length ? `${hits}/${teamGames.length}` : 'keine'}</strong><span>${teamName(teamId)}</span></div>`;
      }).join('');
    }

    els.stats.innerHTML = `
      <div><strong>${finished.length}</strong><span>ausgewertet</span></div>
      <div><strong>${tendency}</strong><span>Tendenz · ${pct(tendency, finished.length)}</span></div>
      <div><strong>${exact}</strong><span>Volltreffer · ${pct(exact, finished.length)}</span></div>
      <div><strong>${streak || '–'}</strong><span>Serie · ${streakType}</span></div>
      <div><strong>${bestStreak || '–'}</strong><span>Beste Treffer-Serie</span></div>
      <div><strong>${formText}</strong><span>Form · letzte ${recent.length}</span></div>
      ${teamStats}`;
  }

  function setStatus(text, error=false) {
    els.status.textContent = text;
    els.status.classList.toggle('error', error);
  }
})();
