"""Guide 12 — multi-vehicle PrivateGold + gold_status sidecar tests."""

from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path

import pytest

from mecharag.gold_status import (
    SIDECAR_BASENAME,
    GoldStatusError,
    collect_gold_status,
    honesty_log_message,
    load_optional_sidecar,
)
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

VEHICLE_A = "fixture:demo-s2000-ap1"
VEHICLE_B = "fixture:demo-miata-nb"


def _stage_vehicle_dir(
    dst: Path,
    *,
    vehicle_id: str,
    document_id: str,
    year: int,
    make: str,
    model: str,
    engine: str,
) -> Path:
    """P1 layout: one Contract 7.2 release dir adapted from program minimal pack."""
    dst.mkdir(parents=True, exist_ok=True)
    for name in ("minimal_p1.txt", "minimal_p2.txt"):
        shutil.copy(PROGRAM_VALID / name, dst / name)

    raw = json.loads((PROGRAM_VALID / "minimal_manifest.json").read_text(encoding="utf-8"))
    raw["manifest_id"] = f"fixture-release-{vehicle_id.split(':', 1)[1]}-v1"
    raw["release_id"] = raw["manifest_id"]
    doc = raw["documents"][0]
    doc["vehicle_id"] = vehicle_id
    doc["document_id"] = document_id
    doc["year"] = year
    doc["make"] = make
    doc["model"] = model
    doc["engine"] = engine
    # Keep artifact hashes — text blobs unchanged from program pack.
    manifest_path = dst / "normalized_document_manifest.json"
    manifest_path.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def stage_multi_vehicle_p1(root: Path, *, with_sidecar: bool = True) -> Path:
    """Stage ≥2 fixture: vehicles (P1) under a private Gold root."""
    root.mkdir(parents=True, exist_ok=True)
    _stage_vehicle_dir(
        root / "s2000",
        vehicle_id=VEHICLE_A,
        document_id="fixture-s2000-oil-service",
        year=2000,
        make="Honda",
        model="S2000",
        engine="F20C",
    )
    _stage_vehicle_dir(
        root / "miata",
        vehicle_id=VEHICLE_B,
        document_id="fixture-miata-oil-service",
        year=1999,
        make="Mazda",
        model="Miata",
        engine="BP-ZE",
    )
    if with_sidecar:
        status = {
            "schema_hint": "mechanic_gold_status/v1",
            "zero_gap": False,
            "publishable": False,
            "present_only": True,
            "complete_library": False,
            "vehicle_ids": [VEHICLE_A, VEHICLE_B],
            "notes": "Guide 12 synthetic incomplete status — not dual-product Done",
        }
        (root / SIDECAR_BASENAME).write_text(
            json.dumps(status, indent=2) + "\n", encoding="utf-8"
        )
    return root


@pytest.fixture
def multi_gold(tmp_path: Path) -> Path:
    return stage_multi_vehicle_p1(tmp_path / "private_gold_g12", with_sidecar=True)


def test_multi_vehicle_load_distinct_ids(multi_gold: Path) -> None:
    source = PrivateGoldSource(multi_gold)
    docs = source.load_all()
    vids = source.distinct_vehicle_ids(docs)
    assert vids == {VEHICLE_A, VEHICLE_B}
    assert len(docs) == 2


def test_discover_skips_gold_status_basename(multi_gold: Path) -> None:
    # Malicious sidecar shaped like a release must still be skipped by basename.
    bad = {
        "schema_version": "1.0.0",
        "corpus_version": "x",
        "documents": [],
    }
    (multi_gold / SIDECAR_BASENAME).write_text(json.dumps(bad), encoding="utf-8")
    source = PrivateGoldSource(multi_gold)
    releases = source.discover()
    assert all(p.name != SIDECAR_BASENAME for p in releases)
    assert len(releases) == 2


def test_missing_sidecar_ok(tmp_path: Path) -> None:
    root = stage_multi_vehicle_p1(tmp_path / "no_sidecar", with_sidecar=False)
    assert collect_gold_status(root) == []
    source = PrivateGoldSource(root)
    assert len(source.distinct_vehicle_ids()) == 2


def test_zero_gap_false_does_not_block_load(multi_gold: Path) -> None:
    statuses = collect_gold_status(multi_gold)
    assert len(statuses) == 1
    assert statuses[0][1]["zero_gap"] is False
    source = PrivateGoldSource(multi_gold)
    assert len(source.load_all()) == 2


def test_invalid_sidecar_fail_closed(tmp_path: Path) -> None:
    root = stage_multi_vehicle_p1(tmp_path / "bad_sc", with_sidecar=False)
    (root / SIDECAR_BASENAME).write_text("{not-json", encoding="utf-8")
    with pytest.raises(GoldStatusError, match="unreadable/invalid"):
        collect_gold_status(root)


def test_honesty_log_mentions_zero_gap(multi_gold: Path, caplog: pytest.LogCaptureFixture) -> None:
    path, status = collect_gold_status(multi_gold)[0]
    msg = honesty_log_message(status, path)
    assert "zero_gap=False" in msg
    assert "dual-product Done" in msg
    with caplog.at_level(logging.INFO):
        logging.getLogger("test").info("%s", msg)
    assert "zero_gap=False" in caplog.text


def test_load_optional_sidecar_none_when_missing(tmp_path: Path) -> None:
    assert load_optional_sidecar(tmp_path / SIDECAR_BASENAME) is None


def test_soft_adjust_cat_allowed_with_status(multi_gold: Path) -> None:
    """Guide 13: cat:/private_oem OK when Guide 12-style incomplete sidecar present."""
    manifest = multi_gold / "miata" / "normalized_document_manifest.json"
    raw = json.loads(manifest.read_text(encoding="utf-8"))
    raw["documents"][0]["vehicle_id"] = "cat:live-miata"
    raw["documents"][0]["rights_class"] = "private_oem"
    manifest.write_text(json.dumps(raw), encoding="utf-8")
    # Existing multi_gold sidecar is present_only + zero_gap=false (no friend).
    docs = PrivateGoldSource(multi_gold).load_all()
    vids = {d.manifest["vehicle_id"] for d in docs}
    assert "cat:live-miata" in vids
    assert VEHICLE_A in vids


def test_honesty_log_includes_friend_publish_eligible(multi_gold: Path) -> None:
    path, status = collect_gold_status(multi_gold)[0]
    msg = honesty_log_message(status, path)
    assert "friend_publish_eligible=" in msg
