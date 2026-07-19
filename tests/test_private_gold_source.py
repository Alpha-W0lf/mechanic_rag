"""Guide 11 — PrivateGoldSource fixture-first (N1) unit tests."""

from __future__ import annotations

import json
import shutil
from argparse import Namespace
from pathlib import Path

import pytest

from mecharag.ingest_cmd import run_ingest
from mecharag.private_gold_source import PrivateGoldSource, PrivateGoldSourceError

REPO_ROOT = Path(__file__).resolve().parents[1]
PROGRAM_VALID = (
    REPO_ROOT.parent
    / "second_brain"
    / "docs"
    / "dev_guides"
    / "fixtures"
    / "vehicle_rag_gold"
    / "valid"
)


def _stage_minimal_pack(dst: Path) -> Path:
    dst.mkdir(parents=True, exist_ok=True)
    for name in (
        "minimal_manifest.json",
        "minimal_p1.txt",
        "minimal_p2.txt",
    ):
        src = PROGRAM_VALID / name
        assert src.is_file(), f"missing program fixture {src}"
        shutil.copy(src, dst / name)
    return dst / "minimal_manifest.json"


@pytest.fixture
def gold_root(tmp_path: Path) -> Path:
    root = tmp_path / "private_gold_met"
    _stage_minimal_pack(root)
    return root


def test_discover_and_load_happy(gold_root: Path) -> None:
    source = PrivateGoldSource(gold_root)
    releases = source.discover()
    assert any(p.name == "minimal_manifest.json" for p in releases)
    docs = source.load_all()
    assert len(docs) == 1
    m = docs[0].manifest
    assert m["vehicle_id"] == "fixture:demo-s2000-ap1"
    assert m["document_id"] == "fixture-s2000-oil-service"
    assert m["rights_class"] == "synthetic_fixture"
    assert len(m["units"]) == 2
    assert all((u.get("text") or "").strip() for u in m["units"])
    assert "oil capacity" in m["units"][0]["text"].lower()


def test_path_escape_rejected(gold_root: Path, tmp_path: Path) -> None:
    source = PrivateGoldSource(gold_root)
    outside = tmp_path / "outside.txt"
    outside.write_text("escape", encoding="utf-8")
    with pytest.raises(PrivateGoldSourceError, match="escapes"):
        source._ensure_under_root(outside)


def test_drive_url_root_rejected() -> None:
    with pytest.raises(PrivateGoldSourceError, match="Drive/URL"):
        PrivateGoldSource("https://drive.google.com/foo")
    with pytest.raises(PrivateGoldSourceError, match="Drive/URL"):
        PrivateGoldSource("gdrive://bucket/path")


def test_reject_private_oem_for_met(gold_root: Path) -> None:
    manifest_path = gold_root / "minimal_manifest.json"
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    raw["documents"][0]["vehicle_id"] = "cat:2017-f-150"
    raw["documents"][0]["rights_class"] = "private_oem"
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")
    source = PrivateGoldSource(gold_root)
    with pytest.raises(PrivateGoldSourceError, match="rejects private_oem/cat"):
        source.load_all()


def test_hash_mismatch_rejected(gold_root: Path) -> None:
    (gold_root / "minimal_p1.txt").write_text("tampered", encoding="utf-8")
    source = PrivateGoldSource(gold_root)
    with pytest.raises(PrivateGoldSourceError, match="validation failed"):
        source.load_all()


def test_unset_env_fail_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("MECHANIC_PRIVATE_GOLD_ROOT", raising=False)
    args = Namespace(source="private-gold", root=None, database_url=None)
    rc = run_ingest(args)
    assert rc == 2


def test_fixtures_root_rejected_for_private_gold(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.chdir(REPO_ROOT)
    fixtures = REPO_ROOT / "fixtures"
    if not fixtures.is_dir():
        pytest.skip("fixtures/ missing")
    args = Namespace(
        source="private-gold",
        root=str(fixtures),
        database_url=None,
    )
    rc = run_ingest(args)
    assert rc == 2


def test_empty_units_after_resolve_rejected(gold_root: Path) -> None:
    source = PrivateGoldSource(gold_root)
    release = {
        "schema_version": "1.0.0",
        "corpus_version": "fixture-corpus",
        "manifest_id": "m1",
    }
    doc = {
        "vehicle_id": "fixture:demo-s2000-ap1",
        "year": 2000,
        "make": "Honda",
        "model": "S2000",
        "engine": "F20C",
        "doc_family": "service_manual",
        "document_id": "empty-units-doc",
        "artifact_version": "1",
        "content_hash": "a" * 64,
        "rights_class": "synthetic_fixture",
        "units": [
            {
                "page_start": 1,
                "page_end": 1,
                "section_path": "empty",
                "heading": "empty",
                "text": "   ",
            }
        ],
    }
    with pytest.raises(PrivateGoldSourceError, match="zero units"):
        source._to_flat_manifest(release, doc, gold_root)
