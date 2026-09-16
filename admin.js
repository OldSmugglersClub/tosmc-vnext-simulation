(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let latestReport = null;
  let latestBackup = null;
  let restoreResult = null;
  const LOG_KEY = "osc-maintenance-log-v1";

  async function timedFetch(name, file, type = "json") {
    const started = performance.now();
    try {
      const response = await fetch(`./${file}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = type === "text" ? await response.text() : await response.json();
      return { name, file, ok: true, milliseconds: Math.round(performance.now() - started), payload, detail: type === "json" ? describe(payload) : payload.trim() };
    } catch (error) {
      return { name, file, ok: false, milliseconds: Math.round(performance.now() - started), payload: null, detail: String(error.message || error) };
    }
  }

  function describe(data) {
    if (Array.isArray(data)) return `${data.length} Einträge`;
    if (!data || typeof data !== "object") return "Geladen";
    const candidates = ["spiele", "teams", "wettbewerbe", "tippspieltage", "spieler", "quellen", "module"];
    for (const key of candidates) {
      const value = data[key];
      if (Array.isArray(value)) return `${value.length} ${key}`;
      if (value && typeof value === "object") return `${Object.keys(value).length} ${key}`;
    }
    return `${Object.keys(data).length} Hauptfelder`;
  }

  function card(label, value) {
    const article = document.createElement("article"); article.className = "admin-card";
    const span = document.createElement("span"); span.textContent = label;
    const strong = document.createElement("strong"); strong.textContent = value ?? "–";
    article.append(span, strong); return article;
  }

  function renderValidation(validation) {
    const counts = validation?.counts || {};
    const errors = validation?.errors || [];
    const warnings = validation?.warnings || [];
    const status = validation?.status || "error";
    $("validationBadge").textContent = status === "ok" ? "Ohne Befund" : status === "warning" ? `${warnings.length} Warnungen` : `${errors.length} Fehler`;
    $("validationBadge").className = `admin-badge ${status === "ok" ? "ok" : status === "warning" ? "warn" : "error"}`;
    $("validationGrid").replaceChildren(
      card("Wettbewerbe", counts.competitions || 0), card("Spiele", counts.games || 0),
      card("Teams", counts.teams || 0), card("Tippspieltage", counts.matchdays || 0),
      card("Fehler", counts.errors || 0), card("Warnungen", counts.warnings || 0)
    );
    const items = [...errors, ...warnings];
    const notices = items.length ? items.map(item => ({ type: item.severity === "error" ? "error" : "", text: `${item.message}${item.details?.length ? `: ${item.details.join(", ")}` : ""}` })) : [{ type: "ok", text: "Alle zentralen Referenzen, IDs, Datumsangaben und Ergebnisfelder sind konsistent." }];
    $("validationDetails").replaceChildren(...notices.map(item => { const p = document.createElement("p"); p.className = `admin-notice ${item.type}`.trim(); p.textContent = item.text; return p; }));
  }

  function render(report) {
    const failed = report.sources.filter(source => !source.ok);
    $("overallBadge").textContent = failed.length ? `${failed.length} Fehler` : "Alle Quellen erreichbar";
    $("overallBadge").className = `admin-badge ${failed.length ? "error" : "ok"}`;
    $("sourceCount").textContent = `${report.sources.length} Quellen`;
    $("sourceCount").className = `admin-badge ${failed.length ? "warn" : "ok"}`;
    $("summaryGrid").replaceChildren(
      card("Website-Version", report.websiteVersion), card("Datenversion", String(report.dataVersion)),
      card("Erreichbare Quellen", `${report.sources.length - failed.length}/${report.sources.length}`), card("Gesamtladezeit", `${report.durationMs} ms`)
    );
    $("sourceRows").replaceChildren(...report.sources.map(source => {
      const row = document.createElement("tr");
      [source.name, source.file].forEach((value, index) => { const cell = document.createElement("td"); if (index) { const code = document.createElement("code"); code.textContent = value; cell.appendChild(code); } else cell.textContent = value; row.appendChild(cell); });
      const status = document.createElement("td"); status.className = `admin-status ${source.ok ? "ok" : "error"}`; status.textContent = source.ok ? "OK" : "Fehler"; row.appendChild(status);
      const detail = document.createElement("td"); detail.textContent = source.detail; row.appendChild(detail);
      const speed = document.createElement("td"); speed.textContent = `${source.milliseconds} ms`; row.appendChild(speed);
      return row;
    }));
    const notices = failed.length ? failed.map(source => ({ type: "error", text: `${source.file}: ${source.detail}` })) : [{ type: "ok", text: "Alle registrierten Kernquellen konnten geladen und ausgewertet werden." }];
    notices.push({ type: "", text: "Mit „Datenbestand sichern“ wird eine lokale JSON-Sicherung aller erreichbaren Datenquellen erstellt. Die Website-Dateien auf GitHub werden dabei nicht verändert." });
    $("noticeList").replaceChildren(...notices.map(item => { const p = document.createElement("p"); p.className = `admin-notice ${item.type}`.trim(); p.textContent = item.text; return p; }));
  }

  function readLog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  function summarizeReport(report) {
    const failed = report.sources.filter(source => !source.ok);
    return {
      recordedAt: new Date().toISOString(),
      websiteVersion: report.websiteVersion,
      dataVersion: report.dataVersion,
      sourceTotal: report.sources.length,
      sourceFailed: failed.length,
      failedFiles: failed.map(source => source.file),
      validationStatus: report.validation?.status || "unbekannt",
      validationErrors: report.validation?.errors?.length || 0,
      validationWarnings: report.validation?.warnings?.length || 0
    };
  }

  function compareSnapshots(previous, current) {
    if (!previous) return ["Erster protokollierter Prüfstand"];
    const changes = [];
    if (previous.websiteVersion !== current.websiteVersion) changes.push(`Website-Version ${previous.websiteVersion} → ${current.websiteVersion}`);
    if (previous.dataVersion !== current.dataVersion) changes.push(`Datenversion ${previous.dataVersion} → ${current.dataVersion}`);
    if (previous.sourceFailed !== current.sourceFailed) changes.push(`Fehlerhafte Quellen ${previous.sourceFailed} → ${current.sourceFailed}`);
    if (previous.validationStatus !== current.validationStatus) changes.push(`Validierung ${previous.validationStatus} → ${current.validationStatus}`);
    if (previous.validationErrors !== current.validationErrors) changes.push(`Validierungsfehler ${previous.validationErrors} → ${current.validationErrors}`);
    if (previous.validationWarnings !== current.validationWarnings) changes.push(`Warnungen ${previous.validationWarnings} → ${current.validationWarnings}`);
    return changes.length ? changes : ["Keine fachliche Änderung zum vorherigen Prüfstand"];
  }

  function renderLog() {
    const log = readLog();
    const latest = log.at(-1);
    $("logBadge").textContent = log.length ? `${log.length} Einträge` : "Noch kein Eintrag";
    $("logBadge").className = `admin-badge ${log.length ? "ok" : ""}`;
    $("logGrid").replaceChildren(
      card("Protokolleinträge", log.length),
      card("Letzter Prüfstand", latest ? new Date(latest.recordedAt).toLocaleString("de-DE") : "–"),
      card("Letzte Version", latest?.websiteVersion || "–"),
      card("Letzter Status", latest?.validationStatus || "–")
    );
    $("logRows").replaceChildren(...log.slice().reverse().slice(0, 20).map(entry => {
      const row = document.createElement("tr");
      const values = [new Date(entry.recordedAt).toLocaleString("de-DE"), entry.websiteVersion, `${entry.sourceTotal-entry.sourceFailed}/${entry.sourceTotal}`, `${entry.validationStatus} · ${entry.validationErrors} F / ${entry.validationWarnings} W`, (entry.changes || []).join("; ")];
      values.forEach(value => { const td=document.createElement("td"); td.textContent=value; row.appendChild(td); });
      return row;
    }));
    $("logDownloadButton").disabled = !log.length;
    $("clearLogButton").disabled = !log.length;
  }

  function recordCurrentReport() {
    if (!latestReport) return;
    const log = readLog();
    const current = summarizeReport(latestReport);
    current.changes = compareSnapshots(log.at(-1), current);
    log.push(current);
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-100)));
    renderLog();
  }

  async function run() {
    $("refreshButton").disabled = true; $("downloadButton").disabled = true; $("backupButton").disabled = true; $("logButton").disabled = true;
    $("overallBadge").textContent = "Prüfung läuft"; $("overallBadge").className = "admin-badge";
    const started = performance.now();
    const registry = await window.OSCDataRegistry.load();
    const configured = registry.quellen || {};
    const labels = { wettbewerbe:"Wettbewerbe", spiele:"Spiele", teams:"Teams", tippspieltage:"Tippspieltage", highscore:"Highscore", hallOfFame:"Hall of Fame", clubdaten:"Clubdaten", saisonuebersicht:"Saisonübersicht", spieltag:"Spieltag", bundesligaTabelle:"Bundesliga-Tabelle", systemstatus:"Systemstatus" };
    const requests = Object.entries(configured).filter(([key, file]) => key !== "datenmodell" && key !== "version" && /\.json$/i.test(file)).map(([key, file]) => timedFetch(labels[key] || key, file));
    const versionLabel = ["Website", "Version"].join("-");
    requests.push(timedFetch(versionLabel, configured.version || "VERSION.txt", "text"));
    const sources = await Promise.all(requests);
    window.OSCDataModel.reset();
    const model = await window.OSCDataModel.load();
    latestReport = { reportVersion: 2, generatedAt: new Date().toISOString(), websiteVersion: registry.websiteVersion || sources.find(s => s.file === "VERSION.txt")?.detail || "unbekannt", schemaVersion: registry.schemaVersion, dataVersion: registry.datenVersion, durationMs: Math.round(performance.now() - started), validation: model.validation, sources: sources.map(({ payload, ...source }) => source) };
    latestBackup = { backupVersion: 1, generatedAt: latestReport.generatedAt, websiteVersion: latestReport.websiteVersion, dataVersion: latestReport.dataVersion, sources: Object.fromEntries(sources.filter(s => s.ok && s.file.endsWith(".json")).map(s => [s.file, s.payload])) };
    render(latestReport); renderValidation(model.validation);
    $("refreshButton").disabled = false; $("downloadButton").disabled = false; $("backupButton").disabled = !Object.keys(latestBackup.sources).length; $("logButton").disabled = false; renderLog();
  }

  function validateBackupDocument(document) {
    const errors = [];
    const warnings = [];
    if (!document || typeof document !== "object" || Array.isArray(document)) errors.push("Die Datei enthält kein gültiges Sicherungsobjekt.");
    const sources = document?.sources;
    if (!sources || typeof sources !== "object" || Array.isArray(sources)) errors.push("Das Feld ‚sources‘ fehlt oder ist ungültig.");
    const entries = sources && typeof sources === "object" && !Array.isArray(sources) ? Object.entries(sources) : [];
    const invalidSources = entries.filter(([file, payload]) => !/^[\wÄÖÜäöüß.() -]+\.json$/i.test(file) || payload === undefined);
    if (invalidSources.length) errors.push(`${invalidSources.length} Quelldateien haben einen ungültigen Dateinamen oder Inhalt.`);
    if (!entries.length && !errors.length) warnings.push("Die Sicherung enthält keine Datenquellen.");
    if (!document.backupVersion) warnings.push("Eine Backup-Versionsnummer fehlt.");
    if (!document.generatedAt) warnings.push("Ein Erstellungszeitpunkt fehlt.");
    const currentVersion = window.OSCDataRegistry.current?.websiteVersion;
    if (document?.websiteVersion && currentVersion && document.websiteVersion !== currentVersion) warnings.push(`Rückrollkontrolle: Sicherung stammt aus Website-Version ${document.websiteVersion}, aktuell ist ${currentVersion}. Vor dem Ersetzen Strukturänderungen prüfen.`);
    const currentDataVersion = window.OSCDataRegistry.current?.datenVersion;
    if (document?.dataVersion != null && currentDataVersion != null && document.dataVersion !== currentDataVersion) warnings.push(`Rückrollkontrolle: Datenversion ${document.dataVersion} weicht von der aktuellen Datenversion ${currentDataVersion} ab.`);
    const registered = new Set(Object.values(window.OSCDataRegistry.current?.quellen || {}).filter(file => /\.json$/i.test(file)));
    const unknown = entries.map(([file]) => file).filter(file => !registered.has(file));
    const missing = [...registered].filter(file => !entries.some(([entry]) => entry === file));
    if (unknown.length) warnings.push(`Nicht registrierte Quellen: ${unknown.join(", ")}`);
    if (missing.length) warnings.push(`Nicht enthaltene registrierte Quellen: ${missing.join(", ")}`);
    return { status: errors.length ? "error" : warnings.length ? "warning" : "ok", errors, warnings, sourceCount: entries.length, unknown, missing, document };
  }

  function renderRestore(result) {
    const badge = $("restoreBadge");
    badge.textContent = result.status === "ok" ? "Sicherung gültig" : result.status === "warning" ? `${result.warnings.length} Hinweise` : `${result.errors.length} Fehler`;
    badge.className = `admin-badge ${result.status === "ok" ? "ok" : result.status === "warning" ? "warn" : "error"}`;
    $("restoreGrid").replaceChildren(
      card("Backup-Version", result.document?.backupVersion || "–"),
      card("Website-Version", result.document?.websiteVersion || "–"),
      card("Datenversion", result.document?.dataVersion ?? "–"),
      card("Enthaltene Quellen", result.sourceCount),
      card("Fehler", result.errors.length),
      card("Hinweise", result.warnings.length)
    );
    const messages = [...result.errors.map(text => ({type:"error", text})), ...result.warnings.map(text => ({type:"warn", text}))];
    if (!messages.length) messages.push({type:"ok", text:"Struktur, Dateinamen und registrierte Quellen sind für einen manuellen Wiederherstellungsablauf geeignet."});
    $("restoreDetails").replaceChildren(...messages.map(item => { const p=document.createElement("p"); p.className=`admin-notice ${item.type}`; p.textContent=item.text; return p; }));
    $("planButton").disabled = result.status === "error";
    $("verifiedBackupButton").disabled = result.status === "error";
  }

  async function inspectRestoreFile(file) {
    try {
      const text = await file.text();
      const document = JSON.parse(text);
      restoreResult = validateBackupDocument(document);
      restoreResult.fileName = file.name;
      restoreResult.checkedAt = new Date().toISOString();
      renderRestore(restoreResult);
    } catch (error) {
      restoreResult = { status:"error", errors:[`Datei konnte nicht gelesen werden: ${error.message || error}`], warnings:[], sourceCount:0, document:null };
      renderRestore(restoreResult);
    }
  }

  function buildImportPlan(result) {
    const files = Object.keys(result.document.sources || {});
    return {
      planVersion: 1, generatedAt: new Date().toISOString(), sourceBackup: result.fileName || null,
      backupWebsiteVersion: result.document.websiteVersion || null, currentWebsiteVersion: latestReport?.websiteVersion || null,
      replace: files.filter(file => !result.unknown.includes(file)),
      reviewBeforeAdding: result.unknown,
      missingFromBackup: result.missing,
      instructions: [
        "Vor Änderungen das aktuelle vollständige GitHub-Paket sichern.",
        "Die unter replace genannten JSON-Dateien aus dem Feld sources einzeln erzeugen und im Repository ersetzen.",
        "Nicht registrierte Quellen nicht ungeprüft hochladen.",
        "Nach dem Upload admin.html öffnen und Datenkonsistenz erneut prüfen."
      ]
    };
  }

  function saveJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  $("refreshButton").addEventListener("click", run);
  $("downloadButton").addEventListener("click", () => latestReport && saveJson(latestReport, `osc-systembericht-${new Date().toISOString().slice(0,10)}.json`));
  $("backupButton").addEventListener("click", () => latestBackup && saveJson(latestBackup, `osc-datensicherung-${new Date().toISOString().slice(0,10)}.json`));
  $("restoreFile").addEventListener("change", event => { const file = event.target.files?.[0]; if (file) inspectRestoreFile(file); });
  $("planButton").addEventListener("click", () => restoreResult && saveJson(buildImportPlan(restoreResult), `osc-importplan-${new Date().toISOString().slice(0,10)}.json`));
  $("verifiedBackupButton").addEventListener("click", () => restoreResult?.document && saveJson(restoreResult.document, `osc-gepruefte-datensicherung-${new Date().toISOString().slice(0,10)}.json`));
  $("logButton").addEventListener("click", recordCurrentReport);
  $("logDownloadButton").addEventListener("click", () => saveJson({ protocolVersion: 1, exportedAt: new Date().toISOString(), entries: readLog() }, `osc-pflegeprotokoll-${new Date().toISOString().slice(0,10)}.json`));
  $("clearLogButton").addEventListener("click", () => { if (confirm("Lokales Pflegeprotokoll dieses Browsers wirklich leeren?")) { localStorage.removeItem(LOG_KEY); renderLog(); } });
  renderLog();
  run();
})();
