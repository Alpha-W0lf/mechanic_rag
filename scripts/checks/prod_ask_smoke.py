#!/usr/bin/env python3
"""Production Ask smoke probe: tests hosted /api/ask endpoint health.

Scores outcome according to the policy in docs/ops.md:
- outcome == 'answered' with citations >= 1: pass
- outcome == 'degraded' with citations >= 1: degraded pass (warn)
- HTTP error, error_class without citations, or outcome != answered/degraded: fail
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from typing import Any

DEFAULT_ASK_URL = "https://mechanic-rag.vercel.app/api/ask"
DEFAULT_VEHICLE_ID = "fixture:honda-s2000-demo"
DEFAULT_QUESTION = "What is the oil drain plug torque?"
DEFAULT_TIMEOUT_SEC = 90


def probe_ask(
    url: str = DEFAULT_ASK_URL,
    vehicle_id: str = DEFAULT_VEHICLE_ID,
    question: str = DEFAULT_QUESTION,
    timeout_sec: int = DEFAULT_TIMEOUT_SEC,
) -> tuple[int, dict[str, Any], float]:
    payload = json.dumps({"vehicle_id": vehicle_id, "question": question}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "MechanicRAG-AskSmoke/1.0",
        },
        method="POST",
    )
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            elapsed = time.perf_counter() - start
            status = resp.status
            body = resp.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                data = {"raw_body": body}
            return status, data, elapsed
    except urllib.error.HTTPError as err:
        elapsed = time.perf_counter() - start
        status = err.code
        body = err.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {"raw_body": body}
        return status, data, elapsed
    except Exception as err:
        elapsed = time.perf_counter() - start
        return 0, {"error": str(err)}, elapsed


def evaluate_smoke(status: int, data: dict[str, Any], elapsed: float) -> tuple[bool, str]:
    if status != 200:
        err_msg = data.get("error_class") or data.get("error") or data.get("raw_body") or f"HTTP {status}"
        return False, f"FAIL: HTTP {status} (elapsed: {elapsed:.2f}s) - {err_msg}"

    outcome = data.get("outcome")
    citations = data.get("citations")
    citations_n = len(citations) if isinstance(citations, list) else 0

    if outcome == "answered":
        if citations_n < 1:
            return False, f"FAIL: outcome='answered' but citations_n={citations_n} (<1)"
        return True, f"PASS: outcome='answered', citations_n={citations_n} (elapsed: {elapsed:.2f}s)"

    if outcome == "degraded":
        if citations_n >= 1:
            return True, f"DEGRADED PASS (warn): outcome='degraded', citations_n={citations_n} (elapsed: {elapsed:.2f}s)"
        return False, f"FAIL: outcome='degraded' with zero citations (elapsed: {elapsed:.2f}s)"

    return False, f"FAIL: unexpected outcome='{outcome}', citations_n={citations_n} (elapsed: {elapsed:.2f}s)"


def main() -> int:
    parser = argparse.ArgumentParser(description="Probe Production Ask endpoint for health")
    parser.add_argument("--url", default=DEFAULT_ASK_URL, help=f"Target Ask URL (default: {DEFAULT_ASK_URL})")
    parser.add_argument("--vehicle-id", default=DEFAULT_VEHICLE_ID, help="Vehicle ID for fixture ask")
    parser.add_argument("--question", default=DEFAULT_QUESTION, help="Question to ask")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_SEC, help="Timeout in seconds")
    args = parser.parse_args()

    print(f"== Production Ask Smoke ==")
    print(f"Endpoint:   {args.url}")
    print(f"Vehicle ID: {args.vehicle_id}")
    print(f"Question:   {args.question}")
    print(f"Timeout:    {args.timeout}s")
    print()

    status, data, elapsed = probe_ask(
        url=args.url,
        vehicle_id=args.vehicle_id,
        question=args.question,
        timeout_sec=args.timeout,
    )

    success, message = evaluate_smoke(status, data, elapsed)
    print(message)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
