# Safety Boundaries

## Geschuetzte operative Referenzen

1. LiveAdmin
2. TestAdmin
3. Live-Repository
4. Test2v2-Repository

Diese vier Systeme muessen fuer vNext read-only bleiben. Sie dienen als operative Abrechnungsbasis fuer aktuelle Teil- und Vollabschluesse und duerfen durch die vNext-Entwicklung nicht veraendert werden.

## Erlaubte Schreibziele

- Dateien innerhalb des eigenstaendigen `tosmc-admin-vnext` Repositories
- explizit erzeugte interne Sandbox-Verzeichnisse innerhalb dieses vNext-Repositories
- explizit erzeugte temporaere Arbeitskopien, die nicht mit den vier geschuetzten Referenzen identisch sind

## Verboten

- direkter Commit nach Test2v2
- direkter Commit nach Live-Repo
- Schreibzugriff auf TestAdmin
- Schreibzugriff auf LiveAdmin
- automatische Git-Synchronisation in eines der geschuetzten Repositories

## Freigaberegel fuer spaetere produktive Integration

Eine spaetere Uebernahme aus vNext in operative Systeme darf nur als eigener, bewusst freigegebener Release-/Deployment-Prozess entwickelt werden. Dieser ist nicht Bestandteil der aktuellen Entwicklungsphase.
