# The Old Smugglers Club

Offizielle Website der Tipprunde **The Old Smugglers Club**.

## Version

Aktueller Stand: **3.3 – Benutzeroberfläche, Barrierefreiheit und Responsive Feinschliff**

## Veröffentlichung auf GitHub Pages

Der gesamte Inhalt dieses Verzeichnisses gehört direkt in das Hauptverzeichnis des GitHub-Repositories. `index.html` darf nicht in einem zusätzlichen Unterordner liegen.

Für Updates muss nicht zwingend das komplette Paket erneut hochgeladen werden. Die Datei `GITHUB-UPDATE-3.3.md` nennt exakt, welche Dateien ersetzt, neu hinzugefügt oder gelöscht werden müssen.

## Zentrale Dokumentation

- `CHANGELOG.md` – Versionshistorie
- `INSTALLATION.md` – Installation und Veröffentlichung
- `ADMIN-HANDBUCH.md` – Pflegehinweise
- `DATENSTRUKTUR.md` – Datenquellen und Struktur
- `BACKUP_RESTORE.md` – Sicherung und Wiederherstellung
- `RELEASE_NOTES_v3.3.md` – Hinweise zu diesem Release

## Administrationszentrum
Die Seite `admin.html` prüft die zentral registrierten Datenquellen, zeigt Versions- und Ladeinformationen und kann einen Systembericht als JSON exportieren. Sie verändert keine Daten.

## Version 3.5
Das Administrationszentrum prüft exportierte Datensicherungen lokal, meldet fehlende oder unbekannte Quellen und erzeugt einen manuellen Importplan. Eine automatische Änderung des GitHub-Repositories findet nicht statt.


## Daten-Cockpit
Die Seite `daten-cockpit.html` zeigt alle Wettbewerbe, Spielstände und den zentralen Integritätsstatus in einer lesenden Übersicht.
