"""Optional PrivateGold status sidecar (Guide 12 — S1, no Contract 7.2 fork)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SIDECAR_BASENAME = "gold_status.json"
SCHEMA_HINT = "mechanic_gold_status/v1"


class GoldStatusError(ValueError):
    pass


def load_optional_sidecar(path: Path) -> dict[str, Any] | None:
    """Return parsed sidecar object, None if missing, or raise if present but invalid."""
    if not path.is_file():
        return None
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise GoldStatusError(
            f"gold_status sidecar unreadable/invalid JSON: {path}: {exc}"
        ) from exc
    if not isinstance(raw, dict):
        raise GoldStatusError(
            f"gold_status sidecar must be a JSON object: {path}"
        )
    return raw


def collect_gold_status(
    gold_root: Path,
    *,
    release_paths: list[Path] | None = None,
) -> list[tuple[Path, dict[str, Any]]]:
    """Load sidecars in Ready preference order: root first, then per-release dirs.

    Missing sidecars are OK. Duplicate paths are skipped.
    """
    root = gold_root.resolve()
    ordered: list[Path] = [root / SIDECAR_BASENAME]
    seen: set[Path] = {ordered[0].resolve()}

    if release_paths:
        for release in release_paths:
            candidate = (release.parent / SIDECAR_BASENAME).resolve()
            if candidate in seen:
                continue
            seen.add(candidate)
            ordered.append(candidate)

    # Also scan one level of subdirs for P1 layout when no releases yet
    if release_paths is None and root.is_dir():
        for child in sorted(root.iterdir()):
            if not child.is_dir():
                continue
            candidate = (child / SIDECAR_BASENAME).resolve()
            if candidate in seen:
                continue
            seen.add(candidate)
            ordered.append(candidate)

    out: list[tuple[Path, dict[str, Any]]] = []
    for path in ordered:
        status = load_optional_sidecar(path)
        if status is not None:
            out.append((path, status))
    return out


def honesty_log_message(status: dict[str, Any], path: Path) -> str:
    """Single INFO line — incomplete Gold must be unmistakable."""
    parts = [
        f"gold_status path={path}",
        f"schema_hint={status.get('schema_hint', '')!r}",
        f"zero_gap={status.get('zero_gap')!r}",
        f"publishable={status.get('publishable')!r}",
        f"present_only={status.get('present_only')!r}",
        f"complete_library={status.get('complete_library')!r}",
    ]
    notes = status.get("notes")
    if notes:
        parts.append(f"notes={notes!r}")
    parts.append("honesty: incomplete/status-aware PrivateGold ≠ dual-product Done")
    return " ".join(parts)
