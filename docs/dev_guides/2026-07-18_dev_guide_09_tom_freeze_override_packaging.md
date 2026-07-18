# Dev Guide 09 — Path B Tom freeze-override packaging (docs-only)

**Date:** 2026-07-18  
**Repo:** `mechanic_rag`  
**Work item:** Guide 09 — formal embed/CE **freeze via Tom override** (honest; no fake lift)  
**Stage that authored this:** Write-dev-guide (pass 152)  
**Status:** **Implemented** 2026-07-18 (Guide 09 Path B freeze-override packaging) — freeze Met by Tom override; public flip **not** Met  
**Ready-check:** `docs/2026-07-18_guide09_ready_check_pass152_note.md` (9.2/10)  
**Handoff (Implement):** `second_brain/docs/2026-07-18_spoke_mechanic_implement_freeze_override_pass152_handoff.md`  
**Context SSOT:** `mechanic_rag/docs/2026-07-18_path_to_formal_freeze_public_flip_context_summary.md`  
**Handoff (Write):** `second_brain/docs/2026-07-18_spoke_mechanic_write_freeze_override_pass152_handoff.md`  
**Freeze SSOT:** `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
**Prerequisite:** Guide 05 keep; Guide 06 packaging; Guide 07–08 flat n=44 evidence; Tom Path **B** lock (pass 152)

**Tom locks (pass 152 — do not reopen):**

| Pin | Lock |
|-----|------|
| Freeze path | **B** — override packaging (not Guide-08-redux discriminative goldens) |
| Evidence honesty | n=44 `ce_vs_rrf_ask_delta_hits=0`; CE-helps=0 / CE-hurts=0 must remain stated |
| Override meaning | Freeze **despite** flat delta — **not** an earned lift claim |
| Public flip / LICENSE | **Out of this guide’s Met** — still separate; LICENSE remains absent |

---

## Objective

Land **docs-only Path B freeze-override packaging** so portfolio formal freeze (VISION §9 freeze row) can close **honestly**:

1. Embedding `nomic-embed-text` @ 768 and CE `Xenova/ms-marco-MiniLM-L-6-v2` (`classification`) flip from **candidate** → **frozen by Tom override**.  
2. Written honesty: paired-ask citation∩gold delta was **0** on n=30 / n=38 / **n=44** — **do not** claim CE improved citation hits.  
3. Keep CE **in the ranking stack** (unchanged architecture; override freezes IDs, does not invent lift).  
4. Guide 05 keep-with-justification retained as **historical** honesty; superseded for status by Guide 09 override freeze section.  
5. **Public flip stays unchecked.** No LICENSE invent.

**Success signal (after Implement):** A reviewer reading `MODEL_FREEZE_STATUS.md` + INTERVIEW sees models **frozen by override**, still cannot honestly believe “CE proved lift,” and cannot believe public flip / v1 Done from this guide alone.

**This Write stage does not Implement and does not claim freeze Met.**

---

## Learning notes (interview-portable)

1. **Override freeze ≠ earned freeze** — Locking model IDs for portfolio narrative can be explicit human judgment when ablation is flat; honesty must say so.  
2. **Ablation honesty survives freeze** — Frozen status does not rewrite `ce_vs_rrf_ask_delta_hits=0`.  
3. **Three gates remain** — keep (done) ≠ freeze (this guide) ≠ public flip (later).  
4. **Docs-only delivery** — No ranking/eval/fixture code in default Implement.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-18_path_to_formal_freeze_public_flip_context_summary.md`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/last_run_summary.json` (n=44; delta 0)
- `mechanic_rag/docs/VISION.md` (§2; **§9** freeze + public-flip)
- `mechanic_rag/docs/ARCHITECTURE.md` (honesty / candidate lines)
- `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md` (link only; do not flip)
- `mechanic_rag/INTERVIEW.md` / `GETTING_STARTED.md` / `README.md`
- `mechanic_rag/docs/dev_guides/2026-07-16_dev_guide_05_model_keep_honesty.md`
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`
- `mechanic_rag/docs/dev_guides/2026-07-17_dev_guide_08_harder_discriminative_ce_traps.md` (closed flat — do not reopen)
- `second_brain/docs/2026-07-18_spoke_mechanic_write_freeze_override_pass152_handoff.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

**Forbidden as lift/freeze evidence:** proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; inventing positive ask delta; Guide-08-redux discriminative goldens as DoD.

---

## Architecture constraints (binding)

1. **Docs-only.** No ranking redesign, model swaps, reindex, golden growth, PrivateGold, Drive, Ford, OEM, second vehicle, g10 residual.  
2. **Path B only.** Do **not** add discriminative traps or claim freeze was earned by lift.  
3. **Honesty mandatory:** n=44, `rrf_only_ask_hits=39`, `ce_ask_hits=39`, `ce_vs_rrf_ask_delta_hits=0`, CE-helps=0 / CE-hurts=0 (`evals/last_run_summary.json`).  
4. **Status flip allowed only with override language** — tables may say **frozen (Tom override)**; never “frozen because CE lift.”  
5. **Three gates distinct** — keep ≠ freeze ≠ public flip.  
6. **VISION §9:** Implement may check **freeze** row after override packaging; **must leave public-flip unchecked**.  
7. **Do not create `LICENSE`.** Do not mark public flip ready / v1 Done.  
8. **Generator `gemma4:e2b` is not a freeze lock** (record as eval generator only).  
9. **CE stays in the stack** — freeze IDs; do not remove rerank path.  
10. **Human-only freeze checklist** in `MODEL_FREEZE_STATUS.md` remains SSOT; Path B is the documented **override** unlock (flat delta + explicit Tom lock), not a new metric invent.

---

## Soft pins (binding for Implement)

| Pin | Locked default |
|-----|----------------|
| Path | **B** — Tom freeze-override packaging |
| Embedding | Ollama `nomic-embed-text` @ 768 → **frozen (Tom override)** |
| Cross-encoder | `Xenova/ms-marco-MiniLM-L-6-v2` / `transformers_js` / `classification` → **frozen (Tom override)**; remains in pipeline |
| Evidence cite | Guide 08: n=**44**, hits **39/39**, `ce_vs_rrf_ask_delta_hits=**0**`, helps=**0**, hurts=**0**, `degrade_rate=0.0`, `avg_ce_latency_ms≈129.8`, generator `gemma4:e2b` |
| Override placement | **Pinned:** new section in `evals/MODEL_FREEZE_STATUS.md` after “Formal freeze packaging (Guide 06)”, titled **“Formal freeze — Tom override (Guide 09)”** |
| Status tables | Top table Status cells flip to **frozen (Tom override — flat delta; no lift claim)** |
| Guide 05 keep note | Keep as historical; add one line that Guide 09 **supersedes status** (candidates → frozen by override) without erasing delta-0 honesty |
| Guide 06 park language | Update “parked” / “candidates until override” to point at Guide 09 override as the lock that unparked freeze |
| VISION §9 freeze row | Check `[x]` with prose: frozen by Tom override; n=44 delta 0; no lift; public flip still open |
| VISION §9 public-flip row | **Must stay `[ ]`** |
| PUBLIC_FLIP_CHECKLIST gate 4 | Update freeze gate from “Parked” to “Resolved by Guide 09 override (freeze Met after Implement)” — **do not** claim public flip |
| Required honesty sentences (must appear) | (1) Paired-ask citation∩gold delta was **0** on n=30, n=38, and **n=44**. (2) Models are **frozen by Tom override**, not because CE proved lift. (3) Cross-encoder **stays in the stack**. (4) **Do not** claim CE improved citation hits on these runs. (5) Guide 09 freeze **≠** public flip / v1 Done / LICENSE. |
| Forbidden phrases (as positive claims) | “CE improves retrieval” / “CE lift” for n=30/38/44; proxy `+1` as proof; “earned freeze from ablation”; “public flip ready” / “v1 Done” from Guide 09 |
| Authoring | Implement drafts prose meeting required sentences; Tom may edit voice — DoD is honesty correctness |
| LICENSE | **Out of Met** — do not add file |
| Discriminative goldens | **Out of scope** — Path A rejected for this guide |

---

## Locked decisions (do not reopen)

| Decision | Lock |
|----------|------|
| Path | **B** override (pass 152) |
| Discriminative redux | **Forbidden** as this guide’s DoD |
| Public flip / LICENSE | **Out of Met** |
| Freeze Met at Write | **No** — Write authors guide only |
| Freeze Met at Implement | **Yes** — after override packaging lands and honesty holds |

---

## Acceptance criteria (Implement)

- [x] `MODEL_FREEZE_STATUS.md` Guide 09 override section authored; status tables say **frozen (Tom override)**  
- [x] All **required honesty sentences** present; n=44 delta **0** explicit  
- [x] VISION §9 freeze `[x]`; public-flip `[ ]`  
- [x] INTERVIEW / GETTING_STARTED / README / ARCHITECTURE honesty aligned (frozen by override; no lift)  
- [x] `PUBLIC_FLIP_CHECKLIST.md` gate 4 updated honestly; gates 5–6 still unmet for flip  
- [x] Verification `rg` finds no lift theater / no public-flip-ready claim  
- [x] No ranking/eval/fixture code; no LICENSE file created  

---

## Ordered step checklist

### Phase A — Evidence anchor

- [x] **A1.** Quote Guide 08 fields from `evals/last_run_summary.json` into the override section (n=44, hits 39/39, delta 0, helps/hurts 0, CE id/mode, generator).  
- [x] **A2.** Confirm human-only freeze checklist six items remain; note Path B = override unlock (flat delta + Tom lock), not lift unlock.  
- [x] **A3.** Confirm `test ! -f LICENSE` still true — document unmet for public flip only; do not invent LICENSE.

### Phase B — Author override freeze

- [x] **B1.** Add **“Formal freeze — Tom override (Guide 09)”** section to `MODEL_FREEZE_STATUS.md` with required honesty sentences + date/lock cite (pass 152 Path B).  
- [x] **B2.** Flip top status table cells to **frozen (Tom override — flat delta; no lift claim)**. Remove “Agent must not invent freeze” once freeze is human-authorized and packaged.  
- [x] **B3.** Add supersession note under Guide 05 keep: status superseded by Guide 09; historical keep honesty retained.  
- [x] **B4.** Update Guide 06 packaging prose: freeze no longer “parked”; override landed; public flip still separate.

### Phase C — Align honesty surfaces

- [x] **C1.** VISION §2 portfolio slot + §9: check freeze row; leave public-flip unchecked; update banner/date honesty.  
- [x] **C2.** INTERVIEW §5–§8: frozen by override; n=44 delta 0; packaging ≠ public flip.  
- [x] **C3.** GETTING_STARTED + README maturity lines: candidates → frozen-by-override; no lift; no v1 Done.  
- [x] **C4.** ARCHITECTURE honesty / deferred-freeze lines: point at Guide 09 override; public flip still open.  
- [x] **C5.** `PUBLIC_FLIP_CHECKLIST.md` gate 3–4 honesty refresh only — **no** flip claim.

### Phase D — Stop

- [x] **D1.** No code path changes; no golden/fixture edits; no LICENSE.  
- [x] **D2.** Stop. Do **not** start public-flip Implement or discriminative Guide 10.

---

## Verification / Definition of Done

```bash
# From mechanic_rag/
# Honesty + freeze-by-override present; no lift theater; public flip not claimed
rg -n 'frozen \(Tom override\)|ce_vs_rrf_ask_delta_hits|n=44|candidate|public flip|LICENSE' \
  evals/MODEL_FREEZE_STATUS.md docs/VISION.md docs/PUBLIC_FLIP_CHECKLIST.md \
  INTERVIEW.md GETTING_STARTED.md README.md docs/ARCHITECTURE.md

# Must find: frozen (Tom override); delta 0 / n=44; public flip still open / unchecked
# Must NOT find as positive claims: CE improves retrieval / CE lift on n=44; proxy +1 as proof;
#   public flip ready / v1 Done from Guide 09; earned freeze from ablation

test ! -f LICENSE   # Guide 09 must not invent LICENSE

# VISION §9: freeze checked; public-flip unchecked
rg -n 'Formal embed/CE \*\*freeze\*\*|Public flip' docs/VISION.md
```

**DoD (Implement):** Override freeze packaging landed; status tables frozen-by-override; §9 freeze checked; §9 public-flip unchecked; required honesty sentences hold; no lift theater; no LICENSE; no ranking code.

**DoD (this Write):** Guide executable with steps / DoD / blast / edges; **no** Implement; **no** freeze Met claim from Write alone.

---

## Blast radius and risks

| Risk | Angle | Mitigation |
|------|-------|------------|
| Fake lift while freezing | Interview | Required delta-0 sentences; forbidden phrases |
| Accidental public flip / LICENSE | Marketing / legal | Soft pins; verification `test ! -f LICENSE`; §9 public-flip stays open |
| Erasing Guide 05 keep history | Maintainability | Supersession note; keep historical paragraphs |
| Reopening Path A discriminative work | Scope | Constraint 2; Phase D stop |
| Ranking code temptation | Scope | Docs-only hard stop |
| “Frozen” without override label | Honesty | Status cells must say Tom override / flat delta |

**Blast radius (Implement):** `MODEL_FREEZE_STATUS.md`, VISION §9, INTERVIEW / GETTING_STARTED / README / ARCHITECTURE honesty, thin `PUBLIC_FLIP_CHECKLIST` gate text — **not** ranking/eval/fixture code.

### Rollback

Revert doc commits; restore candidate status tables + §9 freeze unchecked if override packaging is rejected.

---

## Edge-case handling

| Case | Behavior |
|------|----------|
| Desire to claim CE lift while freezing | **Hard fail** Review — delta remains 0 |
| Desire to check public flip in same delivery | **Hard fail** — out of Met; separate guide after LICENSE |
| Tom wants embed-only freeze | Stop for new lock — default pin is **both** embed + CE |
| Tom wants freeze but keep “candidate” wording | **Hard fail** — Path B means status→frozen with override label |
| Stale “parked until override” lines remain | Fix in Phase B4 / C — leave no contradiction |
| Agent tries golden growth “just in case” | Out of scope — Path A rejected |

---

## Stop conditions

- Write: this guide landed; handoff Results filled; no Implement.  
- Implement (later): Phases A–D DoD met; freeze Met by override; public flip **not** Met.  
- **No** discriminative goldens. **No** LICENSE invent. **No** ranking changes.

---

## Ready for Ready-check?

**Yes** — thin docs-only guide; Path B locked; placements pinned; honesty sentences pinned.  
Residual craft: exact FAQ voice at Implement (required sentences are pins). Not blocking Write DoD.
