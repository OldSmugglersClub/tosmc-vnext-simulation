(() => {
  "use strict";

  const SNAPSHOT_URL = "./torjaeger-snapshots.json";
  const STORAGE_PREFIX = "tosmc:torjaeger:last-good:";

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function entries(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    return safeArray(payload.goalGetters || payload.goalgetters || payload.torjaeger || payload.entries);
  }

  function hasConfirmedGoals(payload) {
    return entries(payload).some(entry => {
      const goals = Number(entry?.goalCount ?? entry?.goals ?? entry?.goalGetterGoals ?? entry?.anzahlTore ?? entry?.tore);
      const name = String(entry?.goalGetterName || entry?.goalGetterNameShort || entry?.goalGetter?.goalGetterName || entry?.player?.name || entry?.name || "").trim();
      return Boolean(name) && Number.isFinite(goals) && goals > 0;
    });
  }

  function readStored(competitionId, storage) {
    try {
      const raw = storage?.getItem(`${STORAGE_PREFIX}${competitionId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && hasConfirmedGoals(parsed.data) ? parsed : null;
    } catch (error) {
      console.warn("Torjäger-Browser-Snapshot konnte nicht gelesen werden.", error);
      return null;
    }
  }

  function storeLive(competitionId, data, storage) {
    if (!hasConfirmedGoals(data)) return;
    try {
      storage?.setItem(`${STORAGE_PREFIX}${competitionId}`, JSON.stringify({
        competitionId,
        capturedAt: new Date().toISOString(),
        source: "OpenLigaDB",
        data
      }));
    } catch (error) {
      console.warn("Torjäger-Browser-Snapshot konnte nicht gespeichert werden.", error);
    }
  }

  async function fetchJson(fetchImpl, url) {
    const response = await fetchImpl(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  async function readStaticSnapshot(competitionId, fetchImpl, snapshotUrl) {
    try {
      const snapshot = await fetchJson(fetchImpl, snapshotUrl);
      const item = snapshot?.competitions?.[competitionId];
      return item && hasConfirmedGoals(item.data) ? item : null;
    } catch (error) {
      console.warn(`Torjäger-Release-Snapshot nicht verfügbar: ${snapshotUrl}`, error);
      return null;
    }
  }

  async function load({ competitionId, liveUrl, fetchImpl = window.fetch.bind(window), storage = window.localStorage, snapshotUrl = SNAPSHOT_URL }) {
    let liveData = null;
    let liveError = null;

    try {
      liveData = await fetchJson(fetchImpl, liveUrl);
      if (hasConfirmedGoals(liveData)) {
        storeLive(competitionId, liveData, storage);
        return { data: liveData, source: "live", stale: false };
      }
    } catch (error) {
      liveError = error;
      console.warn(`OpenLigaDB-Torjäger nicht verfügbar: ${liveUrl}`, error);
    }

    const browserSnapshot = readStored(competitionId, storage);
    if (browserSnapshot) {
      return { data: browserSnapshot.data, source: "browser-snapshot", stale: true, capturedAt: browserSnapshot.capturedAt || "", liveError };
    }

    const staticSnapshot = await readStaticSnapshot(competitionId, fetchImpl, snapshotUrl);
    if (staticSnapshot) {
      return { data: staticSnapshot.data, source: "release-snapshot", stale: true, capturedAt: staticSnapshot.capturedAt || "", liveError };
    }

    return { data: liveData ?? [], source: liveError ? "unavailable" : "live-empty", stale: Boolean(liveError), liveError };
  }

  window.TOSMCGoalGetterFallback = Object.freeze({ load, entries, hasConfirmedGoals });
})();
