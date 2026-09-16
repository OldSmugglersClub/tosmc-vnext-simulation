#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE = {"RELEASE-MANIFEST.json"}
entries = []
for path in sorted(p for p in ROOT.rglob("*") if p.is_file()):
    rel = path.relative_to(ROOT).as_posix()
    if rel in EXCLUDE or rel.startswith(".git/"):
        continue
    data = path.read_bytes()
    entries.append({
        "path": rel,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    })
manifest = {
    "manifestVersion": "4.0.3",
    "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
    "fileCount": len(entries),
    "files": entries,
}
(ROOT / "RELEASE-MANIFEST.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps({"status": "OK", "fileCount": len(entries)}, ensure_ascii=False))
