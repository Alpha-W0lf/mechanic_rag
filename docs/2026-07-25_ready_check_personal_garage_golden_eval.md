# Ready check — Personal garage golden eval

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_golden_eval.md`  
**Verdict:** **Go 8.7 / 10** — Tom authorized Write goldens + proceed

### Locked

| Item | Value |
|------|-------|
| File | `evals/golden_garage_v1.json` |
| Cases | 8 (4 positive + 4 hard-miss) |
| Metric | `citation_gold_hit` |
| Fixture file | Untouched |

### Scores

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide / DoD | **9.0** | Soft: live eval not yet run |
| Harness / DRY | **9.2** | Reuse only |
| Rights honesty | **8.5** | OEM substrings in private golden |
| Env | **8.3** | Needs Next + Compose + Ollama |
| Overall | **8.7** | Go |

**Stop:** Ready Go — Implement next.
