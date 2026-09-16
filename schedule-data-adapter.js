(function(){
  "use strict";

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} konnte nicht geladen werden (${response.status})`);
    return response.json();
  };


  const mergePersistentSchedule = async gamesDoc => {
    let snapshot;
    try { snapshot=await fetchJson("./schedule-terminstand.json"); }
    catch(_){ return gamesDoc; }

    const entries=snapshot&&snapshot.entries&&typeof snapshot.entries==="object"?snapshot.entries:{};
    const clone=JSON.parse(JSON.stringify(gamesDoc));
    const seasons=Array.isArray(clone.saisons)?clone.saisons:[];

    seasons.forEach(season=>(season.spiele||[]).forEach(game=>{
      const saved=entries[game.id];
      if(!saved||saved.terminBestaetigt!==true) return;

      const localConfirmed=game.terminBestaetigt===true&&game.datum&&game.anstoss;
      const localStand=String(game.quelleStand||"");
      const savedStand=String(saved.quelleStand||"");

      // Persistenz ist Rückfallschutz, keine zweite fachliche Wahrheit:
      // - unbestätigte/geleerte Admin-Daten dürfen einen bestätigten Termin nicht vernichten;
      // - ein neuerer verifizierter lokaler Termin gewinnt gegen den Snapshot;
      // - bei gleichem Quellenstand gewinnt der aktuelle lokale Datensatz.
      if(!localConfirmed || (savedStand && (!localStand || savedStand>localStand))){
        Object.assign(game,saved);
      }
    }));
    return clone;
  };

  const validSchedule = schedule => schedule && typeof schedule === "object"
    && Array.isArray(schedule.games)
    && Array.isArray(schedule.matchdays)
    && Array.isArray(schedule.teams);

  async function loadSchedule(){
    try {
      const websiteView = await fetchJson("./website-view.json");
      if (validSchedule(websiteView.schedule)) {
        const schedule = websiteView.schedule;
        // Teamname und Wappen stammen immer aus den verbindlichen zentralen
        // Stammdaten. Der eingebettete Website-Snapshot darf diese Angaben
        // nicht mit einem älteren oder unvollständigen Stand überschreiben.
        let canonicalTeams = schedule.teams;
        try {
          const teamsDocument = await fetchJson("./teams.json");
          if (Array.isArray(teamsDocument?.teams) && teamsDocument.teams.length) {
            canonicalTeams = teamsDocument.teams;
          }
        } catch (teamError) {
          console.error("Verbindliche Teamstammdaten konnten nicht geladen werden.", teamError);
        }
        const activeSeason = schedule.activeSeason || websiteView.saison || "2026-27";
        return {
          source: "website-view.json",
          diagnostics: { source: "website-view.json", fallback: false },
          config: {
            locale: schedule.locale || "de-DE",
            testJetzt: schedule.testNow || "",
            liveDauerMinuten: schedule.liveDurationMinutes || 120,
            hinweisAnzeigen: Boolean(schedule.notice),
            hinweis: schedule.notice || "",
            uebersichtLink: schedule.overviewLink || "./saison-2026-2027.html",
            uebersichtButtonText: schedule.overviewButtonText || "Spieltagslogbuch",
            kicktippLink: schedule.kicktippLink || "",
            kicktippButtonText: schedule.kicktippButtonText || ""
          },
          games: await mergePersistentSchedule({ aktiveSaison: activeSeason, saisons: [{ id: activeSeason, spiele: schedule.games }] }),
          teams: { teams: canonicalTeams },
          matchdays: {
            aktiveSaison: activeSeason,
            saisons: [{ id: activeSeason, aktiv: true, tippspieltage: schedule.matchdays }]
          }
        };
      }
    } catch (error) {
      console.warn("Zentrale Spielbetriebsdaten nicht verfügbar, Rückfall auf 4.6.1-Dateien.", error);
    }

    const registry = window.OSCDataRegistry;
    const [configUrl, gamesUrl, teamsUrl, matchdaysUrl] = registry
      ? await Promise.all([
          registry.url("spieltag"), registry.url("spiele"),
          registry.url("teams"), registry.url("tippspieltage")
        ])
      : ["./spieltag.json", "./spieldaten.json", "./teams.json", "./tippspieltage.json"];

    const [config, gamesRaw, teams, matchdays] = await Promise.all([
      fetchJson(configUrl), fetchJson(gamesUrl), fetchJson(teamsUrl), fetchJson(matchdaysUrl)
    ]);
    const games = await mergePersistentSchedule(gamesRaw);
    return {
      source: "legacy+persistent-terminstand",
      diagnostics: { source: "legacy+persistent-terminstand", fallback: true },
      config, games, teams, matchdays
    };
  }

  window.OSCScheduleDataAdapter = Object.freeze({ loadSchedule });
})();
