"""PrivateGold ask plane (ingest-side attestation).

HTTP ask smoke is optional when Compose/Next/Ollama are up. CI Met for this
file = the synthetic present-only pack loads under the private-ingest policy and exposes the
catalog vehicle id used by the present-only ask path.
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

PRESENT_ONLY_VEHICLE = "cat:demo-synthetic-truck"
FIXTURE_S2000 = "fixture:honda-s2000-demo"


def test_present_only_vehicle_is_a_catalog_id() -> None:
    assert CAT_VID == PRESENT_ONLY_VEHICLE
    assert PRESENT_ONLY_VEHICLE.startswith("cat:")
    assert PRESENT_ONLY_VEHICLE != FIXTURE_S2000


@pytest.mark.integration
@pytest.mark.skipif(
    not (PROGRAM_VALID / "minimal_manifest.json").is_file(),
    reason="program fixtures not present: set MECHANIC_EXTRA_FIXTURES_ROOT (public clone / CI)",
)
def test_present_only_pack_load_exposes_vehicle(tmp_path: Path) -> None:
    root = stage_present_only_cat(tmp_path / "private_gold_g15")
    docs = PrivateGoldSource(root).load_all()
    assert len(docs) >= 1
    vids = {d.manifest["vehicle_id"] for d in docs}
    assert PRESENT_ONLY_VEHICLE in vids
    assert FIXTURE_S2000 not in vids
    for d in docs:
        assert d.manifest["rights_class"] == "private_oem"
