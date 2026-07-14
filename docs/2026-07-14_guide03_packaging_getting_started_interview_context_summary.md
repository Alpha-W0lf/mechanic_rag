# Context: Guide 03 — GETTING_STARTED + INTERVIEW packaging

**Date:** 2026-07-14  
**Repos:** `mechanic_rag` (+ program notes in `second_brain` prioritize pass 12 / gather pass 25 / refine pass 26–27; N/A for code)  
**Status:** Refined  
**Mode last used:** spoke  

**Lens:** Senior AI engineer (portfolio packaging, RAG claim honesty, stranger clone path)

**Stage:** Refine context (pass 27) — **no** Write-dev-guide, **no** Implement, **no** PrivateGold / Drive / Ford / freeze / path-to-30 corpus expansion as core DoD.

---

## Problem

Guide 01 shipped a real hybrid → RRF → section dedup → local CE → generate/citations path. Guide 02 shipped **honest paired ask ablation** (citation∩gold; `ce_vs_rrf_ask_delta_hits=0` on n=12 under `gemma4:e2b`) and left embed/CE as **candidates** — Review pass 24: **shippable as-is**.

Portfolio packaging is still incomplete. VISION §9 remains unchecked for:

| Gap | Evidence |
|-----|----------|
| `GETTING_STARTED` | **Absent** at repo root and under `docs/` (re-confirmed pass 27) |
| `INTERVIEW` | **Absent** at repo root and under `docs/` (re-confirmed pass 27) |
| Clone-and-run | README Quick Start + `.env.example` exist — stranger path is **half-done**, not DoD-complete |
| Metric prose risk | Historical proxy `+1` / `n=5` must **never** appear as CE lift; Guide 02 truth is **flat delta (0)**, CE **candidate**, no freeze theater |

Without GETTING_STARTED + INTERVIEW, D6-style packaging DoD and interview ROI stay open even though the vertical slice and ablation harness are shippable.

---

## Acceptance criteria

- [x] Context artifact exists at this path with every template section filled from evidence.
- [x] Confirmed `GETTING_STARTED` / `INTERVIEW` still absent (root + `docs/`) — re-verified pass 27.
- [x] Clone-and-run inventory grounded in README / `.env.example` / Compose / eval paths (what exists vs what packaging must teach).
- [x] INTERVIEW metric claim rails locked to Guide 02: CE **candidate**, paired delta **0**, proxy +1 retired, no freeze language.
- [x] In/out of scope match prioritize pass 12 **#4** (packaging only); PrivateGold / Drive / Ford / freeze / path-to-30 expansion out.
- [x] Soft defaults pinned: **repo root** + **thin Compose** (pass 26); **INTERVIEW theme list** + **eval smoke depth** (pass 27).
- [x] Honest readiness + score 0–10 stated; open decisions listed; g10 outcome nuance corrected.
- [x] No implementation, no guide writing, no freeze / PrivateGold / Drive / Ford this stage.

---

## In scope

1. **`GETTING_STARTED.md` (stranger-runnable)**  
   Clean-clone operator path: Compose Postgres up, env layering (`cp .env.example web/.env.local` + CLI dotenv), Ollama pulls, `mecharag ingest --source fixtures`, public fail-closed check, `pnpm` web, health + one ask, eval smoke (see pinned default below; twin-process paired ablation → README only).

2. **Thin `INTERVIEW.md` (tradeoffs / FAQ)**  
   Numbered **theme list** (pinned pass 27) — FAQ prose under themes is Write-time cosmetic; themes themselves are binding soft defaults. Metric rails: candidates vs freeze, Drive ≠ Mechanic product path, honest Guide 02 flat delta.

3. **Cross-links**  
   Point at VISION / ARCHITECTURE / `MODEL_FREEZE_STATUS.md` / `PATH_TO_30.md` / README; do not re-author SSOT contracts.

4. **Honesty banners**  
   Packaging ≠ portfolio v1 complete; ≠ public flip; ≠ freeze; ≠ ≥30 goldens done.

---

## Out of scope

- Write-dev-guide / Implement this stage (human-gated next)  
- PrivateGold production ingest  
- Drive / rclone / Google API clients (GD1–GD5)  
- Ford / PTS / CDP / bulk (`fetch-ford-service-manuals`)  
- Human embed/CE **freeze** (or inventing freeze)  
- Path-to-30 corpus expansion as Guide 03 DoD (document pointer only)  
- Ranking redesign, hosted CE default, true MMR, multimodal, Supabase  
- Align-docs checkbox flips in VISION §9 (Align owns after Review evidence)  
- Inventing numeric public pass/fail thresholds (MR5)  
- Reopening Guide 01/02 as “not shippable”  
- Fixing g10 grounding / soft Guide 02 residuals in product code (packaging may narrate honestly only)

---

## Prior art (paths only)

- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` — §4 packaging backlog lock  
- `second_brain/docs/2026-07-14_mechanic_gather_context_guide03_pass25_handoff.md` — gather spoke  
- `second_brain/docs/2026-07-14_mechanic_refine_context_guide03_pass26_handoff.md` — refine pass 26  
- `second_brain/docs/2026-07-14_mechanic_refine_context_guide03_pass27_handoff.md` — this refine spoke  
- `second_brain/docs/2026-07-14_refine_context_guide03_pass26_shared_handoff.md` — program refine rules (pass 26)  
- `second_brain/docs/2026-07-14_refine_context_guide03_pass27_shared_handoff.md` — program refine rules (pass 27)  
- `second_brain/docs/2026-07-14_gather_context_guide03_pass25_shared_handoff.md` — program guide 03 lock  
- `second_brain/docs/2026-07-14_mechanic_review_impl_guide02_pass24.md` — Guide 02 shippable; flat delta; soft residuals (incl. g10)  
- `mechanic_rag/docs/2026-07-13_guide02_rrf_ablation_eval_freeze_context_summary.md` — style prior (full template)  
- `mechanic_rag/docs/VISION.md` — §4 docs list; §9 packaging unchecked  
- `mechanic_rag/docs/ARCHITECTURE.md` — §7 ranking/degrade; §14 non-goals; §15 honesty; §16 step 8 still lists packaging in defer blob  
- `mechanic_rag/README.md` — Quick Start + paired ablation twin-process notes  
- `mechanic_rag/.env.example` — Compose/Ollama/embed/CE/diagnostics/`MECHANIC_FORCE_RRF_ONLY`  
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md` — candidate; flat delta 0; proxy retired  
- `mechanic_rag/evals/PATH_TO_30.md` — ≥30 deferred plan  
- `mechanic_rag/evals/last_run_summary.json` — n=12; 11/11/0 paired ask  
- `mechanic_rag/evals/golden_fixture_v1.json` — n=12  
- `mechanic_rag/docker-compose.yml` — Postgres+pgvector  
- `mechanic_rag/scripts/checks/public_fail_closed.py` — public corpus gate  
- `alphaguard/GETTING_STARTED.md` + `alphaguard/INTERVIEW.md` — peer portfolio packaging shape (thin clone + FAQ; honesty banners)

---

## Risks and blast radius

1. **Interview claim risk (P1)** — Citing proxy `ce_vs_rrf_delta_hits=+1` or implying CE “proved lift” recreates Guide 02 theater. INTERVIEW must say: paired ask delta **0**, CE **candidate**, human keep-with-justification only — never freeze theater.  
2. **`.env.local` footgun** — Next loads `web/.env.local`; CLI (`mecharag ingest` / `eval`) calls `load_dotenv()` then `load_dotenv("web/.env.local")`. Root `.env` alone can satisfy CLI but **not** Next — strangers who skip `web/.env.local` get a half-working clone. Packaging must teach **one** copy target: `cp .env.example web/.env.local` (pass 12 overlooked #2).  
3. **Compose depth creep** — A long Docker/ops appendix can bloat GETTING_STARTED past “thin packaging” and drift into hardening/ops guides. **Pinned soft default:** thin path + link `docker-compose.yml` / ARCHITECTURE — no ops runbook.  
4. **Twin-process ablation complexity** — Full paired eval needs two Next processes; strangers may fail and blame packaging. **Pinned (pass 27):** GETTING_STARTED smoke stops at single-URL eval; twin ablation stays in README.  
5. **ARCHITECTURE §16 lag** — Step 8 still bundles packaging with freeze / ≥30 / PrivateGold. Guide 03 must not silently expand into that blob; note lag for Align later (shared handoff).  
6. **VISION §9 checkbox temptation** — Packaging Implement must not tick §9 from the guide alone; Align-docs after Review.  
7. **Soft Guide 02 residuals leaking into FAQ** — Cosmetic RRF `ce_model` lag, g10 outcome mismatch, etc. are **not** INTERVIEW primary claims; do not elevate soft tidy items into product narrative.  
8. **Peer-copy risk** — AlphaGuard FAQ shape is useful; Mechanic must not copy AG1–AG3 content or Kafka framing. Domain FAQ = ranking / degrade / corpus / freeze honesty.  
9. **Public flip premature** — ARCHITECTURE forbids public flip before packaging DoD; packaging landing still ≠ flip authorize.

---

## Edge cases

- Stranger has Ollama but missing `gemma4:e2b` → document fallback `qwen3.5:4b`; do not claim gemma without successful pull/smoke.  
- Compose Postgres on non-default port (`5433` in `.env.example`) — call out so health/ask failures are diagnosable.  
- `MECHANIC_FORCE_RRF_ONLY=1` left set in `.env.local` after ablation experiments → production-looking ask skips CE; GETTING_STARTED must say default-off / unset for normal use.  
- `MECHANIC_DIAGNOSTICS=0` (default) → strangers cannot see CE/ablation fields over HTTP; eval/INTERVIEW should explain when diagnostics are needed.  
- Ingest without Compose up / wrong `DATABASE_URL` → fail loudly; document order: Compose → env → ingest → web.  
- Eval against stopped Next → ask path fails; README already notes “start Next first.” **Pinned smoke:** Next up for primary eval; `--retrieval-only` is documented escape hatch only.  
- Public fail-closed: pointing fixtures at OEM/private trees must fail closed — packaging should run the check once.  
- Section dedup env mismatch across ablation arms — out of thin GETTING_STARTED; belongs in README ablation section / INTERVIEW note only.  
- Generator-era mix in screenshots — prefer gemma-era language; label any historical qwen proxy as non-evidence.  
- Hard-miss g10 (`expect_outcome=insufficient_evidence`) — live Guide 02 summary shows both arms `citation_gold_hit=false` (correct for lift) but `outcome=answered` (grounding residual, Review pass 24 soft). INTERVIEW must **not** claim hard-miss reliably returns `insufficient_evidence`; may say citation∩gold miss is what ablation scores, grounding polish is open.

---

## Unknowns (must resolve or escalate)

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Compose appendix depth | **Pinned soft default (pass 26):** thin — prerequisites + numbered clone path + honesty table; details stay in `docker-compose.yml` / ARCHITECTURE | No — pinned |
| File placement: root vs `docs/` | **Pinned soft default (pass 26):** repo root `GETTING_STARTED.md` / `INTERVIEW.md` (match AlphaGuard; VISION names files without path) | No — pinned |
| Minimal eval smoke in GETTING_STARTED | **Pinned soft default (pass 27):** health + one ask + `mecharag eval --golden evals/` with Next up; `--retrieval-only` escape hatch only; twin-process paired ablation → README pointer only | No — pinned |
| INTERVIEW theme inventory | **Pinned soft default (pass 27):** numbered theme list below (not full Q&A prose) | No — pinned |
| INTERVIEW keep-justification depth | Soft pin: candidate + flat delta `0` + pointer to `MODEL_FREEZE_STATUS.md` stub; no invented lift | Soft — non-blocking |
| Screenshot / `docs/assets/` DoD | Soft pin: **out** unless human adds (AG has assets; Mechanic handoff does not require) | Soft — not blocking |
| Align timing for VISION §9 / ARCHITECTURE §16 after packaging lands | Out of Guide 03 Implement; Align stage later | No for Write-dev-guide |

---

## Recommended approach

**Thin packaging docs only — no product code, no freeze, no corpus growth.**

### Soft defaults pinned (pass 26–27 — Write-dev-guide must honor)

| Pin | Value | Why | Pass |
|-----|-------|-----|------|
| Placement | **Repo root** `GETTING_STARTED.md` + `INTERVIEW.md` | Match AlphaGuard peer; README can link without `docs/` nesting | 26 |
| Compose depth | **Thin** — one Compose step + port callout (`5433` host → `5432` container per `docker-compose.yml` / `.env.example`); no ops appendix | Keeps Guide 03 packaging, not hardening | 26 |
| Eval smoke depth | **Health + one ask + `mecharag eval --golden evals/`** (Next must be running for ask path). Document `--retrieval-only` as escape hatch if Next is down. **Do not** require twin-process paired ablation in GETTING_STARTED — link README “Paired ask ablation eval” | Matches README Quick Start §6; avoids stranger twin-process fail blaming packaging | 27 |
| INTERVIEW themes | **Numbered theme list** (below) — Write authors FAQ Q&A under these themes; do not invent new primary themes without human gate | Closes “exact theme inventory” invent risk; FAQ wording under themes remains cosmetic | 27 |

### INTERVIEW theme list (pinned soft default — pass 27)

Numbered **themes** for `INTERVIEW.md` DoD — **not** full Q&A prose. Write-dev-guide / Implement may author ≈1–2 FAQ entries per theme; total FAQ still ~thin (peer AG shape is a ceiling, not a copy).

1. **Ranking order** — Why hybrid → RRF → section dedup → local CE (MR2).  
2. **Degrade vs ablation** — `rerank_degraded` (failure path) ≠ `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY` (intentional arm).  
3. **Public corpus boundary** — Fixtures only; Drive / Ford / OEM PDFs never in this repo.  
4. **Candidates vs freeze** — Embed/CE **candidate**; Guide 02 paired ask `ce_vs_rrf_ask_delta_hits=0` (n=12, gemma); proxy `+1` / `n=5` **forbidden** as lift; keep-with-justification → pointer to `MODEL_FREEZE_STATUS.md` stub (no invented lift).  
5. **Citations + vehicle scope** — Citations from DB rows; `vehicle_id` filtering.  
6. **Eval maturity** — Path to ≥30 open (`PATH_TO_30.md`); do not claim complete eval suite.  
7. **Packaging honesty banners** — Packaging ≠ portfolio v1 complete ≠ public flip ≠ freeze.  
8. **Soft residual honesty (secondary)** — g10: ablation scores citation∩gold miss; do **not** claim hard-miss reliably returns `insufficient_evidence` (live both arms `outcome=answered`).

Do **not** copy AlphaGuard AG1–AG3 / Kafka themes.

1. **`GETTING_STARTED.md` (repo root — pinned)** — Mirror AlphaGuard shape: prerequisites → clean-clone numbered steps → honesty table → links to INTERVIEW / VISION / ARCHITECTURE.  
   - Steps mirror README Quick Start but teach **why** `web/.env.local`, Compose-first, fixture-only corpus, public fail-closed.  
   - **Thin Compose (pinned):** “`docker compose up -d` provides local Postgres+pgvector on host port **5433** (see `.env.example`)” — not a full ops runbook.  
   - **Eval smoke (pinned pass 27):** health + one ask + `mecharag eval --golden evals/`; defer twin-process paired ablation to README.  
2. **`INTERVIEW.md` (repo root — pinned)** — FAQ under the **eight themes** above; not a second ARCHITECTURE.  
3. **README touch (Implement-time, minimal)** — Add links to the two new files; do not duplicate full Quick Start into three places.  
4. **Metric rails (binding for all packaging prose):**

| Claim | Allowed? |
|-------|----------|
| Paired ask `ce_vs_rrf_ask_delta_hits=0` (n=12, gemma, citation∩gold) | Yes — honest |
| CE / embed **candidate** | Yes |
| Human freeze | **No** — not done |
| Proxy `+1` / `n=5` as lift | **Forbidden** |
| “CE improves retrieval” / invented lift | **Forbidden** |
| Keep-with-justification | Point at freeze-file stub; do not invent lift language |

5. **Learning / interview ROI:** Packaging completes the stranger + FAQ surface after Guide 02 evidence — same program reason AlphaGuard packaged before Kafka E2E.

---

## Open decisions (human)

1. ~~Compose appendix depth~~ → **Pinned soft default:** thin (pass 26).  
2. ~~File placement~~ → **Pinned soft default:** repo root (pass 26).  
3. ~~GETTING_STARTED eval depth~~ → **Pinned soft default (pass 27):** health + one ask + `mecharag eval --golden evals/`; twin ablation → README only.  
4. ~~INTERVIEW theme inventory~~ → **Pinned soft default (pass 27):** eight numbered themes (not full Q&A).  
5. **INTERVIEW keep-justification depth** — stub pointer vs authored paragraph. **Guide default:** pointer to `MODEL_FREEZE_STATUS.md`; no invented lift.  
6. **Assets/screenshots** — include in Guide 03 DoD? **Guide default:** out unless human adds.

---

## Evidence opened this pass

**Rails / stage / handoffs (pass 27 refine)**

- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`  
- `second_brain/docs/workflow_os/rails/ALWAYS.md`  
- `second_brain/docs/workflow_os/rails/LEARNING_MODE.md`  
- `second_brain/docs/workflow_os/stages/refine-context.md`  
- `second_brain/docs/2026-07-14_mechanic_refine_context_guide03_pass27_handoff.md`  
- `second_brain/docs/2026-07-14_refine_context_guide03_pass27_shared_handoff.md`  
- Prior refine note pass 26 + this context file  

**Live re-verify (pass 27)**

- Filesystem: **still absent** — no `GETTING_STARTED.md` / `INTERVIEW.md` at root or `docs/`  
- `evals/MODEL_FREEZE_STATUS.md` — embed/CE **candidate**; paired delta **0**; proxy +1 retired; keep stub present  
- `evals/last_run_summary.json` — `n_cases=12`, `rrf_only_ask_hits=11`, `ce_ask_hits=11`, `ce_vs_rrf_ask_delta_hits=0`, `generator_models_seen=['gemma4:e2b']`, `model_status` candidate  
- g10 both arms: `citation_gold_hit=false`, `outcome=answered` (reconfirmed)  
- `docs/VISION.md` §9 — GETTING_STARTED/INTERVIEW still unchecked; clone-and-run [x] via README only  
- `README.md` Quick Start §6 = `mecharag eval --golden evals/` + twin ablation section separate  

**Commands:** absence `ls`, summary parse, targeted reads — read-only. No Implement / no Write-dev-guide / no freeze.

---

## Learning notes

**Gather pass 25**

1. **Packaging DoD vs freeze DoD** — Stranger-run + interview FAQ can ship while models stay **candidates**. Freezing is a separate human claim; packaging must narrate evidence, not invent locks.  
2. **Interview surface as claim amplifier** — INTERVIEW is where proxy theater becomes career risk. Flat delta + candidate language is the feature, not a weakness to hide.  
3. **Env layering** — Next.js conventionally reads `web/.env.local`; CLIs that `load_dotenv("web/.env.local")` couple operator docs to that path. Teaching one copy target beats “also try root `.env`.”

**Refine pass 26**

1. **Soft pin** — An open decision the human has not contradicted, promoted to a guide default so Write-dev-guide does not re-debate it.  
2. **Outcome ≠ ablation metric** — A golden can expect `insufficient_evidence` while the live ask still returns `outcome=answered` with `citation_gold_hit=false`. Ablation honesty uses citation∩gold; grounding polish is a separate residual.

**Refine pass 27 (new)**

1. **Theme inventory vs FAQ prose** — Pinning *what* topics INTERVIEW must cover (themes) removes material invent for Write DoD; *how* each Q is worded stays cosmetic. That split is how packaging can be Write-ready without freezing exact interview scripts.  
2. **Smoke ceiling** — A GETTING_STARTED “eval smoke” is the stranger proof that golden tooling runs; a twin-process ablation is an evidence *reproduction* path. Mixing them overloads packaging and creates false failure modes (two Next ports) for clone reviewers.

---

## Honest readiness

- **Write-dev-guide readiness score:** **9.5 / 10** — Ready; material soft pins closed (placement, Compose, themes, eval smoke). Residual invent = FAQ wording under pinned themes + keep-stub pointer default + assets-out. Not **10**: user bar is zero invent — FAQ prose under themes is still authored at Write.  
- **Delta vs prior 9:** **+0.5** (themes + eval smoke pinned; live absences / candidate / delta 0 re-verified; no regression).  
- **Ready for Write-dev-guide?** **Yes**  
- **Not ready for Implement** until Write-dev-guide (human-gated).  
- **Not ready to claim portfolio v1 / public flip** — packaging is necessary but not sufficient (§9 ≥30 + freeze still open).  
- **Still weak (non-blocking):** exact FAQ Q wording under themes; keep-stub depth (pointer default); assets optional-out; g10 grounding narrative must stay honest; ARCHITECTURE §16 Align lag.

---

## QUALITY_STANDARD §5 checklist

- [x] Assumptions listed / soft-pinned (root; thin Compose; themes; eval smoke; no assets DoD)  
- [x] Did not rush; unknowns explicit; no guessed metric lift; g10 claim held  
- [x] Mode/Stage/artifacts declared (spoke / Refine pass 27 / this path)  
- [x] Edge cases for packaging (env, FORCE flag leak, twin ablation, Ollama fallback, g10 outcome≠expect)  
- [x] Blast radius: interview claims, VISION checkbox temptation, ARCHITECTURE §16 lag  
- [x] Findings written to this file + refine note + handoff Results  
- [x] Spoke stayed in Mechanic guide 03 packaging slice  
- [x] No scope creep / no guide writing / no Implement / no freeze  
- [x] Verification = filesystem + doc + summary evidence (stage-appropriate)  
- [x] Honest readiness: Yes for Write-dev-guide; score 9.5; soft opens non-blocking  
