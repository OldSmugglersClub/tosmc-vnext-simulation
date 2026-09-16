# INSTALLATION – Phase 6A

## Einspielen
1. Produktives Repository auf Basis **4.7.2-HF3-HF6** verwenden.
2. Dieses ZIP entpacken.
3. Die Verzeichnisse `.github` und `scripts` in den Repository-Stamm kopieren.
4. Es werden dabei genau drei neue Betriebsdateien ergänzt.
5. GitHub Desktop kontrollieren.
6. Commit-Vorschlag:
   `Phase 6A – Bundesliga Autoimport`
7. `Push origin`.

## Erstinbetriebnahme
Nach dem Push:
1. GitHub → Actions.
2. Workflow **Bundesliga Ergebnisse – automatisch** öffnen.
3. Einmal manuell starten.
4. Außerhalb eines Ergebnisfensters muss der Lauf grün enden.
5. Erwartete Meldungen:
   - `KEIN API-ABRUF`
   - `Keine Änderung an spieldaten.json – kein Commit.`
6. Prüfen, dass kein automatischer Ergebnis-Commit entstanden ist.

Danach darf der vorhandene Cron regulär laufen.

## Verhalten bei echtem Ergebnis
Liegt ein bestätigtes neues Endergebnis vor:
- Ergebnis wird nach vollständiger Validierung in `spieldaten.json` geschrieben;
- `datenVersion` steigt exakt um 1;
- GitHub Action erzeugt einen Commit ausschließlich für `spieldaten.json`.

## Sofortmaßnahme bei Auffälligkeit
Workflow in GitHub Actions deaktivieren und keine manuelle Änderung an
`spieldaten.json` vornehmen, bis der konkrete Lauf geprüft wurde.
