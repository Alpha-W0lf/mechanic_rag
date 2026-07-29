"""Tests for personal garage allowlist, denylist, emit (synthetic)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from pypdf import PdfWriter

from mecharag.garage_emit.allowlist import (
    YXZ_EXCLUDE,
    is_denied_name,
    require_vehicle,
)
from mecharag.garage_emit.bronze import BronzeError, sync_vehicle_bronze, write_inventory
from mecharag.garage_emit.emit import emit_vehicle
from mecharag.garage_emit.extract import PageExtract
from mecharag.garage_emit.hashing import sha256_file, slug_document_id
from mecharag.garage_emit.layout import bronze_dir, ensure_layout, gold_dir
from mecharag.gold_status import SIDECAR_BASENAME
from mecharag.private_gold_source import PrivateGoldSource


def _write_blank_pdf(path: Path, n_pages: int = 1) -> None:
    writer = PdfWriter()
    for _ in range(n_pages):
        writer.add_blank_page(width=200, height=200)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as fh:
        writer.write(fh)


def test_deny_and_yxz_exclude() -> None:
    assert is_denied_name("CARFAX - report.pdf")
    assert is_denied_name("foo.crdownload")
    assert is_denied_name("Victron Orion.pdf")
    assert "YXZ1000R 2024_service manual.pdf" in YXZ_EXCLUDE
    assert "YXZ1000R 2019_service manual.pdf" not in YXZ_EXCLUDE


def test_slug_stable() -> None:
    a = slug_document_id("service_manual", "Triumph Service.pdf")
    b = slug_document_id("service_manual", "Triumph Service.pdf")
    assert a == b
    assert "service_manual" in a


def test_bronze_local_override_and_emit(tmp_path: Path) -> None:
    root = tmp_path / "garage"
    ensure_layout(root)
    vid = "cat:2015-triumph-street-triple"
    spec = require_vehicle(vid)
    local: dict[str, Path] = {}
    for manual in spec.manuals:
        pdf = tmp_path / "src" / manual.filename
        _write_blank_pdf(pdf, n_pages=2)
        local[manual.filename] = pdf

    slice_ = sync_vehicle_bronze(
        root, vid, use_rclone=False, local_overrides=local
    )
    assert len(slice_["includes"]) == 3
    write_inventory(root, [slice_])

    bad = bronze_dir(root, spec) / "CARFAX junk.pdf"
    bad.write_bytes(b"%PDF-1.4 junk")
    with pytest.raises(BronzeError, match="denied|unexpected"):
        sync_vehicle_bronze(root, vid, use_rclone=False, local_overrides=local)
    bad.unlink()

    def fake_extract(path: Path) -> list[PageExtract]:
        name = path.name
        return [
            PageExtract(1, f"text from {name} page1 torque 12 Nm", False),
            PageExtract(2, "   ", True),
            PageExtract(3, f"text from {name} page3", False),
        ]

    with patch("mecharag.garage_emit.emit.extract_pages", side_effect=fake_extract):
        receipt = emit_vehicle(root, vid, corpus_version="test-garage-1")

    assert receipt["pages_total"] == 9  # 3 manuals × 3 pages
    assert receipt["empty_extract_pages"] == 3
    gdir = gold_dir(root, spec)
    assert (gdir / "normalized_document_manifest.json").is_file()
    assert (gdir / SIDECAR_BASENAME).is_file()

    source = PrivateGoldSource(root / "gold")
    docs = source.load_all()
    assert len(docs) == 3
    assert all(d.manifest["vehicle_id"] == vid for d in docs)
    assert all(d.manifest["rights_class"] == "private_oem" for d in docs)
    assert source.last_soft_adjust_status is not None


def test_sha_dedup_detection(tmp_path: Path) -> None:
    a = tmp_path / "a.pdf"
    b = tmp_path / "b.pdf"
    _write_blank_pdf(a)
    data = a.read_bytes()
    b.write_bytes(data)
    assert sha256_file(a) == sha256_file(b)
