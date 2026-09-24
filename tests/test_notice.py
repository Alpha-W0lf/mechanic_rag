"""Honesty lock for the public NOTICE file."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def _required_notices(text: str) -> list[str]:
    return [line for line in text.splitlines() if line.startswith("Required Notice:")]


def test_notice_preserves_license_required_notice() -> None:
    license_text = (REPO_ROOT / "LICENSE").read_text(encoding="utf-8")
    notice = (REPO_ROOT / "NOTICE").read_text(encoding="utf-8")
    required = [line for line in _required_notices(license_text) if "Yoyodyne" not in line]
    assert required == ["Required Notice: Copyright (c) 2026 Tom Chacko"]
    for line in required:
        assert line in notice


def test_notice_states_polyform_and_fixture_honesty() -> None:
    notice = (REPO_ROOT / "NOTICE").read_text(encoding="utf-8")
    lowered = notice.lower()
    assert "PolyForm Noncommercial License 1.0.0" in notice
    assert "not OSI open source" in notice
    assert "synthetic_fixture" in notice
    assert "synthetic fixtures only" in lowered
    assert "does not claim oem rights" in lowered
    assert "oem manuals are redistributable" not in lowered
    assert "does not vendor third-party source" in lowered
