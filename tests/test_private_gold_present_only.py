"""Guide 13 Soft Adjust — present-only local PrivateGold (cat:/private_oem)."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from mecharag.gold_status import SIDECAR_BASENAME, honesty_log_message
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

CAT_VID = "cat:demo-synthetic-f150"


def _met_sidecar(*, friend: bool = False, zero_gap: bool = False) -> dict:
    return {
        "schema_hint": "mechanic_gold_status/v1",
        "zero_gap": zero_gap,
        "publishable": False,
        "present_only": True,
        "complete_library": False,
        "friend_publish_eligible": friend,
        "vehicle_ids": [CAT_VID],
        "notes": (
            "Guide 13 Soft Adjust synthetic present-only — "
            "not dual-product Done; not friend publish"
        ),
    }


def stage_present_only_cat(
    root: Path, *, with_sidecar: bool = True, friend: bool = False
) -> Path:
    """Stage synthetic cat:/private_oem Contract 7.2 pack (no OEM bytes)."""
    release = root / "synth_f150"
    release.mkdir(parents=True, exist_ok=True)
    for name in ("minimal_p1.txt", "minimal_p2.txt"):
        shutil.copy(PROGRAM_VALID / name, release / name)

    raw = json.loads((PROGRAM_VALID / "minimal_manifest.json").read_text(encoding="utf-8"))
    raw["manifest_id"] = "synth-release-demo-synthetic-f150-v1"
    raw["release_id"] = raw["manifest_id"]
    doc = raw["documents"][0]
    doc["vehicle_id"] = CAT_VID
    doc["document_id"] = "synth-f150-oil-service"
    doc["year"] = 2022
    doc["make"] = "Ford"
    doc["model"] = "F-150"
    doc["engine"] = "synthetic-demo"
    doc["rights_class"] = "private_oem"
    doc["provenance"] = {
        "adapter_id": "synthetic_present_only_adapter",
        "source_id": "guide13-synth-pack",
        "source_doc_ids": ["syn-oil-001"],
        "redacted_locator": "tmp/guide13-synth/*",
        "observation_ids": ["obs:guide13-synth-001"],
        "export_id": "export:guide13-synth-001",
    }
    # Text blobs unchanged — keep program artifact hashes / content_hash.
    (release / "normalized_document_manifest.json").write_text(
        json.dumps(raw, indent=2) + "\n", encoding="utf-8"
    )
    if with_sidecar:
        (root / SIDECAR_BASENAME).write_text(
            json.dumps(_met_sidecar(friend=friend), indent=2) + "\n",
            encoding="utf-8",
        )
    return root


@pytest.fixture
def present_only_gold(tmp_path: Path) -> Path:
    return stage_present_only_cat(tmp_path / "private_gold_g13")


def test_soft_adjust_load_happy(present_only_gold: Path) -> None:
    source = PrivateGoldSource(present_only_gold)
    docs = source.load_all()
    assert len(docs) == 1
    m = docs[0].manifest
    assert m["vehicle_id"] == CAT_VID
    assert m["rights_class"] == "private_oem"
    assert len(m["units"]) == 2
    assert source.last_soft_adjust_status is not None
    _path, status = source.last_soft_adjust_status
    assert status["present_only"] is True
    assert status["friend_publish_eligible"] is False


def test_missing_sidecar_fail_closed(tmp_path: Path) -> None:
    root = stage_present_only_cat(tmp_path / "no_sc", with_sidecar=False)
    with pytest.raises(PrivateGoldSourceError, match="requires gold_status"):
        PrivateGoldSource(root).load_all()


def test_friend_publish_eligible_rejected(tmp_path: Path) -> None:
    root = stage_present_only_cat(tmp_path / "friend", friend=True)
    with pytest.raises(
        PrivateGoldSourceError, match="friend_publish_eligible=true"
    ):
        PrivateGoldSource(root).load_all()


def test_friend_true_even_with_zero_gap_true_rejected(tmp_path: Path) -> None:
    """Ready preference: reject friend flag on Soft Adjust path for Guide 13."""
    root = stage_present_only_cat(tmp_path / "friend_zg", with_sidecar=False)
    status = _met_sidecar(friend=True, zero_gap=True)
    status["present_only"] = False
    (root / SIDECAR_BASENAME).write_text(
        json.dumps(status, indent=2) + "\n", encoding="utf-8"
    )
    with pytest.raises(
        PrivateGoldSourceError, match="friend_publish_eligible=true"
    ):
        PrivateGoldSource(root).load_all()


def test_fixture_path_still_optional_sidecar(tmp_path: Path) -> None:
    """Guide 11/12 fixture: path unchanged — no sidecar required."""
    dst = tmp_path / "fixture_only"
    dst.mkdir(parents=True, exist_ok=True)
    for name in ("minimal_manifest.json", "minimal_p1.txt", "minimal_p2.txt"):
        shutil.copy(PROGRAM_VALID / name, dst / name)
    source = PrivateGoldSource(dst)
    docs = source.load_all()
    assert len(docs) == 1
    assert docs[0].manifest["vehicle_id"].startswith("fixture:")
    assert source.last_soft_adjust_status is None


def test_drive_url_still_forbidden() -> None:
    with pytest.raises(PrivateGoldSourceError, match="Drive/URL"):
        PrivateGoldSource("https://drive.google.com/foo")


def test_honesty_log_includes_friend_flag(present_only_gold: Path) -> None:
    path = present_only_gold / SIDECAR_BASENAME
    status = json.loads(path.read_text(encoding="utf-8"))
    msg = honesty_log_message(status, path)
    assert "friend_publish_eligible=False" in msg
    assert "dual-product Done" in msg


def test_mixed_fixture_and_cat_requires_status(tmp_path: Path) -> None:
    root = tmp_path / "mixed"
    fixture_dir = root / "fixture_pack"
    fixture_dir.mkdir(parents=True)
    for name in ("minimal_manifest.json", "minimal_p1.txt", "minimal_p2.txt"):
        shutil.copy(PROGRAM_VALID / name, fixture_dir / name)
    stage_present_only_cat(root, with_sidecar=False)
    with pytest.raises(PrivateGoldSourceError, match="requires gold_status"):
        PrivateGoldSource(root).load_all()
    (root / SIDECAR_BASENAME).write_text(
        json.dumps(_met_sidecar(), indent=2) + "\n", encoding="utf-8"
    )
    docs = PrivateGoldSource(root).load_all()
    vids = {d.manifest["vehicle_id"] for d in docs}
    assert CAT_VID in vids
    assert any(v.startswith("fixture:") for v in vids)
