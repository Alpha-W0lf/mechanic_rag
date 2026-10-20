"""Bronze sync: copy allowlisted PDFs only; inventory + denylist gates."""

from __future__ import annotations

import json
import shutil
from dataclasses import asdict
from pathlib import Path
from typing import Any

from mecharag.garage_emit.allowlist import (
    Allowlist,
    VehicleSpec,
    is_denied_name,
    load_allowlist,
)
from mecharag.garage_emit.hashing import sha256_file
from mecharag.garage_emit.layout import (
    bronze_dir,
    ensure_layout,
    inventory_path,
)


class BronzeError(ValueError):
    pass


def _scan_bronze_violations(
    bdir: Path, spec: VehicleSpec, allowlist: Allowlist
) -> list[str]:
    issues: list[str] = []
    if not bdir.is_dir():
        return issues
    allowed = {m.filename for m in spec.manuals}
    for path in sorted(bdir.rglob("*")):
        if not path.is_file():
            continue
        name = path.name
        if is_denied_name(name, allowlist):
            issues.append(f"denied name present: {name}")
        if name in spec.exclude_filenames:
            issues.append(f"excluded file present: {name}")
        if name not in allowed and path.suffix.lower() == ".pdf":
            issues.append(f"unexpected PDF in bronze: {name}")
    return issues


def sync_vehicle_bronze(
    root: Path,
    vehicle_id: str,
    *,
    copy_from_source: bool = True,
    local_overrides: dict[str, Path] | None = None,
) -> dict[str, Any]:
    """Copy allowlisted manuals into bronze; return vehicle inventory slice."""
    ensure_layout(root)
    allowlist = load_allowlist()
    if vehicle_id not in allowlist.vehicles:
        raise KeyError(f"unknown vehicle_id: {vehicle_id}")
    spec = allowlist.vehicles[vehicle_id]
    bdir = bronze_dir(root, spec)
    bdir.mkdir(parents=True, exist_ok=True)
    overrides = local_overrides or {}

    files: list[dict[str, Any]] = []
    hash_to_name: dict[str, str] = {}
    for manual in spec.manuals:
        dest = bdir / manual.filename
        if manual.filename in overrides:
            src = overrides[manual.filename]
            if not src.is_file():
                raise BronzeError(f"local override missing: {src}")
            shutil.copy2(src, dest)
        elif copy_from_source:
            src = allowlist.source_root / manual.source
            if not src.is_file():
                raise BronzeError(f"source PDF missing: {src}")
            shutil.copy2(src, dest)
        else:
            if not dest.is_file():
                raise BronzeError(
                    f"bronze missing and source copy disabled: {dest}"
                )

        digest = sha256_file(dest)
        entry: dict[str, Any] = {
            "filename": manual.filename,
            "doc_family": manual.doc_family,
            "sha256": digest,
            "byte_length": dest.stat().st_size,
            "source": manual.source,
        }
        if digest in hash_to_name:
            entry["dedup_of"] = hash_to_name[digest]
        else:
            hash_to_name[digest] = manual.filename
        files.append(entry)

    issues = _scan_bronze_violations(bdir, spec, allowlist)
    if issues:
        raise BronzeError("; ".join(issues))

    return {
        "vehicle_id": spec.vehicle_id,
        "bronze_dirname": spec.bronze_dirname,
        "year": spec.year,
        "make": spec.make,
        "model": spec.model,
        "engine": spec.engine,
        "trim": spec.trim,
        "includes": files,
        "excludes_declared": list(spec.exclude_filenames),
    }


def write_inventory(root: Path, vehicles: list[dict[str, Any]]) -> Path:
    path = inventory_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_hint": "mechanic_garage_inventory/v1",
        "vehicles": vehicles,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def sync_all_bronze(
    root: Path,
    *,
    copy_from_source: bool = True,
    vehicle_ids: tuple[str, ...] | None = None,
) -> Path:
    order = vehicle_ids or load_allowlist().emit_order
    slices: list[dict[str, Any]] = []
    for vid in order:
        slices.append(sync_vehicle_bronze(root, vid, copy_from_source=copy_from_source))
    return write_inventory(root, slices)
