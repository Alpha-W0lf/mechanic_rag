"""Live present-only PrivateGold pilot (load attestation)."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from mecharag.gold_status import (
    SIDECAR_BASENAME,
    collect_gold_status,
    require_present_only_status,
)
from mecharag.private_gold_source import PrivateGoldSource
from mecharag.receipt_to_gold_status import write_gold_status_from_receipt

REPO_ROOT = Path(__file__).resolve().parents[1]
# A live present-only release directory from the private corpus builder.
LIVE_RELEASE = Path(
    os.environ.get("MECHANIC_LIVE_RELEASE") or REPO_ROOT / ".no-live-release"
)


def _live_available() -> bool:
    return (
        LIVE_RELEASE.is_dir()
        and (LIVE_RELEASE / "normalized_document_manifest.json").is_file()
        and (LIVE_RELEASE / "present_only_receipt.json").is_file()
    )


pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not _live_available(),
        reason="live release missing: set MECHANIC_LIVE_RELEASE",
    ),
]


@pytest.fixture
def live_with_status() -> Path:
    """Map receipt → release-dir gold_status."""
    write_gold_status_from_receipt(
        LIVE_RELEASE / "present_only_receipt.json",
        out_path=LIVE_RELEASE / SIDECAR_BASENAME,
    )
    return LIVE_RELEASE


def test_live_present_only_status_and_sample_load(live_with_status: Path) -> None:
    """Large pack: present-only gate + ≥1 unit of ≥1 doc (not full upsert)."""
    source = PrivateGoldSource(live_with_status)
    releases = source.discover()
    assert releases, "expected release under live emit"
    path, status = require_present_only_status(
        collect_gold_status(live_with_status, release_paths=releases)
    )
    assert path.name == SIDECAR_BASENAME
    assert status["share_eligible"] is False
    assert status["present_only"] is True
    assert status["zero_gap"] is False
    assert len(status["vehicle_ids"]) == 1
    vid = status["vehicle_ids"][0]
    assert vid.startswith("cat:")

    release = releases[0]
    raw = json.loads(release.read_text(encoding="utf-8"))
    docs = raw.get("documents") or []
    assert docs, "live manifest documents[] empty"
    doc0 = docs[0]
    assert isinstance(doc0, dict)
    source._enforce_doc_identity(doc0)
    sample = dict(doc0)
    units = list(doc0.get("units") or [])
    assert units, "live document has zero units"
    sample["units"] = units[:1]
    flat = source._to_flat_manifest(raw, sample, release.parent)
    assert flat["vehicle_id"] == vid
    assert flat["rights_class"] == "private_oem"
    assert len(flat["units"]) >= 1
    assert (flat["units"][0].get("text") or "").strip()
