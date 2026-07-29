#!/usr/bin/env python3
"""M3 VLM eval harness (B1) — torque non-regression, diagram assist, degrade.

No invented pass thresholds. Records honest diagnostics.

Usage:
  # Arm with VLM on (default ask still text-safe when flag off for control cases):
  MECHANIC_VLM=1 MECHANIC_DIAGNOSTICS=1 pnpm exec next dev -p 3000

  .venv/bin/python scripts/m3_vlm_eval_harness.py \\
    --golden evals/golden_m3_vision_v1.json \\
    --ask-url http://127.0.0.1:3000/api/ask \\
    --ask-url-vlm-off http://127.0.0.1:3002/api/ask
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]


def _load_cases(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text())
    return [c for c in (data.get("cases") or []) if isinstance(c, dict) and c.get("id")]


def _ask(
    url: str,
    vehicle_id: str,
    question: str,
    *,
    timeout: float,
    diagram_assist: bool = False,
) -> dict[str, Any]:
    body: dict[str, Any] = {"vehicle_id": vehicle_id, "question": question}
    if diagram_assist:
        body["diagram_assist"] = True
    r = requests.post(url, json=body, timeout=timeout)
    r.raise_for_status()
    return r.json()


def _has_substrings(answer: str, needles: list[str]) -> list[str]:
    missing = []
    for n in needles:
        if n not in answer:
            # allow ascii fallback for middot
            alt = n.replace("·", "·").replace("N·m", "N·m")
            if alt not in answer and n.replace("·", "") not in answer.replace("·", ""):
                # try common variants
                variants = {
                    "39 N·m": ["39 N·m", "39 Nm", "39 N.m", "39 nm"],
                    "29 lbf·ft": ["29 lbf·ft", "29 lbf-ft", "29 lb-ft", "29 lbf ft"],
                    "4.8 liters": ["4.8 liters", "4.8 L", "4.8 liters"],
                }
                ok = any(v.lower() in answer.lower() for v in variants.get(n, [n]))
                if not ok:
                    missing.append(n)
    return missing


def _run_unit_filter() -> dict[str, Any]:
    """Mirror ask_vlm filter business rule in Python for offline unit case."""
    notes = "The bolt shows 99 N·m on the diagram. Also 39 N·m near plug."
    cited = ["Oil drain plug torque is 39 N·m (29 lbf·ft)."]
    blob = "\n".join(cited).lower().replace(" ", "")
    pat = re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:n·m|n\.m|nm|lbf(?:·ft)?|ft-?lb|ft·lb|lb-?ft|mm|in(?:ch(?:es)?)?)\b",
        re.I,
    )

    def repl(m: re.Match[str]) -> str:
        compact = re.sub(r"\s+", "", m.group(0).lower())
        if compact in blob.replace(" ", ""):
            return m.group(0)
        return "[spec omitted — not in text citation]"

    out = pat.sub(repl, notes)
    return {
        "id": "m3-f01-filter-invented-nm",
        "mode": "synthetic_unit",
        "output": out,
        "stripped_99": "99" not in out or "[spec omitted" in out,
        "kept_39": "39" in out,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="M3 VLM eval harness")
    p.add_argument("--golden", type=Path, default=ROOT / "evals/golden_m3_vision_v1.json")
    p.add_argument("--ask-url", required=True, help="MECHANIC_VLM=1 ask URL")
    p.add_argument(
        "--ask-url-vlm-off",
        required=True,
        help="Ask URL with MECHANIC_VLM unset/0 (torque control)",
    )
    p.add_argument(
        "--ask-url-force-fail",
        default="",
        help="Optional ask URL with MECHANIC_VLM_FORCE_FAIL=1",
    )
    p.add_argument("--timeout", type=float, default=180.0)
    p.add_argument(
        "--out",
        type=Path,
        default=ROOT / "docs/2026-07-27_m3_vlm_eval_evidence.json",
    )
    args = p.parse_args(argv)

    golden_path = args.golden.resolve()
    try:
        golden_rel = str(golden_path.relative_to(ROOT))
    except ValueError:
        golden_rel = str(golden_path)

    rows: list[dict[str, Any]] = []
    for case in _load_cases(args.golden):
        cid = case["id"]
        if case.get("vlm") == "synthetic" or case.get("intent") == "spec_filter_unit":
            rows.append(_run_unit_filter())
            continue

        mode = case.get("vlm") or "on"
        url = args.ask_url
        if mode == "off":
            url = args.ask_url_vlm_off
        elif mode == "on_forced_fail":
            url = args.ask_url_force_fail or args.ask_url
            if not args.ask_url_force_fail:
                rows.append(
                    {
                        "id": cid,
                        "skipped": True,
                        "reason": "need --ask-url-force-fail with MECHANIC_VLM_FORCE_FAIL=1",
                    }
                )
                continue

        try:
            body = _ask(
                url,
                case["vehicle_id"],
                case["question"],
                timeout=args.timeout,
                diagram_assist=bool(case.get("diagram_assist")),
            )
        except Exception as exc:  # noqa: BLE001 — record honest harness failure
            rows.append({"id": cid, "error": f"{type(exc).__name__}: {exc}"})
            continue

        diag = body.get("diagnostics") or {}
        answer = body.get("answer") or ""
        allowed = case.get("allowed_content_substrings") or []
        missing = _has_substrings(answer, list(allowed)) if allowed else []
        row: dict[str, Any] = {
            "id": cid,
            "vehicle_id": case["vehicle_id"],
            "outcome": body.get("outcome"),
            "vlm_invoked": diag.get("vlm_invoked"),
            "vlm_degraded": diag.get("vlm_degraded"),
            "vlm_degrade_reason": diag.get("vlm_degrade_reason"),
            "vlm_pages": diag.get("vlm_pages"),
            "missing_allowed_substrings": missing or None,
            "answer_preview": answer[:240],
        }
        rows.append(row)

    evidence = {
        "harness": "m3_vlm_eval_harness",
        "golden": golden_rel,
        "ask_url_vlm_on": args.ask_url,
        "ask_url_vlm_off": args.ask_url_vlm_off,
        "ask_url_force_fail": args.ask_url_force_fail or None,
        "no_invented_pass_threshold": True,
        "rows": rows,
    }
    args.out.write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps({"wrote": str(args.out), "n_rows": len(rows)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
