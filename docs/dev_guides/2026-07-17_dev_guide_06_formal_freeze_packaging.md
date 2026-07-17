# Dev Guide 06 — Formal freeze packaging / public-flip checklist (docs-only)

**Date:** 2026-07-17  
**Repo:** `mechanic_rag`  
**Work item:** Guide 06 — formal freeze packaging / public-flip checklist (docs)  
**Stage that authored this:** Write-dev-guide (spoke; handoff `second_brain/docs/2026-07-17_spoke_mechanic_freeze_packaging_write_handoff.md`)  
**Status:** **Draft** — Write-dev-guide complete; not yet Refine / Ready-check / Implement  

**Context SSOT (prior):** `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`  
**Prior guide (done):** `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
**Locks:** `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md` (Mechanic models keep-as-candidates); hub pass 70 park of freeze-without-new-evidence; pass 79 spoke authorize for this packaging guide  

**Prerequisite:** Guide 04 ≥30 goldens + paired-ask re-baseline shippable; Guide 05 keep-with-justification authored (candidates; CE in stack; no lift claim).

---

## Objective

Author an **executable packaging checklist** that separates three gates and keeps docs honest for portfolio / interview claims:

1. **Keep-in-stack** (already done — Guide 05) — embed + CE remain **candidates**; CE stays in ranking; keep-with-justification authored; paired-ask citation∩gold delta **0** on n=30.  
2. **Formal freeze** (human-only; **parked** without new evidence or explicit Tom lock) — checklist + evidence gates documented; status tables stay **candidate** until human authors freeze.  
3. **Public flip** / portfolio “v1 Done” marketing (separate human gate) — packaging checklist **≠** flip; VISION §9 public-flip row stays unchecked unless Tom later locks.

**Success signal:** A later Implement agent (or reviewer) can walk the checklist, point at exact evidence paths, and leave VISION §9 freeze + public-flip boxes **unchecked** while still having a clear “what must be true before freeze / before public flip” doc surface. No invented CE lift. No freeze theater.

**This Write stage does not flip any status checkboxes.** Implement (later, only if authorized) may *add* checklist prose / optional `PUBLIC_FLIP_CHECKLIST.md` — still without flipping §9 unless Tom explicitly locks freeze and/or public flip.

---

## Learning notes (interview-portable)

1. **Candidate vs frozen** — Shipping a component in the product path is compatible with “candidate” status when ablation is flat. Freeze is a **portfolio claim**, not a code deploy.  
2. **Ablation honesty** — Paired ask (rerank-on vs fusion-only) is the evidence; packaging prose must match `ce_vs_rrf_ask_delta_hits`, not historical proxy fields.  
3. **Packaging checklist ≠ release gate** — Writing “what would be required to go public” is documentation hygiene; checking “public flip” is an irreversible marketing/ops gate.  
4. **Definition of Done vs Definition of Ready** — Guide 06 DoD is “checklist exists and honesty rails hold.” Ready-for-freeze / ready-for-public-flip are **separate** human decisions with higher bars.

---

## References (paths only)

### Product / evidence

- `mechanic_rag/docs/2026-07-15_guide05_model_freeze_keep_context_summary.md`
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/evals/PATH_TO_30.md`
- `mechanic_rag/docs/VISION.md` (§2 portfolio slot; **§9** freeze + public-flip rows)
- `mechanic_rag/docs/ARCHITECTURE.md` (§7 ranking; §15 honesty; deferred freeze)
- `mechanic_rag/INTERVIEW.md` (§5–§8 freeze / packaging / public flip)
- `mechanic_rag/GETTING_STARTED.md` (honesty table)
- `mechanic_rag/README.md` (status banners)

### Hub / locks / program

- `second_brain/docs/2026-07-16_human_locks_pass60_fan_in.md`
- `second_brain/docs/2026-07-17_spoke_mechanic_freeze_packaging_write_handoff.md`
- `second_brain/docs/2026-07-17_hub_spoke_persistent_sessions_note.md`
- `second_brain/docs/2026-07-17_portfolio_progress_report_pass79.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

### Prior packaging shape (peer pattern — do not reopen Guide 03 scope)

- `mechanic_rag/docs/dev_guides/2026-07-14_dev_guide_03_packaging_getting_started_interview.md`

**Non-authoritative / forbidden as freeze or lift evidence:** historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; Guide 02 n=12 as “current” maturity; inventing positive `ce_vs_rrf_ask_delta_hits`.

---

## Architecture constraints (binding)

1. **Docs-only.** No ranking code, model swaps, reindex, eval harness changes, PrivateGold, Drive, Ford, OEM PDFs, second vehicle, or g10 grounding residual.  
2. **Models stay candidates** unless Tom later explicitly locks formal freeze with checklist evidence. Write + default Implement path: **do not** change status tables to frozen.  
3. **Do not invent CE lift.** Cite Guide 04 paired ask: n=30, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, `ce_vs_rrf_ask_delta_hits=0`.  
4. **Forbidden freeze evidence:** proxy `ce_vs_rrf_delta_hits=+1` / `n=5` / lexical-proxy-alone / answer-substring-as-lift.  
5. **Three gates stay distinct** — keep-in-stack ≠ formal freeze ≠ public flip. Guide 05 keep-with-justification **does not** satisfy VISION §9 freeze.  
6. **VISION §9 freeze / public-flip checkboxes** — Write stage **must not** flip them. Implement stage **must not** flip them unless Tom’s Stage authorize + explicit lock language says so. Default Implement = checklist packaging only.  
7. **Compose Postgres+pgvector; local CE; public fixtures only** — unchanged stack locks.  
8. **Generator `gemma4:e2b` is not a freeze lock** — freeze checklist requires paired ask under that generator as evidence context, not as “generator frozen.”  
9. **Packaging checklist ≠ public flip** — completing Guide 06 Implement must not claim portfolio v1 Done or public-flip ready.

---

## Soft pins

| Pin | Locked default |
|-----|----------------|
| Embedding | Ollama `nomic-embed-text` @ 768 — **candidate** |
| Cross-encoder | `Xenova/ms-marco-MiniLM-L-6-v2` via `transformers_js` / `classification` — **candidate**, remains in pipeline |
| Current evidence cite | Guide 04 paired ask: n=30, generator `gemma4:e2b`, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, `ce_vs_rrf_ask_delta_hits=0`, `degrade_rate=0.0`, `avg_ce_latency_ms≈94.7` — `evals/last_run_summary.json` |
| Keep-in-stack gate | **Closed** by Guide 05 — do not reopen; do not rewrite keep note unless honesty drift found |
| Formal freeze now | **Park** without new paired-ask evidence **or** explicit Tom lock overriding park |
| Public flip in Guide 06 | **Checklist only** — flip remains separate human gate |
| Human-only freeze checklist SSOT | `evals/MODEL_FREEZE_STATUS.md` “Freeze checklist (human-only)” — six items; agent formats, human authors freeze |
| Optional new artifact (Implement) | `docs/PUBLIC_FLIP_CHECKLIST.md` **or** a clearly titled section in `MODEL_FREEZE_STATUS.md` / INTERVIEW — pick one placement at Implement; prefer dedicated file if section would exceed ~40 lines |
| Required honesty sentences (must remain true after Implement) | (1) Paired-ask citation∩gold delta was **0** on n=30. (2) Models remain **candidates**, not frozen — unless Tom locked freeze in writing. (3) Cross-encoder **stays in the stack**. (4) **Do not** claim CE improved citation hits on this run. (5) Packaging checklist **≠** public flip / portfolio v1 Done. |
| Forbidden phrases (unless quoting as anti-pattern) | “frozen embedding”, “frozen CE”, “CE improves retrieval” / “CE lift” for n=30, citing proxy `+1` as proof, “public flip ready” / “v1 Done” from Guide 06 alone |
| Stack | Compose Postgres+pgvector; local CE; fixtures-only public corpus |

---

## Three gates (binding mental model)

| Gate | Meaning | Status entering Guide 06 | Who closes it |
|------|---------|--------------------------|---------------|
| **1. Keep-in-stack** | CE + embed stay in product architecture with honesty note; status can still be candidate | **Done** (Guide 05) | Already locked pass 60 |
| **2. Formal freeze** | Human declares embed and/or CE **frozen** for portfolio ranking claims after freeze checklist | **Open / parked** — VISION §9 unchecked | Tom only; requires checklist + evidence (or explicit override lock) |
| **3. Public flip** | Marketing / portfolio “v1 Done” / public-release claim | **Open** — VISION §9 unchecked | Tom only; packaging checklist is prerequisite narrative, not the flip |

**Implement of Guide 06 closes none of gates 2–3 by default.** It only lands the checklist packaging so those gates are auditable.

---

## Acceptance criteria (for later Implement — not checked in Write)

- [ ] Formal-freeze packaging checklist exists (in `MODEL_FREEZE_STATUS.md` and/or linked from INTERVIEW / GETTING_STARTED) and mirrors human-only freeze items without inventing new metrics.  
- [ ] Public-flip packaging checklist exists (dedicated file **or** bounded section) listing stranger-clone + honesty + corpus + freeze-gate prerequisites — **without** checking VISION §9 public-flip.  
- [ ] Status tables still say **candidate** for embed + CE (unless Tom locked freeze mid-Implement — default: no).  
- [ ] VISION §9 freeze + public-flip rows remain **unchecked** under default Implement.  
- [ ] Required honesty sentences still present on honesty surfaces.  
- [ ] Verification `rg` finds no forbidden lift / freeze / public-flip-ready theater.  
- [ ] No ranking / eval / ingest code changes required for DoD.

---

## Ordered step checklist

All boxes start unchecked. **Do not check boxes in Write / Refine / Ready-check.** Only Implement (when authorized) checks them.

### Phase A — Evidence re-anchor (read-only)

- [ ] **A1.** Open `evals/last_run_summary.json` and confirm: `n_cases=30`, `ce_vs_rrf_ask_delta_hits=0`, `rrf_only_ask_hits=26`, `ce_ask_hits=26`, CE id `Xenova/ms-marco-MiniLM-L-6-v2`, `ce_runtime_modes_seen` includes `classification`, generator `gemma4:e2b`.  
- [ ] **A2.** Open `evals/MODEL_FREEZE_STATUS.md` and confirm: status tables **candidate**; keep-with-justification present; human-only freeze checklist still lists the six gates; proxy section labeled non-evidence.  
- [ ] **A3.** Open VISION §9 and confirm freeze + public-flip rows are **unchecked**; do **not** flip them in this guide.  
- [ ] **A4.** If any of A1–A3 contradict locks (positive inventable delta, already-frozen tables without Tom lock, §9 already checked without checklist), **STOP** and escalate to hub/human — do not invent reconciliation.

### Phase B — Formal freeze packaging (docs)

- [ ] **B1.** Add a **“Formal freeze packaging (Guide 06)”** section (or equivalent clear heading) that:  
  - Points at the existing human-only freeze checklist.  
  - States current evidence (n=30, delta **0**) is **insufficient** to freeze without new evidence **or** explicit Tom lock.  
  - Lists what “freeze” would mean in interview language (portfolio claim that embed/CE IDs are locked for ranking claims).  
  - Explicitly says Guide 05 keep-with-justification **≠** freeze.  
- [ ] **B2.** Cross-link INTERVIEW §5/§8 and GETTING_STARTED honesty table to the new freeze-packaging section (one sentence each — no FAQ rewrite theater).  
- [ ] **B3.** Do **not** change status tables from candidate → frozen.

### Phase C — Public-flip packaging checklist (docs)

- [ ] **C1.** Create `docs/PUBLIC_FLIP_CHECKLIST.md` **or** a bounded “Public flip packaging (Guide 06)” section. Minimum items to list (as **gates**, all currently unmet for flip):  
  1. Fixtures-only public corpus; public fail-closed check green; no OEM/Drive/Ford in git.  
  2. Stranger-clone path works (GETTING_STARTED: Compose, env, Ollama, ingest, health, ask, eval smoke).  
  3. Honesty surfaces consistent: candidates (or human-frozen with checklist), no lift theater, no proxy `+1` as proof.  
  4. Formal freeze gate resolved **or** explicit Tom decision that public flip may proceed while models remain candidates (rare; must be written).  
  5. VISION §9 / README / INTERVIEW banners updated **only after** Tom locks public flip — not as part of drafting the checklist.  
  6. No secrets in git; LICENSE / marketing claim language matches reality.  
- [ ] **C2.** Link the public-flip checklist from README and/or INTERVIEW §8 with banner: checklist ≠ flip complete.  
- [ ] **C3.** Do **not** check VISION §9 public-flip row.

### Phase D — Align light surfaces (docs only)

- [ ] **D1.** Grep honesty surfaces for drift (forbidden phrases; stale “freeze pending growth” if it implies freeze is automatic). Fix prose only.  
- [ ] **D2.** ARCHITECTURE honesty line: ensure it still says candidates + Guide 05 keep note; add one pointer to Guide 06 packaging checklists if missing.  
- [ ] **D3.** Optional: one-line VISION §9 footnote that Guide 06 packaging checklists exist — **without** checking freeze/public-flip boxes.

### Phase E — Stop

- [ ] **E1.** No code path changes.  
- [ ] **E2.** Stop. Do **not** start formal freeze authoring, public-flip marketing, ranking work, or g10 residual.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
# 1) Evidence still flat / candidate
rg -n 'ce_vs_rrf_ask_delta_hits|candidate|frozen|keep-with-justification|public flip|PUBLIC_FLIP' \
  evals/MODEL_FREEZE_STATUS.md docs/VISION.md GETTING_STARTED.md INTERVIEW.md README.md docs/ARCHITECTURE.md \
  docs/PUBLIC_FLIP_CHECKLIST.md docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md

# 2) Must find: candidate; delta 0 / no lift; Guide 05 keep; freeze packaging + public-flip checklist language
# 3) Must NOT find (as positive claims): CE improved citation hits on n=30; embed/CE frozen;
#    public flip ready / v1 Done from Guide 06 alone; proxy +1 as proof

# 4) VISION §9 freeze + public-flip must remain unchecked markdown:
rg -n 'Formal embed/CE|Public flip' docs/VISION.md
# Expect lines still starting with "- [ ]" for those two rows
```

**DoD (Implement):** Freeze packaging + public-flip packaging checklists exist and are linked; candidates unchanged; §9 freeze/public-flip unchecked; required honesty sentences present; no lift / freeze / flip theater; no code changes.

**DoD (this Write stage):** This guide file exists with objective, references, constraints, soft pins, ordered steps, verification/DoD, blast radius, edge cases, stop conditions — **no** status flips, **no** code.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Freeze theater | Docs / interview | Soft pins forbid flipping status; Review greps §9 unchecked; checklist states park without new evidence |
| Confusing Guide 05 keep with freeze | Maintainers / interviewers | Three-gates table; explicit “keep ≠ freeze” sentence in B1 |
| Proxy eval resurrection | Eval honesty | Forbidden evidence pin; rg for `ce_vs_rrf_delta_hits` without `_ask_` |
| Accidental public-flip claim | Portfolio marketing | C1–C3 require checklist ≠ flip; §9 stays unchecked |
| Scope creep into ranking / reindex | Product code | Hard stop docs-only; E1–E2 |
| Doc-only blast (Implement later) | VISION, INTERVIEW, GETTING_STARTED, MODEL_FREEZE_STATUS, README, optional PUBLIC_FLIP_CHECKLIST | Phase B–D lists exact targets; smallest prose diffs |

### Rollback

Revert Guide 06 doc commits; restore prior honesty surfaces. No schema/code rollback needed for default path.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Tom wants freeze **now** despite delta 0 | Stop for human lock in writing; do **not** invent lift; if Tom overrides park, Implement may author freeze **only** after that lock is recorded in hub/locks — still cite flat delta honesty |
| Tom wants public flip while models remain candidates | Allowed only with explicit written decision (C1 item 4); default recommend: resolve freeze gate first or document “candidates at public flip” banner |
| Evidence file shows non-zero delta after a future re-run | New guide / re-baseline — do not silently update freeze packaging to claim lift without Review |
| `PUBLIC_FLIP_CHECKLIST.md` vs inline section | Prefer dedicated file if content > ~40 lines; else section in MODEL_FREEZE_STATUS or INTERVIEW — one SSOT, not both full copies |
| Desire to flip §9 during Guide 06 Implement | **Forbidden** unless Stage fill-in + Tom lock explicitly authorize checkbox flips |
| g10 / second vehicle / PrivateGold appear in checklist draft | Strike — out of scope; may list as **non-blocking deferred** only under public-flip “not required for fixtures-only flip” |
| Historical proxy `+1` cited in a PR comment as freeze proof | Reject; point at MODEL_FREEZE_STATUS historical proxy section |

---

## Stop conditions

- **Write-dev-guide:** Stop when this guide is authored (this file). Do **not** Refine / Ready-check / Implement / flip status.  
- **Later Implement (when authorized):** Stop when Phase A–E DoD met; §9 freeze/public-flip still unchecked under default path.  
- **Stop for human immediately if:** asked to invent freeze or positive CE lift; evidence contradicts locks; scope expands to ranking code / reindex / PrivateGold / Drive / Ford; asked to check VISION §9 without Tom lock.  
- **Do not** proceed to Refine-dev-guide / Ready-check / Implement unless Tom authorizes with Stage fill-in in the persistent spoke chat.

---

## Open decisions (human only — do not invent locks)

### 1. Formal freeze after checklist?

- **In plain terms:** After Guide 06 lands the freeze packaging checklist, should we declare embed/CE frozen for portfolio claims?  
- **Options:** (A) Freeze now despite delta 0; (B) Park freeze until new paired-ask evidence; (C) Freeze embed only / CE stays candidate.  
- **Recommendation:** **(B) Park** until new evidence or an explicit Tom override lock.  
- **Reasoning:** Current paired ask is flat (`ce_vs_rrf_ask_delta_hits=0` on n=30). Freezing would overclaim ranking lock-in. Guide 05 already kept CE in-stack honestly.  
- **Tradeoffs:** Parking keeps interview answers longer (“why not frozen?”). Freezing now sounds stronger in a one-liner but fails the evidence bar and recreates freeze theater.

### 2. Public flip in Guide 06 Implement?

- **In plain terms:** When Implement runs, should we also mark the repo publicly “v1 Done,” or only write the checklist of what that would require?  
- **Options:** (A) Checklist only; (B) Checklist + flip §9 public-flip after Tom lock in same delivery; (C) Park public-flip packaging entirely.  
- **Recommendation:** **(A) Checklist only** in Guide 06; public flip remains a separate human gate.  
- **Reasoning:** Packaging ≠ release. Flip is irreversible marketing/ops; freeze gate is still open; fixtures-only honesty must stay explicit.  
- **Tradeoffs:** Two more human gates before “portfolio done” messaging. Faster flip would risk overclaiming while candidates remain unfrozen.

---

## Ready for next stage? (non-binding Write guess)

- **Ready for:** Refine-dev-guide (tighten pins / DoD wording if needed).  
- **Not ready for:** Implement (needs Refine + Ready-check + Tom Stage authorize).  
- **Guess Ready-check readiness:** ~8.5 / 10 after one Refine pass — not 10 because Implement still chooses PUBLIC_FLIP file vs section placement and exact cross-link sentences (craft residual, soft-pinned).
