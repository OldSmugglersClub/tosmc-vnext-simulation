/* The Old Smugglers Club – Stalk-O-Meter 4.7.2-TEST1
 * Öffentliche, schreibgeschützte GoatCounter-Counter-Endpunkte.
 * Kein API-Key/Secret im Browser.
 * Diese Seite selbst wird absichtlich NICHT getrackt.
 */
(function () {
  'use strict';

  const base = 'https://oldsmugglersclub.goatcounter.com/counter/';
  const pages = [
    { label: 'Startseite', path: '/index.html' },
    { label: 'Saisonübersicht', path: '/saison-2026-2027.html' },
    { label: 'Ranglistenlogbuch', path: '/highscore.html' },
    { label: 'Spieltags-Logbuch', path: '/logbuch.html' },
    { label: 'Ehrenlogbuch', path: '/hall-of-fame.html' },
    { label: 'Bundesliga', path: '/bundesliga.html' },
    { label: 'DFB-Pokal', path: '/dfb-pokal.html' },
    { label: 'Champions League', path: '/champions-league.html' },
    { label: 'Europa League', path: '/europa-league.html' },
    { label: 'Relegation', path: '/relegation.html' },
    { label: 'Smuggleraufträge', path: '/dynamo-dresden.html' },
    { label: 'Piratenkodex', path: '/piratenkodex.html' },
    { label: 'Weihnachtsregatta', path: '/weihnachtsregatta.html' },
    { label: 'Coco – Das Orakel', path: '/coco' }
  ];

  const list = document.getElementById('stalk-list');
  const total = document.getElementById('stalk-total-count');
  const status = document.getElementById('stalk-total-status');
  const error = document.getElementById('stalk-error');

  const format = new Intl.NumberFormat('de-DE');

  function endpoint(path) {
    return base + encodeURIComponent(path) + '.json';
  }

  async function readCount(page) {
    const response = await fetch(endpoint(page.path), { cache: 'no-store' });
    if (response.status === 404) return { ...page, count: 0 };
    if (!response.ok) throw new Error('Counter HTTP ' + response.status);
    const data = await response.json();
    const count = Number.parseInt(data.count, 10);
    return { ...page, count: Number.isFinite(count) ? count : 0 };
  }

  function render(rows) {
    rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de'));
    list.replaceChildren();

    rows.forEach((row, index) => {
      const item = document.createElement('div');
      item.className = 'stalk-row';

      const rank = document.createElement('span');
      rank.className = 'stalk-rank';
      rank.textContent = String(index + 1) + '.';

      const label = document.createElement('span');
      label.className = 'stalk-label';
      label.textContent = row.label;

      const count = document.createElement('span');
      count.className = 'stalk-count';
      count.textContent = format.format(row.count);

      item.append(rank, label, count);
      list.appendChild(item);
    });
  }

  Promise.all(pages.map(readCount))
    .then(rows => {
      render(rows);
      const sum = rows.reduce((acc, row) => acc + row.count, 0);
      total.textContent = format.format(sum);
      status.textContent = 'Summe der unten aufgeführten Inhaltsseiten';
    })
    .catch(() => {
      total.textContent = '–';
      status.textContent = 'Aufrufzahlen derzeit nicht verfügbar';
      list.innerHTML = '<div class="stalk-empty">Keine Statistikdaten verfügbar.</div>';
      if (error) error.classList.remove('is-hidden');
    });
})();
