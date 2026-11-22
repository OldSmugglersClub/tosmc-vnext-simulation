# TOSMC vNext 4.11.9 – Coco Aktuelle Tippserie

Basis der beiden Coco-Dateien: GitHub OldSmugglersClub/tosmc-vnext-simulation, main, Stand 22.11.2026, Commit 777c2910bcdb40aa36aa947b6fead30a71301566.
Die Basisdateien sind bytegleich zum hochgeladenen vNext-Archiv vom 21.11.2026.
Referenz: bestätigter operativer Commit 7fc4394b567214e1a11fcf1f6fa0a5490a6b1603 (LIVE 4.9.15).
Letzter vom Nutzer bestätigter Website-Stand: 4.11.8; GitHub VERSION.txt war bei Quellprüfung noch 4.11.7.

Installation manuell ins Repository OldSmugglersClub/tosmc-vnext-simulation:
- coco/coco.js ersetzen
- coco/index.html ersetzen
- VERSION.txt auf 4.11.9 setzen
Keine sonstigen Website-Dateien oder Icons verändern.

Funktion:
- Kachel Aktuelle Tippserie
- Rückwärtszählung ab jüngstem ausgewerteten Spiel
- Ein Fehltipp: 1 / Fehltipp in Folge
- Mehrere Fehltipps: Anzahl / Fehltipps in Folge
- Treffer: Anzahl / Treffer in Folge (Volltreffer zählen)
- Keine ausgewerteten Spiele: – / Noch keine Auswertung

Prüfung: Node-Syntax bestanden; 9 Fälle der Zähl-/Anzeigelogik bestanden; exakter Rückdiff auf unveränderte Quelldateien bestanden; ZIP-CRC und Hashes. Reale Browseransicht und Benutzerfreigabe offen.
