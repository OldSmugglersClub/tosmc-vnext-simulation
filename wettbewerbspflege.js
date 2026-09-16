(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const clone = value => JSON.parse(JSON.stringify(value));
  let sourceDocument = null;
  let workingDocument = null;
  let dirty = false;

  const competitions = () => workingDocument?.wettbewerbe || [];
  const nullableNumber = value => value === "" ? null : Number(value);
  const text = value => String(value ?? "").trim();

  function card(label, value) {
    const node = document.createElement("article"); node.className = "admin-card";
    const strong = document.createElement("strong"); strong.textContent = value;
    const span = document.createElement("span"); span.textContent = label;
    node.append(strong, span); return node;
  }
  function message(messageText, type="") {
    const p = document.createElement("p"); p.className = `admin-notice ${type}`.trim(); p.textContent = messageText;
    $("messageBox").replaceChildren(p);
  }
  function setDirty(value) {
    dirty = value; $("exportButton").disabled = !workingDocument;
    $("statusBadge").textContent = dirty ? "Lokale Änderungen" : "Daten geladen";
    $("statusBadge").className = `admin-badge${dirty ? " warn" : " ok"}`;
  }
  function renderSummary() {
    const all = competitions();
    const standard = all.filter(item => item.filter?.type === "wettbewerb").length;
    const specials = all.filter(item => item.filter?.type === "sonderwertung").length;
    const visible = all.filter(item => item.sichtbar !== false).length;
    $("summaryGrid").replaceChildren(card("Wettbewerbe", all.length), card("Regulär", standard), card("Sonderwertungen", specials), card("Sichtbar", visible), card("Datenversion", workingDocument?.datenVersion ?? "–"), card("Lokale Änderungen", dirty ? "Ja" : "Nein"));
  }
  function resetForm() {
    $("competitionForm").reset(); $("originalId").value = ""; $("visible").checked = true;
    $("editorBadge").textContent = "Neuer Wettbewerb"; $("editorBadge").className = "admin-badge competition-state-new";
    $("deleteButton").disabled = true; $("formErrors").replaceChildren();
    document.querySelectorAll("#competitionRows tr").forEach(row => row.dataset.selected = "false");
  }
  function collectCompetition() {
    return {
      id: text($("competitionId").value), label: text($("label").value), page: text($("page").value),
      filter: {type: text($("filterType").value), value: text($("filterValue").value)},
      scheduleTitle: text($("scheduleTitle").value),
      saison: {seasonLabel: text($("seasonLabel").value), tippspieltageZiel: nullableNumber($("matchdaysTarget").value), spieleZiel: nullableNumber($("gamesTarget").value), zeitraum: text($("period").value), status: text($("competitionStatus").value)},
      sichtbar: $("visible").checked,
      pflegehinweis: text($("note").value) || null
    };
  }
  function validateCompetition(item, originalId=null) {
    const errors = [];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push("Die Wettbewerbs-ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");
    if (!item.label) errors.push("Der Anzeigename fehlt.");
    if (!/^[a-z0-9-]+\.html$/i.test(item.page)) errors.push("Die HTML-Seite muss als lokaler Dateiname mit .html angegeben werden.");
    if (!item.filter.type || !item.filter.value) errors.push("Filtertyp und Filterwert sind erforderlich.");
    if (!item.scheduleTitle || !item.saison.seasonLabel || !item.saison.zeitraum || !item.saison.status) errors.push("Spielplan-Überschrift und Saisonangaben müssen vollständig sein.");
    if (item.saison.tippspieltageZiel != null && (!Number.isInteger(item.saison.tippspieltageZiel) || item.saison.tippspieltageZiel < 0)) errors.push("Das Ziel der Tippspieltage muss eine nichtnegative ganze Zahl sein.");
    if (item.saison.spieleZiel != null && (!Number.isInteger(item.saison.spieleZiel) || item.saison.spieleZiel < 0)) errors.push("Das Spiele-Ziel muss eine nichtnegative ganze Zahl sein.");
    if (competitions().some(existing => existing.id === item.id && existing.id !== originalId)) errors.push(`Die ID „${item.id}“ ist bereits vergeben.`);
    if (competitions().some(existing => existing.page === item.page && existing.id !== originalId)) errors.push(`Die Seite „${item.page}“ ist bereits einem anderen Wettbewerb zugeordnet.`);
    return errors;
  }
  function loadIntoForm(item) {
    $("originalId").value = item.id; $("competitionId").value = item.id; $("label").value = item.label || ""; $("page").value = item.page || "";
    $("filterType").value = item.filter?.type || "wettbewerb"; $("filterValue").value = item.filter?.value || item.id;
    $("scheduleTitle").value = item.scheduleTitle || ""; $("seasonLabel").value = item.saison?.seasonLabel || "";
    $("matchdaysTarget").value = item.saison?.tippspieltageZiel ?? ""; $("gamesTarget").value = item.saison?.spieleZiel ?? "";
    $("period").value = item.saison?.zeitraum || ""; $("competitionStatus").value = item.saison?.status || "";
    $("visible").checked = item.sichtbar !== false; $("note").value = item.pflegehinweis || "";
    $("editorBadge").textContent = item.id; $("editorBadge").className = "admin-badge"; $("deleteButton").disabled = false; $("formErrors").replaceChildren();
    document.querySelectorAll("#competitionRows tr").forEach(row => row.dataset.selected = String(row.dataset.id === item.id));
    $("editorHeading").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function renderList() {
    const query = text($("searchInput").value).toLocaleLowerCase("de"); const type = $("typeFilter").value;
    const list = competitions().filter(item => {
      if (type && item.filter?.type !== type) return false;
      return !query || [item.id,item.label,item.page,item.saison?.status,item.scheduleTitle].join(" ").toLocaleLowerCase("de").includes(query);
    }).sort((a,b) => a.label.localeCompare(b.label,"de"));
    $("resultCount").textContent = `${list.length} von ${competitions().length}`;
    $("competitionRows").replaceChildren(...list.map(item => {
      const row = document.createElement("tr"); row.dataset.id = item.id; row.dataset.selected = String($("originalId").value === item.id);
      const target = [item.saison?.tippspieltageZiel,item.saison?.spieleZiel].map(value => value ?? "–").join(" / ");
      [item.label,item.id,item.filter?.type || "–",target,item.saison?.status || "–"].forEach(value => {const td=document.createElement("td");td.textContent=value;row.appendChild(td);});
      const td=document.createElement("td"),button=document.createElement("button");button.type="button";button.className="admin-button";button.textContent="Bearbeiten";button.addEventListener("click",()=>loadIntoForm(item));td.appendChild(button);row.appendChild(td);return row;
    }));
  }
  async function loadData() {
    $("reloadButton").disabled = true; $("statusBadge").textContent = "Wird geladen";
    try {
      const registry = await window.OSCDataRegistry.load(); const response = await fetch(registry.quellen.wettbewerbe,{cache:"no-store"});
      if (!response.ok) throw new Error("wettbewerbe.json ist nicht erreichbar.");
      sourceDocument = await response.json(); workingDocument = clone(sourceDocument);
      if (!Array.isArray(workingDocument.wettbewerbe)) throw new Error("Die Wettbewerbsdatei besitzt keine gültige Wettbewerbsliste.");
      setDirty(false); resetForm(); renderSummary(); renderList(); message("Die zentrale Wettbewerbsdatei wurde vollständig geladen. Änderungen bleiben bis zum Download ausschließlich in diesem Browserfenster.","ok");
    } catch (error) { $("statusBadge").textContent="Ladefehler";$("statusBadge").className="admin-badge error";message(error.message || String(error),"error"); }
    finally { $("reloadButton").disabled = false; }
  }
  function saveCompetition(event) {
    event.preventDefault(); if (!workingDocument) return;
    const item = collectCompetition(); const originalId = $("originalId").value || null; const errors = validateCompetition(item,originalId);
    if (errors.length) { $("editorBadge").textContent=`${errors.length} Fehler`;$("editorBadge").className="admin-badge competition-state-error";$("formErrors").replaceChildren(...errors.map(value=>{const p=document.createElement("p");p.className="admin-notice error";p.textContent=value;return p;}));return; }
    const index = competitions().findIndex(existing => existing.id === originalId); if (index >= 0) competitions()[index] = item; else competitions().push(item);
    workingDocument.aktualisiert = new Date().toISOString().slice(0,10); workingDocument.datenVersion = Number(workingDocument.datenVersion || 0) + 1;
    setDirty(true); renderSummary(); renderList(); loadIntoForm(item); message(`Wettbewerb „${item.label}“ wurde lokal übernommen. Vor dem Export muss für neue Wettbewerbe die angegebene HTML-Seite separat vorhanden sein.`,"ok");
  }
  function deleteCompetition() {
    const id = $("originalId").value; if (!id || !workingDocument) return;
    if (!confirm(`Wettbewerb „${id}“ wirklich aus der lokalen Arbeitskopie löschen? Bestehende Spiel- und Tippspieltagsreferenzen werden nicht automatisch entfernt.`)) return;
    workingDocument.wettbewerbe = competitions().filter(item => item.id !== id); workingDocument.aktualisiert = new Date().toISOString().slice(0,10); workingDocument.datenVersion = Number(workingDocument.datenVersion || 0) + 1;
    setDirty(true); resetForm(); renderSummary(); renderList(); message(`Wettbewerb „${id}“ wurde lokal entfernt. Abhängige Daten müssen vor dem GitHub-Upload separat geprüft werden.`,"warn");
  }
  function exportData() {
    const allErrors = competitions().flatMap(item => validateCompetition(item,item.id).map(error => `${item.id || "ohne ID"}: ${error}`));
    if (allErrors.length) { $("formErrors").replaceChildren(...allErrors.slice(0,30).map(value=>{const p=document.createElement("p");p.className="admin-notice error";p.textContent=value;return p;}));return; }
    const blob = new Blob([JSON.stringify(workingDocument,null,2)+"\n"],{type:"application/json;charset=utf-8"}); const url=URL.createObjectURL(blob); const link=document.createElement("a");link.href=url;link.download="wettbewerbe.json";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);message("wettbewerbe.json wurde erzeugt. Diese Datei kann im Hauptverzeichnis des GitHub-Repositories ersetzt werden.","ok");
  }
  $("competitionForm").addEventListener("submit",saveCompetition); $("deleteButton").addEventListener("click",deleteCompetition); $("cancelButton").addEventListener("click",resetForm);
  $("newButton").addEventListener("click",()=>{resetForm();$("editorHeading").scrollIntoView({behavior:"smooth"});});
  $("reloadButton").addEventListener("click",()=>{if(!dirty||confirm("Lokale, noch nicht exportierte Änderungen verwerfen und neu laden?"))loadData();}); $("exportButton").addEventListener("click",exportData);
  $("searchInput").addEventListener("input",renderList); $("typeFilter").addEventListener("change",renderList); $("competitionId").addEventListener("input",()=>{if(!$("filterValue").value||$("filterValue").value===$("originalId").value)$("filterValue").value=$("competitionId").value;});
  window.addEventListener("beforeunload",event=>{if(dirty){event.preventDefault();event.returnValue="";}}); loadData();
})();
