"""Unit tests for scripts/checks/public_fail_closed.py (no network)."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "checks"))

from public_fail_closed import main  # noqa: E402


def test_repo_fixtures_pass(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "argv", ["public_fail_closed.py", str(REPO_ROOT / "fixtures")])
    assert main() == 0


def test_pdf_fail_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (tmp_path / "oops.pdf").write_bytes(b"%PDF-1.4")
    monkeypatch.setattr(sys, "argv", ["public_fail_closed.py", str(tmp_path)])
    assert main() == 1


def test_private_oem_path_token_fail_closed(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    banned = tmp_path / "private_oem" / "note.txt"
    banned.parent.mkdir()
    banned.write_text("x", encoding="utf-8")
    monkeypatch.setattr(sys, "argv", ["public_fail_closed.py", str(tmp_path)])
    assert main() == 1


def test_repo_tree_has_no_pdfs_or_stray_images(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "argv", ["public_fail_closed.py", "--tree", str(REPO_ROOT)])
    assert main() == 0


def test_tree_flags_image_outside_docs_assets(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "docs" / "assets").mkdir(parents=True)
    (tmp_path / "docs" / "assets" / "ok.png").write_bytes(b"x")
    monkeypatch.setattr(sys, "argv", ["public_fail_closed.py", "--tree", str(tmp_path)])
    assert main() == 0
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts" / "page.png").write_bytes(b"x")
    assert main() == 1
    (tmp_path / "scripts" / "page.png").unlink()
    (tmp_path / "web").mkdir()
    (tmp_path / "web" / "logo.svg").write_text("<svg/>", encoding="utf-8")
    assert main() == 1
