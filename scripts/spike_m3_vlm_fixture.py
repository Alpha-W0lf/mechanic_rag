#!/usr/bin/env python3
"""Planning spike only — M3 local VLM on one fixture PNG (Ready gate).

Uses already-pulled Ollama vision model (default gemma4:e2b).
Usage:
  .venv/bin/python scripts/spike_m3_vlm_fixture.py
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
PNG_DIR = ROOT / "output" / "images" / "Honda_s2000_owners_manual_2001"
OUT = ROOT / "docs" / "2026-07-26_spike_evidence_m3_vlm_fixture.json"
MODEL = "gemma4:e2b"
OLLAMA = "http://127.0.0.1:11434/api/generate"
TIMEOUT_S = 45


def main() -> int:
    pngs = sorted(PNG_DIR.glob("page_*.png"))
    if not pngs:
        print(f"NEED_PNG: {PNG_DIR}")
        return 3
    # Prefer a mid-manual page that often has diagrams; fall back to first
    pick = next((p for p in pngs if "0100" in p.name or "0116" in p.name), pngs[len(pngs) // 2])

    prompt = (
        "Describe only what is visible in this service-manual page image. "
        "Do NOT invent torque or numeric specs. If you see a diagram, say what it shows. "
        "If text is unreadable, say so."
    )
    # Ollama vision: send path via images as base64
    import base64

    b64 = base64.b64encode(pick.read_bytes()).decode("ascii")
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "images": [b64],
        "stream": False,
        "options": {"temperature": 0.2},
    }
    t0 = time.perf_counter()
    try:
        r = requests.post(OLLAMA, json=payload, timeout=TIMEOUT_S)
        elapsed = time.perf_counter() - t0
        r.raise_for_status()
        body = r.json()
        response_text = (body.get("response") or "").strip()
        err = None
    except Exception as e:  # noqa: BLE001 — spike records failure honestly
        elapsed = time.perf_counter() - t0
        response_text = ""
        err = f"{type(e).__name__}: {e}"
        body = {}

    # Heuristic: did model invent Nm / lbf? (soft check for Ready honesty)
    lower = response_text.lower()
    invent_risk = any(x in lower for x in ("n·m", "n.m", "nm ", "lbf", "ft-lb", "ft·lb", "torque"))

    evidence = {
        "spike": "m3_vlm_fixture",
        "date_local_hint": "2026-07-26",
        "model_id": MODEL,
        "png_path": str(pick.relative_to(ROOT)),
        "timeout_budget_seconds": TIMEOUT_S,
        "elapsed_seconds": round(elapsed, 3),
        "ok": err is None and bool(response_text),
        "error": err,
        "response_chars": len(response_text),
        "response_preview": response_text[:800],
        "soft_numeric_mention": invent_risk,
        "recommendation": (
            "Freeze VLM model_id=gemma4:e2b for M3 Ready if ok=true; "
            "Build must still filter VLM numeric claims against text citations."
        ),
        "router_default": "off",
        "degrade": "on timeout/error → text/M2/M1 path",
    }
    OUT.write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps({k: v for k, v in evidence.items() if k != "response_preview"}, indent=2))
    print("--- preview ---")
    print(evidence["response_preview"][:500])
    print(f"WROTE {OUT}")
    return 0 if evidence["ok"] else 4


if __name__ == "__main__":
    raise SystemExit(main())
