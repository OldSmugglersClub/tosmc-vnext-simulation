from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[2]
files = [
    root / ".github/workflows/dynamo-terminimport-auto.yml",
    root / ".github/workflows/bundesliga-terminimport-auto.yml",
]

for path in files:
    text = path.read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    assert isinstance(data, dict), f"{path.name}: YAML ist nicht auswertbar"

    # Fachlich relevant: Der Workflow muss nach dem Terminimport den zentralen
    # Terminstand aktualisieren.
    assert "node scripts/schedule-terminstand.mjs" in text, (
        f"{path.name}: schedule-terminstand.mjs wird nicht ausgeführt"
    )

    # Fachlich relevant: Änderungen an BEIDEN Dateien müssen erkannt werden.
    # Die heutige Workflow-Fassung darf schedule-terminstand.json dabei
    # defensiv auf Existenz prüfen; eine alte wortgleiche Zwei-Datei-Zeile ist
    # ausdrücklich nicht mehr erforderlich.
    assert "git diff --quiet -- spieldaten.json" in text, (
        f"{path.name}: spieldaten.json fehlt in der Änderungsprüfung"
    )
    assert "schedule-terminstand.json" in text and "git diff --quiet -- schedule-terminstand.json" in text, (
        f"{path.name}: schedule-terminstand.json fehlt in der Änderungsprüfung"
    )

    # Fachlich relevant: Beide Dateien müssen bei einer Änderung commitfähig
    # vorgemerkt werden. Eine Existenzprüfung für den Terminstand ist zulässig
    # und sicherer als die historische starre git-add-Zeile.
    assert "git add spieldaten.json" in text, (
        f"{path.name}: spieldaten.json wird nicht zum Commit vorgemerkt"
    )
    assert "git add schedule-terminstand.json" in text, (
        f"{path.name}: schedule-terminstand.json wird nicht zum Commit vorgemerkt"
    )

print("HF14_P1_YAML_OK")
