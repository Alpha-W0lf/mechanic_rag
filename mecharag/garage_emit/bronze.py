"""Bronze sync: copy allowlisted PDFs only; inventory + denylist gates."""

from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import asdict
from pathlib import Path
from typing import Any

from mecharag.garage_emit.allowlist import (
    EMIT_ORDER,
    VEHICLES,
    VehicleSpec,
    YXZ_EXCLUDE,
    is_denied_name,
    require_vehicle,
)
from mecharag.garage_emit.hashing import sha256_file
from mecharag.garage_emit.layout import (
    bronze_dir,
    ensure_layout,
    inventory_path,
)


class BronzeError(ValueError):
    pass


def _rclone_copyto(remote: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["rclone", "copyto", remote, str(dest)]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        raise BronzeError(
            f"rclone copyto failed ({proc.returncode}): {remote}\n"
            f"{proc.stderr or proc.stdout}"
        )


def _scan_bronze_violations(bdir: Path, spec: VehicleSpec) -> list[str]:
    issues: list[str] = []
    if not bdir.is_dir():
        return issues
    allowed = {m.filename for m in spec.manuals}
    for path in sorted(bdir.rglob("*")):
        if not path.is_file():
            continue
        name = path.name
        if is_denied_name(name):
            issues.append(f"denied name present: {name}")
        if spec.vehicle_id.endswith("yxz1000r-ss-se") and name in YXZ_EXCLUDE:
            issues.append(f"YXZ out-of-range present: {name}")
        if name not in allowed and path.suffix.lower() == ".pdf":
            issues.append(f"unexpected PDF in bronze: {name}")
    return issues


def sync_vehicle_bronze(
    root: Path,
    vehicle_id: str,
    *,
    use_rclone: bool = True,
    local_overrides: dict[str, Path] | None = None,
) -> dict[str, Any]:
    """Copy allowlisted manuals into bronze; return vehicle inventory slice."""
    ensure_layout(root)
    spec = require_vehicle(vehicle_id)
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
        elif use_rclone:
            _rclone_copyto(manual.drive_remote, dest)
        else:
            if not dest.is_file():
                raise BronzeError(
                    f"bronze missing and rclone disabled: {dest}"
                )

        digest = sha256_file(dest)
        entry: dict[str, Any] = {
            "filename": manual.filename,
            "doc_family": manual.doc_family,
            "sha256": digest,
            "byte_length": dest.stat().st_size,
            "drive_remote": manual.drive_remote,
        }
        if digest in hash_to_name:
            entry["dedup_of"] = hash_to_name[digest]
        else:
            hash_to_name[digest] = manual.filename
        files.append(entry)

    issues = _scan_bronze_violations(bdir, spec)
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
    use_rclone: bool = True,
    vehicle_ids: tuple[str, ...] | None = None,
) -> Path:
    order = vehicle_ids or EMIT_ORDER
    slices: list[dict[str, Any]] = []
    for vid in order:
        slices.append(sync_vehicle_bronze(root, vid, use_rclone=use_rclone))
    return write_inventory(root, slices)
