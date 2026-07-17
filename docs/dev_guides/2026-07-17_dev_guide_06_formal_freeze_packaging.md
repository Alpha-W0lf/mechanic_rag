# Dev Guide 06 — Formal freeze packaging / public-flip checklist (docs-only)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Work item:** Guide 06 — formal freeze packaging / public-flip checklist (docs)  
**Stage that authored this:** Write-dev-guide (spoke)  
**Last refined:** Refine-dev-guide (2026-07-17) — one pass  
**Status:** **Refined** — Ready-check next; not Implemented  

**Handoff:** `second_brain/docs/2026-07-17_spoke_mechanic_freeze_packaging_write_handoff.md`  
**Context SSOT (prior):** `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`  
**Prior guide (done):** `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  

**Locks:**  
- Pass 60: embed + CE keep-as-candidates; CE in stack; no lift claim  
- Pass 70 / Tom 2026-07-17: formal freeze **parked** until new evidence or explicit override  
- Tom 2026-07-17: Guide 06 Implement = **checklist packaging only**; public flip = separate human gate  

**Prerequisite:** Guide 04 ≥30 goldens + paired-ask re-baseline; Guide 05 keep-with-justification authored.

---

## Objective

Land **executable packaging checklists** that separate three gates and keep docs honest:

1. **Keep-in-stack** (done — Guide 05) — embed + CE **candidates**; CE in ranking; keep-with-justification; paired-ask citation∩gold delta **0** on n=30.  
2. **Formal freeze** (human-only; **parked**) — packaging section documents what freeze would require; status tables stay **candidate**.  
3. **Public flip** / portfolio “v1 Done” (separate human gate) — packaging checklist **≠** flip; VISION §9 freeze + public-flip rows stay **unchecked**.

**Success signal:** Implement walks pinned placements, leaves §9 unchecked, invents no CE lift / freeze / public-flip-ready claim.

**Default Implement does not flip any status checkboxes** and does not author freeze or public-flip marketing.

---

## Learning notes (interview-portable)

1. **Candidate vs frozen** — In-path ≠ portfolio freeze claim when ablation is flat.  
2. **Ablation honesty** — Cite `ce_vs_rrf_ask_delta_hits`, not historical proxy fields.  
3. **Packaging checklist ≠ release gate** — Prerequisites doc ≠ irreversible marketing flip.  
4. **Soft pin vs craft residual** — Placement and forbidden claims are pins; exact FAQ sentence voice is craft at Implement.

---

## References (paths only)

### Product / evidence

- `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/evals/PATH_TO_30.md`
- `mechanic_rag/docs/VISION.md` (§2; **§9** freeze + public-flip)
- `mechanic_rag/docs/ARCHITECTURE.md` (§7; honesty / deferred freeze)
- `mechanic_rag/INTERVIEW.md` (§5–§8)
- `mechanic_rag/GETTING_STARTED.md`
- `mechanic_rag/README.md`
- `mechanic_rag/scripts/checks/public_fail_closed.py` (public-flip checklist gate reference)

### Hub / locks

- `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`
- `second_brain/docs/2026-07-17_spoke_mechanic_freeze_packaging_write_handoff.md`
- `second_brain/docs/2026-07-17_portfolio_progress_report_pass79.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

### Peer shape (do not reopen Guide 03)

- `mechanic_rag/docs/dev_guides/2026-07-14_dev_guide_03_packaging_getting_started_interview.md`

**Forbidden as freeze/lift evidence:** proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; Guide 02 n=12 as current maturity; inventing positive ask delta.

---

## Architecture constraints (binding)

1. **Docs-only.** No ranking code, model swaps, reindex, eval harness, PrivateGold, Drive, Ford, OEM PDFs, second vehicle, g10 residual.  
2. **Models stay candidates.** Do not change status tables to frozen.  
3. **No invented CE lift.** Cite n=30, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, `ce_vs_rrf_ask_delta_hits=0`.  
4. **Forbidden freeze evidence:** proxy `+1` / `n=5` / lexical-proxy-alone / answer-substring-as-lift.  
5. **Three gates distinct** — keep ≠ freeze ≠ public flip.  
6. **VISION §9 freeze / public-flip** — must remain unchecked under default Implement.  
7. **Stack:** Compose Postgres+pgvector; local CE; fixtures-only public corpus.  
8. **Generator `gemma4:e2b` is not a freeze lock.**  
9. **Guide 06 Implement ≠ public flip / v1 Done.**  
10. **Do not create `LICENSE` in this guide** — repo currently has no LICENSE file; list it as an unmet *future* public-flip prerequisite only.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| Embedding | Ollama `nomic-embed-text` @ 768 — **candidate** |
| Cross-encoder | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` / `classification` — **candidate**, in pipeline |
| Evidence cite | n=30, `gemma4:e2b`, hits 26/26, `ce_vs_rrf_ask_delta_hits=0`, `degrade_rate=0.0`, `avg_ce_latency_ms≈94.7` — `evals/last_run_summary.json` |
| Keep-in-stack | **Closed** (Guide 05) — do not rewrite keep note unless honesty drift |
| Formal freeze | **Parked** (Tom 2026-07-17) until new paired-ask evidence or explicit override lock |
| Public flip in Guide 06 | **Checklist packaging only** — flip remains separate human gate |
| Freeze packaging placement | **Pinned:** new section in `evals/MODEL_FREEZE_STATUS.md` immediately after Keep-with-justification (Guide 05), titled **“Formal freeze packaging (Guide 06)”** |
| Public-flip checklist placement | **Pinned:** create `docs/PUBLIC_FLIP_CHECKLIST.md` (dedicated file SSOT). Do **not** duplicate full checklist into INTERVIEW/MODEL_FREEZE_STATUS — link only |
| Human-only freeze checklist SSOT | Existing six items under `MODEL_FREEZE_STATUS.md` “Freeze checklist (human-only)” — packaging points at them; does not invent new metrics |
| Required honesty sentences (must remain true) | (1) Paired-ask citation∩gold delta **0** on n=30. (2) Models remain **candidates**, not frozen. (3) CE **stays in the stack**. (4) **Do not** claim CE improved citation hits on this run. (5) Packaging checklist **≠** public flip / portfolio v1 Done. |
| Forbidden phrases (as positive claims) | “frozen embedding/CE”; “CE improves retrieval” / “CE lift” for n=30; proxy `+1` as proof; “public flip ready” / “v1 Done” from Guide 06 alone |
| LICENSE | Document as **unmet** public-flip prerequisite if absent — **do not** add LICENSE file in Guide 06 |
| Fail-closed pointer | Reference `scripts/checks/public_fail_closed.py` in public-flip checklist item 1 |

---

## Locked decisions (do not reopen)

| Decision | Lock (2026-07-17 Tom) |
|----------|----------------------|
| Formal freeze after checklist? | **Park** until new evidence or explicit override |
| Public flip in Guide 06 Implement? | **Checklist only**; flip = separate human gate |
| Model status | **Candidates**; no invent lift; CE stays in stack |

---

## Three gates (binding mental model)

| Gate | Meaning | Status entering Guide 06 | Who closes it |
|------|---------|--------------------------|---------------|
| **1. Keep-in-stack** | Architecture + honesty; may still be candidate | **Done** (Guide 05) | Already locked |
| **2. Formal freeze** | Portfolio claim embed/CE IDs frozen | **Open / parked** — §9 unchecked | Tom only |
| **3. Public flip** | Marketing / “v1 Done” / public-release | **Open** — §9 unchecked | Tom only |

**Guide 06 Implement closes none of gates 2–3.** It only lands auditable packaging.

---

## Acceptance criteria (Implement — unchecked until then)

- [ ] `MODEL_FREEZE_STATUS.md` has **Formal freeze packaging (Guide 06)** section after keep-with-justification; states park + keep ≠ freeze; points at human-only checklist; no status→frozen.  
- [ ] `docs/PUBLIC_FLIP_CHECKLIST.md` exists with the six minimum gates below; banner: checklist ≠ flip.  
- [ ] INTERVIEW + GETTING_STARTED + README each gain **one** cross-link sentence (no FAQ rewrite theater).  
- [ ] Status tables still **candidate**; VISION §9 freeze + public-flip still `- [ ]`.  
- [ ] Required honesty sentences present; verification `rg` clean of forbidden positive claims.  
- [ ] No ranking/eval/ingest code; no new LICENSE file.

---

## Ordered step checklist

All boxes start unchecked. **Do not check in Write / Refine / Ready-check.** Only Implement checks them.

### Phase A — Evidence re-anchor (read-only)

- [ ] **A1.** Confirm `evals/last_run_summary.json`: `n_cases=30`, `ce_vs_rrf_ask_delta_hits=0`, hits 26/26, CE `Xenova/ms-marco-MiniLM-L-6-v2`, mode `classification`, generator `gemma4:e2b`.  
- [ ] **A2.** Confirm `MODEL_FREEZE_STATUS.md`: **candidate** tables; keep-with-justification present; six-item human freeze checklist; proxy = non-evidence.  
- [ ] **A3.** Confirm VISION §9 freeze + public-flip rows are `- [ ]`; do **not** flip.  
- [ ] **A4.** If A1–A3 contradict locks → **STOP** for hub/human.

### Phase B — Formal freeze packaging (docs)

- [ ] **B1.** In `evals/MODEL_FREEZE_STATUS.md`, after Keep-with-justification, add **Formal freeze packaging (Guide 06)** that:  
  - Points at the existing human-only freeze checklist (do not invent new metric gates).  
  - States n=30 / delta **0** is **insufficient** to freeze without new evidence **or** explicit Tom override.  
  - Defines freeze in interview language (portfolio lock of embed/CE IDs for ranking claims).  
  - States Guide 05 keep-with-justification **≠** freeze.  
  - Records Tom lock: freeze **parked**.  
- [ ] **B2.** One-sentence cross-link from INTERVIEW §5 or §8 and from GETTING_STARTED honesty table → that section.  
- [ ] **B3.** Do **not** change candidate → frozen.

### Phase C — Public-flip packaging checklist (docs)

- [ ] **C1.** Create `docs/PUBLIC_FLIP_CHECKLIST.md` with banner “checklist ≠ public flip / v1 Done” and these **gates** (document current unmet status honestly):  
  1. Fixtures-only corpus; `scripts/checks/public_fail_closed.py` green; no OEM/Drive/Ford in git.  
  2. Stranger-clone path (GETTING_STARTED: Compose, env, Ollama, ingest, health, ask, eval smoke).  
  3. Honesty surfaces: candidates (or later human-frozen with checklist); no lift theater; no proxy `+1` as proof.  
  4. Formal freeze gate still **parked** — public flip remains blocked on a *separate* Tom lock (do not treat Guide 06 as resolving freeze or flip).  
  5. VISION §9 / README / INTERVIEW banners flip **only** after Tom locks public flip — not in this Implement.  
  6. No secrets in git; **LICENSE** currently absent — list as unmet prerequisite for a future flip; **do not** add LICENSE here.  
- [ ] **C2.** Link `docs/PUBLIC_FLIP_CHECKLIST.md` from README and INTERVIEW §8 (one line each).  
- [ ] **C3.** Do **not** check VISION §9 public-flip.

### Phase D — Align light surfaces (docs only)

- [ ] **D1.** `rg` honesty surfaces for forbidden positive claims / automatic-freeze language; fix prose only.  
- [ ] **D2.** ARCHITECTURE honesty: still candidates + Guide 05 keep; add one pointer to Guide 06 freeze packaging section + `PUBLIC_FLIP_CHECKLIST.md`.  
- [ ] **D3.** Optional (not required for DoD): one-line VISION §9 footnote that packaging checklists exist — **without** checking boxes.

### Phase E — Stop

- [ ] **E1.** No code path changes; no LICENSE file created.  
- [ ] **E2.** Stop. No freeze authoring, no public-flip marketing, no ranking, no g10.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
rg -n 'ce_vs_rrf_ask_delta_hits|candidate|frozen|keep-with-justification|public flip|PUBLIC_FLIP|Formal freeze packaging' \
  evals/MODEL_FREEZE_STATUS.md docs/VISION.md GETTING_STARTED.md INTERVIEW.md README.md docs/ARCHITECTURE.md \
  docs/PUBLIC_FLIP_CHECKLIST.md docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md

# Must find: candidate; delta 0 / no lift; Guide 05 keep; Formal freeze packaging; PUBLIC_FLIP_CHECKLIST
# Must NOT find as positive claims: CE improved citation hits on n=30; embed/CE frozen;
#   public flip ready / v1 Done from Guide 06; proxy +1 as proof

rg -n 'Formal embed/CE|Public flip' docs/VISION.md
# Expect both portfolio rows still "- [ ]"

test -f docs/PUBLIC_FLIP_CHECKLIST.md
test ! -f LICENSE   # Guide 06 must not have created one; if LICENSE appears from unrelated work, do not claim Guide 06 added it
```

**DoD (Implement):** Freeze packaging section + `PUBLIC_FLIP_CHECKLIST.md` + thin cross-links; candidates unchanged; §9 unchecked; honesty sentences hold; no lift/freeze/flip theater; no code; no LICENSE invent.

**DoD (Refine — this pass):** Pins + placement locked; human decisions recorded as locks; Ready-check readiness scored; no Implement.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Freeze theater | Docs / interview | Park lock; B3; §9 grep |
| Keep confused with freeze | Interviewers | Three-gates + B1 keep ≠ freeze |
| Proxy resurrection | Eval honesty | Forbidden evidence pin; field-name discipline |
| Accidental public-flip claim | Portfolio | C1 banner; C3; checklist ≠ flip |
| LICENSE invent / scope creep | Legal packaging | Constraint 10; C1.6 document-only |
| Duplicate checklist SSOT | Maintainers | Public flip = dedicated file only; others link |
| Ranking / reindex creep | Product code | Docs-only; E1–E2 |
| Doc blast | MODEL_FREEZE_STATUS, PUBLIC_FLIP_CHECKLIST, INTERVIEW, GETTING_STARTED, README, ARCHITECTURE, optional VISION footnote | Phases B–D |

### Rollback

Revert Guide 06 doc commits; restore prior honesty surfaces. No schema/code rollback.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Tom overrides park and wants freeze now | Stop until override lock is written in hub/locks; still cite flat delta; **out of default Guide 06 Implement** |
| Tom wants public flip while candidates | Separate Stage + lock; not Guide 06 default; would need explicit “candidates at public flip” banner |
| Future re-run shows non-zero delta | New guide / re-baseline — do not silently claim lift here |
| Implement tempted to put public-flip body in INTERVIEW | Forbidden — link only; body in `docs/PUBLIC_FLIP_CHECKLIST.md` |
| Desire to flip §9 in Guide 06 | Forbidden without Stage + Tom lock |
| g10 / second vehicle / PrivateGold in checklist | Strike from DoD; optional “non-blocking deferred / not required for fixtures-only flip” note only |
| Proxy `+1` cited as freeze proof | Reject; point at historical proxy section |
| `PUBLIC_FLIP_CHECKLIST.md` already exists from prior attempt | Edit in place; do not fork a second SSOT |

---

## Stop conditions

- **Refine-dev-guide:** Stop after this refine + numeric readiness. Do **not** Implement / Ready-check unless Tom authorizes Ready-check next.  
- **Later Implement:** Stop when Phases A–E DoD met; §9 still unchecked; freeze still parked; no LICENSE invent.  
- **Stop for human if:** invent freeze/lift requested; evidence contradicts locks; code scope; §9 flip without lock.

---

## Refine pass notes (2026-07-17)

- Converted open decisions → **locked** (Tom agreed: park freeze; checklist-only public flip; candidates).  
- **Pinned placements:** freeze packaging → `MODEL_FREEZE_STATUS.md` section; public flip → `docs/PUBLIC_FLIP_CHECKLIST.md` (removed Implement invent of file-vs-section).  
- Clarified LICENSE as unmet documented gate — not created by Guide 06.  
- Tightened C1.4 to park language (no “flip while candidates” as Guide 06 path).  
- Added fail-closed script path pin; D3 explicitly optional for DoD.  
- Soft residual remaining: exact section prose / cross-link sentence craft at Implement.

---

## Ready-check readiness (binding score)

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 06 formal freeze packaging / public-flip checklist | **9.1 / 10** | Implement still authors exact B1/C1 prose and one-sentence cross-links (craft residual). Soft residual only — **not** material invent. Not 10 because prose voice and optional D3 footnote remain unwritten. |

**Ready-check next?** **Yes.**  
**Implement next?** **No** — Ready-check first, then Tom Stage authorize Implement.  
**More Refine needed?** **No** — one refine pass complete; further refine would be polish theater.
