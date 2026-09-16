"use strict";

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function setText(id, value) {
  const el = $(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

function formatDate(dateString, timeString = "") {
  if (!dateString) return "Termin offen";
  const iso = `${dateString}T${timeString || "12:00"}:00`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return `${dateString} ${timeString}`.trim();
  return new Intl.DateTimeFormat("de-DE", {
    weekday:"short", day:"2-digit", month:"2-digit",
    hour:timeString ? "2-digit" : undefined,
    minute:timeString ? "2-digit" : undefined
  }).format(date);
}

function renderMatches(data) {
  setText("matchday-kicker", `${data.wettbewerb} · Saison ${data.saison}`);
  setText("matchday-title", `${data.spieltag}. Spieltag`);
  setText("matchday-state", data.status);
  setText("matchday-note", data.hinweis);
  setText("matchday-date", formatDate(data.startdatum));

  const root = $("match-list");
  if (!root) return;

  const matches = Array.isArray(data.spiele) ? data.spiele : [];
  if (!matches.length) {
    root.innerHTML = `
      <div class="empty-state">
        <strong>Die neue Jagd ist vorbereitet.</strong>
        <span>Sobald die offiziellen Paarungen feststehen, erscheinen sie hier automatisch mit Anstoßzeit und Ergebnis.</span>
      </div>`;
    return;
  }

  root.innerHTML = matches.map(match => {
    const scored = Number.isInteger(match.heimtore) && Number.isInteger(match.auswaertstore);
    const score = scored ? `${match.heimtore}:${match.auswaertstore}` : "–";
    return `
      <article class="match-card">
        <div class="match-date">${escapeHtml(formatDate(match.datum, match.uhrzeit))}</div>
        <div class="match-pairing">
          <span>${escapeHtml(match.heim || "Noch offen")}</span>
          <strong>${escapeHtml(score)}</strong>
          <span>${escapeHtml(match.auswaerts || "Noch offen")}</span>
        </div>
        <span class="badge">${escapeHtml(match.status || "geplant")}</span>
      </article>`;
  }).join("");
}

function renderTable(data) {
  setText("table-state", data.status);
  const body = $("league-table-body");
  if (!body) return;

  const teams = Array.isArray(data.teams) ? data.teams : [];
  if (!teams.length) {
    body.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty">
          Noch ist die Tabelle leer. Mit dem ersten abgeschlossenen Spieltag wird sie hier automatisch aufgebaut.
        </td>
      </tr>`;
    return;
  }

  body.innerHTML = teams.map((team,index) => {
    const pos = team.platz ?? index + 1;
    let cls = "";
    if (pos <= 4) cls = "position-europe";
    else if (pos === 16) cls = "position-relegation";
    else if (pos >= 17) cls = "position-danger";

    return `
      <tr class="${cls}">
        <td>${escapeHtml(pos)}</td>
        <td class="team-name">${escapeHtml(team.name)}</td>
        <td>${escapeHtml(team.spiele ?? 0)}</td>
        <td>${escapeHtml(team.siege ?? 0)}</td>
        <td>${escapeHtml(team.unentschieden ?? 0)}</td>
        <td>${escapeHtml(team.niederlagen ?? 0)}</td>
        <td>${escapeHtml(team.tore ?? "0:0")}</td>
        <td>${escapeHtml(team.differenz ?? 0)}</td>
        <td><strong>${escapeHtml(team.punkte ?? 0)}</strong></td>
      </tr>`;
  }).join("");
}

function renderTopPlayers(data) {
  setText("topplayers-state", data.status);
  const root = $("topplayers-grid");
  if (!root) return;

  const cats = Array.isArray(data.kategorien) ? data.kategorien : [];

  root.innerHTML = cats.map((item,index) => `
    <article class="stat-card">
      <span>${escapeHtml(item.titel)}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <em>${escapeHtml(item.wert)}</em>
    </article>
  `).join("");
}

function renderClub(data) {
  setText("champion-name", data.aktuellerChampion?.name);
  setText("champion-meta",
    [data.aktuellerChampion?.wettbewerb,data.aktuellerChampion?.titel,data.aktuellerChampion?.jahr]
      .filter(Boolean).join(" · ")
  );
  setText("record-total", `${data.rekorde?.gesamtpunkte?.wert ?? "–"} · ${data.rekorde?.gesamtpunkte?.name ?? ""}`);
  setText("record-bonus", `${data.rekorde?.bonuspunkte?.wert ?? "–"} · ${data.rekorde?.bonuspunkte?.name ?? ""}`);
  setText("record-exact", `${data.rekorde?.exakteTipps?.wert ?? "–"} · ${data.rekorde?.exakteTipps?.name ?? ""}`);

  const timeline = $("hall-timeline");
  if (!timeline) return;

  const entries = [
    ["Meister", data.meister?.saison, data.meister?.name],
    ["DFB-Pokal", data.dfbPokal?.saison, data.dfbPokal?.name],
    ["Champions League", data.championsLeague?.saison, data.championsLeague?.name],
    ["Weihnachtsregatta", data.weihnachtsregatta?.jahr, data.weihnachtsregatta?.name]
  ];

  timeline.innerHTML = entries.map(([title,season,name]) => `
    <div class="timeline-item">
      <span>${escapeHtml(season || "Noch offen")}</span>
      <div>
        <strong>${escapeHtml(title)}</strong><br>
        <small>${escapeHtml(name || "Noch offen")}</small>
      </div>
    </div>
  `).join("");
}

async function boot() {
  await Promise.allSettled([
    loadJson("./spieltag.json").then(renderMatches),
    loadJson("./bundesliga-tabelle.json").then(renderTable),
    loadJson("./topspieler.json").then(renderTopPlayers),
    loadJson("./clubdaten.json").then(renderClub)
  ]);
}


function startCountdown() {
  const target = new Date("2026-08-28T20:30:00+02:00").getTime();

  function update() {
    const distance = Math.max(0, target - Date.now());
    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);

    setText("countdown-days", String(days).padStart(2, "0"));
    setText("countdown-hours", String(hours).padStart(2, "0"));
    setText("countdown-minutes", String(minutes).padStart(2, "0"));
    setText("countdown-seconds", String(seconds).padStart(2, "0"));
  }

  update();
  window.setInterval(update, 1000);
}


document.addEventListener("DOMContentLoaded", () => {
  const menu = $("menu-button");
  const nav = $("main-nav");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
  }

  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  startCountdown();
  boot();
});
