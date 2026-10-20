"""Allowlist / denylist for a local private corpus.

The vehicle list is local config, not code: a JSON file at
``MECHANIC_GARAGE_ALLOWLIST``, or ``allowlist.json`` in the garage root
(``MECHANIC_GARAGE_ROOT``, default ``~/var/mechanic_garage``). The shape is
shown in ``allowlist.example.json`` next to this module. Vehicles are synced
and emitted in file order. Each manual's ``source`` is a path to a local PDF,
relative to ``source_root`` (or absolute); sync copies it into bronze.
Only the manuals listed here are ingested; any other file in the source
folder is ignored, and stray PDFs in bronze fail the sync.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from mecharag.garage_emit import DEFAULT_GARAGE_ROOT

DocFamily = Literal[
    "service_manual", "owners_manual", "wiring", "connectors"
]

EXAMPLE_PATH = Path(__file__).with_name("allowlist.example.json")


@dataclass(frozen=True)
class ManualSpec:
    """One included PDF source."""

    filename: str
    doc_family: DocFamily
    source: str  # local PDF path, relative to the allowlist's source_root


@dataclass(frozen=True)
class VehicleSpec:
    vehicle_id: str
    bronze_dirname: str
    gold_dirname: str
    year: int
    make: str
    model: str
    engine: str
    trim: str | None
    manuals: tuple[ManualSpec, ...]
    exclude_filenames: tuple[str, ...] = ()


@dataclass(frozen=True)
class Allowlist:
    vehicles: dict[str, VehicleSpec]
    deny_name_substr: tuple[str, ...]
    source_root: Path

    @property
    def emit_order(self) -> tuple[str, ...]:
        return tuple(self.vehicles)


# Partial downloads never belong in a corpus. Anything else to skip goes in
# the local allowlist's "deny_name_substr".
DENY_NAME_SUBSTR = (".crdownload", ".part")


def allowlist_path() -> Path:
    explicit = os.environ.get("MECHANIC_GARAGE_ALLOWLIST", "").strip()
    if explicit:
        return Path(explicit).expanduser()
    root = os.environ.get("MECHANIC_GARAGE_ROOT", "").strip() or DEFAULT_GARAGE_ROOT
    return Path(root).expanduser() / "allowlist.json"


def load_allowlist(path: Path | None = None) -> Allowlist:
    src = path or allowlist_path()
    if not src.is_file():
        raise FileNotFoundError(
            f"no garage allowlist at {src}; copy {EXAMPLE_PATH.name} there "
            "or set MECHANIC_GARAGE_ALLOWLIST"
        )
    raw = json.loads(src.read_text(encoding="utf-8"))
    vehicles: dict[str, VehicleSpec] = {}
    for v in raw.get("vehicles") or []:
        manuals = tuple(
            ManualSpec(m["filename"], m["doc_family"], m["source"])
            for m in v["manuals"]
        )
        spec = VehicleSpec(
            vehicle_id=v["vehicle_id"],
            bronze_dirname=v["bronze_dirname"],
            gold_dirname=v["gold_dirname"],
            year=int(v["year"]),
            make=v["make"],
            model=v["model"],
            engine=v["engine"],
            trim=v.get("trim"),
            manuals=manuals,
            exclude_filenames=tuple(v.get("exclude_filenames") or ()),
        )
        vehicles[spec.vehicle_id] = spec
    extra = tuple(s.lower() for s in raw.get("deny_name_substr") or ())
    source_root = Path(raw.get("source_root") or src.parent).expanduser()
    return Allowlist(
        vehicles=vehicles,
        deny_name_substr=DENY_NAME_SUBSTR + extra,
        source_root=source_root,
    )


def emit_order() -> tuple[str, ...]:
    return load_allowlist().emit_order


def is_denied_name(name: str, allowlist: Allowlist | None = None) -> bool:
    lower = name.lower()
    tokens = allowlist.deny_name_substr if allowlist else DENY_NAME_SUBSTR
    return any(token in lower for token in tokens)


def require_vehicle(vehicle_id: str) -> VehicleSpec:
    vehicles = load_allowlist().vehicles
    if vehicle_id not in vehicles:
        raise KeyError(f"unknown vehicle_id: {vehicle_id}")
    return vehicles[vehicle_id]
