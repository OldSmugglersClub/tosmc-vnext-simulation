(() => {
  "use strict";
  if (window.OSCDataRegistry) return;

  const fallback = {
    schemaVersion: 2,
    datenVersion: 4,
    websiteVersion: "3.1",
    saison: "2026/2027",
    quellen: {
      wettbewerbe: "wettbewerbe.json", spiele: "spieldaten.json", teams: "teams.json",
      tippspieltage: "tippspieltage.json", highscore: "highscore.json", hallOfFame: "hall-of-fame.json",
      clubdaten: "clubdaten.json", saisonuebersicht: "saison-2026-2027.json", spieltag: "spieltag.json",
      bundesligaTabelle: "bundesliga-tabelle.json", bundesligaTorjaeger: "bundesliga-torjaeger.json", version: "VERSION.txt", systemstatus: "systemstatus.json"
    }
  };

  let cache;
  let lastError = null;

  function normalize(data) {
    return { ...fallback, ...(data || {}), quellen: { ...fallback.quellen, ...((data && data.quellen) || {}) } };
  }

  async function load() {
    if (cache) return cache;
    cache = fetch("./datenregister.json", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error(`datenregister.json: HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        lastError = null;
        return normalize(data);
      })
      .catch(error => {
        lastError = error;
        console.warn("Zentrales Datenregister nicht verfügbar; Rückfallpfade werden verwendet.", error);
        return normalize(fallback);
      });
    return cache;
  }

  async function url(key) {
    const registry = await load();
    const value = registry.quellen[key] || fallback.quellen[key] || key;
    return value.startsWith("./") ? value : `./${value}`;
  }

  async function status() {
    const registry = await load();
    return {
      ok: !lastError,
      websiteVersion: registry.websiteVersion || fallback.websiteVersion,
      schemaVersion: registry.schemaVersion,
      datenVersion: registry.datenVersion,
      sourceCount: Object.keys(registry.quellen || {}).length,
      error: lastError ? String(lastError.message || lastError) : ""
    };
  }

  function reset() {
    cache = undefined;
    lastError = null;
  }

  window.OSCDataRegistry = { load, url, status, reset, fallback };
})();
