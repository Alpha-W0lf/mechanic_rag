"""Every GitHub Actions badge in the README must be able to show a real status.

A badge renders "no status" when its workflow has never run for the filter in
the badge URL. So each badge must point at a workflow file that exists, carry
no `?event=` filter, and use a workflow that runs on pushes to main.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BADGE_RE = re.compile(r"actions/workflows/([\w.-]+)/badge\.svg(\?[^)\s]*)?")


def _badges() -> list[tuple[str, str]]:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    return [(m.group(1), m.group(2) or "") for m in BADGE_RE.finditer(readme)]


def test_readme_has_a_ci_badge() -> None:
    assert any(name == "ci.yml" for name, _ in _badges())


def test_each_badge_can_show_a_status() -> None:
    for name, query in _badges():
        workflow = ROOT / ".github" / "workflows" / name
        assert workflow.is_file(), f"badge points at missing workflow {name}"
        assert "event=" not in query, f"{name} badge filters on an event: {query}"
        text = workflow.read_text(encoding="utf-8")
        push = re.search(r"^\s+push:\s*\n\s+branches:\s*\[\s*main\s*\]", text, re.M)
        assert push, f"{name} does not run on push to main"
