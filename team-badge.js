(() => {
  "use strict";
  const DEFAULT_ORIGINAL_REGISTER = "./assets/team-logos/original-team-logos.json";
  let registerPromise = null;
  let originalRegister = { teams: {} };

  const fetchRegistry = async url => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Originalwappen-Register konnte nicht geladen werden (${response.status})`);
    const data = await response.json();
    if (!data || typeof data !== "object" || !data.teams) throw new Error("Originalwappen-Register ist ungültig");
    return data;
  };

  const load = (_unused, originalUrl = DEFAULT_ORIGINAL_REGISTER) => {
    if (!registerPromise) registerPromise = fetchRegistry(originalUrl).then(data => (originalRegister = data));
    return registerPromise;
  };

  const resolve = (teamId, teamName) => ({ teamId, name: teamName || teamId || "Team" });
  const originalLogoPath = teamId => {
    const entry = originalRegister.teams?.[teamId];
    return typeof entry?.path === "string" && entry.path.trim() ? entry.path.trim() : null;
  };

  const reportMissingOriginal = (element, teamId, teamName, reason = "nicht registriert") => {
    element.replaceChildren();
    element.dataset.badgeSource = "missing-original";
    element.setAttribute("aria-label", `Originalwappen fehlt: ${teamName || teamId}`);
    console.error(`[Originalwappen] ${teamName || teamId} (${teamId}) ist ${reason}. Die Release-Prüfung muss diesen Zustand verhindern.`);
  };

  const render = (element, teamId, teamName, options = {}) => {
    if (!element) return;
    const logoPath = originalLogoPath(teamId);
    if (!logoPath) return reportMissingOriginal(element, teamId, teamName);
    const image = document.createElement("img");
    image.src = logoPath;
    image.alt = "";
    image.decoding = "async";
    image.loading = "eager";
    Object.assign(image.style, { width: "100%", height: "100%", display: "block", objectFit: "contain", objectPosition: "center" });
    image.addEventListener("error", () => reportMissingOriginal(element, teamId, teamName, `unter ${logoPath} nicht ladbar`), { once: true });
    element.hidden = false;
    element.replaceChildren(image);
    element.dataset.badgeSource = "original";
    element.setAttribute("aria-label", options.ariaLabel || `Vereinswappen ${teamName || teamId}`);
  };

  window.OSCTeamBadge = Object.freeze({ load, resolve, render, originalLogoPath });
})();
