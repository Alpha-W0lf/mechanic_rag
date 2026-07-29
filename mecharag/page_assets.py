"""M1 page assets — resolve bronze PDFs and cache full-page PNGs.

Business rule:
  Visual join key = (vehicle_id, document_id, page_number).
  Bronze PDF path = garage_root / provenance.redacted_locator
    (emit shape: bronze/<dirname>/<filename>).
  Reject path traversal (``..``, absolute escapes outside garage_root).
  Asset path = garage_root / assets / <vehicle_id> / <document_id> / page_NNNNN.png
  Rasterize on demand @150 DPI full page via pdf2image+Poppler; atomic write.
  Ask must never call ensure_page_png — only the asset HTTP path may render.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from pathlib import Path

from mecharag.garage_emit import DEFAULT_GARAGE_ROOT

PAGE_DPI = 150
PAGE_NAME_RE = re.compile(r"^page_(\d{5})\.png$")
_TRAVERSAL = re.compile(r"(^|/)\.\.(/|$)")


def garage_root_from_env(root: str | Path | None = None) -> Path:
    """Resolve garage root: explicit arg → MECHANIC_GARAGE_ROOT → default."""
    if root is not None:
        raw = Path(root)
    else:
        env = os.environ.get("MECHANIC_GARAGE_ROOT", "").strip()
        raw = Path(env) if env else Path(DEFAULT_GARAGE_ROOT)
    return raw.expanduser().resolve()


def _safe_under(root: Path, candidate: Path) -> Path | None:
    """Return resolved candidate if it stays under root; else None."""
    try:
        resolved = candidate.resolve()
        root_res = root.resolve()
        resolved.relative_to(root_res)
    except (OSError, ValueError):
        return None
    return resolved


def reject_traversal_segment(value: str) -> bool:
    """True if value is unsafe for path segments."""
    if not value or value.strip() != value:
        return True
    if _TRAVERSAL.search(value) or value.startswith("/") or "\\" in value:
        return True
    if "\x00" in value:
        return True
    return False


def asset_path(garage_root: Path, vehicle_id: str, document_id: str, page: int) -> Path:
    """Deterministic cache path for a page PNG."""
    if reject_traversal_segment(vehicle_id) or reject_traversal_segment(document_id):
        raise ValueError("unsafe vehicle_id or document_id")
    if page < 1 or page > 99999:
        raise ValueError("page out of range")
    return (
        garage_root
        / "assets"
        / vehicle_id
        / document_id
        / f"page_{page:05d}.png"
    )


def resolve_bronze_pdf_from_locator(
    garage_root: Path, redacted_locator: str | None
) -> Path | None:
    """Join garage_root / redacted_locator; fail closed on traversal/missing."""
    if not redacted_locator or not isinstance(redacted_locator, str):
        return None
    loc = redacted_locator.strip()
    if not loc or loc.startswith("/") or _TRAVERSAL.search(loc):
        return None
    candidate = garage_root / loc
    safe = _safe_under(garage_root, candidate)
    if safe is None or not safe.is_file():
        return None
    return safe


def resolve_bronze_pdf_from_provenance(
    garage_root: Path, provenance: dict | str | None
) -> Path | None:
    """Extract redacted_locator from provenance JSON/dict and resolve."""
    if provenance is None:
        return None
    if isinstance(provenance, str):
        try:
            provenance = json.loads(provenance)
        except json.JSONDecodeError:
            return None
    if not isinstance(provenance, dict):
        return None
    return resolve_bronze_pdf_from_locator(
        garage_root, provenance.get("redacted_locator")
    )


def ensure_page_png(
    *,
    garage_root: Path,
    bronze_pdf: Path,
    vehicle_id: str,
    document_id: str,
    page: int,
    dpi: int = PAGE_DPI,
) -> Path:
    """Return cached PNG path; render page if missing. Raises on render failure."""
    out = asset_path(garage_root, vehicle_id, document_id, page)
    if out.is_file() and out.stat().st_size > 0:
        return out

    safe_bronze = _safe_under(garage_root, bronze_pdf)
    if safe_bronze is None or not safe_bronze.is_file():
        raise FileNotFoundError(f"bronze PDF not under garage root: {bronze_pdf}")

    from pdf2image import convert_from_path  # lazy: optional until M1 install

    out.parent.mkdir(parents=True, exist_ok=True)
    images = convert_from_path(
        str(safe_bronze),
        dpi=dpi,
        first_page=page,
        last_page=page,
        fmt="png",
    )
    if not images:
        raise RuntimeError(f"pdf2image returned no page for {safe_bronze} p={page}")
    fd, tmp_name = tempfile.mkstemp(suffix=".png", dir=out.parent)
    tmp_path = Path(tmp_name)
    try:
        os.close(fd)
        images[0].save(tmp_path, format="PNG")
        tmp_path.replace(out)
    finally:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
    return out
