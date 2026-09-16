(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let sourceDocument = null;
  let workingDocument = null;
  let teams = [];
  let competitions = [];
  let activeSeason = null;
  let dirty = false;

  const clone = value => JSON.parse(JSON.stringify(value));
  const currentGames = () => activeSeason?.spiele || [];
  const teamName = id => teams.find(team => team.id === id)?.kurzname || teams.find(team => team.id === id)?.name || id || "–";
  const competitionName = id => competitions.find(item => item.id === id)?.label || id || "–";
  const nullableNumber = value => value === "" ? null : Number(value);
  const nullableText = value => value.trim() || null;

  function card(label, value) {
    const article = document.createElement("article"); article.className = "admin-card";
    const span = document.createElement("span"); span.textContent = label;
    const strong = document.createElement("strong"); strong.textContent = value;
    article.append(span, strong); return article;
  }

  function message(text, type = "info") {
    const p = document.createElement("p"); p.className = `admin-notice ${type}`; p.textContent = text;
    $("messageBox").replaceChildren(p);
  }

  function setDirty(value) {
    dirty = value;
    $("exportButton").disabled = !workingDocument;
    $("statusBadge").textContent = value ? "Lokale Änderungen" : "Daten geladen";
    $("statusBadge").className = `admin-badge ${value ? "warn" : "ok"}`;
  }

  function fillSelect(select, items, valueKey, labelKey, placeholder) {
    const previous = select.value;
    const options = [];
    if (placeholder) { const option = document.createElement("option"); option.value = ""; option.textContent = placeholder; options.push(option); }
    for (const item of items) {
      const option = document.createElement("option"); option.value = item[valueKey]; option.textContent = item[labelKey] || item[valueKey]; options.push(option);
    }
    select.replaceChildren(...options);
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }

  function populateControls() {
    fillSelect($("homeTeam"), teams.filter(t => t.aktiv !== false).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id,"de")), "id", "name", "Heimteam wählen");
    fillSelect($("awayTeam"), teams.filter(t => t.aktiv !== false).sort((a,b)=>(a.name||a.id).localeCompare(b.name||b.id,"de")), "id", "name", "Auswärtsteam wählen");
    fillSelect($("competition"), competitions, "id", "label", "Wettbewerb wählen");
    fillSelect($("competitionFilter"), competitions, "id", "label", "Alle Wettbewerbe");
    const statuses = [...new Set(currentGames().map(game => game.status).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
    fillSelect($("statusFilter"), statuses.map(value => ({id:value,label:value})), "id", "label", "Alle Statuswerte");
  }

  function validateGame(game, originalId = null) {
    const errors = [];
    if (!game.id) errors.push("Die Spiel-ID fehlt.");
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(game.id || "")) errors.push("Die Spiel-ID darf nur Buchstaben, Zahlen und Bindestriche enthalten.");
    if (currentGames().some(item => item.id === game.id && item.id !== originalId)) errors.push(`Die Spiel-ID „${game.id}“ ist bereits vorhanden.`);
    if (!game.wettbewerb) errors.push("Ein Wettbewerb muss gewählt werden.");
    if (!game.heimTeamId || !game.auswaertsTeamId) errors.push("Heim- und Auswärtsteam müssen gewählt werden.");
    if (game.heimTeamId && game.heimTeamId === game.auswaertsTeamId) errors.push("Heim- und Auswärtsteam dürfen nicht identisch sein.");
    if (!game.runde) errors.push("Die Runde fehlt.");
    if (!game.saison) errors.push("Die Saison fehlt.");
    if (!game.status) errors.push("Der Status fehlt.");
    if ((game.heimtore == null) !== (game.auswaertstore == null)) errors.push("Ein Ergebnis muss immer vollständig mit beiden Torwerten erfasst werden.");
    if (game.datumVon && game.datumBis && game.datumVon > game.datumBis) errors.push("Der Beginn des Terminzeitraums liegt nach dessen Ende.");
    return errors;
  }

  function collectGame() {
    const date = nullableText($("date").value);
    const dateFrom = nullableText($("dateFrom").value) || date;
    const dateTo = nullableText($("dateTo").value) || date;
    const competitionId = $("competition").value;
    return {
      id: $("gameId").value.trim(),
      wettbewerb: competitionId,
      wettbewerbAnzeige: $("competitionLabel").value.trim() || competitionName(competitionId),
      saison: $("season").value.trim(),
      runde: $("round").value.trim(),
      spieltagNummer: nullableNumber($("matchdayNumber").value),
      spielNummer: nullableNumber($("gameNumber").value),
      datum: date,
      datumVon: dateFrom,
      datumBis: dateTo,
      datumAnzeige: date ? new Intl.DateTimeFormat("de-DE").format(new Date(`${date}T12:00:00`)) : null,
      anstoss: nullableText($("kickoff").value),
      terminBestaetigt: $("confirmed").checked,
      heimtore: nullableNumber($("homeGoals").value),
      auswaertstore: nullableNumber($("awayGoals").value),
      status: $("gameStatus").value.trim(),
      sonderwertungen: $("specialRatings").value.split(",").map(value => value.trim()).filter(Boolean),
      notiz: nullableText($("note").value),
      quelleStand: nullableText($("sourceDate").value),
      heimTeamId: $("homeTeam").value,
      auswaertsTeamId: $("awayTeam").value
    };
  }

  function resetForm() {
    $("gameForm").reset(); $("originalId").value = "";
    $("season").value = activeSeason?.anzeige || "2026/2027";
    $("sourceDate").value = new Date().toISOString().slice(0,10);
    $("editorBadge").textContent = "Neues Spiel"; $("editorBadge").className = "admin-badge game-state-new";
    $("deleteButton").disabled = true; $("formErrors").replaceChildren();
    document.querySelectorAll("#gameRows tr").forEach(row => row.dataset.selected = "false");
  }

  function loadIntoForm(game) {
    $("originalId").value = game.id || ""; $("gameId").value = game.id || "";
    $("competition").value = game.wettbewerb || ""; $("competitionLabel").value = game.wettbewerbAnzeige || competitionName(game.wettbewerb);
    $("season").value = game.saison || activeSeason?.anzeige || ""; $("round").value = game.runde || "";
    $("matchdayNumber").value = game.spieltagNummer ?? ""; $("gameNumber").value = game.spielNummer ?? "";
    $("homeTeam").value = game.heimTeamId || ""; $("awayTeam").value = game.auswaertsTeamId || "";
    $("date").value = game.datum || ""; $("dateFrom").value = game.datumVon || ""; $("dateTo").value = game.datumBis || "";
    $("kickoff").value = game.anstoss || ""; $("gameStatus").value = game.status || "";
    $("homeGoals").value = game.heimtore ?? ""; $("awayGoals").value = game.auswaertstore ?? ""; $("confirmed").checked = Boolean(game.terminBestaetigt);
    $("specialRatings").value = (game.sonderwertungen || []).join(", "); $("note").value = game.notiz || ""; $("sourceDate").value = game.quelleStand || "";
    $("editorBadge").textContent = game.id; $("editorBadge").className = "admin-badge"; $("deleteButton").disabled = false; $("formErrors").replaceChildren();
    document.querySelectorAll("#gameRows tr").forEach(row => row.dataset.selected = String(row.dataset.id === game.id));
    $("editorHeading").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderSummary() {
    const games = currentGames();
    const finished = games.filter(game => game.heimtore != null && game.auswaertstore != null).length;
    const confirmed = games.filter(game => game.terminBestaetigt).length;
    $("summaryGrid").replaceChildren(card("Aktive Saison", activeSeason?.anzeige || "–"), card("Spiele", games.length), card("Termine bestätigt", confirmed), card("Ergebnisse vorhanden", finished), card("Lokale Änderungen", dirty ? "Ja" : "Nein"));
  }

  function renderGames() {
    const query = $("searchInput").value.trim().toLocaleLowerCase("de");
    const competition = $("competitionFilter").value; const status = $("statusFilter").value;
    const list = currentGames().filter(game => {
      if (competition && game.wettbewerb !== competition) return false;
      if (status && game.status !== status) return false;
      const haystack = [game.id, teamName(game.heimTeamId), teamName(game.auswaertsTeamId), game.runde, game.notiz, game.status].join(" ").toLocaleLowerCase("de");
      return !query || haystack.includes(query);
    }).sort((a,b) => String(a.datumVon || a.datum || "9999").localeCompare(String(b.datumVon || b.datum || "9999")) || String(a.id).localeCompare(String(b.id)));
    $("resultCount").textContent = `${list.length} von ${currentGames().length}`;
    $("gameRows").replaceChildren(...list.map(game => {
      const row = document.createElement("tr"); row.dataset.id = game.id; row.dataset.selected = String($("originalId").value === game.id);
      const values = [game.datumAnzeige || game.datumVon || "offen", `${teamName(game.heimTeamId)} – ${teamName(game.auswaertsTeamId)}`, game.wettbewerbAnzeige || competitionName(game.wettbewerb), game.runde || "–", game.status || "–"];
      values.forEach(value => { const td = document.createElement("td"); td.textContent = value; row.appendChild(td); });
      const action = document.createElement("td"); const button = document.createElement("button"); button.type="button"; button.className="admin-button"; button.textContent="Bearbeiten"; button.addEventListener("click",()=>loadIntoForm(game)); action.appendChild(button); row.appendChild(action); return row;
    }));
  }

  async function loadData() {
    $("reloadButton").disabled = true; $("statusBadge").textContent = "Wird geladen"; $("statusBadge").className = "admin-badge";
    try {
      const registry = await window.OSCDataRegistry.load();
      const [gamesResponse, teamsResponse, competitionsResponse] = await Promise.all([
        fetch(registry.quellen.spiele,{cache:"no-store"}), fetch(registry.quellen.teams,{cache:"no-store"}), fetch(registry.quellen.wettbewerbe,{cache:"no-store"})
      ]);
      if (!gamesResponse.ok || !teamsResponse.ok || !competitionsResponse.ok) throw new Error("Mindestens eine zentrale Datenquelle ist nicht erreichbar.");
      sourceDocument = await gamesResponse.json(); workingDocument = clone(sourceDocument);
      teams = (await teamsResponse.json()).teams || []; competitions = (await competitionsResponse.json()).wettbewerbe || [];
      activeSeason = workingDocument.saisons?.find(season => season.id === workingDocument.aktiveSaison) || workingDocument.saisons?.find(season => season.aktiv) || workingDocument.saisons?.[0];
      if (!activeSeason) throw new Error("In spieldaten.json wurde keine Saison gefunden.");
      populateControls(); setDirty(false); resetForm(); renderSummary(); renderGames(); message("Die zentrale Spieldatei wurde vollständig geladen. Änderungen bleiben bis zum Download ausschließlich in diesem Browserfenster.","ok");
    } catch (error) {
      $("statusBadge").textContent = "Ladefehler"; $("statusBadge").className = "admin-badge error"; message(error.message || String(error),"error");
    } finally { $("reloadButton").disabled = false; }
  }

  function saveGame(event) {
    event.preventDefault(); if (!workingDocument) return;
    const game = collectGame(); const originalId = $("originalId").value || null; const errors = validateGame(game, originalId);
    if (errors.length) {
      $("editorBadge").textContent = `${errors.length} Fehler`; $("editorBadge").className = "admin-badge game-state-error";
      $("formErrors").replaceChildren(...errors.map(text => { const p=document.createElement("p"); p.className="admin-notice error"; p.textContent=text; return p; })); return;
    }
    const index = currentGames().findIndex(item => item.id === originalId);
    if (index >= 0) currentGames()[index] = game; else currentGames().push(game);
    workingDocument.aktualisiert = new Date().toISOString().slice(0,10); workingDocument.datenVersion = Number(workingDocument.datenVersion || 0) + 1;
    setDirty(true); populateControls(); renderSummary(); renderGames(); loadIntoForm(game); message(`Spiel „${game.id}“ wurde lokal übernommen. Für GitHub muss anschließend die exportierte spieldaten.json hochgeladen werden.`,"ok");
  }

  function deleteGame() {
    const id = $("originalId").value; if (!id || !workingDocument) return;
    if (!confirm(`Spiel „${id}“ wirklich aus der lokalen Arbeitskopie löschen?`)) return;
    activeSeason.spiele = currentGames().filter(game => game.id !== id); workingDocument.aktualisiert = new Date().toISOString().slice(0,10); workingDocument.datenVersion = Number(workingDocument.datenVersion || 0) + 1;
    setDirty(true); populateControls(); resetForm(); renderSummary(); renderGames(); message(`Spiel „${id}“ wurde lokal entfernt. Abhängige Tippspieltage müssen vor dem GitHub-Upload separat geprüft werden.`,"warn");
  }

  function exportData() {
    if (!workingDocument) return;
    const allErrors = currentGames().flatMap(game => validateGame(game, game.id).map(error => `${game.id || "ohne ID"}: ${error}`));
    if (allErrors.length) { $("formErrors").replaceChildren(...allErrors.slice(0,20).map(text=>{const p=document.createElement("p");p.className="admin-notice error";p.textContent=text;return p;})); return; }
    const blob = new Blob([JSON.stringify(workingDocument,null,2)+"\n"],{type:"application/json;charset=utf-8"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download="spieldaten.json"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    message("spieldaten.json wurde erzeugt. Diese Datei kann im Hauptverzeichnis des GitHub-Repositories ersetzt werden.","ok");
  }

  $("gameForm").addEventListener("submit",saveGame); $("deleteButton").addEventListener("click",deleteGame); $("cancelButton").addEventListener("click",resetForm); $("newButton").addEventListener("click",()=>{resetForm();$("editorHeading").scrollIntoView({behavior:"smooth"});});
  $("reloadButton").addEventListener("click",()=>{if(!dirty||confirm("Lokale, noch nicht exportierte Änderungen verwerfen und neu laden?"))loadData();}); $("exportButton").addEventListener("click",exportData);
  ["searchInput","competitionFilter","statusFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderGames));
  $("competition").addEventListener("change",()=>{$("competitionLabel").value=competitionName($("competition").value);});
  window.addEventListener("beforeunload",event=>{if(dirty){event.preventDefault();event.returnValue="";}});
  loadData();
})();
