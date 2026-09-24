"""migrate.sh must never apply *DRAFT* SQL (JH-47). No Postgres required."""

from __future__ import annotations

import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MIGRATE = REPO_ROOT / "scripts" / "migrate.sh"
MIGRATIONS = REPO_ROOT / "db" / "migrations"


def _list_output() -> str:
    proc = subprocess.run(
        ["bash", str(MIGRATE), "--list"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout


def test_draft_migration_exists_so_skip_is_meaningful() -> None:
    drafts = list(MIGRATIONS.glob("*DRAFT*.sql"))
    assert drafts, "expected a *DRAFT*.sql planning file in db/migrations/"


def test_migrate_list_skips_draft_and_keeps_numbered() -> None:
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
    assert all("DRAFT" not in name for name in apply_names)
    for required in (
        "001_init.sql",
        "002_chunk_image_embeddings.sql",
        "003_ask_rate_limit.sql",
        "004_lock_data_api.sql",
    ):
        assert required in apply_names, f"missing {required} in {apply_names}"
