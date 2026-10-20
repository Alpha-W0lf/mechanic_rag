#!/usr/bin/env python3
"""Public fail-closed checks.

`public_fail_closed.py fixtures` checks the fixture corpus: no PDFs, no
private path tokens, no private rights class, fixture vehicle IDs only.

`public_fail_closed.py --tree .` checks every tracked file in the repo: no
PDFs anywhere, and images only under docs/assets/
plus the app favicon.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

FORBIDDEN_SUFFIXES = {".pdf"}
FORBIDDEN_RIGHTS = {"private_oem"}
FORBIDDEN_PATH_TOKENS = {"private_oem", "private_gold", "oem_pdf"}
IMAGE_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".tif", ".tiff", ".bmp", ".svg", ".ico",
}
ALLOWED_IMAGE_DIR = "docs/assets/"
ALLOWED_IMAGE_FILES = {"web/src/app/favicon.ico"}


def tracked_files(root: Path) -> list[str]:
    """Paths relative to root: git-tracked files, or every file outside git."""
    if not (root / ".git").exists():
        return [str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()]
    try:
        out = subprocess.run(
            ["git", "ls-files", "-z"], cwd=root, capture_output=True, check=True
        ).stdout.decode("utf-8")
        return [p for p in out.split("\0") if p]
    except (subprocess.CalledProcessError, FileNotFoundError):
        return [str(p.relative_to(root)) for p in root.rglob("*") if p.is_file()]


def check_tree(root: Path) -> list[str]:
    errors: list[str] = []
    for rel in tracked_files(root):
        suffix = Path(rel).suffix.lower()
        if suffix in FORBIDDEN_SUFFIXES:
            errors.append(f"forbidden PDF in tree: {rel}")
        if (
            suffix in IMAGE_SUFFIXES
            and not rel.startswith(ALLOWED_IMAGE_DIR)
            and rel not in ALLOWED_IMAGE_FILES
        ):
            errors.append(f"image outside {ALLOWED_IMAGE_DIR}: {rel}")
    return errors


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--tree":
        tree = Path(sys.argv[2] if len(sys.argv) > 2 else ".").resolve()
        tree_errors = check_tree(tree)
        if tree_errors:
            print("FAIL public tree check:")
            for e in tree_errors:
                print(f"  - {e}")
            return 1
        print(f"OK public tree check ({tree})")
        return 0

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
