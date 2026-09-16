(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CocoOracle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 'COCO_ORACLE_V1';

  const RESULTS = {
    H: [
      ['1:0', 18], ['2:0', 16], ['2:1', 26], ['3:0', 7], ['3:1', 14],
      ['3:2', 8], ['4:0', 2], ['4:1', 5], ['4:2', 4]
    ],
    D: [['0:0', 18], ['1:1', 52], ['2:2', 25], ['3:3', 5]],
    A: [
      ['0:1', 18], ['0:2', 16], ['1:2', 26], ['0:3', 7], ['1:3', 14],
      ['2:3', 8], ['0:4', 2], ['1:4', 5], ['2:4', 4]
    ]
  };

  const PIRATE = {
    H: [['3:2', 28], ['4:2', 30], ['4:3', 27], ['5:3', 15]],
    D: [['2:2', 32], ['3:3', 48], ['4:4', 20]],
    A: [['2:3', 28], ['2:4', 30], ['3:4', 27], ['3:5', 15]]
  };

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function seed(gameId, channel) {
    return fnv1a(`${VERSION}|${gameId}|${channel}`);
  }

  function percentile(gameId, channel) {
    return seed(gameId, channel) / 0x100000000;
  }

  function weightedPick(items, p) {
    const total = items.reduce((sum, item) => sum + item[1], 0);
    let cursor = p * total;
    for (const [value, weight] of items) {
      if (cursor < weight) return value;
      cursor -= weight;
    }
    return items[items.length - 1][0];
  }

  function tendency(gameId) {
    const p = percentile(gameId, 'tendency');
    if (p < 0.45) return 'H';
    if (p < 0.72) return 'D';
    return 'A';
  }

  function predict(gameId) {
    if (!gameId) throw new Error('gameId required');
    const t = tendency(gameId);
    const pirate = percentile(gameId, 'pirate') < 0.05;
    const score = weightedPick(pirate ? PIRATE[t] : RESULTS[t], percentile(gameId, 'score'));
    const [home, away] = score.split(':').map(Number);
    return { version: VERSION, gameId, tendency: t, home, away, score, pirate };
  }

  function actualTendency(home, away) {
    if (home > away) return 'H';
    if (home < away) return 'A';
    return 'D';
  }

  function evaluate(prediction, home, away) {
    const exact = prediction.home === Number(home) && prediction.away === Number(away);
    const tendencyHit = prediction.tendency === actualTendency(Number(home), Number(away));
    return {
      exact,
      tendencyHit,
      label: exact ? 'Volltreffer' : tendencyHit ? 'Tendenztreffer' : 'Danebengepickt'
    };
  }

  return { VERSION, fnv1a, predict, evaluate, actualTendency };
});
