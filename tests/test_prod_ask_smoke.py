"""Unit tests for scripts/checks/prod_ask_smoke.py (mocked, no network)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "checks"))

from prod_ask_smoke import evaluate_smoke  # noqa: E402


def test_evaluate_answered_with_citations():
    ok, msg = evaluate_smoke(200, {"outcome": "answered", "citations": [{"label": "1"}]}, 1.5)
    assert ok is True
    assert "PASS" in msg
    assert "citations_n=1" in msg


def test_evaluate_answered_zero_citations():
    ok, msg = evaluate_smoke(200, {"outcome": "answered", "citations": []}, 1.5)
    assert ok is False
    assert "FAIL" in msg


def test_evaluate_degraded_with_citations():
    ok, msg = evaluate_smoke(200, {"outcome": "degraded", "citations": [{"label": "1"}]}, 1.5)
    assert ok is True
    assert "DEGRADED PASS" in msg


def test_evaluate_degraded_zero_citations():
    ok, msg = evaluate_smoke(200, {"outcome": "degraded", "citations": []}, 1.5)
    assert ok is False
    assert "FAIL" in msg


def test_evaluate_http_error():
    ok, msg = evaluate_smoke(503, {"error_class": "database_unavailable"}, 1.5)
    assert ok is False
    assert "FAIL: HTTP 503" in msg


def test_evaluate_unexpected_outcome():
    ok, msg = evaluate_smoke(200, {"outcome": "something_else", "citations": []}, 1.5)
    assert ok is False
    assert "FAIL: unexpected outcome" in msg


if __name__ == "__main__":
    test_evaluate_answered_with_citations()
    test_evaluate_answered_zero_citations()
    test_evaluate_degraded_with_citations()
    test_evaluate_degraded_zero_citations()
    test_evaluate_http_error()
    test_evaluate_unexpected_outcome()
    print("All prod ask smoke evaluation tests passed.")

