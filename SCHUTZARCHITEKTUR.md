# TOSMC Schutzarchitektur 1.0

## Ziel

Website und Admin bleiben vollständig reparierbar und erweiterbar. Die Schutzarchitektur verhindert nicht Änderungen, sondern blockiert Pakete, deren tatsächliche Nebenwirkungen über den freigegebenen Änderungsumfang hinausgehen.

## Die zehn verbindlichen Schutzebenen

1. **Frische Referenz:** Jede Arbeit beginnt ausschließlich mit den neu bereitgestellten ZIPs. Versionsanzeige, `VERSION.txt` und `ADMIN_VERSION.txt` müssen übereinstimmen.
2. **Temporäre Baseline:** Ein bestätigter Stand ist Referenz, bis ein geprüfter Nachfolger ausdrücklich abgenommen wurde. Für jede Referenz wird ein SHA-256-Dateimanifest erzeugt.
3. **Änderungsplan:** Vor einer Änderung werden Zweck, Kategorie, erlaubte Dateien, geschützte Dateien und ausdrücklich erlaubte Ausnahmen maschinenlesbar festgelegt.
4. **Änderungsgrenzen:** Der Vorher-/Nachher-Vergleich blockiert jede neue, gelöschte oder veränderte Datei außerhalb des Plans.
5. **Gemeinsame Abhängigkeiten:** Gemeinsame Wettbewerbsdateien werden über alle acht Seiten geprüft. Cache-Kennungen von `wettbewerb.js` und `wettbewerb.css` müssen überall identisch sein.
6. **Kanonische Teamstammdaten:** Jedes in `spieldaten.json` verwendete Team benötigt offiziellen Anzeigenamen, lokalen Originalwappen-Eintrag und denselben Pfad in `teams.json`. Fantasie- oder Ersatzwappen blockieren die Freigabe.
7. **Ranglisten- und Datenspiegel:** `highscore.json`, `website-view.json` und ihre Gesamt-/Bonusspiegel müssen bei Teilnehmer-ID, Rang, Punkten, Bonuspunkten und S-Wert übereinstimmen. Doppelte oder leere Teilnehmer-IDs blockieren.
8. **Admin-Abschlusswächter:** Vor dem Erzeugen eines Teil- oder Endabschlusses prüft der Admin Dateiliste, Teilnehmerbestand, Ranglistenspiegel, fremde Wettbewerbe und fremde Spiele. Ein Fehler verhindert beide ZIP-Downloads.
9. **Paket- und Rückfallschutz:** Test und Live bleiben getrennt. Jedes Paket enthält Prüfergebnis und Änderungsnachweis; der vollständige Vorzustand bleibt als separate Referenz/Vollversion verfügbar.
10. **Automatische Freigabesperre:** Website-Repositories führen die Schutzprüfung bei Push, Pull Request und manuell aus. Ein rotes Ergebnis bedeutet: nicht veröffentlichen. Die Freigabe bleibt eine ausdrückliche menschliche Entscheidung.

## Änderungskategorien

| Kategorie | Bedeutung | Mindestprüfung |
|---|---|---|
| Lokal | Eine benannte Seite, Kachel oder isolierte Datei | Änderungsgrenze, geschützte Daten, betroffene Ansicht |
| Gemeinsam | Renderer, CSS, Wappen, Datenregister oder Cache-Logik | Alle acht Wettbewerbsseiten, Desktop/Mobil, leerer Cache |
| System | Admin-Rechenkern, Datenformat, Workflow oder Migration | Vollständige Regression, Vorher/Nachher, Rückfallpaket, Test-/Live-Parität |

## Admin-Sperren

### Teilabschluss

Zulässig sind ausschließlich `spielbetrieb.json`, `spieldaten.json`, `highscore.json` und `website-view.json`. Finale Wertungs-, Logbuch-, Hall-of-Fame- oder Topspieler-Artefakte sind gesperrt. Veränderungen an nicht ausgewählten Spielen oder Wettbewerben blockieren.

### Endabschluss

Alle 17 Pflichtdateien müssen vorhanden sein. Frühere Teilnehmer dürfen nicht physisch verschwinden; ein Ausscheiden erfolgt nur über `aktiv=false`. Fremde Spiele und Wettbewerbe bleiben unverändert. Spiegelranglisten müssen exakt konsistent sein.

## Bedienung

- Admin lokal: `SCHUTZPRUEFUNG_STARTEN.bat` ausführen.
- Website/Repository: GitHub-Aktion **TOSMC Schutzprüfung** abwarten.
- Geplanter Vorher-/Nachher-Vergleich: `node scripts/protection/tosmc-release-guard.mjs compare --before <REFERENZ> --after <KANDIDAT> --plan <PLAN.json>`.
- Ein Ergebnis mit `status: BLOCKED` darf nicht live gehen.

## Erweiterbarkeit

Neue Seiten, Wettbewerbe, Datenformate oder Pflichtdateien werden durch Änderung der versionierten Richtlinie `scripts/protection/tosmc-protection-policy.json` aufgenommen. Eine bewusste Erweiterung ist erlaubt, muss aber im Änderungsplan sichtbar sein und neue Regressionstests mitbringen. Schutzregeln werden nicht heimlich abgeschaltet.

## Bekannter Baseline-Befund vom 10.09.2026

- Live-Website HF64: Schutzprüfung bestanden; 75/75 verwendete Teams kanonisch und mit lokalen Originalwappen.
- Test2v2 mit Versionsanzeige HF64: Schutzprüfung blockiert, weil `teams.json` noch alte Schmugglersiegel verwendet und der Startseitenadapter den kanonischen Teamstammdatenweg nicht enthält.
- LiveAdmin HF20 und TestAdmin HF6: aktive Versionen waren korrekt, die beiden Versionsdateien waren jedoch veraltet. Die neuen Kandidaten HF21/HF7 korrigieren dies und blockieren künftige Abweichungen.

