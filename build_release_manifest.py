#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
REF_RE = re.compile(r'''(?:src|href)\s*=\s*["']([^"'#?]+)|fetch\(\s*["']([^"']+)["']''', re.I)
SKIP = ("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "//")

html_files = sorted(ROOT.glob("*.html"))
js_files = sorted(ROOT.glob("*.js"))
json_files = sorted(ROOT.glob("*.json"))
missing = []
checked_refs = set()
json_errors = []

for file in html_files + js_files:
    text = file.read_text(encoding="utf-8", errors="replace")
    for match in REF_RE.finditer(text):
        ref = next((g for g in match.groups() if g), "").strip()
        if not ref or ref.startswith(SKIP):
            continue
        ref = ref.split("?")[0].split("#")[0]
        if not ref or "${" in ref or ref.startswith("/"):
            continue
        target = (file.parent / ref).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            continue
        key = (file.name, ref)
        if key in checked_refs:
            continue
        checked_refs.add(key)
        if not target.exists():
            missing.append({"source": file.name, "reference": ref})

for file in json_files:
    try:
        json.loads(file.read_text(encoding="utf-8"))
    except Exception as exc:
        json_errors.append({"file": file.name, "error": str(exc)})

required = ["index.html", "VERSION.txt", "CHANGELOG.md", "README.md", "datenregister.json", "datenmodell.js", "RELEASE-MANIFEST.json", "admin.html", "admin.css", "admin.js"]
missing_required = [name for name in required if not (ROOT / name).exists()]
version = (ROOT / "VERSION.txt").read_text(encoding="utf-8").strip() if (ROOT / "VERSION.txt").exists() else None
status = "OK" if not missing and not json_errors and not missing_required and version == "3.7.2" else "FEHLER"
report = {
    "auditVersion": "3.7.2",
    "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
    "status": status,
    "version": version,
    "counts": {"html": len(html_files), "javascript": len(js_files), "json": len(json_files), "referencesChecked": len(checked_refs)},
    "missingRequiredFiles": missing_required,
    "missingLocalReferences": missing,
    "jsonErrors": json_errors,
}
(ROOT / "RELEASE-AUDIT.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(0 if status == "OK" else 1)
