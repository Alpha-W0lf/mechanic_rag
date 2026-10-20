"""The lexical proxy reports MRR from gold ranks, not a copy of its recall."""

from __future__ import annotations

from mecharag.eval_cmd import lexical_proxy_mrr


def test_mrr_uses_first_gold_rank() -> None:
    ranks = [1, 2, None, 4]
    recall = sum(1 for r in ranks if r) / len(ranks)
    assert lexical_proxy_mrr(ranks) == (1 + 0.5 + 0 + 0.25) / 4
    assert lexical_proxy_mrr(ranks) != recall


def test_mrr_empty_and_all_misses() -> None:
    assert lexical_proxy_mrr([]) == 0.0
    assert lexical_proxy_mrr([None, None]) == 0.0
