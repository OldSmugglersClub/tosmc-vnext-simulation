(function () {
  "use strict";
  const CONFIG_PATH = "./website-mitteilung.json";
  const STORAGE_PREFIX = "tosmc-website-mitteilung-bestaetigt:";
  let config = null;
  let timer = null;
  let overlay = null;
  let previousFocus = null;

  function berlinWallTime(date) {
    const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).reduce((result, part) => { if (part.type !== "literal") result[part.type] = part.value; return result; }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  }
  function normalized(value) { const text = String(value || "").trim().replace(" ", "T"); return text.length === 16 ? text + ":00" : text.slice(0, 19); }
  function valid(candidate) {
    return candidate && candidate.schemaVersion === 1 && typeof candidate.id === "string" && candidate.id.trim() && typeof candidate.enabled === "boolean" && candidate.timeZone === "Europe/Berlin" && typeof candidate.headline === "string" && candidate.headline.trim() && typeof candidate.message === "string" && candidate.message.trim() && normalized(candidate.startsAt) && normalized(candidate.endsAt) && normalized(candidate.startsAt) < normalized(candidate.endsAt) && typeof candidate.buttonLabel === "string" && candidate.buttonLabel.trim();
  }
  function previewRequested() { return new URLSearchParams(window.location.search).get("hinweis-vorschau") === "1"; }
  function acknowledged() { try { return sessionStorage.getItem(STORAGE_PREFIX + config.id) === "1"; } catch (error) { return false; } }
  function isActive() { if (!config || !config.enabled) return false; if (previewRequested()) return true; const now = berlinWallTime(new Date()); return now >= normalized(config.startsAt) && now < normalized(config.endsAt); }
  function createOverlay() {
    const root = document.createElement("div"); root.className = "tosmc-notice-overlay"; root.hidden = true;
    const dialog = document.createElement("section"); dialog.className = "tosmc-notice-dialog"; dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", "tosmcNoticeHeadline");
    if (previewRequested()) { const preview = document.createElement("p"); preview.className = "tosmc-notice-preview"; preview.textContent = "Vorschau der zeitgesteuerten Mitteilung"; dialog.appendChild(preview); }
    const kicker = document.createElement("p"); kicker.className = "tosmc-notice-kicker"; kicker.textContent = "The Old Smugglers Club";
    const headline = document.createElement("h2"); headline.id = "tosmcNoticeHeadline"; headline.textContent = config.headline;
    const message = document.createElement("p"); message.className = "tosmc-notice-message"; message.textContent = config.message;
    const button = document.createElement("button"); button.className = "tosmc-notice-button"; button.type = "button"; button.textContent = config.buttonLabel;
    button.addEventListener("click", function () { try { sessionStorage.setItem(STORAGE_PREFIX + config.id, "1"); } catch (error) {} closeOverlay(); });
    dialog.append(kicker, headline, message, button); root.appendChild(dialog); document.body.appendChild(root); return root;
  }
  function openOverlay() { if (!overlay) overlay = createOverlay(); if (!overlay.hidden) return; previousFocus = document.activeElement; overlay.hidden = false; document.body.style.overflow = "hidden"; overlay.querySelector("button").focus(); }
  function closeOverlay() { if (!overlay || overlay.hidden) return; overlay.hidden = true; document.body.style.overflow = ""; if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus(); }
  function evaluate() { if (isActive() && (previewRequested() || !acknowledged())) openOverlay(); else closeOverlay(); }
  async function load() {
    try { const response = await fetch(CONFIG_PATH + "?t=" + Date.now(), { cache: "no-store" }); if (!response.ok) throw new Error("Konfiguration nicht erreichbar"); const candidate = await response.json(); if (!valid(candidate)) throw new Error("Konfiguration ungültig"); config = candidate; evaluate(); timer = window.setInterval(evaluate, 30000); }
    catch (error) { console.warn("Website-Mitteilung bleibt deaktiviert:", error); closeOverlay(); }
  }
  document.addEventListener("keydown", function (event) { if (event.key === "Tab" && overlay && !overlay.hidden) { const button = overlay.querySelector("button"); if (document.activeElement !== button) { event.preventDefault(); button.focus(); } } });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true }); else load();
  window.addEventListener("pagehide", function () { if (timer) window.clearInterval(timer); });
}());
