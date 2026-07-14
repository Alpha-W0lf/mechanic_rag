#!/usr/bin/env python3
"""Public fail-closed check: no OEM/private PDFs or forbidden classes under fixtures."""

from __future__ import annotations

import json
import sys
from pathlib import Path

FORBIDDEN_SUFFIXES = {".pdf"}
FORBIDDEN_RIGHTS = {"private_oem"}
FORBIDDEN_PATH_TOKENS = {"private_oem", "private_gold", "oem_pdf"}


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "fixtures").resolve()
    errors: list[str] = []

    if not root.is_dir():
        print(f"FAIL: fixture root missing: {root}")
        return 1

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = str(path.relative_to(root)).lower()
        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            errors.append(f"forbidden PDF: {path}")
        for token in FORBIDDEN_PATH_TOKENS:
            if token in rel:
                errors.append(f"forbidden path token '{token}': {path}")
        if path.name in ("manifest.json", "manifest.template.json"):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                errors.append(f"invalid JSON {path}: {exc}")
                continue
            rights = data.get("rights_class")
            if rights in FORBIDDEN_RIGHTS:
                errors.append(f"forbidden rights_class in {path}: {rights}")
            vid = data.get("vehicle_id", "")
            if vid and not str(vid).startswith("fixture:"):
                errors.append(f"non-fixture vehicle_id in public fixtures: {path}")

    if errors:
        print("FAIL public fail-closed check:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print(f"OK public fail-closed check ({root})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
