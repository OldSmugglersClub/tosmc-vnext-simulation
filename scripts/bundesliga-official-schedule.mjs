import fs from "node:fs";

const CONFIG = {
  bundesliga: { slug: "bundesliga", label: "Bundesliga" },
  "2-bundesliga": { slug: "2bundesliga", label: "2. Bundesliga" }
};

function pageUrl(slug, matchday) {
  // Offizielle Spieltagseite. "rahmenspielplan" liefert sowohl bereits
  // zeitgenau terminierte als auch noch offene Spieltage.
  return `https://www.bundesliga.com/de/${slug}/spieltag/rahmenspielplan/${matchday}`;
}

function normalizeHtml(html) {
  return String(html || "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyOfficialMatchdayPage(html, matchday) {
  const text = normalizeHtml(html);
  if (!text || text.length < 250) {
    throw new Error(`Offizielle Spieltagseite ${matchday} ist leer/unplausibel.`);
  }

  const seasonOk = /2026\s*[-/]\s*2027|2026\/27/i.test(text);
  const matchdayOk = new RegExp(`(?:Spieltag|Matchday)\\s*${matchday}(?:\\D|$)`, "i").test(text);
  if (!seasonOk || !matchdayOk) {
    throw new Error(`Offizielle Spieltagseite ${matchday} konnte nicht sicher validiert werden.`);
  }

  // Dieses Signal wird auf der offiziellen Bundesliga-Seite bei noch nicht
  // zeitgenau angesetzten Spieltagen ausgegeben.
  if (/Dieser Spieltag ist noch nicht fix terminiert\.?/i.test(text)) return false;

  // Fail-safe: "nicht offen" allein genügt nicht. Ein bestätigter Spieltag
  // muss konkrete Uhrzeiten enthalten oder bereits ausgetragen sein.
  const timeCount = (text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) || []).length;
  const completedCount = (text.match(/\bwhistle\b/gi) || []).length;
  if (timeCount === 0 && completedCount === 0) {
    throw new Error(`Offizielle Spieltagseite ${matchday}: weder konkrete Uhrzeit noch abgeschlossene Spiele erkannt. Keine Änderung.`);
  }

  return true;
}

async function loadPage(slug, matchday, fixtureDir) {
  if (fixtureDir) {
    const path = `${fixtureDir}/${slug}-${matchday}.html`;
    if (!fs.existsSync(path)) throw new Error(`Offizielles Testfixture fehlt: ${path}`);
    return {
      html: fs.readFileSync(path, "utf8"),
      status: 200,
      contentType: "text/html; fixture",
      url: path
    };
  }

  let response;
  try {
    response = await fetch(pageUrl(slug, matchday), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; TheOldSmugglersClub/1.0; +https://the-old-smugglers-club.de)"
      },
      redirect: "follow"
    });
  } catch (error) {
    throw new Error(`Offizielle Bundesliga-Terminquelle nicht erreichbar: ${error.message}. Keine Änderung.`);
  }

  if (!response.ok) {
    throw new Error(`Offizielle Bundesliga-Terminquelle HTTP ${response.status}. Keine Änderung.`);
  }
  return {
    html: await response.text(),
    status: response.status,
    contentType: response.headers.get("content-type") || "unbekannt",
    url: response.url || pageUrl(slug, matchday)
  };
}

function wait(ms) {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

async function loadAndClassifyMatchday(slug, matchday, options) {
  const fixtureDir = options.fixtureDir || "";
  const fetchAttempts = fixtureDir ? 1 : Math.max(1, Number(options.fetchAttempts || 3));
  const retryDelayMs = Math.max(0, Number(options.retryDelayMs ?? 1500));
  let lastError;

  for (let attempt = 1; attempt <= fetchAttempts; attempt++) {
    try {
      const page = await loadPage(slug, matchday, fixtureDir);
      try {
        return classifyOfficialMatchdayPage(page.html, matchday);
      } catch (error) {
        throw new Error(
          `${error.message} [HTTP ${page.status}; Content-Type ${page.contentType}; ` +
          `${page.html.length} Zeichen; Quelle ${page.url}]`
        );
      }
    } catch (error) {
      lastError = error;
      if (attempt >= fetchAttempts) break;
      console.warn(
        `Offizielle Spieltagseite ${matchday} unplausibel/nicht erreichbar ` +
        `(Versuch ${attempt}/${fetchAttempts}): ${error.message}`
      );
      await wait(retryDelayMs);
    }
  }

  throw new Error(
    `Offizielle Spieltagseite ${matchday} nach ${fetchAttempts} Versuch(en) nicht sicher auswertbar: ` +
    `${lastError?.message || "unbekannter Fehler"}`
  );
}

export async function loadOfficialConfirmedMatchdays(competition, options = {}) {
  const cfg = CONFIG[competition];
  if (!cfg) throw new Error(`Unbekannter Wettbewerb für offizielle Terminprüfung: ${competition}`);

  const fixtureDir = options.fixtureDir || process.env.OSC_OFFICIAL_FIXTURE_DIR || "";
  const startMatchday = Math.max(1, Number(options.startMatchday || 1));
  const confirmed = new Set();

  // DFL terminiert fortlaufende Blöcke. Bis zum ersten offiziell als offen
  // gekennzeichneten Spieltag prüfen; spätere Rahmentermine werden nicht freigegeben.
  for (let st = startMatchday; st <= 34; st++) {
    const isConfirmed = await loadAndClassifyMatchday(cfg.slug, st, {
      ...options,
      fixtureDir
    });
    if (!isConfirmed) break;
    confirmed.add(st);
  }

  if (!confirmed.size) {
    throw new Error(`${cfg.label}: kein offiziell fix terminierter Spieltag erkannt. Keine Änderung.`);
  }
  return confirmed;
}
