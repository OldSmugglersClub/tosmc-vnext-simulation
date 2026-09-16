# Release Notes 4.1.3

Diese Korrektur behebt ausschließlich den Darstellungsfehler in der Hall-of-Fame-Kachel auf der Startseite.

Ursache war eine CSS-Regel, die das HTML-Attribut `hidden` des Pokal-Fallbacks übersteuerte. Dadurch wurde zusätzlich zum vorhandenen Pokalbild das Wort „POKAL“ in extremer Größe angezeigt und die gesamte Kachel unnötig verlängert.

Die Fallback-Anzeige erscheint nun nur noch, wenn das Pokalbild tatsächlich nicht geladen werden kann.

Es wurden keine Bilder erstellt oder verändert. Desktop-Raster, Kachelmaße, Navigation und Datenlogik bleiben unverändert.
