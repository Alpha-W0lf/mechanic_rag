"""migrate.sh must never apply *DRAFT* SQL (JH-47, JH-48.8). No Postgres required."""

from __future__ import annotations

import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MIGRATE = REPO_ROOT / "scripts" / "migrate.sh"
MIGRATIONS = REPO_ROOT / "db" / "migrations"
DRAFTS_DIR = REPO_ROOT / "docs" / "drafts"


def _list_output() -> str:
    proc = subprocess.run(
        ["bash", str(MIGRATE), "--list"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout


def test_migrations_dir_contains_only_applicable_sql() -> None:
    """db/migrations must only contain applicable SQL; draft SQL moved to docs/drafts/ (JH-48.8)."""
    drafts = list(MIGRATIONS.glob("*DRAFT*.sql"))
    assert not drafts, f"expected no *DRAFT*.sql in db/migrations/, found: {drafts}"
    relocated = DRAFTS_DIR / "00X_chunk_image_embeddings_DRAFT.sql"
    assert relocated.is_file(), f"expected draft SQL relocated to {relocated}"


def test_migrate_list_applies_all_numbered_migrations() -> None:
    """All numbered migrations in db/migrations are listed for apply and contain no drafts."""
    out = _list_output()
    apply_names = [
        line[2:].strip()
        for line in out.splitlines()
        if line.startswith("→ ")
    ]
    assert all("DRAFT" not in name for name in apply_names)
    for required in (
        "001_init.sql",
        "002_chunk_image_embeddings.sql",
        "003_ask_rate_limit.sql",
        "004_lock_data_api.sql",
    ):
        assert required in apply_names, f"missing {required} in {apply_names}"


def test_migrate_skips_draft_if_introduced() -> None:
    """migrate.sh must continue to skip any *DRAFT* SQL file if introduced."""
    temp_draft = MIGRATIONS / "999_sample_DRAFT.sql"
    try:
        temp_draft.write_text("-- temporary draft for testing skip behavior\n")
        out = _list_output()
        apply_names = [
            line[2:].strip()
            for line in out.splitlines()
            if line.startswith("→ ")
        ]
        skipped = [
            line
            for line in out.splitlines()
            if line.startswith("skip ") and "DRAFT" in line
        ]
        assert skipped, f"expected a DRAFT skip line, got:\n{out}"
        assert any("999_sample_DRAFT.sql" in line for line in skipped)
        assert "999_sample_DRAFT.sql" not in apply_names
    finally:
        if temp_draft.exists():
            temp_draft.unlink()
