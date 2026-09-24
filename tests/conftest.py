"""Pytest markers and collection policy for the public-clone CI subset.

`integration` / `slow` tests are **deselected** in GitHub Actions
(`pytest -m "not integration and not slow"`). Locally, `pytest` with no
`-m` still collects them; they skip with a reason when the sibling tree
or OEM corpus is absent.

Legacy OEM PDF smoke scripts are collect-ignored: importing them pulls
`google.genai` (the `legacy` extra) and they are not unit tests.
"""

from __future__ import annotations

from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
PROGRAM_FIXTURES = (
    REPO_ROOT.parent
    / "second_brain"
    / "docs"
    / "dev_guides"
    / "fixtures"
    / "vehicle_rag_gold"
)
PROGRAM_VALID = PROGRAM_FIXTURES / "valid"

collect_ignore = [
    "test_parser.py",
    "test_chunking.py",
]


def sibling_program_fixtures_available() -> bool:
    return (PROGRAM_VALID / "minimal_manifest.json").is_file()


requires_sibling_fixtures = pytest.mark.skipif(
    not sibling_program_fixtures_available(),
    reason=(
        "sibling second_brain program fixtures not present "
        "(public clone / CI; mark=integration)"
    ),
)
