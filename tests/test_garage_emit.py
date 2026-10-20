"""Tests for the local private-corpus allowlist, denylist, emit (synthetic)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from pypdf import PdfWriter

from mecharag.garage_emit.allowlist import (
    EXAMPLE_PATH,
    is_denied_name,
    load_allowlist,
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


@pytest.fixture(autouse=True)
def example_allowlist(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MECHANIC_GARAGE_ALLOWLIST", str(EXAMPLE_PATH))


def test_deny_and_config_excludes() -> None:
    allowlist = load_allowlist()
    assert is_denied_name("manual.pdf.crdownload")
    assert is_denied_name("manual.pdf.part")
    assert not is_denied_name("Draft scan.pdf")
    assert is_denied_name("Draft scan.pdf", allowlist)
    spec = allowlist.vehicles["cat:demo-roadster"]
    assert "Demo Roadster - Service Manual (older year).pdf" in spec.exclude_filenames
    assert allowlist.emit_order == ("cat:demo-roadster",)


def test_missing_allowlist_says_where(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("MECHANIC_GARAGE_ALLOWLIST", str(tmp_path / "nope.json"))
    with pytest.raises(FileNotFoundError, match="allowlist.example.json"):
        load_allowlist()


def test_slug_stable() -> None:
    a = slug_document_id("service_manual", "Demo Service.pdf")
    b = slug_document_id("service_manual", "Demo Service.pdf")
    assert a == b
    assert "service_manual" in a


def test_bronze_local_override_and_emit(tmp_path: Path) -> None:
    root = tmp_path / "garage"
    ensure_layout(root)
    vid = "cat:demo-roadster"
    spec = require_vehicle(vid)
    local: dict[str, Path] = {}
    for manual in spec.manuals:
        pdf = tmp_path / "src" / manual.filename
        _write_blank_pdf(pdf, n_pages=2)
        local[manual.filename] = pdf

    slice_ = sync_vehicle_bronze(
        root, vid, copy_from_source=False, local_overrides=local
    )
    assert len(slice_["includes"]) == 3
    write_inventory(root, [slice_])

    bad = bronze_dir(root, spec) / "Draft scan.pdf"
    bad.write_bytes(b"%PDF-1.4 junk")
    with pytest.raises(BronzeError, match="denied|unexpected"):
        sync_vehicle_bronze(root, vid, copy_from_source=False, local_overrides=local)
    bad.unlink()

    old = bronze_dir(root, spec) / "Demo Roadster - Service Manual (older year).pdf"
    old.write_bytes(b"%PDF-1.4 old")
    with pytest.raises(BronzeError, match="excluded file present"):
        sync_vehicle_bronze(root, vid, copy_from_source=False, local_overrides=local)
    old.unlink()

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
    assert source.last_present_only_status is not None


def test_sha_dedup_detection(tmp_path: Path) -> None:
    a = tmp_path / "a.pdf"
    b = tmp_path / "b.pdf"
    _write_blank_pdf(a)
    data = a.read_bytes()
    b.write_bytes(data)
    assert sha256_file(a) == sha256_file(b)


def test_sync_copies_from_local_source_root(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import json

    src_root = tmp_path / "manuals"
    example = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    example["source_root"] = str(src_root)
    for manual in example["vehicles"][0]["manuals"]:
        _write_blank_pdf(src_root / manual["source"])
    cfg = tmp_path / "allowlist.json"
    cfg.write_text(json.dumps(example), encoding="utf-8")
    monkeypatch.setenv("MECHANIC_GARAGE_ALLOWLIST", str(cfg))

    root = tmp_path / "garage"
    slice_ = sync_vehicle_bronze(root, "cat:demo-roadster")
    assert len(slice_["includes"]) == 3
    assert all(e["source"].startswith("Demo Roadster/") for e in slice_["includes"])
