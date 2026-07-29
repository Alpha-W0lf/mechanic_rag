"""Local garage root layout (~/var/mechanic_garage)."""

from __future__ import annotations

from pathlib import Path

from mecharag.garage_emit import DEFAULT_GARAGE_ROOT
from mecharag.garage_emit.allowlist import VehicleSpec

README_TEXT = """Personal garage private OEM corpus for Mechanic RAG.
Do NOT commit this tree to git. Drive is copy-source only (GD2).
"""


def resolve_garage_root(root: str | Path | None = None) -> Path:
    """Resolve garage root; prefers arg, else MECHANIC_GARAGE_ROOT, else default."""
    import os

    if root is not None:
        raw = Path(root)
    else:
        env = os.environ.get("MECHANIC_GARAGE_ROOT", "").strip()
        raw = Path(env) if env else Path(DEFAULT_GARAGE_ROOT)
    return raw.expanduser().resolve()


def ensure_layout(root: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    for name in ("inventory", "bronze", "gold", "receipts", "assets"):
        (root / name).mkdir(parents=True, exist_ok=True)
    readme = root / "README.txt"
    if not readme.is_file():
        readme.write_text(README_TEXT, encoding="utf-8")


def bronze_dir(root: Path, spec: VehicleSpec) -> Path:
    return root / "bronze" / spec.bronze_dirname


def gold_dir(root: Path, spec: VehicleSpec) -> Path:
    return root / "gold" / spec.gold_dirname


def inventory_path(root: Path) -> Path:
    return root / "inventory" / "corpus_inventory.json"


def free_bytes(path: Path) -> int:
    import shutil

    return shutil.disk_usage(path).free


def require_free_gib(path: Path, min_gib: float = 8.0) -> None:
    free = free_bytes(path)
    need = int(min_gib * 1024**3)
    if free < need:
        raise RuntimeError(
            f"free disk {free / 1024**3:.2f} GiB < {min_gib} GiB gate at {path}"
        )
