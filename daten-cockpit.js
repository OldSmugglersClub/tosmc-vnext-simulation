(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const safeDate = value => {
    if (!value) return "nicht angegeben";
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat("de-DE").format(parsed);
  };
  const maxUpdate = model => [model.competitionData, model.gameData, model.teamData, model.matchdayData]
    .map(item => item && item.aktualisiert).filter(Boolean).sort().at(-1) || "";
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

  function overviewCard(value, label) {
    return `<article class="overview-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></article>`;
  }

  function competitionCard(competition, summary) {
    const season = competition.saison || {};
    const total = summary.total || 0;
    const completed = summary.completed || 0;
    const progress = total ? Math.round(completed / total * 100) : 0;
    return `<article class="competition-card">
      <h3>${escapeHtml(competition.label || competition.id)}</h3>
      <p class="competition-meta">${escapeHtml(season.zeitraum || "Zeitraum offen")} · ${escapeHtml(season.status || "Status offen")}</p>
      <div class="competition-stats">
        <div class="competition-stat"><strong>${total}</strong><span>Spiele</span></div>
        <div class="competition-stat"><strong>${completed}</strong><span>Beendet</span></div>
        <div class="competition-stat"><strong>${summary.open || 0}</strong><span>Offen</span></div>
        <div class="competition-stat"><strong>${summary.matchdays || 0}</strong><span>Tippspieltage</span></div>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Fortschritt ${escapeHtml(competition.label || competition.id)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><div class="progress-bar" style="width:${progress}%"></div></div>
      <a class="competition-link" href="${escapeHtml(competition.page)}">Wettbewerb öffnen</a>
    </article>`;
  }

  async function render() {
    const badge = $("#integrityBadge");
    badge.textContent = "Prüfung läuft";
    badge.dataset.status = "";
    $("#overviewGrid").innerHTML = overviewCard("…", "Daten werden geladen");
    $("#competitionGrid").innerHTML = "";
    $("#cockpitNotices").innerHTML = "<p>Die zentralen Daten werden geladen.</p>";

    try {
      const model = await window.OSCDataModel.load();
      const summaries = Object.values(model.summaries || {});
      const totalGames = summaries.reduce((sum, item) => sum + item.total, 0);
      const completedGames = summaries.reduce((sum, item) => sum + item.completed, 0);
      const openGames = summaries.reduce((sum, item) => sum + item.open, 0);
      const update = maxUpdate(model);
      const validation = model.validation || {status:"error", errors:[], warnings:[]};

      $("#overviewGrid").innerHTML = [
        overviewCard(model.competitions.length, "Wettbewerbe"),
        overviewCard(totalGames, "zugeordnete Spiele"),
        overviewCard(completedGames, "beendete Spiele"),
        overviewCard(openGames, "offene Spiele"),
        overviewCard(safeDate(update), "letzte Datenpflege")
      ].join("");

      $("#competitionCount").textContent = `${model.competitions.length} Wettbewerbe`;
      $("#competitionGrid").innerHTML = model.competitions.map(item => competitionCard(item, model.summaries[item.id] || {})).join("");

      const statusLabels = {ok:"Datenintegrität bestätigt",warning:"Hinweise vorhanden",error:"Fehler gefunden"};
      badge.textContent = statusLabels[validation.status] || "Status unbekannt";
      badge.dataset.status = validation.status;

      const fallbackSources = (model.diagnostics && model.diagnostics.fallbackSources) || [];
      const notices = [];
      validation.errors.forEach(item => notices.push(`<li class="error"><strong>${escapeHtml(item.message)}</strong>${item.details && item.details.length ? `: ${escapeHtml(item.details.slice(0,5).join(", "))}` : ""}</li>`));
      validation.warnings.forEach(item => notices.push(`<li class="warning"><strong>${escapeHtml(item.message)}</strong>${item.details && item.details.length ? `: ${escapeHtml(item.details.slice(0,5).join(", "))}` : ""}</li>`));
      if (fallbackSources.length) notices.push(`<li class="error">Nicht erreichbare Datenquellen: ${escapeHtml(fallbackSources.join(", "))}</li>`);
      $("#cockpitNotices").innerHTML = notices.length ? `<ul>${notices.join("")}</ul>` : "<p>Alle zentralen Datenquellen wurden geladen. Die strukturelle Prüfung meldet keine Fehler oder Warnungen.</p>";
    } catch (error) {
      badge.textContent = "Cockpit nicht verfügbar";
      badge.dataset.status = "error";
      $("#overviewGrid").innerHTML = overviewCard("–", "Ladefehler");
      $("#cockpitNotices").innerHTML = `<p class="error">Das zentrale Datenmodell konnte nicht geladen werden: ${escapeHtml(error.message || error)}</p>`;
    }
  }

  $("#refreshCockpit").addEventListener("click", () => {
    window.OSCDataModel.reset();
    render();
  });
  render();
})();
