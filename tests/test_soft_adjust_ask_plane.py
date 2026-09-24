"""Guide 15 Soft Adjust — PrivateGold ask plane (ingest-side attestation).

HTTP ask smoke is optional when Compose/Next/Ollama are up. CI Met for this
file = Soft Adjust synthetic pack loads under Guide 13 policy and exposes the
Q1 Met vehicle id used by Soft Adjust ask.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from mecharag.private_gold_source import PrivateGoldSource

from test_private_gold_present_only import (
    CAT_VID,
    PROGRAM_VALID,
    stage_present_only_cat,
)

SOFT_ADJUST_ASK_MET_VEHICLE = "cat:demo-synthetic-f150"
FIXTURE_S2000 = "fixture:honda-s2000-demo"


def test_soft_adjust_ask_met_vehicle_matches_q1_lock() -> None:
    assert CAT_VID == SOFT_ADJUST_ASK_MET_VEHICLE
    assert SOFT_ADJUST_ASK_MET_VEHICLE.startswith("cat:")
    assert SOFT_ADJUST_ASK_MET_VEHICLE != FIXTURE_S2000


@pytest.mark.integration
@pytest.mark.skipif(
    not (PROGRAM_VALID / "minimal_manifest.json").is_file(),
    reason="sibling second_brain program fixtures not present (public clone / CI)",
)
def test_soft_adjust_pack_load_exposes_ask_met_vehicle(tmp_path: Path) -> None:
    root = stage_present_only_cat(tmp_path / "private_gold_g15")
    docs = PrivateGoldSource(root).load_all()
    assert len(docs) >= 1
    vids = {d.manifest["vehicle_id"] for d in docs}
    assert SOFT_ADJUST_ASK_MET_VEHICLE in vids
    assert FIXTURE_S2000 not in vids
    for d in docs:
        assert d.manifest["rights_class"] == "private_oem"
