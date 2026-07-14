"""Golden eval harness — Guide 02 paired ask ablation + lexical proxy segregation."""

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
        files = sorted(golden_path.glob("golden*.json")) or sorted(
            p for p in golden_path.glob("*.json") if p.name != "last_run_summary.json"
        )
        if not files:
            logger.error("no golden JSON under %s", golden_path)
            return 1
        cases_doc = json.loads(files[0].read_text(encoding="utf-8"))
    else:
        cases_doc = json.loads(golden_path.read_text(encoding="utf-8"))

    cases = cases_doc.get("cases") or []
    if len(cases) < 10:
        logger.warning(
            "golden set has %s cases; Guide 02 DoD wants ≥10–15 (path to ≥30 documented)",
            len(cases),
        )

    database_url = (
        args.database_url
        or os.getenv("DATABASE_URL")
        or "postgres://mechanic:mechanic@localhost:5433/mechanic_rag"
    )

    paired = (
        not args.retrieval_only
        and not getattr(args, "no_paired_ask", False)
        and bool(getattr(args, "ask_url_rrf_only", None))
    )
    if (
        not args.retrieval_only
        and not getattr(args, "no_paired_ask", False)
        and not getattr(args, "ask_url_rrf_only", None)
    ):
        logger.warning(
            "paired ask ablation skipped: pass --ask-url-rrf-only pointing at a "
            "Next process with MECHANIC_FORCE_RRF_ONLY=1 (and MECHANIC_DIAGNOSTICS=1). "
            "CE-on arm uses --ask-url with FORCE unset. See README / mecharag eval --help."
        )

    lexical_proxy_hits = 0
    citation_ok_count = 0
    ask_ok = 0
    degrade_count = 0
    ce_latencies: list[float] = []
    rrf_only_ask_hits = 0
    ce_ask_hits = 0
    paired_scored = 0
    asymmetric_failures = 0
    per_case: list[dict[str, Any]] = []
    generator_models: set[str] = set()
    ce_models: set[str] = set()
    ce_runtime_modes: set[str] = set()

    with psycopg.connect(database_url) as conn:
        for case in cases:
            started = time.time()
            row = _eval_case_retrieval(conn, case)
            lexical_hit = row["retrieval_hit"]
            if lexical_hit:
                lexical_proxy_hits += 1

            ask_ce: dict[str, Any] | None = None
            ask_rrf: dict[str, Any] | None = None
            case_row: dict[str, Any] = {
                "id": case["id"],
                "lexical_proxy_retrieval_hit": lexical_hit,
            }

            if not args.retrieval_only:
                ask_ce = _eval_case_ask(args.ask_url, case, conn)
                case_row["ask_ce"] = ask_ce
                if ask_ce.get("ok"):
                    ask_ok += 1
                if ask_ce.get("citation_ok"):
                    citation_ok_count += 1
                if ask_ce.get("rerank_degraded"):
                    degrade_count += 1
                if ask_ce.get("ce_latency_ms") is not None:
                    ce_latencies.append(float(ask_ce["ce_latency_ms"]))
                for key, bucket in (
                    ("generator_model", generator_models),
                    ("ce_model", ce_models),
                    ("ce_runtime_mode", ce_runtime_modes),
                ):
                    if ask_ce.get(key):
                        bucket.add(str(ask_ce[key]))

                if paired:
                    ask_rrf = _eval_case_ask(args.ask_url_rrf_only, case, conn)
                    case_row["ask_rrf_only"] = ask_rrf
                    for key, bucket in (
                        ("generator_model", generator_models),
                        ("ce_model", ce_models),
                        ("ce_runtime_mode", ce_runtime_modes),
                    ):
                        if ask_rrf.get(key):
                            bucket.add(str(ask_rrf[key]))

                    both_ok = bool(ask_ce.get("ok")) and bool(ask_rrf.get("ok"))
                    if both_ok:
                        paired_scored += 1
                        if ask_ce.get("citation_gold_hit"):
                            ce_ask_hits += 1
                        if ask_rrf.get("citation_gold_hit"):
                            rrf_only_ask_hits += 1
                    else:
                        # Asymmetric / flap: do not inflate delta
                        asymmetric_failures += 1
                        case_row["paired_asymmetric_failure"] = True
                elif ask_ce.get("ok") and ask_ce.get("citation_gold_hit"):
                    # Single-arm run: record CE hits only; delta undefined
                    ce_ask_hits += 1

            case_row["elapsed_ms"] = int((time.time() - started) * 1000)
            per_case.append(case_row)

    n = max(len(cases), 1)
    recall_lexical = lexical_proxy_hits / n
    citation_rate = citation_ok_count / n if not args.retrieval_only else None
    degrade_rate = degrade_count / n if not args.retrieval_only else None
    avg_ce = sum(ce_latencies) / len(ce_latencies) if ce_latencies else None
    delta = (
        ce_ask_hits - rrf_only_ask_hits
        if paired and paired_scored > 0
        else None
    )

    summary = {
        "n_cases": len(cases),
        "generator_era": "gemma4:e2b (operator default; confirm diagnostics)",
        "generator_models_seen": sorted(generator_models),
        "ce_models_seen": sorted(ce_models),
        "ce_runtime_modes_seen": sorted(ce_runtime_modes),
        "paired_ask_ablation": paired,
        "paired_cases_scored": paired_scored if paired else 0,
        "paired_asymmetric_failures": asymmetric_failures if paired else 0,
        # Ask-path shared predicate (citation ∩ gold) — freeze-relevant
        "rrf_only_ask_hits": rrf_only_ask_hits if paired else None,
        "ce_ask_hits": ce_ask_hits if not args.retrieval_only else None,
        "ce_vs_rrf_ask_delta_hits": delta,
        # Lexical FTS proxy — segregated; never used as CE lift
        "lexical_proxy_retrieval_hits": lexical_proxy_hits,
        "recall_at_k_lexical_proxy": round(recall_lexical, 4),
        "mrr_lexical_proxy": round(recall_lexical, 4),
        "citation_correctness_rate": (
            round(citation_rate, 4) if citation_rate is not None else None
        ),
        "degrade_rate": round(degrade_rate, 4) if degrade_rate is not None else None,
        "avg_ce_latency_ms": round(avg_ce, 2) if avg_ce is not None else None,
        "ask_http_ok": ask_ok if not args.retrieval_only else None,
        "model_status": {
            "embedding": "candidate pending lock (nomic-embed-text@768)",
            "ce": "candidate pending lock (MiniLM / transformers_js); freeze only after paired ask evidence + human",
        },
        "historical_proxy_note": (
            "Pass-8c qwen-era proxy fields (rrf_only_retrieval_hits / "
            "ce_vs_rrf_delta_hits=+1 / n=5) are NOT freeze evidence."
        ),
        "note": (
            "No invented public-release thresholds. "
            "ce_vs_rrf_ask_delta_hits uses citation∩gold on both arms only."
        ),
        "cases": per_case,
    }
    print(json.dumps(summary, indent=2))
    out = Path("evals/last_run_summary.json")
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    logger.info("wrote %s", out)
    return 0


_STOP = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "what", "which", "who", "whom", "whose", "this", "that", "these", "those",
    "do", "does", "did", "how", "when", "where", "why", "to", "of", "for",
    "in", "on", "at", "by", "with", "from", "or", "and", "as", "it", "its",
    "my", "your", "our", "their", "can", "could", "should", "would", "will",
    "may", "might", "must", "i", "you", "we", "they", "he", "she",
}


def _lexical_query_from_question(question: str) -> str:
    """Mirror web lexical_query.ts — simple config keeps stopwords."""
    import re

    tokens = re.sub(r"[^a-z0-9.\-/\s]", " ", question.lower()).split()
    kept = [t for t in tokens if len(t) >= 2 and t not in _STOP]
    return " ".join(kept)


def _chunk_matches_gold(
    content: str | None,
    section_path: str | None,
    substrings: list[str],
    sections: list[str],
) -> bool:
    ok_sub = any(s in (content or "") for s in substrings) if substrings else False
    ok_sec = (
        any(
            section_path and (sp == section_path or sp in section_path)
            for sp in sections
        )
        if sections
        else False
    )
    return ok_sub or ok_sec


def _eval_case_retrieval(conn, case: dict[str, Any]) -> dict[str, Any]:
    """Lexical-only FTS proxy (smoke) — not ask-path CE lift."""
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
        if _chunk_matches_gold(content, section_path, substrings, sections):
            hit = True
            matched_ids.append(chunk_id)
    return {"retrieval_hit": hit, "matched_chunk_ids": matched_ids, "top_n": len(rows)}


def _citation_gold_hit(
    conn,
    citations: list[dict[str, Any]],
    case: dict[str, Any],
) -> bool:
    """Shared hit predicate: cited chunk_id ∩ allowed section/substring evidence."""
    substrings = case.get("allowed_content_substrings") or []
    sections = case.get("allowed_section_paths") or []
    if not substrings and not sections:
        # Do not fall back to bool(citations)
        return False

    for c in citations:
        if sections and _chunk_matches_gold(
            None, c.get("section_path"), [], sections
        ):
            return True

    ids = [c.get("chunk_id") for c in citations if c.get("chunk_id")]
    if not ids:
        return False

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT chunk_id, section_path, content
            FROM chunks
            WHERE chunk_id = ANY(%s::text[])
            """,
            (ids,),
        )
        rows = cur.fetchall()

    for _chunk_id, section_path, content in rows:
        if _chunk_matches_gold(content, section_path, substrings, sections):
            return True
    return False


def _eval_case_ask(
    ask_url: str,
    case: dict[str, Any],
    conn,
) -> dict[str, Any]:
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
    citation_ok = bool(citations) and all(c.get("chunk_id") for c in citations)
    answer = data.get("answer") or ""
    # Deprecated name kept as dual-emit alias pointing at answer smoke only
    answer_substring_hit = (
        any(s in answer for s in substrings) if substrings else False
    )
    citation_gold_hit = _citation_gold_hit(conn, citations, case)

    return {
        "ok": True,
        "citation_ok": citation_ok,
        "citation_gold_hit": citation_gold_hit,
        "answer_substring_hit": answer_substring_hit,
        # Deprecated: was answer-substring theater; do not use for lift
        "retrieval_hit_via_citations_deprecated": answer_substring_hit,
        "rerank_degraded": diagnostics.get("rerank_degraded"),
        "ablation_rrf_only": diagnostics.get("ablation_rrf_only"),
        "ce_latency_ms": diagnostics.get("ce_latency_ms"),
        "ce_runtime_mode": diagnostics.get("ce_runtime_mode"),
        "generator_model": diagnostics.get("generator_model"),
        "ce_model": diagnostics.get("ce_model"),
        "outcome": data.get("outcome"),
        "cited_chunk_ids": [c.get("chunk_id") for c in citations],
        "cited_section_paths": [c.get("section_path") for c in citations],
    }
