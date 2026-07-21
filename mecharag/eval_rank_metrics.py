"""Rank-aware CE experiment metrics (MRR / Recall@k) — not freeze lift."""

from __future__ import annotations

from typing import Any, Callable

ChunkMatchesGold = Callable[
    [str | None, str | None, list[str], list[str]],
    bool,
]


def first_gold_rank(
    conn,
    ordered_ids: list[str],
    case: dict[str, Any],
    chunk_matches_gold: ChunkMatchesGold,
) -> int | None:
    """1-based rank of first gold-matching chunk; None if absent."""
    if not ordered_ids:
        return None
    substrings = case.get("allowed_content_substrings") or []
    sections = case.get("allowed_section_paths") or []
    if not substrings and not sections:
        return None
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT chunk_id, section_path, content
            FROM chunks
            WHERE chunk_id = ANY(%s::text[])
            """,
            (ordered_ids,),
        )
        rows = {row[0]: (row[1], row[2]) for row in cur.fetchall()}
    for i, chunk_id in enumerate(ordered_ids):
        section_path, content = rows.get(chunk_id, (None, None))
        if chunk_matches_gold(content, section_path, substrings, sections):
            return i + 1
    return None


def rank_metrics_for_paired_case(
    conn,
    case: dict[str, Any],
    ask_ce: dict[str, Any],
    ask_rrf: dict[str, Any],
    ce_top_k: int,
    chunk_matches_gold: ChunkMatchesGold,
) -> dict[str, Any]:
    """MRR / Recall@k on RRF shortlist vs CE-ranked list; soft-skip if lists missing."""
    rrf_ids = ask_rrf.get("pre_ce_shortlist_chunk_ids") or ask_ce.get(
        "pre_ce_shortlist_chunk_ids"
    )
    ce_ids = ask_ce.get("ce_ranked_chunk_ids")
    if not isinstance(rrf_ids, list) or not isinstance(ce_ids, list):
        return {
            "skipped": True,
            "reason": "missing_shortlist_diagnostics",
        }
    # Cosine fallback is not true CE — still compute ranks but flag honesty.
    cosine_note = ask_ce.get("ce_runtime_mode") == "cosine"

    rank_rrf = first_gold_rank(
        conn, [str(x) for x in rrf_ids], case, chunk_matches_gold
    )
    rank_ce = first_gold_rank(
        conn, [str(x) for x in ce_ids], case, chunk_matches_gold
    )
    gold_in_rrf_top_k = bool(rank_rrf is not None and rank_rrf <= ce_top_k)

    def _mrr(rank: int | None) -> float:
        return 0.0 if rank is None else 1.0 / float(rank)

    def _recall_at(rank: int | None, k: int) -> int:
        return 1 if rank is not None and rank <= k else 0

    return {
        "skipped": False,
        "gold_mrr_rrf": _mrr(rank_rrf),
        "gold_mrr_ce": _mrr(rank_ce),
        "gold_recall_at_1_rrf": _recall_at(rank_rrf, 1),
        "gold_recall_at_1_ce": _recall_at(rank_ce, 1),
        "gold_recall_at_3_rrf": _recall_at(rank_rrf, 3),
        "gold_recall_at_3_ce": _recall_at(rank_ce, 3),
        "gold_in_rrf_top_k": gold_in_rrf_top_k,
        "gold_rank_rrf": rank_rrf,
        "gold_rank_ce": rank_ce,
        "cosine_runtime_not_ce_lift": cosine_note,
    }


def _mean_or_none(vals: list[float] | list[int]) -> float | None:
    if not vals:
        return None
    return round(sum(vals) / len(vals), 4)


def aggregate_rank_summary_fields(
    *,
    paired: bool,
    rank_mrr_rrf: list[float],
    rank_mrr_ce: list[float],
    rank_r1_rrf: list[int],
    rank_r1_ce: list[int],
    rank_r3_rrf: list[int],
    rank_r3_ce: list[int],
    gold_in_rrf_top_k_hits: int,
    rank_metric_cases_scored: int,
    rank_metric_cases_skipped: int,
) -> dict[str, Any]:
    """Summary JSON fields for rank-aware CE experiment (not freeze lift)."""
    scored = paired and rank_metric_cases_scored > 0
    return {
        "gold_mrr_rrf": _mean_or_none(rank_mrr_rrf),
        "gold_mrr_ce": _mean_or_none(rank_mrr_ce),
        "gold_recall_at_1_rrf": _mean_or_none(rank_r1_rrf),
        "gold_recall_at_1_ce": _mean_or_none(rank_r1_ce),
        "gold_recall_at_3_rrf": _mean_or_none(rank_r3_rrf),
        "gold_recall_at_3_ce": _mean_or_none(rank_r3_ce),
        "gold_in_rrf_top_k_count": gold_in_rrf_top_k_hits if scored else None,
        "gold_in_rrf_top_k_rate": (
            round(gold_in_rrf_top_k_hits / rank_metric_cases_scored, 4)
            if scored
            else None
        ),
        "rank_metric_cases_scored": rank_metric_cases_scored if paired else 0,
        "rank_metric_cases_skipped": rank_metric_cases_skipped if paired else 0,
    }
