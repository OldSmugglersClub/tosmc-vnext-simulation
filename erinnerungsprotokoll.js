(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const load = async file => { const response = await fetch(file, {cache:"no-store"}); if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`); return response.json(); };
  const download = (name, content, type) => { const link=document.createElement("a"); link.href=URL.createObjectURL(new Blob([content],{type})); link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000); };
  const games = data => (data.saisons || []).flatMap(season => season.spiele || []);
  const deadline = game => game.datum && game.anstoss ? new Date(`${game.datum}T${game.anstoss}:00`) : null;
  const formatDate = date => new Intl.DateTimeFormat("de-DE", {dateStyle:"short", timeStyle:"short"}).format(date);
  const teamMap = data => new Map((data.teams || []).map(team => [team.id, team.name || team.label || team.id]));
  const teamName = (game, map, key) => game[key] || map.get(game[`${key}TeamId`]) || game[`${key}TeamId`] || "Noch offen";
  const keyOf = (participantId, gameId) => `${participantId}|${gameId}`;
  let candidates = [];
  let entries = [];
  let season = "2026/2027";

  function normalizedEntry(raw) {
    return {
      id: raw.id || `er-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      teilnehmerId: String(raw.teilnehmerId || ""),
      teilnehmerName: String(raw.teilnehmerName || ""),
      spielId: String(raw.spielId || ""),
      begegnung: String(raw.begegnung || ""),
      frist: raw.frist || null,
      versendetAm: raw.versendetAm || new Date().toISOString(),
      kanal: String(raw.kanal || "WhatsApp"),
      bearbeiter: String(raw.bearbeiter || "Spielleitung"),
      notiz: String(raw.notiz || "")
    };
  }

  async function build() {
    try {
      $("#statusBadge").textContent = "Prüfung läuft";
      const [spieldaten, teilnehmer, tipps, teams, log] = await Promise.all([
        load("spieldaten.json"), load("teilnehmer.json"), load("tipps.json"), load("teams.json"), load("erinnerungsprotokoll.json")
      ]);
      season = spieldaten.aktiveSaison || log.saison || season;
      entries = (log.eintraege || []).map(normalizedEntry);
      const active = (teilnehmer.teilnehmer || []).filter(person => person.aktiv !== false);
      const tipsSet = new Set((tipps.tipps || []).filter(tip => tip.status !== "zurueckgezogen").map(tip => keyOf(tip.teilnehmerId, tip.spielId)));
      const map = teamMap(teams);
      const now = new Date();
      const upcoming = games(spieldaten).map(game => {
        const date = deadline(game);
        if (!date || date <= now) return null;
        return {
          spielId: game.id,
          begegnung: `${teamName(game,map,"heim")} – ${teamName(game,map,"auswaerts")}`,
          frist: date.toISOString(),
          fristAnzeige: formatDate(date),
          stunden: (date-now)/36e5,
          wettbewerb: game.wettbewerbAnzeige || game.wettbewerb || "Wettbewerb",
          runde: game.runde || "ohne Rundenangabe"
        };
      }).filter(Boolean);
      candidates = active.flatMap(person => upcoming.filter(game => !tipsSet.has(keyOf(person.id, game.spielId))).map(game => ({...game, teilnehmerId:person.id, teilnehmerName:person.name})));
      $("#jsonButton").disabled = false;
      $("#csvButton").disabled = false;
      $("#statusBadge").textContent = "Bereit";
      render();
    } catch (error) {
      $("#statusBadge").textContent = "Fehler";
      $("#message").innerHTML = `<div class="admin-notices"><p>${esc(error.message)}</p></div>`;
    }
  }

  function sentMap() { return new Map(entries.map(entry => [keyOf(entry.teilnehmerId, entry.spielId), entry])); }
  function filteredCandidates() {
    const hours = Number($("#rangeFilter").value);
    const query = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    const sent = sentMap();
    return candidates.filter(item => item.stunden <= hours && (!query || item.teilnehmerName.toLowerCase().includes(query))).filter(item => {
      const exists = sent.has(keyOf(item.teilnehmerId,item.spielId));
      return status === "all" || (status === "sent" ? exists : !exists);
    });
  }

  function summaryCard(title, value, description) { return `<article class="admin-card"><h3>${esc(title)}</h3><strong>${esc(value)}</strong><p>${esc(description)}</p></article>`; }

  function render() {
    const visible = filteredCandidates();
    const sent = sentMap();
    const openCount = candidates.filter(item => !sent.has(keyOf(item.teilnehmerId,item.spielId))).length;
    const people = new Set(entries.map(entry => entry.teilnehmerId)).size;
    const last = [...entries].sort((a,b)=>String(b.versendetAm).localeCompare(String(a.versendetAm)))[0];
    $("#summaryGrid").innerHTML = summaryCard("Protokolleinträge", entries.length, "dauerhaft exportierbare Versandnachweise") + summaryCard("Erreichte Teilnehmer", people, "mindestens einmal protokolliert") + summaryCard("Noch offen", openCount, "aktuelle Fälle ohne Protokolleintrag") + summaryCard("Letzter Eintrag", last ? formatDate(new Date(last.versendetAm)) : "–", last ? last.teilnehmerName : "noch kein Versand dokumentiert");
    $("#candidateBadge").textContent = `${visible.length} Fälle`;
    $("#logBadge").textContent = `${entries.length} Einträge`;
    $("#candidateList").innerHTML = visible.length ? visible.map((item,index) => {
      const existing = sent.get(keyOf(item.teilnehmerId,item.spielId));
      return `<article class="log-entry"><div class="log-entry-head"><div><h3>${esc(item.teilnehmerName)}</h3><p class="log-meta">${esc(item.begegnung)} · ${esc(item.wettbewerb)} · ${esc(item.runde)} · Frist ${esc(item.fristAnzeige)}</p></div><span class="log-state ${existing?'sent':'open'}">${existing?'protokolliert':'offen'}</span></div>${existing ? `<p>Versendet am ${esc(formatDate(new Date(existing.versendetAm)))} über ${esc(existing.kanal)}.</p>` : `<div class="log-fields"><label>Kanal<select data-channel="${index}"><option>WhatsApp</option><option>E-Mail</option><option>Telefon</option><option>Persönlich</option><option>Sonstiges</option></select></label><label>Bearbeiter<input data-editor="${index}" value="Spielleitung"></label><button class="admin-button mark-button" data-index="${index}" type="button">Als versendet markieren</button></div>`}</article>`;
    }).join("") : '<div class="admin-notices"><p>Keine Fälle im gewählten Filter.</p></div>';
    document.querySelectorAll(".mark-button").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.index); const item = visible[index];
      const channel = document.querySelector(`[data-channel="${index}"]`).value;
      const editor = document.querySelector(`[data-editor="${index}"]`).value.trim() || "Spielleitung";
      entries.push(normalizedEntry({teilnehmerId:item.teilnehmerId,teilnehmerName:item.teilnehmerName,spielId:item.spielId,begegnung:item.begegnung,frist:item.frist,kanal:channel,bearbeiter:editor,versendetAm:new Date().toISOString()}));
      render();
    }));
    $("#logRows").innerHTML = entries.length ? [...entries].sort((a,b)=>String(b.versendetAm).localeCompare(String(a.versendetAm))).map(entry => `<tr><td>${esc(formatDate(new Date(entry.versendetAm)))}</td><td>${esc(entry.teilnehmerName)}</td><td>${esc(entry.begegnung)}</td><td>${esc(entry.kanal)}</td><td>${esc(entry.bearbeiter)}</td><td><button class="admin-button danger-button delete-button" data-id="${esc(entry.id)}" type="button">Entfernen</button></td></tr>`).join("") : '<tr><td class="empty-row" colspan="6">Noch keine Erinnerung protokolliert.</td></tr>';
    document.querySelectorAll(".delete-button").forEach(button => button.addEventListener("click", () => { entries = entries.filter(entry => entry.id !== button.dataset.id); render(); }));
  }

  function exportObject() { return {schemaVersion:1,datenVersion:1,aktualisiert:new Date().toISOString(),saison,hinweis:"Manuell geführtes Protokoll versendeter Abgabe-Erinnerungen.",eintraege:entries}; }
  $("#reloadButton").addEventListener("click", build);
  ["searchInput"].forEach(id => $("#"+id).addEventListener("input", render));
  ["statusFilter","rangeFilter"].forEach(id => $("#"+id).addEventListener("change", render));
  $("#importFile").addEventListener("change", async event => { try { const file=event.target.files[0]; if(!file)return; const data=JSON.parse(await file.text()); if(!Array.isArray(data.eintraege)) throw new Error("Die Datei enthält keine gültige Eintragsliste."); entries=data.eintraege.map(normalizedEntry); $("#message").innerHTML='<div class="admin-notices"><p>Protokoll erfolgreich importiert. Für die dauerhafte Übernahme anschließend exportieren.</p></div>'; render(); } catch(error) { $("#message").innerHTML=`<div class="admin-notices"><p>${esc(error.message)}</p></div>`; } finally { event.target.value=""; } });
  $("#jsonButton").addEventListener("click", () => download("erinnerungsprotokoll.json", JSON.stringify(exportObject(),null,2)+"\n", "application/json"));
  $("#csvButton").addEventListener("click", () => { const rows=[["Zeitpunkt","Teilnehmer-ID","Teilnehmer","Spiel-ID","Begegnung","Frist","Kanal","Bearbeiter","Notiz"].join(";")].concat(entries.map(entry => [entry.versendetAm,entry.teilnehmerId,entry.teilnehmerName,entry.spielId,entry.begegnung,entry.frist||"",entry.kanal,entry.bearbeiter,entry.notiz].map(value=>`"${String(value).replaceAll('"','""')}"`).join(";"))); download("erinnerungsprotokoll.csv", "\ufeff"+rows.join("\n"), "text/csv"); });
  build();
})();
