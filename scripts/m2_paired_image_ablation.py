#!/usr/bin/env python3
"""M2 paired ablation harness (C1) — image channel on vs off.

Compares ask diagnostics / citation∩gold when MECHANIC_IMAGE_CHANNEL is
enabled vs disabled. Does not invent pass thresholds.

Usage (two Next processes recommended, same pattern as CE ablation):
  # Arm A (image on, default):  MECHANIC_DIAGNOSTICS=1 pnpm dev          # :3000
  # Arm B (image off): PORT=3002 MECHANIC_IMAGE_CHANNEL=0 MECHANIC_DIAGNOSTICS=1 pnpm dev

  .venv/bin/python scripts/m2_paired_image_ablation.py \\
    --golden evals/golden_m2_diagram_stubs_v1.json \\
    --ask-url http://127.0.0.1:3000/api/ask \\
    --ask-url-image-off http://127.0.0.1:3002/api/ask
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]


def _load_cases(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text())
    cases = data.get("cases") or []
    return [c for c in cases if isinstance(c, dict) and c.get("id")]


def _ask(url: str, vehicle_id: str, question: str, timeout: float) -> dict[str, Any]:
    r = requests.post(
        url,
        json={"vehicle_id": vehicle_id, "question": question},
        timeout=timeout,
    )
    r.raise_for_status()
    return r.json()


def _citation_pages(payload: dict[str, Any]) -> set[int]:
    pages: set[int] = set()
    for c in payload.get("citations") or []:
        ps = c.get("page_start")
        if isinstance(ps, int):
            pages.add(ps)
    return pages


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="M2 image-channel paired ablation")
    p.add_argument("--golden", type=Path, default=ROOT / "evals/golden_m2_diagram_stubs_v1.json")
    p.add_argument("--ask-url", required=True, help="Image channel ON ask URL")
    p.add_argument("--ask-url-image-off", required=True, help="MECHANIC_IMAGE_CHANNEL=0 ask URL")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument(
        "--out",
        type=Path,
        default=ROOT / "docs/2026-07-26_m2_paired_image_ablation_evidence.json",
    )
    args = p.parse_args(argv)

    cases = _load_cases(args.golden)
    rows = []
    for case in cases:
        q = str(case.get("question") or "")
        if q.startswith("STUB:"):
            rows.append(
                {
                    "id": case["id"],
                    "skipped": True,
                    "reason": "stub_question_not_executable",
                }
            )
            continue
        vid = case["vehicle_id"]
        on = _ask(args.ask_url, vid, q, args.timeout)
        off = _ask(args.ask_url_image_off, vid, q, args.timeout)
        hints = case.get("allowed_page_hints") or []
        gold_pages = {int(x) for x in hints if str(x).isdigit()}
        on_pages = _citation_pages(on)
        off_pages = _citation_pages(off)
        row = {
            "id": case["id"],
            "vehicle_id": vid,
            "on_outcome": on.get("outcome"),
            "off_outcome": off.get("outcome"),
            "on_image_count": (on.get("diagnostics") or {}).get("image_count"),
            "off_image_count": (off.get("diagnostics") or {}).get("image_count"),
            "on_cite_pages": sorted(on_pages),
            "off_cite_pages": sorted(off_pages),
            "citation_intersect_gold_on": sorted(on_pages & gold_pages) if gold_pages else None,
            "citation_intersect_gold_off": sorted(off_pages & gold_pages) if gold_pages else None,
            "notes": case.get("notes"),
        }
        rows.append(row)

    golden_path = args.golden.resolve()
    try:
        golden_rel = str(golden_path.relative_to(ROOT))
    except ValueError:
        golden_rel = str(golden_path)

    evidence = {
        "harness": "m2_paired_image_ablation",
        "golden": golden_rel,
        "ask_url_on": args.ask_url,
        "ask_url_image_off": args.ask_url_image_off,
        "no_invented_pass_threshold": True,
        "rows": rows,
    }
    args.out.write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps({"wrote": str(args.out), "n_rows": len(rows)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
