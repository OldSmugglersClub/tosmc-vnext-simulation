# TOSMC Admin vNext

Sichere Entwicklungsbasis fuer das eigenstaendige Repository `OldSmugglersClub/tosmc-admin-vnext`.

## Verbindliche Sicherheitsgrenze

Die folgenden vier operativen Systeme sind ausschliesslich Referenzquellen und duerfen von vNext niemals beschrieben werden:

- LiveAdmin
- TestAdmin
- Live-Repository
- Test2v2-Repository

Alle kuenftigen Schreibtests, Snapshots, Commits und Rollbacks finden ausschliesslich innerhalb des eigenstaendigen vNext-Repositories oder in daraus erzeugten Sandboxes/Arbeitskopien statt.

## Aktueller Stand

Diese Repo-Basis entspricht fachlich dem bestaetigten Stand nach vNext 1.9.0:

- historische Regression: 9/9 Abschluesse bestanden
- State-Gates: 9/9 bestanden
- vollstaendige Replay-Kette bis zu 18 Abschlussartefakten validiert
- Transaktionsmechanik zuvor in isolierten Arbeitskopien getestet
- kein direkter Schreibpfad auf operative Referenzsysteme enthalten

Die verworfene `2.0.0 Direct Test2v2 Commit`-Variante ist **nicht** Bestandteil dieses Repositories.

## Start unter Windows

`START_VNEXT.bat` starten. Der lokale Server verwendet Port 8877.

## Entwicklung

Neue Schreibfunktionen muessen technisch auf das vNext-Repo bzw. dessen interne Sandbox begrenzt sein. Ein Pfad, der LiveAdmin, TestAdmin, Live-Repo oder Test2v2 als Schreibziel akzeptiert, ist unzulaessig.
