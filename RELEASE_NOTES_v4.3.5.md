# Version 4.3.5 – Trennerkorrektur Startzentrale

Der weiterhin sichtbare diagonale Balken stammte aus einem CSS-Konflikt: Eine ältere Regel gab dem mittleren Rautenelement des Überschriftentrenners `flex: 1` und einen Verlauf. Dadurch wurde das kleine Element langgezogen und um 45 Grad gedreht.

Die Raute besitzt nun eine feste Größe, keinen geerbten Verlauf und kann nicht mehr wachsen. Bilder, Inhalte, Kachelgrößen und Datenlogik bleiben unverändert.
