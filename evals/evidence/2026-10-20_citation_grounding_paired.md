# Citation grounding: before vs after (paired Ask)

**Date:** 2026-10-20  
**Before:** `e72e3e827f52dc8cd6d0147432aab023d0dafbe9`  
**After:** `b76f599` (citation grounding, ARCHITECTURE §7.6)  
**Route:** both arms on Vercel Preview deployments of their commit, same database, run back to back (17:42–18:02 UTC)  
**Models:** generator `gemma-4-26b-a4b-it`, embeddings `gemini-embedding-001`  
**Golden:** `evals/golden_fixture_v1.json`, the 40 answerable cases, plus 3 open questions on the 2003 S2000 manuals (x1 brake bleeding, x2 F20C valve clearance, x3 tire pressure)  
**Evidence JSON:** `evals/evidence/2026-10-20_citation_grounding_paired.json` (answers, citations and scores per case; excerpts omitted)

## How it is scored

Each question goes through `POST /api/ask`, 4 s apart.

- **Citation hit:** a returned citation's `section_path` matches the case's `allowed_section_paths`. This is a section match, so it is looser than the chunk-level hit in the 2026-09-24 evidence.
- **Numeric grounding:** for every marker that closes a claim stating a number, the cited source text contains every number in the claim. The source text is the fixture section, or the cited PDF pages for the S2000 manuals. It is checked per section or page, so it is more lenient than a per-chunk check.
- **Gap-free labels:** the answer's cards are labelled `1..n` in order.

## Results (n = 43)

| Metric                                    |          Before |          After |
| ----------------------------------------- | --------------: | -------------: |
| Citation hits (40 golden)                 |         40 / 40 |        40 / 40 |
| Numeric claims grounded in the cited text | 49 / 52 (94.2%) | 49 / 49 (100%) |
| Answers with gap-free labels              |         37 / 43 |        43 / 43 |
| Answered                                  |         43 / 43 |        43 / 43 |

39 of the 43 answers are word-for-word the same in both arms apart from their markers. The generator reworded the other 4 (g14, g19, g28, x2); none changed its citation hit or grounding count. The after arm renumbers every answer, so gap-free labels hold by construction.

## Cases that changed

| Case                   | Before                                                                              | After                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| g32 spark gap          | value cited to the hot-inspection section and the specification; the first lacks it | only the specification is cited                                               |
| x3 tire pressure       | 2 of 6 markers cite a page without the value; labels `[4] [5] [7]`                  | cited to the two owner's manual pages that state the values; labels `[1] [2]` |
| g01, g28, g43, g44, x2 | labels skip (`[1],[3]`, `[2]` alone, `[1],[4]`)                                     | labels `1..n`                                                                 |

Excerpts are now centred on the cited value. In g01, card 1 now shows "39 N·m", which the start-of-section excerpt cut off.

## Gate set before the run

Ship only if citation hits do not drop: **40 → 40, gate met.**

## Notes

- After this run, marker groups are also listed in ascending order (`[2], [1]` → `[1], [2]`, seen in x3). That only reorders labels inside a group; it doesn't change any score above.
- x2 cites the maintenance schedule (SM p.60) next to the valve-clearance spec page (p.172) in both arms. The page-level check counts it grounded because p.60 also lists those values, so this check can't tell whether p.60 is the better source.
- Retrieval and ranking code is unchanged, so MRR and Recall@k from 2026-09-24 still stand.
