# Context: Guide 02 — true RRF-only ask ablation + golden growth + embed/CE freeze gate

**Date:** 2026-07-13  
**Repos:** `mechanic_rag` (+ program notes in `second_brain` prioritize pass 12; N/A for code)  
**Status:** Ready for Write-dev-guide  
**Mode last used:** spoke  

**Lens:** Senior AI engineer (RAG eval honesty, ranking evidence, portfolio claims)

**Stage:** Refine context (pass 15 verify; pass 14 refine) — no Write-dev-guide, no Implement, no Drive/Ford, no PrivateGold production.

---

## Problem

Guide 01 shipped a real hybrid → RRF → section dedup → local CE → generate/citations path, but the **CE-lift number used for provisional keep is not a true ablation**.

Today’s `ce_vs_rrf_delta_hits=+1` in `evals/last_run_summary.json` compares:

| Side labeled “RRF-only” (`rrf_only_retrieval_hits`) | Side labeled “CE / ask” (`ce_or_ask_path_hits`) |
|-----------------------------------------------------|--------------------------------------------------|
| Direct Postgres **lexical FTS only** (`plainto_tsquery` / `ts_rank_cd`, LIMIT 8) vs golden substrings/sections | Full HTTP `POST /api/ask` (vector+lexical → RRF → dedup → CE → Ollama) |
| Hit = substring/section match in **retrieved chunk content** | Hit = allowed substring appears in the **generated answer** (`retrieval_hit_via_citations` — **misnamed**: does **not** score citation∩gold) |

Those are different pipelines and different hit definitions. Calling the delta “CE lift vs RRF-only” is **proxy theater** — useful smoke, weak freeze/interview proof. ARCHITECTURE §15 and prioritize pass 12 already flag this; Guide 02 must replace (or clearly segregate) the proxy with a **paired ask-path ablation**: same cases, same corpus/generator, full hybrid→RRF→dedup **with CE** vs **without CE** (RRF(+dedup)-only context order).

Secondary gaps on the same work item: golden set still **n=5** (VISION §9 wants ≥30 path); embed + CE remain **candidates** (`MODEL_FREEZE_STATUS.md`); freeze must wait on honest ablation (+ preferred multi-case growth).

---

## Acceptance criteria

- [x] Context artifact exists at this path with every template section filled from evidence.
- [x] “Proxy CE lift” is defined with code/doc citations (what is measured vs what MR2 requires) — re-verified pass 14.
- [x] Ablation hooks in current `ask.ts` / eval harness are inventoried (what exists, what is missing) — re-verified pass 14.
- [x] In/out of scope match prioritize pass 12 #1–#3 (ablation → golden growth path → human freeze gate); packaging/PrivateGold/Drive/Ford out.
- [x] Honest readiness: whether Write-dev-guide can proceed; blocking unknowns listed; soft decisions pinned as recommendations.
- [x] No implementation, no Drive/Ford ops, no PrivateGold production code this stage.

---

## In scope

1. **True RRF-only ask ablation (measurement honesty)**  
   Design paired comparison on the live ask pipeline: CE-on vs RRF(+dedup)-only / forced degrade, same goldens, same corpus version, same generator era — so `ce_vs_rrf_delta_*` (or renamed fields) is not lexical-FTS proxy.

2. **Golden growth on the path to ≥30**  
   Plan expansion of `evals/` (diverse intents; fixture corpus only); need not hit 30 in one guide — credible bump (e.g. toward 15+) + growth plan.

3. **Human embed/CE freeze gate (after evidence)**  
   Update `MODEL_FREEZE_STATUS.md` only with ablation (+ preferably multi-case) evidence; agent does not invent freeze. Freeze gate = human decision after paired ask evidence; reject “freeze now” on proxy +1 / n=5.

4. **Harness / ask-path measurement hooks needed for #1**  
   Document smallest hooks (request/env/opts) so Write-dev-guide can specify without redesigning ranking.

---

## Out of scope

- Implement / coding this stage  
- Write-dev-guide this stage (human gate)  
- Drive / rclone / Google API clients (GD1–GD5)  
- Ford / PTS / CDP / bulk ops (`fetch-ford-service-manuals`)  
- PrivateGold production ingest path  
- GETTING_STARTED / INTERVIEW packaging (parallel later; metric prose waits on #1)  
- Hosted CE default, true MMR, multimodal, Supabase  
- Inventing numeric public pass/fail thresholds (MR5)  
- Ranking algorithm redesign (order stays §7)  
- Reopening Guide 01 DoD as “not shippable”

---

## Prior art (paths only)

- `mechanic_rag/docs/ARCHITECTURE.md` — §7 ranking (MR2), §7.5 degrade, §10 eval (MR5), §15 honesty (proxy ablation)  
- `mechanic_rag/docs/VISION.md` — §8–§9 success checklist (evals/freeze/packaging open)  
- `mechanic_rag/docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md` — residual: true RRF-only ablation, ≥30, freeze  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` — candidates; proxy lift called out; not frozen  
- `mechanic_rag/evals/golden_fixture_v1.json` — n=5 goldens  
- `mechanic_rag/evals/last_run_summary.json` — pass 8c baseline (+1 delta, qwen-era ask)  
- `mechanic_rag/mecharag/eval_cmd.py` — lexical proxy + ask hit; delta math  
- `mechanic_rag/mecharag/__main__.py` — `--compare-ce` declared, unused by `run_eval`  
- `mechanic_rag/web/src/server/ask.ts` — live pipeline; CE inject via `opts?.ce`; no force-RRF-only API  
- `mechanic_rag/web/src/server/cross_encoder.ts` — degrade + classification vs cosine fallback  
- `mechanic_rag/web/src/app/api/ask/route.ts` — `handleAsk(validated.value)` only; no opts  
- `mechanic_rag/contracts/ask_request.schema.json` — `vehicle_id` + `question` (+ optional `doc_family`) only  
- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` — ordered backlog #1–#3  
- `second_brain/docs/2026-07-13_mechanic_gather_context_guide02_pass13_handoff.md` — gather spoke  
- `second_brain/docs/2026-07-13_mechanic_refine_context_guide02_pass14_handoff.md` — this refine spoke  

---

## Risks and blast radius

1. **Interview / README claim risk** — Citing `ce_vs_rrf_delta_hits=+1` as CE lift without “proxy” language recreates the P1 claim risk from pass 12. Ablation + summary field rename/docs must land before INTERVIEW metrics.  
2. **Generator-era skew** — Pass 8c `last_run_summary.json` is qwen-era; pass 9 gemma smoke is separate. Freeze/docs must re-baseline under the operator default generator (`gemma4:e2b`) or label eras explicitly.  
3. **Ablation API surface** — Adding a public `skip_ce` on every ask expands attack/confusion surface; prefer diagnostics-gated, env-only, or harness-internal inject of null CE. Wrong design pollutes product API.  
4. **Score-domain / hit-definition drift** — If CE-on and CE-off still use different hit predicates (answer substring vs citation chunk_id vs retrieval list), ablation remains dishonest. Both arms need the **same** scoring definition.  
5. **CE cosine fallback** — `cross_encoder.ts` may run `transformers_js:cosine` if classification pipeline fails; freeze/keep claims must know which score domain ran.  
6. **Golden growth without ablation first** — New cases can encode the proxy metric into “baseline,” making later honesty harder (pass 12: prefer after or tightly interleaved with #1).  
7. **Freeze-now pressure** — Freezing on n=5 + proxy delta is a status lie (pass 12 anti-pattern). Human gate only after #1 (+ preferably #2).  
8. **Doc blast** — MODEL_FREEZE_STATUS, ARCHITECTURE §15, VISION §9, last_run_summary field names, and any future INTERVIEW must stay aligned after metric rename.  
9. **HTTP-only eval reachability** — Python `eval_cmd.py` only POSTs `/api/ask`; it **cannot** use `opts.ce` today. Without env/route/Node harness change, “inject null CE” is unreachable from the current eval entrypoint.

---

## Edge cases

- CE unavailable / timeout / empty scores already degrade to RRF order (`rerank_degraded=true`) — **failure degrade ≠ intentional ablation** unless harness forces and labels it.  
- Empty fused list → insufficient_evidence before CE; both arms must agree.  
- Answer-substring hit can be true while retrieval/citation evidence is wrong (generator luck) — prefer citation/`chunk_id` / section evidence for lift.  
- Lexical-only proxy miss + ask hit (case `g04-spark-plug-gap` in last_run: `retrieval_hit=false`, ask `retrieval_hit_via_citations=true`) — exactly why +1 is misleading.  
- `citation_ok` in eval only checks citations have `chunk_id`s — **not** gold overlap; do not confuse citation_rate=1.0 with CE lift.  
- When `allowed_content_substrings` is empty, ask-side hit falls back to `bool(citations)` — different predicate than substring match; goldens today all supply substrings.  
- Section dedup on/off (`SECTION_DEDUP_ENABLED`) must be identical on both ablation arms.  
- `MECHANIC_DIAGNOSTICS=1` required to observe CE/rerank fields over HTTP today (eval reads `diagnostics` for `rerank_degraded` / `ce_latency_ms`).  
- Mid-eval Ollama/Postgres flaps → asymmetric arm failures; need clear per-case skip/error, not silent delta inflation.  
- Cosine fallback vs true CE logits mid-run → mixed score domains.  
- Growing goldens with only positive torque/spec questions → optimistic lift; need hard misses, wiring-ish negatives, multi-section, degrade cases (pass 12).  
- `--compare-ce` is `store_true` with `default=True` (always on, no `--no-compare-ce`) and **never read** in `run_eval` — operators may think paired ablation already exists.

---

## Unknowns (must resolve or escalate)

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Exact ablation control surface: env flag vs diagnostics-only request field vs harness-only `opts.ce = null` / FakeCE / Node-side eval | Write-dev-guide proposes one (recommendation pinned below); human picks if API schema change | **Yes** for Implement design; **No** for Write-dev-guide start |
| Canonical hit metric for both arms (citation chunk ∩ allowed evidence vs answer substring vs fused top-K contains gold) | Define in Write-dev-guide; prefer citation/locator over answer text | **Yes** for honest delta; recommend in guide |
| Target golden count for Guide 02 (e.g. 10–15 vs jump toward 30) | Human or guide DoD; pass 12 says credible bump OK | Soft — plan required, exact N negotiable |
| Whether pass 8c proxy fields are renamed, deprecated, or dual-emitted during transition | Write-dev-guide + summary schema | Soft for guide; hard before INTERVIEW claims |
| Re-baseline under gemma as hard Guide 02 DoD vs documented follow-up | Prefer include in ablation re-run DoD | Soft — strongly recommended |
| Whether intentional RRF-only should set `rerank_degraded=true` or a distinct `ablation_rrf_only=true` diagnostic | Write-dev-guide; avoid conflating failure degrade with experiment | Soft for guide |

---

## Recommended approach

**Smallest honest measurement change — not a ranking redesign.**

1. **Ask-path hook (minimal):** Allow the eval harness (not casual product UI) to force RRF(+dedup)-only context order.  
   - **Pinned recommendation:** prefer **env-gated** `FORCE_RRF_ONLY=1` (or diagnostics-gated body field only when `MECHANIC_DIAGNOSTICS=1`) that reuses the existing `!ce` branch (`fused.slice(0, ceTopK)` + labeled diagnostic).  
   - **Tradeoff:** env is invisible to strangers and needs process restart discipline; diagnostics body field is explicit per-request but widens contract if not gated; pure `opts.ce=null` is cleanest for unit tests but **unreachable from current Python HTTP eval** without route change.  
   - Prefer **not** widening public `ask_request.schema.json` for production clients.  
2. **Eval harness:** For each golden, run **paired** asks (CE-on vs forced RRF-only) with **identical** hit/citation scoring; emit clearly named fields (e.g. `rrf_only_ask_hits`, `ce_ask_hits`, `ce_vs_rrf_ask_delta_hits`) and mark lexical FTS metrics as `*_lexical_proxy` only. Wire or remove unused `--compare-ce` (and fix argparse so it is not a dead always-True flag).  
3. **Segregate proxy:** Keep lexical FTS recall as optional retrieval smoke; never subtract it from ask CE hits for “lift.”  
4. **Shared hit predicate (pinned recommendation):** score both arms by **cited `chunk_id` ∩ allowed section/substring evidence** (or fused top-K contains gold chunk), not answer-substring alone. Answer text may remain a secondary smoke.  
   - **Tradeoff:** citation/locator is stricter and less luck-inflated; answer-substring is easier but confounds generator quality with rerank lift.  
5. **Golden growth:** After (or tightly with) paired scoring, expand fixture goldens with diverse intents; document path to ≥30. Guide 02 DoD: credible bump (recommend **≥10–15**) + written plan to 30 — not necessarily 30 in one guide.  
6. **Freeze gate (pinned):** Human updates `MODEL_FREEZE_STATUS.md` only after paired ask evidence; **#2 strongly preferred** before freeze; never freeze on proxy +1 / n=5. Record CE runtime mode (`classification` vs `cosine`) and generator model used.  
7. **Re-baseline** under `gemma4:e2b` so freeze/docs don’t mix eras.

---

## Open decisions (human)

1. Ablation control surface: env vs diagnostics request field vs Node harness (API schema change?). **Guide default if human silent:** env-gated force + keep `opts.ce` for tests.  
2. Canonical shared hit definition for both arms. **Guide default if human silent:** citation/`chunk_id` ∩ allowed evidence.  
3. Guide 02 golden target (minimum bump vs stretch toward 30). **Guide default:** ≥10–15 + path-to-30 plan.  
4. Freeze after Guide 02 ablation alone vs require ≥N cases first (pass 12: #1 required, #2 strongly preferred). **Guide default:** #1 required; freeze blocked until #2 bump lands unless human writes keep-with-justification.  
5. Keep provisional CE keep language until paired lift, or require explicit human “keep with justification” if delta is flat/negative.

---

## Evidence opened this gather pass (pass 13)

**Rails / stage**

- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`  
- `second_brain/docs/workflow_os/rails/ALWAYS.md`  
- `second_brain/docs/workflow_os/rails/LEARNING_MODE.md`  
- `second_brain/docs/workflow_os/stages/gather-context.md`  
- `second_brain/docs/workflow_os/templates/context-summary.md`  
- `second_brain/docs/2026-07-13_mechanic_gather_context_guide02_pass13_handoff.md`  
- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` (+ handoff)  

**Product truth**

- `mechanic_rag/docs/ARCHITECTURE.md` §7, §10, §15 (and related §8/§14/§16)  
- `mechanic_rag/docs/VISION.md` §8–§9  
- `mechanic_rag/docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md` (E3–E4, residual debt)  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`  
- `mechanic_rag/evals/golden_fixture_v1.json`  
- `mechanic_rag/evals/last_run_summary.json`  
- `mechanic_rag/mecharag/eval_cmd.py` (`_eval_case_retrieval`, `_eval_case_ask`, delta)  
- `mechanic_rag/mecharag/__main__.py` (`--compare-ce` unused)  
- `mechanic_rag/web/src/server/ask.ts`  
- `mechanic_rag/web/src/server/cross_encoder.ts` (header + classification/cosine)  
- `mechanic_rag/web/src/app/api/ask/route.ts`  
- `mechanic_rag/contracts/ask_request.schema.json`  

**Commands:** none required for Gather (read-only evidence). No Implement.

### What “proxy CE lift” means (evidence) — re-verified pass 14

In `mecharag/eval_cmd.py` (`run_eval` + helpers):

| Counter / JSON field | How it increments | What it is **not** |
|----------------------|-------------------|--------------------|
| Internal `rrf_only_hits` → `rrf_only_retrieval_hits` | `_eval_case_retrieval`: lexical FTS top-8 content/section match | Hybrid, RRF, section dedup, or ask |
| Internal `ce_path_hits` → `ce_or_ask_path_hits` | `_eval_case_ask`: `retrieval_hit_via_citations` true | Citation∩gold; RRF-only ask |
| `ce_vs_rrf_delta_hits` | `ce_path_hits - rrf_only_hits` → **1** (n=5) | MR2 paired RRF-only vs RRF+CE |

Ask-side predicate (exact):

```text
retrieval_hit_via_citations =
  any(substring in answer) if allowed_content_substrings
  else bool(citations)
```

Name is misleading: it does **not** intersect cited `chunk_id`s with gold evidence. Separate `citation_ok` only asserts citations exist with `chunk_id`s.

`MODEL_FREEZE_STATUS.md` and ARCHITECTURE §15 already name this a **proxy**, not true RRF-only ask ablation. Guide 01 E3 asked for paired RRF-only vs RRF+CE; the harness delivered a **labeled** comparison that does not meet that contract.

### Ablation hooks today (`ask.ts` + route + eval) — re-verified pass 14

| Hook | Status |
|------|--------|
| Natural CE degrade when `createCrossEncoderFromEnv` fails / null | Exists — serves `fused.slice(0, ceTopK)` with `rerank_degraded=true` |
| `opts?.ce` inject (tests / callers) | Exists on `handleAsk` — **HTTP `route.ts` does not pass opts** |
| Request body `skip_ce` / `ablation_mode` | **Absent** (`ask_request.schema.json` + `validateAskRequest`) |
| Env `FORCE_RRF_ONLY` (or similar) | **Absent** |
| Eval paired double-ask | **Absent**; `--compare-ce` unused (always-True argparse dead flag) |
| Lexical FTS proxy as “RRF-only” | Present — misnamed for MR2 lift |
| Python eval → force RRF-only without product change | **Blocked** — HTTP-only POST; cannot set `opts.ce` |

---

## Evidence opened this refine pass (pass 14)

**Rails / stage / handoffs**

- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`  
- `second_brain/docs/workflow_os/rails/ALWAYS.md`  
- `second_brain/docs/workflow_os/rails/LEARNING_MODE.md`  
- `second_brain/docs/workflow_os/stages/refine-context.md`  
- `second_brain/docs/workflow_os/templates/context-summary.md`  
- `second_brain/docs/2026-07-13_refine_context_guide02_pass14_shared_handoff.md`  
- `second_brain/docs/2026-07-13_refine_context_guide02_pass14_program_note.md`  
- `second_brain/docs/2026-07-13_mechanic_refine_context_guide02_pass14_handoff.md`  

**Re-verify targets**

- `mechanic_rag/mecharag/eval_cmd.py` (full) — proxy math, predicates, unused compare path  
- `mechanic_rag/mecharag/__main__.py` — `--compare-ce` `store_true` + `default=True`, never consumed  
- `mechanic_rag/web/src/server/ask.ts` — `opts?.ce`, `!ce` degrade branch, no force flag  
- `mechanic_rag/web/src/app/api/ask/route.ts` — `handleAsk(validated.value)` only  
- `mechanic_rag/contracts/ask_request.schema.json` — no ablation fields  
- `mechanic_rag/evals/last_run_summary.json` — n=5, delta=+1, g04 lexical miss / ask hit  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` — candidate + proxy language; freeze gate clear  
- `mechanic_rag/evals/golden_fixture_v1.json` — n=5  
- `mechanic_rag/docs/ARCHITECTURE.md` §7 / §10 / §15  
- `mechanic_rag/web/src/lib/retrieval/lexical_query.ts` — stopword mirror vs eval `_lexical_query_from_question` (aligned; not the honesty bug)  
- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` — #1–#3 scope lock  

**Commands:** read-only re-verify. No Implement.

---

## Evidence opened this refine pass (pass 15 — verify)

**Live re-verify:** `rg` still shows `rrf_only_retrieval_hits` / `ce_vs_rrf_delta_hits` / `retrieval_hit_via_citations` in `eval_cmd.py`; `--compare-ce` still in `__main__.py`. Proxy ablation claim **unchanged**.

**Material content changes this pass:** **None.** Pass 14 construct-validity / HTTP `opts.ce` gap / freeze-gate honesty remain accurate.

---

## Learning notes (new this refine pass)

1. **Construct validity** — A metric has construct validity when it measures the claim you attach to it. `ce_vs_rrf_delta_hits` lacks it for “CE lift”: numerator and denominator are different constructs (answer luck vs lexical chunk match).  
2. **Confound** — When two variables change together (pipeline stage **and** hit definition), you cannot attribute the delta to one cause. Ablation holds the hit definition fixed and flips only CE.  
3. **Misnamed telemetry** — `retrieval_hit_via_citations` reading answer text is a footgun: reviewers will trust the name. Rename or redefine before INTERVIEW packaging.  
4. **Dead control surface** — A CLI flag that is always True and never read is worse than no flag: it falsely signals capability. Guide 02 should delete, wire, or replace it.

---

## Honest readiness

- **Ready for Write-dev-guide?** **Yes** — pass 14 holds; pass 15 live re-verify found **no material gaps**. Soft residuals (golden N, control surface, summary-field rename) stay for Write-dev-guide.  
- **Not ready for Implement** until Write-dev-guide (human-gated) and open decisions on control surface + shared hit metric are resolved in the guide (or escalated).  
- **Blocking for freeze claims today:** true paired ablation + preferably golden growth; do not freeze on proxy +1 / n=5. Freeze gate clarity already matches pass 12 anti-pattern.  
- **Still weak (non-blocking for Write-dev-guide):** exact golden N; whether env vs diagnostics field wins; final summary-field rename scheme — guide should pick defaults.  
- **Pass 15:** Stopped for human — no Write/Implement. Verification = live re-read of eval/proxy hooks.

---

## Results (handoff table)

| Item | Status | Evidence |
|------|--------|----------|
| Context path | **Done** | `mechanic_rag/docs/2026-07-13_guide02_rrf_ablation_eval_freeze_context_summary.md` |
| Ready for Write-dev-guide? | **Yes** | Proxy CE lift re-verified in `eval_cmd.py` + `ask.ts` + `last_run_summary.json`; ablation hooks + HTTP reachability gap inventoried; soft decisions pinned as recommendations |
| Blocking unknowns | **Soft for Write-dev-guide; hard for Implement** | Ablation control surface; shared hit predicate; Guide 02 golden N; freeze-after-N policy — guide can recommend defaults |
