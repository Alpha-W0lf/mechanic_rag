"""Unit tests for M1 page asset resolve/cache (no Poppler required for most)."""

from __future__ import annotations

from pathlib import Path

import pytest

from mecharag.page_assets import (
    asset_path,
    ensure_page_png,
    garage_root_from_env,
    reject_traversal_segment,
    resolve_bronze_pdf_from_locator,
    resolve_bronze_pdf_from_provenance,
)


def test_garage_root_env(monkeypatch, tmp_path: Path):
    monkeypatch.setenv("MECHANIC_GARAGE_ROOT", str(tmp_path))
    assert garage_root_from_env() == tmp_path.resolve()


def test_reject_traversal():
    assert reject_traversal_segment("../x")
    assert reject_traversal_segment("a/../b")
    assert not reject_traversal_segment("2015-triumph-street-triple")


def test_resolve_bronze_ok(tmp_path: Path):
    bronze = tmp_path / "bronze" / "triumph" / "manual.pdf"
    bronze.parent.mkdir(parents=True)
    bronze.write_bytes(b"%PDF-1.4\n")
    got = resolve_bronze_pdf_from_locator(tmp_path, "bronze/triumph/manual.pdf")
    assert got == bronze.resolve()


def test_resolve_bronze_missing(tmp_path: Path):
    assert resolve_bronze_pdf_from_locator(tmp_path, "bronze/nope.pdf") is None


def test_resolve_bronze_traversal(tmp_path: Path):
    assert resolve_bronze_pdf_from_locator(tmp_path, "../etc/passwd") is None
    assert resolve_bronze_pdf_from_locator(tmp_path, "/etc/passwd") is None


def test_resolve_from_provenance(tmp_path: Path):
    bronze = tmp_path / "bronze" / "t" / "a.pdf"
    bronze.parent.mkdir(parents=True)
    bronze.write_bytes(b"%PDF")
    assert (
        resolve_bronze_pdf_from_provenance(
            tmp_path, {"redacted_locator": "bronze/t/a.pdf"}
        )
        == bronze.resolve()
    )
    assert resolve_bronze_pdf_from_provenance(tmp_path, None) is None
    assert resolve_bronze_pdf_from_provenance(tmp_path, "{}") is None


def test_asset_path_and_unsafe():
    root = Path("/tmp/garage")
    p = asset_path(root, "cat:triumph", "doc-1", 3)
    assert p.name == "page_00003.png"
    assert "cat:triumph" in str(p)
    with pytest.raises(ValueError):
        asset_path(root, "../x", "doc", 1)


def test_ensure_cache_hit_skips_render(tmp_path: Path):
    bronze = tmp_path / "bronze" / "t" / "a.pdf"
    bronze.parent.mkdir(parents=True)
    bronze.write_bytes(b"%PDF")
    out = asset_path(tmp_path, "v1", "d1", 1)
    out.parent.mkdir(parents=True)
    out.write_bytes(b"PNGCACHE")
    # Cache hit returns before importing pdf2image.
    got = ensure_page_png(
        garage_root=tmp_path,
        bronze_pdf=bronze,
        vehicle_id="v1",
        document_id="d1",
        page=1,
    )
    assert got == out
    assert got.read_bytes() == b"PNGCACHE"
