"""PrivateGold status sidecar and the gates for present-only private ingest."""

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
    """Load sidecars in preference order: root first, then per-release dirs.

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


def require_present_only_status(
    statuses: list[tuple[Path, dict[str, Any]]],
) -> tuple[Path, dict[str, Any]]:
    """Authorize present-only private ingest (fail closed).

    Rejects ``share_eligible=true`` on the present-only path
    (sharing and zero-gap publishing stay out of scope).
    """
    if not statuses:
        raise GoldStatusError(
            "present-only ingest requires gold_status.json "
            "(missing sidecar; fail closed)"
        )
    path, status = statuses[0]
    if status.get("share_eligible") is True:
        raise GoldStatusError(
            "present-only ingest rejects share_eligible=true "
            f"(path={path}; sharing is out of scope)"
        )
    present_only = status.get("present_only") is True
    zero_gap_false = status.get("zero_gap") is False
    if not (present_only or zero_gap_false):
        raise GoldStatusError(
            "present-only ingest requires present_only=true or zero_gap=false "
            f"(path={path})"
        )
    return path, status


def gold_status_log_message(status: dict[str, Any], path: Path) -> str:
    """Single INFO line — incomplete Gold must be unmistakable."""
    parts = [
        f"gold_status path={path}",
        f"schema_hint={status.get('schema_hint', '')!r}",
        f"zero_gap={status.get('zero_gap')!r}",
        f"publishable={status.get('publishable')!r}",
        f"present_only={status.get('present_only')!r}",
        f"complete_library={status.get('complete_library')!r}",
        f"share_eligible={status.get('share_eligible')!r}",
    ]
    notes = status.get("notes")
    if notes:
        parts.append(f"notes={notes!r}")
    parts.append("status-aware PrivateGold (may be incomplete)")
    return " ".join(parts)


def present_only_log_message(status: dict[str, Any], path: Path) -> str:
    """INFO line for present-only ingest."""
    return (
        f"present-only ingest {gold_status_log_message(status, path)}"
    )
