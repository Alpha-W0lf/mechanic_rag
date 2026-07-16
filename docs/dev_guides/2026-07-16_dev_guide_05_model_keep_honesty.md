# Dev Guide 05 — Keep models as candidates + honesty note (docs-only)

**Date:** 2026-07-16  
**Repo:** `mechanic_rag`  
**Work item:** Guide 05 — keep embedding + cross-encoder in stack; leave **candidate**; author keep-with-justification honesty (no freeze / no lift claim)  
**Stage that authored this:** Write-dev-guide (pass 61)  
**Status:** Draft — ready for Refine-dev-guide / Ready-check; **not implemented**

**Context SSOT:** `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`  
**Locks:** `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`  
**Prerequisite:** Guide 04 ≥30 goldens + paired-ask re-baseline shippable.

---

## Objective

Codify Tom’s lock in product docs:

1. Embedding model and cross-encoder **remain candidates** (not frozen).  
2. Cross-encoder **stays in the ranking pipeline** (sophistication + degrade path).  
3. Written honesty: paired-ask citation∩gold delta was **0** on n=30 — **do not** claim the reranker improved citation hits.  
4. Align VISION / GETTING_STARTED / INTERVIEW / ARCHITECTURE status language.

**Success signal:** A reviewer reading INTERVIEW + `MODEL_FREEZE_STATUS.md` cannot honestly believe “models frozen” or “CE proved lift,” but still sees a full hybrid → fusion → rerank architecture.

---

## Learning notes (new for this guide)

1. **Keep ≠ freeze** — Keeping a component in production architecture is compatible with “candidate” status when evals are flat.  
2. **Ablation honesty** — Paired ask (rerank on vs fusion-only) is the evidence; prose must match numbers.  
3. **Docs-only delivery** — This guide changes **no** ranking code unless a stale checkbox is wrong.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/docs/VISION.md`
- `mechanic_rag/docs/ARCHITECTURE.md` (§7 ranking)
- `mechanic_rag/GETTING_STARTED.md`
- `mechanic_rag/INTERVIEW.md`
- `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

---

## Architecture constraints (binding)

1. **Docs Align only** — no CE model swap; no ranking redesign; no PrivateGold; no second vehicle.  
2. **Human lock:** keep both as candidates; keep reranker in stack; write justification.  
3. **Forbidden:** invent positive delta; freeze on historical proxy `+1` / n=5; claim “frozen.”  
4. Generator `gemma4:e2b` is **not** a freeze lock.  
5. g10 grounding residual is **out of scope** (optional later slice).

---

## Soft pins

| Pin | Locked default |
|-----|----------------|
| Embedding | Ollama `nomic-embed-text` @ 768 — **candidate** |
| Cross-encoder | `Xenova/ms-marco-MiniLM-L-6-v2` — **candidate**, remains in pipeline |
| Evidence cite | Guide 04 paired ask: n=30, citation∩gold hits 26 vs 26, delta **0** |
| Justification themes (allowed) | Architecture completeness; demo of N→K rerank; latency measurement; degrade-to-fusion reliability; future eval growth — **not** “improves citation hits on this set” |
| Authoring | Agent may draft prose; Tom reviews before treating as final portfolio voice (Implement may land draft + mark “human-reviewed” when Tom signs off in chat) |

---

## Acceptance criteria

- [ ] `MODEL_FREEZE_STATUS.md` keep-with-justification section authored (not stub)  
- [ ] Status tables still say **candidate** for embed + CE  
- [ ] VISION / GETTING_STARTED / INTERVIEW state: reranker present; **no** proven citation lift on n=30  
- [ ] Strike any stale “Grow to ≥30” / “freeze pending growth” contradictions if still present  
- [ ] No ranking code changes required for DoD  

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Ready-check.**

### Phase A — Evidence anchor

- [ ] **A1.** Re-read `evals/last_run_summary.json` fields used in honesty prose.  
- [ ] **A2.** Confirm `MODEL_FREEZE_STATUS.md` freeze checklist remains human-only.

### Phase B — Author honesty

- [ ] **B1.** Replace keep stub with full paragraph(s) covering: what was measured, delta=0, why CE stays, what we do **not** claim.  
- [ ] **B2.** Update VISION §2/§9 (or equivalent) status rows.  
- [ ] **B3.** Update GETTING_STARTED + INTERVIEW FAQ/banners for freeze vs keep.  
- [ ] **B4.** Grep ARCHITECTURE for stale ≥30 / freeze theater; fix or strike.

### Phase C — Stop

- [ ] **C1.** No code path changes unless a doc link is broken.  
- [ ] **C2.** Stop. Do not start g10 residual in this guide.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
rg -n 'frozen|candidate|delta|cross-encoder|rerank|lift' evals/MODEL_FREEZE_STATUS.md docs/VISION.md GETTING_STARTED.md INTERVIEW.md docs/ARCHITECTURE.md
# Must NOT find claims that CE improved citation hits on the n=30 paired ask
# Must find candidate + keep justification
```

**DoD:** Honesty docs consistent; candidates unchanged; reranker still described as in-pipeline; no lift theater.

---

## Blast radius and risks

| Risk | Mitigation |
|------|------------|
| Agent invents freeze | Soft pin forbids; Review checks status tables |
| Soft language that implies lift | Explicit “delta 0 / no lift” sentence required |
| Scope into ranking code | Hard stop docs-only |

### Rollback

Revert doc commits; restore stub if needed.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Conflicting old INTERVIEW freeze wording | Prefer MODEL_FREEZE_STATUS + last_run_summary |
| Desire to freeze later | New human authorize + new guide after better evidence |

---

## Stop conditions

- Docs Align complete  
- **No** Implement of ranking changes  
- **No** g10 residual  

---

## Ready for Refine-dev-guide?

**Yes** — thin docs-only guide; low blast radius.
