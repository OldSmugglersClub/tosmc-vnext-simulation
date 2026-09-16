(() => {
  "use strict";

  const REGISTER_URL = "./schmugglersiegel/schmugglersiegel-register.json";
  const TEAMS_URL = "../../teams.json";
  const examples = [
    ["dynamo-dresden", "schalke-04"],
    ["dortmund", "bayern-muenchen"],
    ["liverpool", "real-madrid"]
  ];

  const gameRows = document.getElementById("gameRows");
  const fallbackRow = document.getElementById("fallbackRow");
  const status = document.getElementById("status");
  const sizeSelect = document.getElementById("sizeSelect");

  const loadJson = async url => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  };

  const initials = name => String(name || "?")
    .replace(/\b(FC|SC|SV|VfB|VfL|TSG|RB|1\.)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(word => word[0])
    .join("")
    .toUpperCase() || "?";

  const seal = (team, entry, size) => {
    const wrapper = document.createElement("span");
    wrapper.className = "seal-wrap";
    wrapper.style.setProperty("--seal-size", `${size}px`);

    if (!entry?.datei) {
      const fallback = document.createElement("span");
      fallback.className = "seal-fallback";
      fallback.textContent = initials(team?.name || team?.id);
      fallback.title = "Neutrales Fallback – kein Schmugglersiegel hinterlegt";
      wrapper.appendChild(fallback);
      return wrapper;
    }

    const image = document.createElement("img");
    image.src = `../../${entry.datei}`;
    image.alt = `Schmugglersiegel ${team.name}`;
    image.width = size;
    image.height = size;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      wrapper.replaceChildren();
      const fallback = document.createElement("span");
      fallback.className = "seal-fallback";
      fallback.textContent = entry.kuerzel || initials(team.name);
      fallback.title = "Fallback nach Ladefehler";
      wrapper.appendChild(fallback);
    }, { once: true });
    wrapper.appendChild(image);
    return wrapper;
  };

  const teamBlock = (team, entry, size, away = false) => {
    const block = document.createElement("div");
    block.className = away ? "team away" : "team";
    const name = document.createElement("span");
    name.className = "team-name";
    name.textContent = team.name;
    if (away) block.append(name, seal(team, entry, size));
    else block.append(seal(team, entry, size), name);
    return block;
  };

  const gameRow = (home, away, entries, size) => {
    const row = document.createElement("article");
    row.className = "game-row";
    const separator = document.createElement("span");
    separator.className = "separator";
    separator.textContent = "gegen";
    row.append(
      teamBlock(home, entries.get(home.id), size),
      separator,
      teamBlock(away, entries.get(away.id), size, true)
    );
    return row;
  };

  const renderStatus = (teamCount, sealCount, linkedCount) => {
    const values = [
      ["Mannschaften", teamCount, "aus teams.json"],
      ["Siegel", sealCount, "im SDS-Register"],
      ["Zuordnung", `${linkedCount}/${teamCount}`, linkedCount === teamCount ? "vollständig" : "unvollständig"]
    ];
    status.replaceChildren(...values.map(([label, value, detail]) => {
      const item = document.createElement("div");
      item.className = "status-item";
      item.innerHTML = `<strong>${label}: ${value}</strong><span>${detail}</span>`;
      return item;
    }));
  };

  const init = async () => {
    try {
      const [teamDoc, registerDoc] = await Promise.all([loadJson(TEAMS_URL), loadJson(REGISTER_URL)]);
      const teams = new Map((teamDoc.teams || []).map(team => [team.id, team]));
      const entries = new Map((registerDoc.siegeleintraege || []).map(entry => [entry.teamId, entry]));
      const render = () => {
        const size = Number(sizeSelect.value || 48);
        gameRows.replaceChildren(...examples.map(([homeId, awayId]) => gameRow(
          teams.get(homeId) || { id: homeId, name: homeId },
          teams.get(awayId) || { id: awayId, name: awayId },
          entries,
          size
        )));
        const known = teams.get("dynamo-dresden") || { id: "dynamo-dresden", name: "SG Dynamo Dresden" };
        const unknown = { id: "unbekannter-testverein", name: "Unbekannter Testverein" };
        fallbackRow.replaceChildren(gameRow(known, unknown, entries, size));
      };
      sizeSelect.addEventListener("change", render);
      render();
      const activeTeams = [...teams.values()].filter(team => team.aktiv !== false);
      const linked = activeTeams.filter(team => entries.has(team.id)).length;
      renderStatus(activeTeams.length, entries.size, linked);
    } catch (error) {
      gameRows.innerHTML = `<p>Integrationsprobe konnte nicht geladen werden: ${error.message}</p>`;
    }
  };

  init();
})();
