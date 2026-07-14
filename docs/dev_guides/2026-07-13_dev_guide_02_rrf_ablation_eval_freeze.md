# Dev Guide 02 — True RRF-only ask ablation + golden growth + embed/CE freeze gate

**Date:** 2026-07-13  
**Repo:** `mechanic_rag`  
**Work item:** Guide 02 — true RRF-only ask ablation + golden growth + embed/CE freeze gate  
**Stage that authored this:** Write → Refine-dev-guide (pass 17)  
**Status:** Review complete — shippable as-is (pass 23); freeze still human-only / candidate  
**Context SSOT:** `docs/2026-07-13_guide02_rrf_ablation_eval_freeze_context_summary.md`  
**Prerequisite:** Guide 01 DoD met (shippable; do not reopen as unshippable)

---

## Objective

Replace **proxy CE-lift theater** with an **honest paired ask-path ablation**, then grow goldens and unlock a **human-only** embed/CE freeze gate.

**Deliver:**

1. **Paired ablation on the live ask pipeline** — same goldens, same corpus, same generator era, same hit predicate — comparing **full hybrid → RRF → section dedup → CE** vs **forced RRF(+dedup)-only** (CE skipped intentionally).
2. **Eval harness honesty** — rename/segregate lexical-FTS proxy fields; emit ask-path paired metrics; wire or remove dead `--compare-ce`.
3. **Golden growth** — bump fixture goldens to **≥10–15** with diverse intents + written path to **≥30**.
4. **Human freeze gate** — update `evals/MODEL_FREEZE_STATUS.md` process/evidence only after paired ask ablation (+ strongly preferred golden bump); never freeze on proxy `+1` / `n=5`.

**Not this guide:** ranking redesign, Drive/Ford/PrivateGold production, INTERVIEW packaging prose that claims CE lift, inventing MR5 numeric thresholds, hosted CE.

---

## Learning notes (new for Guide 02)

| Concept | Plain meaning | Example in this slice |
|---------|----------------|------------------------|
| **Construct validity** | A metric has construct validity when it measures the *claim* you attach to it — not a nearby convenient substitute. | Calling `ce_vs_rrf_delta_hits=+1` “CE lift” lacks construct validity: one arm is lexical FTS chunk match; the other is answer-substring luck on full ask. |
| **Confound** | Two things change at once, so you cannot attribute the delta to one cause. | Today’s delta confounds **pipeline stage** (lexical-only vs full ask) **and** **hit definition** (chunk content vs answer text). Ablation holds the hit definition fixed and flips only CE. |
| **Ablation vs natural degrade** | An **ablation** is an intentional experiment switch (“force CE off”). A **degrade** is failure recovery (“CE timed out → serve RRF order”). | Reusing the `!ce` code path is fine; labeling must differ: `ablation_rrf_only=true` vs `rerank_degraded=true`. Conflating them makes fail-rate look like an experiment. |

Short analogy: measuring “does the turbo help?” by comparing a bicycle (different vehicle) to a car with turbo is a confound. Ablation keeps the same car and only removes the turbo.

---

## References (paths only)

- `mechanic_rag/docs/2026-07-13_guide02_rrf_ablation_eval_freeze_context_summary.md` (context SSOT)
- `mechanic_rag/docs/ARCHITECTURE.md` (§7 ranking/degrade, §10 eval/MR5, §15 honesty — proxy ablation)
- `mechanic_rag/docs/VISION.md` (§8–§9 success checklist; ≥30 / freeze open)
- `mechanic_rag/docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md` (prior slice; residual ablation/≥30/freeze)
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/golden_fixture_v1.json`
- `mechanic_rag/evals/last_run_summary.json` (historical proxy baseline; qwen-era)
- `mechanic_rag/mecharag/eval_cmd.py`
- `mechanic_rag/mecharag/__main__.py` (`--compare-ce` dead flag)
- `mechanic_rag/web/src/server/ask.ts`
- `mechanic_rag/web/src/server/cross_encoder.ts`
- `mechanic_rag/web/src/app/api/ask/route.ts`
- `mechanic_rag/contracts/ask_request.schema.json`
- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` (#1–#3 backlog)
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

**Non-authoritative for this slice:** INTERVIEW packaging drafts, Drive/Ford ops docs, inventing public pass/fail thresholds.

---

## Architecture constraints (binding)

1. **Ranking order unchanged (MR2):** vehicle-filtered vector + lexical → **RRF** → **section dedup** → local **CE (N→K)** → context + citations. Guide 02 measures CE; it does **not** redesign fusion/dedup/CE.
2. **Guide 01 remains shippable.** Do not reopen Guide 01 DoD as “not shippable.” Residual debt becomes this guide’s work.
3. **Public ask schema stays thin:** `vehicle_id` + `question` (+ optional `doc_family`). Do **not** widen `contracts/ask_request.schema.json` for casual clients / product UI ablation knobs.
4. **Ablation ≠ degrade:** intentional RRF-only must set a **distinct** diagnostic (`ablation_rrf_only=true`). Natural CE failure continues to set `rerank_degraded=true`. Do not overload one flag for both meanings.
5. **SECTION_DEDUP identical on both arms** (`SECTION_DEDUP_ENABLED` must not differ between CE-on and forced RRF-only runs).
6. **Corpus:** fixture-only goldens / public path; no Drive/Ford/PrivateGold production in this guide.
7. **Generator for re-baseline:** operator default **`gemma4:e2b`** (`qwen3.5:4b` fallback only). Do not mix qwen-era proxy numbers into freeze claims without labeling eras.
8. **Freeze is human-only.** Agent records evidence and process steps; agent does **not** invent “frozen” status.
9. **No invented MR5 numeric public thresholds** — record honest paired metrics; keep/reject CE with lift **or** written human justification (ARCHITECTURE §10 / MR2).
10. Prefer ≤300 lines/file (hard max 400). Smallest correct measurement hooks — not a second ask API.

---

## Open decisions pinned (defaults for Implement)

These were soft in context; **this guide locks them** unless a human overrides before Implement.

### Pin 1 — Ablation control surface

| Choice | **Default: env-gated `MECHANIC_FORCE_RRF_ONLY=1`** (exact name pinned pass 17) |
|--------|-------------------------------------------|
| Behavior | When set, ask path reuses the existing `!ce` / skip-CE branch: serve `fused.slice(0, ceTopK)` (post-RRF + dedup) **without** calling CE. Emit diagnostics `ablation_rrf_only=true` (when `MECHANIC_DIAGNOSTICS=1`). Do **not** set `rerank_degraded=true` solely because ablation is on. |
| Keep | `opts?.ce` inject for **unit tests** (fake CE / null CE) — unchanged. |
| Do not | Widen public `ask_request.schema.json` with `skip_ce` for casual clients. |

**Tradeoff (considered, rejected as default):** diagnostics-gated body field only when `MECHANIC_DIAGNOSTICS=1` is more explicit per-request and avoids process restart discipline, but widens the HTTP contract (even gated) and risks clients copying the field into production. Pure `opts.ce=null` is cleanest for tests but **unreachable from current Python HTTP eval** (`route.ts` calls `handleAsk(validated.value)` only). **Env wins:** invisible to strangers, reachable from `mecharag eval` via process env, no schema widen. Name uses `MECHANIC_` prefix to match `MECHANIC_DIAGNOSTICS`. Implement must document: restart / ensure Next process sees `MECHANIC_FORCE_RRF_ONLY` when running the RRF-only arm (or spawn/document a second server env for paired runs).

### Pin 2 — Shared hit predicate + field names

| Choice | **Default: cited `chunk_id` ∩ allowed evidence** |
|--------|--------------------------------------------------|
| Hit | For **both** ablation arms: a case hits if **any cited `chunk_id`** maps to a chunk whose content/section overlaps gold `allowed_content_substrings` and/or `allowed_section_paths` (load chunk text/metadata from DB or citation locators already on the response — prefer locator/`chunk_id` evidence, not answer text alone). |
| Secondary smoke (optional) | Answer-substring may remain a **separate** field (e.g. `answer_substring_hit`) — never the sole lift numerator/denominator. |
| Lexical proxy | Keep as optional retrieval smoke only; rename fields to `*_lexical_proxy` (e.g. `rrf_only_retrieval_hits` → `lexical_proxy_retrieval_hits` or dual-emit during transition then drop from lift math). |
| Ask paired fields (required names) | `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits` (delta = `ce_ask_hits - rrf_only_ask_hits`). |

**Tradeoff:** citation∩gold is stricter and less luck-inflated than answer-substring; answer-substring confounds **generator quality** with **rerank lift**. Prefer rigor for freeze/interview claims.

### Pin 3 — Golden growth

| Choice | **Guide 02 DoD: ≥10–15 cases** + written path to **≥30** |
|--------|----------------------------------------------------------|
| Diversity | Not only positive torque/spec questions — include hard misses / insufficient-evidence expectations, multi-section, wiring-ish or negative cases as fixture text allows, and at least one case that exercises degrade *observation* (without treating degrade as ablation). |
| Ordering | Prefer implement ablation scoring **before or tightly interleaved with** growth so new cases do not encode the old proxy delta as “baseline.” |

### Pin 4 — Freeze gate

| Choice | **Human freeze only after paired ask evidence** |
|--------|--------------------------------------------------|
| Required | Paired ask ablation metrics under **`gemma4:e2b`** re-baseline; record **CE runtime mode** (`classification` vs `cosine` fallback) and CE model id. |
| Strongly preferred | Golden bump (#2 / Pin 3) lands **before** freeze. |
| Forbidden | Freeze on proxy `ce_vs_rrf_delta_hits=+1` / `n=5`; freeze from lexical proxy alone; silent agent self-freeze. |
| If paired delta flat/negative | CE stays **candidate**; human may write **keep-with-justification** (MR2) — do not invent freeze. |

### Pin 5 — Dead `--compare-ce`

| Choice | **Wire or remove** — no dead always-True flag left |
|--------|-----------------------------------------------------|
| Prefer | Replace with explicit paired-ask behavior (default on when `--ask-url` used), **or** delete the flag and document that paired ask ablation is always part of `mecharag eval` when ask URL is set. |
| Fix argparse | Current `store_true` + `default=True` is meaningless (always True, never read in `run_eval`). Either wire `args.compare_ce` into paired runs or remove it. |

---

## Ordered step checklist

All steps unchecked until Implement. Do **not** check boxes in Write-dev-guide.

### Phase A — Ask-path ablation hook (env-gated)

- [x] **A1.** Add env gate **`MECHANIC_FORCE_RRF_ONLY=1`** (exact name; document in `.env.example`). When set, skip CE scoring and use post-RRF (+ dedup) top-K context order (reuse existing `!ce` branch structure).
- [x] **A2.** Emit **`ablation_rrf_only=true`** in diagnostics when ablation is active and `MECHANIC_DIAGNOSTICS=1`. Do **not** set `rerank_degraded=true` merely because ablation is on. Natural CE failure still sets `rerank_degraded` as today.
- [x] **A3.** Keep `opts?.ce` for unit tests. Do **not** add public `skip_ce` / `ablation_mode` to `contracts/ask_request.schema.json` or `validateAskRequest` for casual clients.
- [x] **A4.** Document operator discipline: paired eval requires CE-on process (env unset) and RRF-only process (env set), or an Implement-chosen equivalent that keeps arms isolated (e.g. two documented env invocations). `SECTION_DEDUP_ENABLED` identical on both.
- [x] **A5.** Unit test: with force flag / equivalent, CE is not invoked; diagnostics show `ablation_rrf_only`; with CE failure (no force), `rerank_degraded` still works and is distinct.

### Phase B — Eval harness: paired ask + honest fields

- [x] **B1.** For each golden (when ask URL enabled), run **paired** HTTP asks: CE-on vs forced RRF-only. Same case JSON, same corpus version, same generator env era.
- [x] **B2.** Score **both** arms with the **shared** hit predicate (Pin 2): cited `chunk_id` ∩ allowed section/substring evidence. Stop using answer-substring alone as the CE-side “retrieval hit.”
- [x] **B3.** Emit summary fields: `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`. Segregate legacy lexical FTS counters as `*_lexical_proxy` (rename and/or dual-emit during one transition run; never subtract lexical proxy from ask CE hits for “lift”).
- [x] **B4.** Rename or clearly deprecate misleading `retrieval_hit_via_citations` if it still means answer-substring — do not leave INTERVIEW-facing names that lie.
- [x] **B5.** Wire or **remove** `--compare-ce` in `mecharag/__main__.py` + `eval_cmd.py` (Pin 5). No always-True unread flag.
- [x] **B6.** Per-case error handling: mid-eval Ollama/Postgres flaps → skip/error that case on **both** arms or mark asymmetric failure explicitly — do not silently inflate delta.
- [x] **B7.** When `MECHANIC_DIAGNOSTICS=1`, record per arm: `rerank_degraded`, `ablation_rrf_only`, `ce_latency_ms`, generator model, CE model; surface **CE runtime mode** (`classification` vs `cosine`) if available from CE adapter / diagnostics (add a diagnostic field if missing — smallest hook).
- [x] **B8.** Write new paired baseline to `evals/last_run_summary.json` (or successor) under **`gemma4:e2b`**; label historical pass-8c proxy row as **proxy / qwen-era** only.

### Phase C — Golden growth (≥10–15 + path to ≥30)

- [x] **C1.** Expand `evals/golden_fixture_v1.json` (or versioned successor) to **≥10 and ≤15 is OK; target band ≥10–15** fixture cases on `fixture:honda-s2000-demo` (or additional synthetic fixtures if needed — still public fixtures only).
- [x] **C2.** Diversify intents: keep existing torque/spec positives; add ≥1 hard miss / insufficient-evidence expectation; ≥1 multi-section or cross-section distractor; avoid “all easy positives.”
- [x] **C3.** Ensure each new case has allowed evidence locators (`allowed_section_paths` and/or substrings) sufficient for citation∩gold scoring — not answer-only expectations.
- [x] **C4.** Document **path to ≥30** in the golden file header and/or a short note in `evals/` (themes to add later: more families, negatives, degrade observation cases, multi-vehicle when fixtures exist). Do **not** require 30 in this guide’s DoD.
- [x] **C5.** Re-run paired eval on the expanded set; refresh summary metrics.

### Phase D — Human freeze gate (evidence only)

- [x] **D1.** Update `evals/MODEL_FREEZE_STATUS.md` with: paired ask ablation results; `n_cases`; generator=`gemma4:e2b`; CE model; **CE runtime mode**; degrade rate; explicit statement that proxy `+1`/`n=5` is **not** freeze evidence.
- [x] **D2.** Embedding + CE remain **candidates** unless **human** writes freeze. Guide 02 Implement may prepare the evidence section and freeze checklist; agent must **not** flip status to frozen unilaterally.
- [x] **D3.** If paired delta is flat/negative: leave candidates; optionally draft “keep with justification” stub for human edit — do not invent keep language as if lift existed.
- [x] **D4.** Align honesty lines if needed in ARCHITECTURE §15 / VISION §9 pointers (smallest doc edits) so they no longer imply proxy delta is true ablation — without claiming portfolio-complete.

### Phase E — Verification + stop

- [x] **E1.** Run unit tests for ablation vs degrade distinction; run vitest suite still green for ranking/ask contract.
- [x] **E2.** Run `mecharag eval` paired path against Compose + Next with diagnostics on; confirm new field names present; lexical proxy not used as lift.
- [x] **E3.** Confirm public ask schema unchanged for casual clients; `.env.example` documents `MECHANIC_FORCE_RRF_ONLY` + diagnostics.
- [x] **E4.** Stop. Do not start Drive/Ford/PrivateGold production, INTERVIEW packaging claim updates that assert CE lift without paired evidence, hosted CE, or ranking redesign.

---

## Verification / Definition of Done (this guide)

**Done when all are true:**

1. Env-gated force RRF-only ask path exists; diagnostics distinguish **`ablation_rrf_only`** from **`rerank_degraded`**; public `ask_request` schema not widened for casual clients; `opts.ce` still usable in tests.
2. Eval runs **paired** CE-on vs forced RRF-only asks on the same goldens with **shared** citation∩allowed-evidence hit predicate.
3. Summary emits `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`; lexical FTS metrics are `*_lexical_proxy` (or clearly segregated) and **not** used as CE lift.
4. Dead `--compare-ce` always-True unread flag is **wired or removed**.
5. Golden set has **≥10–15** diverse fixture cases + written **path to ≥30**.
6. Paired baseline re-run under **`gemma4:e2b`** recorded; CE **runtime mode** recorded; `MODEL_FREEZE_STATUS.md` updated with evidence and still honest about candidate vs frozen.
7. **No freeze claim** on proxy `+1` / `n=5`. Freeze (if any) is **human-authored** after paired evidence (+ strongly preferred growth).
8. No ranking redesign; Guide 01 remains shippable; no Drive/Ford/PrivateGold production / INTERVIEW false lift claims in this guide.

**Explicitly not required for this guide’s DoD:**

- Hitting ≥30 goldens in one pass (path documented is enough)
- Invented public numeric pass/fail thresholds (MR5)
- Automatic freeze without human
- INTERVIEW.md / GETTING_STARTED packaging depth
- Hosted CE, true MMR, multimodal, Drive/Ford

---

## Blast radius and risks

| Risk | Blast radius | Mitigation in steps |
|------|----------------|---------------------|
| Ablation flag conflated with degrade | Operators/evals misread fail rate as experiment | A2 distinct `ablation_rrf_only`; tests A5 |
| Public schema `skip_ce` | Clients ship ablation into prod; contract sprawl | A3 / Pin 1 — env only |
| Env restart discipline missed | Both arms accidentally CE-on → fake zero lift | A4 document paired process env |
| Hit-definition drift between arms | Ablation still dishonest | B2 shared predicate Pin 2 |
| Keeping proxy field names | Interview claim risk (pass 12 P1) | B3–B4 rename/segregate |
| Dead `--compare-ce` left | False signal that ablation exists | B5 |
| Growing goldens on proxy metric | Encodes theater into “baseline” | C after/with B; Pin 3 |
| Freeze on n=5 proxy | Status lie | D1–D2 / Pin 4 forbidden |
| Generator-era skew | Freeze docs mix qwen vs gemma | B8 / D1 re-baseline gemma |
| Cosine fallback mid-run | Score-domain mix in “CE” arm | B7 record runtime mode |
| Asymmetric arm failures | Inflated delta | B6 per-case skip/error |
| Doc drift (ARCHITECTURE §15, VISION §9, freeze file) | Conflicting honesty | D4 smallest align |

### Rollback (pass 18 — for Ready check)

**Rollback** = git revert the Guide 02 PR; unset `MECHANIC_FORCE_RRF_ONLY` on any running Next process; if summary field rename already shipped, keep dual-emit or document one-release deprecation before dropping proxy field names. Do **not** leave models marked frozen if evidence was reverted. No public ask-schema widen to unwind.

---

## Edge-case handling (must appear in implementation or tests)

| Edge case | Expected behavior |
|-----------|-------------------|
| `MECHANIC_FORCE_RRF_ONLY=1` + CE healthy | Skip CE; `ablation_rrf_only=true`; `rerank_degraded` not set for ablation alone |
| CE unavailable **without** force | Natural degrade; `rerank_degraded=true`; not labeled as ablation |
| Empty fused list | insufficient_evidence **before** CE on both arms; no delta inflation |
| Answer contains gold substring but wrong citations | Shared predicate → **miss** (citation∩gold); optional answer smoke may still true |
| Lexical proxy miss + ask hit (historical g04 pattern) | Must **not** drive `ce_vs_rrf_ask_delta_hits` |
| Empty `allowed_content_substrings` | Do not fall back to `bool(citations)` as the shared lift hit — require locators or explicit case rules; prefer requiring evidence fields on goldens |
| `citation_ok` true (ids present) | Not the same as citation∩gold hit |
| `SECTION_DEDUP_ENABLED` differs across arms | Forbidden for paired run |
| Diagnostics off | Ablation still works; diagnostic fields may be omitted — eval should enable diagnostics for harness runs |
| Cosine fallback vs classification | Record mode; do not claim “true CE logits” if cosine |
| Mid-eval dependency flap | Skip/error case; no silent partial delta |
| `--compare-ce` / `--no-compare-ce` | After B5: either real control or flag gone — no always-True unread |

---

## Suggested verification commands (implementer)

```bash
# deps
docker compose up -d
# Ollama: gemma4:e2b + nomic-embed-text
cd web && pnpm install && pnpm dev   # CE-on arm: FORCE_RRF_ONLY unset

# unit
cd web && pnpm test

# paired eval (exact env orchestration per A4 — example shape)
MECHANIC_DIAGNOSTICS=1 mecharag eval --golden evals/ --ask-url http://127.0.0.1:3000/api/ask
# RRF-only arm: restart or second process with MECHANIC_FORCE_RRF_ONLY=1 (document exact flow in README / eval help)

# inspect
cat evals/last_run_summary.json
# expect: rrf_only_ask_hits, ce_ask_hits, ce_vs_rrf_ask_delta_hits; lexical_*_proxy segregated
```

---

## Stop conditions for the implementer

- Stop when this guide’s DoD is met.
- Do **not** freeze models without human authorship of freeze status.
- Do **not** expand into Drive, Ford, PrivateGold production, INTERVIEW packaging that claims CE lift without paired fields, hosted CE, true MMR, or multimodal.
- Do **not** reopen Guide 01 as unshippable or redesign MR2 order.
- If env-gated ablation proves operationally unworkable for paired HTTP eval, **stop and ask** before widening public ask schema — do not silently add `skip_ce` for all clients.

---

## Refine pass 18 (hub verify)

**Checked:** completeness, order, DoD, blast/edges, pins; Ready-check preview (alignment, rollback).

**Material edits:** Explicit **Rollback** subsection. Env name pin from pass 17 unchanged.

**Honest call:** **Ready check next**. Still **not** authorized to Implement / freeze.

**Readiness score (Refine preview, /10):** **9.0** — measurement design solid; residual operational risk is paired-eval env restart discipline (documented, not a design hole).

---

## Honest readiness (Refine pass 17–18)

- Guide **Implemented** (pass 22). Paired ask ablation live; models remain candidates.
- Soft pins from context are **locked as defaults** above with tradeoffs (env name now exact).
- **No implementation** in Refine (no `ask.ts` / `eval_cmd.py` / freeze-as-done edits).
- Next: Ready check → Implement (human-gated).
