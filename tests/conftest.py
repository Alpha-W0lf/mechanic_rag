"""Pytest markers and collection policy for the public-clone CI subset.

`integration` / `slow` tests are **deselected** in GitHub Actions
(`pytest -m "not integration and not slow"`). Locally, `pytest` with no
`-m` still collects them; they skip with a reason when the program
fixtures or OEM corpus are absent.

Program fixtures (synthetic manifests for the private-corpus path) live
outside this repo. Point `MECHANIC_EXTRA_FIXTURES_ROOT` at the folder that holds
`fixtures/vehicle_rag_gold/` to run those tests.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
PROGRAM_ROOT = Path(
    os.environ.get("MECHANIC_EXTRA_FIXTURES_ROOT") or REPO_ROOT / ".no-extra-fixtures-root"
)
PROGRAM_FIXTURES = PROGRAM_ROOT / "fixtures" / "vehicle_rag_gold"
PROGRAM_VALID = PROGRAM_FIXTURES / "valid"



def sibling_program_fixtures_available() -> bool:
    return (PROGRAM_VALID / "minimal_manifest.json").is_file()


requires_sibling_fixtures = pytest.mark.skipif(
    not sibling_program_fixtures_available(),
    reason=(
        "program fixtures not present: set MECHANIC_EXTRA_FIXTURES_ROOT "
        "(public clone / CI; mark=integration)"
    ),
)
