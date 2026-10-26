TOSMC Live Website HF107

Basis:
- Live Website 4.9.2-HF12-HF106
- Port des auf Test2v2 TEST11 bestätigten Highscore-Darstellungsfixes

Änderung:
- In Wettbewerbs-Gesamtwertungen wird die fachlich bedeutungslose Spalte
  "Bonuspunkte" entfernt.
- Stattdessen werden vorhandene Wettbewerbswerte angezeigt:
  Rang | Spieler | Exakt | Differenz | Tendenz | Spieltagssiege | Gesamtpunkte
- Gesamt-Bonuswertung bleibt unverändert.
- Gesamt-Einzelwertung bleibt unverändert.
- Spieltagswertung und Teamwertung bleiben unverändert.

Sicherheitsumfang:
- Keine JSON-Dateien enthalten.
- Keine Wertungsdaten werden verändert.
- Keine Hall-of-Fame-, Historien-, Spielstands- oder Teilnehmerdaten werden verändert.

Geänderte Dateien:
- highscore.js
- highscore.html (nur Cache-Buster für highscore.js)
- VERSION.txt
