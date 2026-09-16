export function normalizeGoalGetters(rows) {
  if (!Array.isArray(rows)) {
    throw new Error("OpenLigaDB-Torjägerdaten sind kein Array.");
  }

  const normalized = rows.map((row, index) => {
    const name = String(
      row?.goalGetterName ?? row?.GoalGetterName ?? ""
    ).trim();
    const rawCount = row?.goalCount ?? row?.GoalCount;
    const tore = Number(rawCount);

    if (!name) {
      throw new Error(`Torjägereintrag ${index + 1}: Name fehlt.`);
    }
    if (!Number.isInteger(tore) || tore < 0) {
      throw new Error(`Torjägereintrag ${index + 1}: ungültige Torzahl.`);
    }

    return { name, tore };
  }).filter(entry => entry.tore > 0);

  const seen = new Set();
  for (const entry of normalized) {
    const key = entry.name.toLocaleLowerCase("de");
    if (seen.has(key)) {
      throw new Error(`Doppelter Torjägername in OpenLigaDB: ${entry.name}`);
    }
    seen.add(key);
  }

  // TEST27: Reihenfolge von OpenLigaDB unverändert bewahren.
  // Der erste von OpenLigaDB gelieferte Eintrag ist verbindlich Platz 1.
  return normalized;
}

export function sameSportingData(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  return JSON.stringify(left) === JSON.stringify(right);
}
