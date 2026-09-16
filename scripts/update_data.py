#!/usr/bin/env python3
"""Validiert die JSON-Datendateien der Website.

Die spätere API-Anbindung wird in diesem Skript ergänzt.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys

FILES = (
    "clubdaten.json",
    "spieltag.json",
    "bundesliga-tabelle.json",
    "topspieler.json",
    "systemstatus.json",
)

def validate(root: Path) -> int:
    errors = 0
    for name in FILES:
        path = root / name
        try:
            with path.open("r", encoding="utf-8") as handle:
                json.load(handle)
            print(f"OK: {name}")
        except Exception as exc:
            errors += 1
            print(f"FEHLER: {name}: {exc}", file=sys.stderr)
    return errors

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    return 1 if validate(root) else 0

if __name__ == "__main__":
    raise SystemExit(main())
