"""Golden eval harness for Guide 01."""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any

import psycopg
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def run_eval(args) -> int:
    load_dotenv()
    load_dotenv("web/.env.local")
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    golden_path = Path(args.golden)
    if golden_path.is_dir():
        files = sorted(golden_path.glob("*.json"))
        if not files:
            logger.error("no golden JSON under %s", golden_path)
            return 1
        cases_doc = json.loads(files[0].read_text(encoding="utf-8"))
    else:
        cases_doc = json.loads(golden_path.read_text(encoding="utf-8"))

    cases = cases_doc.get("cases") or []
    if len(cases) < 5:
        logger.warning(
            "golden set has %s cases; Guide 01 requires ≥5 (debt: grow to ≥30)",
            len(cases),
        )

    database_url = (
        args.database_url
        or os.getenv("DATABASE_URL")
        or "postgres://mechanic:mechanic@localhost:5433/mechanic_rag"
    )

    retrieval_hits = 0
    citation_ok = 0
    ask_ok = 0
    degrade_count = 0
    ce_latencies: list[float] = []
    rrf_only_hits = 0
    ce_path_hits = 0
    per_case: list[dict[str, Any]] = []

    with psycopg.connect(database_url) as conn:
        for case in cases:
            started = time.time()
            row = _eval_case_retrieval(conn, case)
            retrieval_ok = row["retrieval_hit"]
            if retrieval_ok:
                retrieval_hits += 1
                rrf_only_hits += 1

            ask_result = None
            if not args.retrieval_only:
                ask_result = _eval_case_ask(args.ask_url, case)
                if ask_result.get("ok"):
                    ask_ok += 1
                if ask_result.get("citation_ok"):
                    citation_ok += 1
                if ask_result.get("rerank_degraded"):
                    degrade_count += 1
                if ask_result.get("ce_latency_ms") is not None:
                    ce_latencies.append(float(ask_result["ce_latency_ms"]))
                if ask_result.get("retrieval_hit_via_citations"):
                    ce_path_hits += 1

            per_case.append(
                {
                    "id": case["id"],
                    "retrieval_hit": retrieval_ok,
                    "ask": ask_result,
                    "elapsed_ms": int((time.time() - started) * 1000),
                }
            )

    n = max(len(cases), 1)
    recall_at_k = retrieval_hits / n
    # MRR proxy: 1.0 if top evidence found in retrieval set else 0 (minimal slice)
    mrr = recall_at_k
    citation_rate = citation_ok / n if not args.retrieval_only else None
    degrade_rate = degrade_count / n if not args.retrieval_only else None
    avg_ce = sum(ce_latencies) / len(ce_latencies) if ce_latencies else None

    summary = {
        "n_cases": len(cases),
        "recall_at_k_proxy": round(recall_at_k, 4),
        "mrr_proxy": round(mrr, 4),
        "citation_correctness_rate": (
            round(citation_rate, 4) if citation_rate is not None else None
        ),
        "rrf_only_retrieval_hits": rrf_only_hits,
        "ce_or_ask_path_hits": ce_path_hits,
        "ce_vs_rrf_delta_hits": ce_path_hits - rrf_only_hits,
        "degrade_rate": round(degrade_rate, 4) if degrade_rate is not None else None,
        "avg_ce_latency_ms": round(avg_ce, 2) if avg_ce is not None else None,
        "ask_http_ok": ask_ok,
        "model_status": {
            "embedding": "candidate pending lock (nomic-embed-text@768)",
            "ce": "candidate pending lock (MiniLM / transformers_js); keep CE only with lift or written justification",
        },
        "note": "No invented public-release thresholds. First honest baseline only.",
        "cases": per_case,
    }
    print(json.dumps(summary, indent=2))
    out = Path("evals/last_run_summary.json")
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    logger.info("wrote %s", out)
    return 0


_STOP = {
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "this",
    "that",
    "these",
    "those",
    "do",
    "does",
    "did",
    "how",
    "when",
    "where",
    "why",
    "to",
    "of",
    "for",
    "in",
    "on",
    "at",
    "by",
    "with",
    "from",
    "or",
    "and",
    "as",
    "it",
    "its",
    "my",
    "your",
    "our",
    "their",
    "can",
    "could",
    "should",
    "would",
    "will",
    "may",
    "might",
    "must",
    "i",
    "you",
    "we",
    "they",
    "he",
    "she",
}


def _lexical_query_from_question(question: str) -> str:
    """Mirror web lexical_query.ts — simple config keeps stopwords."""
    import re

    tokens = re.sub(r"[^a-z0-9.\-/\s]", " ", question.lower()).split()
    kept = [t for t in tokens if len(t) >= 2 and t not in _STOP]
    return " ".join(kept)


def _eval_case_retrieval(conn, case: dict[str, Any]) -> dict[str, Any]:
    """Lexical-only proxy for retrieval hit vs allowed substrings/sections."""
    vehicle_id = case["vehicle_id"]
    question = _lexical_query_from_question(case["question"])
    if not question:
        return {"retrieval_hit": False, "matched_chunk_ids": [], "top_n": 0}
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT chunk_id, section_path, content
            FROM chunks
            WHERE vehicle_id = %s
              AND content_tsv @@ plainto_tsquery('simple', %s)
            ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('simple', %s)) DESC
            LIMIT 8
            """,
            (vehicle_id, question, question),
        )
        rows = cur.fetchall()

    substrings = case.get("allowed_content_substrings") or []
    sections = case.get("allowed_section_paths") or []
    hit = False
    matched_ids: list[str] = []
    for chunk_id, section_path, content in rows:
        ok_sub = any(s in content for s in substrings) if substrings else False
        ok_sec = (
            any(
                section_path and (sp == section_path or sp in section_path)
                for sp in sections
            )
            if sections
            else False
        )
        if ok_sub or ok_sec:
            hit = True
            matched_ids.append(chunk_id)
    return {"retrieval_hit": hit, "matched_chunk_ids": matched_ids, "top_n": len(rows)}


def _eval_case_ask(ask_url: str, case: dict[str, Any]) -> dict[str, Any]:
    try:
        resp = requests.post(
            ask_url,
            json={"vehicle_id": case["vehicle_id"], "question": case["question"]},
            timeout=240,
        )
    except requests.RequestException as exc:
        return {"ok": False, "error": str(exc)}

    if resp.status_code != 200:
        return {"ok": False, "status": resp.status_code, "body": resp.text[:300]}

    data = resp.json()
    citations = data.get("citations") or []
    diagnostics = data.get("diagnostics") or {}
    substrings = case.get("allowed_content_substrings") or []
    # Citation correctness: cited chunk_ids exist; content match via answer/substr heuristics
    citation_ok = bool(citations) and all(c.get("chunk_id") for c in citations)
    answer = data.get("answer") or ""
    retrieval_hit_via_citations = any(s in answer for s in substrings) if substrings else bool(citations)
    return {
        "ok": True,
        "citation_ok": citation_ok,
        "retrieval_hit_via_citations": retrieval_hit_via_citations,
        "rerank_degraded": diagnostics.get("rerank_degraded"),
        "ce_latency_ms": diagnostics.get("ce_latency_ms"),
        "outcome": data.get("outcome"),
        "cited_chunk_ids": [c.get("chunk_id") for c in citations],
    }
