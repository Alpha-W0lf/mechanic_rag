"""Receipt → gold_status mapper unit tests (fixture receipt only)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from mecharag.gold_status import SIDECAR_BASENAME
from mecharag.receipt_to_gold_status import (
    ReceiptToGoldStatusError,
    map_receipt_to_gold_status,
    write_gold_status_from_receipt,
)


def _fixture_receipt(**overrides: object) -> dict:
    base = {
        "schema_version": "1.0.0",
        "enabled": True,
        "complete_library": False,
        "vehicle_id": "cat:demo-synthetic-truck",
        "skip_counts": {"total": 1},
    }
    base.update(overrides)
    return base


def test_map_happy() -> None:
    status = map_receipt_to_gold_status(_fixture_receipt())
    assert status["schema_hint"] == "mechanic_gold_status/v1"
    assert status["zero_gap"] is False
    assert status["present_only"] is True
    assert status["complete_library"] is False
    assert status["share_eligible"] is False
    assert status["publishable"] is False
    assert status["vehicle_ids"] == ["cat:demo-synthetic-truck"]
    assert "not a complete library" in status["notes"]


def test_map_rejects_non_cat() -> None:
    with pytest.raises(ReceiptToGoldStatusError, match="cat:"):
        map_receipt_to_gold_status(_fixture_receipt(vehicle_id="fixture:x"))


def test_map_rejects_bad_complete_library() -> None:
    with pytest.raises(ReceiptToGoldStatusError, match="complete_library"):
        map_receipt_to_gold_status(_fixture_receipt(complete_library="no"))


def test_write_default_sibling(tmp_path: Path) -> None:
    receipt_path = tmp_path / "present_only_receipt.json"
    receipt_path.write_text(
        json.dumps(_fixture_receipt()) + "\n", encoding="utf-8"
    )
    dest = write_gold_status_from_receipt(receipt_path)
    assert dest == tmp_path / SIDECAR_BASENAME
    status = json.loads(dest.read_text(encoding="utf-8"))
    assert status["share_eligible"] is False
    assert status["vehicle_ids"] == ["cat:demo-synthetic-truck"]


def test_write_missing_receipt(tmp_path: Path) -> None:
    with pytest.raises(ReceiptToGoldStatusError, match="missing"):
        write_gold_status_from_receipt(tmp_path / "absent.json")


def test_share_flag_hard_false_even_if_receipt_lied() -> None:
    """Mapper must never emit share_eligible=true."""
    receipt = _fixture_receipt()
    receipt["share_eligible"] = True  # ignored if present
    status = map_receipt_to_gold_status(receipt)
    assert status["share_eligible"] is False
