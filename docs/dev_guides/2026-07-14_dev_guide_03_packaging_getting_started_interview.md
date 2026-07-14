# Dev Guide 03 — GETTING_STARTED + INTERVIEW packaging

**Date:** 2026-07-14  
**Repo:** `mechanic_rag`  
**Work item:** Guide 03 — GETTING_STARTED + INTERVIEW packaging  
**Stage that authored this:** Write-dev-guide (pass 28)  
**Last refined:** Refine-dev-guide (pass 30 VERIFY)  
**Status:** **READY** (Ready check pass 35 — awaiting Implement authorize)  

**Context SSOT:** `docs/2026-07-14_guide03_packaging_getting_started_interview_context_summary.md`  
**Prerequisite:** Guide 01 vertical slice shippable; Guide 02 paired ask ablation shippable as-is (Review pass 24). This guide adds **docs + links only** — no product/ranking/eval code, no freeze, no corpus growth.

---

## Objective

Land the **defendable interview + stranger-clone shell** around the already-shippable hybrid → RRF → CE slice and honest Guide 02 ablation evidence:

1. Root `GETTING_STARTED.md` — clean-clone path (Compose Postgres, `web/.env.local`, Ollama, fixture ingest, public fail-closed, Next, health + one ask, eval smoke).  
2. Root `INTERVIEW.md` — thin FAQ under **eight pinned themes** (ranking, degrade vs ablation, corpus boundary, candidates/freeze honesty, citations/vehicle, eval maturity, packaging banners, g10 residual honesty).  
3. Minimal README touch — link the two new files; do not triplicate Quick Start.  
4. Metric rails everywhere — CE **candidate**, paired ask delta **0**, proxy `+1`/`n=5` **forbidden**, **no freeze theater**.

**Success signal:** A reviewer can clone, follow GETTING_STARTED, run health + ask + `mecharag eval`, open INTERVIEW.md, and hear honest Guide 02 claims without needing twin-process ablation, Drive, Ford, PrivateGold, or a model freeze.

---

## Learning notes

1. **Packaging vs freeze DoD** — Stranger-run docs and interview FAQ can ship while embed/CE stay **candidates**. Freezing is a separate human claim; packaging narrates evidence, it does not invent locks. Analogy: shipping the owner’s manual is not the same as stamping the engine “production certified.”

2. **Theme inventory vs FAQ prose** — Pinning *what* topics INTERVIEW must cover (eight themes) removes material invent for Write DoD; *how* each Q is worded stays cosmetic at Implement. That split is how packaging can be Write-ready without freezing exact interview scripts.

3. **Smoke ceiling** — GETTING_STARTED “eval smoke” proves golden tooling runs for a stranger (health + ask + `mecharag eval` with Next up). Twin-process paired ablation is an evidence *reproduction* path. Mixing them overloads packaging and creates false failure modes (two Next ports) for clone reviewers.

4. **Env layering footgun** — Next.js reads `web/.env.local`; CLI `load_dotenv()` then loads `web/.env.local`. Root `.env` alone can satisfy CLI but **not** Next. Teaching **one** copy target (`cp .env.example web/.env.local`) beats “also try root `.env`.”

5. **Ready-check readiness vs Implement craft (pass 29)** — Ready check asks whether an Implement agent must invent *material* decisions (placement, smoke ceiling, metric rails, theme inventory). Exact FAQ sentences and where a README link sits are **craft residuals** — they do not block Ready check if pins are closed. Do not confuse “still writing prose at Implement” with “guide incomplete.”

6. **Ask-delta vs proxy-delta field names** — Honest Guide 02 field is `ce_vs_rrf_ask_delta_hits`. Historical proxy theater used `ce_vs_rrf_delta_hits=+1` (n=5, answer-substring). Packaging must not conflate the two names; citing the short name as if it were Guide 02 lift recreates claim theater.

---

## References (paths only)

### Product / contracts / rails

- `mechanic_rag/docs/2026-07-14_guide03_packaging_getting_started_interview_context_summary.md` (context SSOT)
- `mechanic_rag/docs/VISION.md` (§4 docs list; §9 packaging unchecked — Align owns ticks)
- `mechanic_rag/docs/ARCHITECTURE.md` (§7 ranking/degrade; §14 non-goals; §15 honesty; §16 step 8 lag)
- `mechanic_rag/README.md` (Quick Start + paired ablation section)
- `mechanic_rag/.env.example`
- `mechanic_rag/docker-compose.yml`
- `mechanic_rag/evals/MODEL_FREEZE_STATUS.md`
- `mechanic_rag/evals/PATH_TO_30.md`
- `mechanic_rag/evals/last_run_summary.json`
- `mechanic_rag/evals/golden_fixture_v1.json`
- `mechanic_rag/scripts/checks/public_fail_closed.py`
- `mechanic_rag/docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md`
- `mechanic_rag/docs/dev_guides/2026-07-13_dev_guide_02_rrf_ablation_eval_freeze.md`
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

### Program / refine evidence

- `second_brain/docs/2026-07-13_mechanic_prioritize_next_work_pass12.md` (§4 packaging backlog)
- `second_brain/docs/2026-07-14_mechanic_refine_context_guide03_pass27.md`
- `second_brain/docs/2026-07-14_mechanic_review_impl_guide02_pass24.md`
- `second_brain/docs/2026-07-14_write_dev_guide_guide03_pass28_shared_handoff.md`

### Peer shape (do not copy AG domain content)

- `alphaguard/GETTING_STARTED.md`
- `alphaguard/INTERVIEW.md`
- `alphaguard/docs/dev_guides/2026-07-13_dev_guide_02_interview_packaging.md`

**Non-authoritative for this slice:** Drive/Ford ops, inventing MR5 thresholds, freeze declarations, VISION §9 checkbox flips mid-Implement.

---

## Architecture constraints (binding)

1. **Docs + links only.** No ranking redesign, no eval harness changes, no freeze flips, no PrivateGold/Drive/Ford, no path-to-30 corpus expansion as core DoD, no hosted CE, no Supabase.  
2. **Guide 01 / Guide 02 remain shippable.** Do not reopen either as “not shippable.” Soft residuals (g10 grounding, cosmetic RRF `ce_model` lag) may be **narrated honestly** only — not fixed in this guide.  
3. **Placement pinned:** `GETTING_STARTED.md` and `INTERVIEW.md` at **repo root** (match AlphaGuard; VISION names files without path).  
4. **Thin Compose:** one Compose step + host port **5433** callout (`.env.example` / `docker-compose.yml`). No ops runbook / healthcheck appendix.  
5. **Eval smoke ceiling (pinned):** health + one ask + `mecharag eval --golden evals/` with Next up. Document `--retrieval-only` as escape hatch only. Twin-process paired ablation → README pointer only — **not** GETTING_STARTED DoD.  
6. **Metric rails (binding for all packaging prose):**

| Claim | Allowed? |
|-------|----------|
| Paired ask `ce_vs_rrf_ask_delta_hits=0` (n=12, gemma, citation∩gold) | Yes — honest |
| CE / embed **candidate** | Yes |
| Human freeze | **No** — not done |
| Proxy `+1` / `n=5` as lift | **Forbidden** |
| Historical field `ce_vs_rrf_delta_hits` (no `_ask_`) as Guide 02 lift | **Forbidden** — proxy-era name only; if mentioned, label historical proxy / non-evidence |
| “CE improves retrieval” / invented lift | **Forbidden** |
| Keep-with-justification | Point at `MODEL_FREEZE_STATUS.md` stub; do not invent lift |

7. **Ablation ≠ degrade** in FAQ: `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY` ≠ `rerank_degraded`.  
8. **Public corpus boundary:** fixtures only; Drive / Ford / OEM PDFs never in this repo.  
9. **Do not copy AlphaGuard AG1–AG3 / Kafka themes.** Domain FAQ = ranking / degrade / corpus / freeze honesty.  
10. **Update VISION §9 / ARCHITECTURE §16 in this same delivery** so packaging status matches reality after `GETTING_STARTED.md` + `INTERVIEW.md` land (trustworthy docs). Do not leave packaging marked missing/unchecked when files exist.  
11. **Assets/screenshots:** **out** of core DoD unless human expands.  
12. Prefer ≤300 lines/file for incidental doc edits; no new product modules. Still say **vertical slice / not portfolio v1 complete / not public-flip ready**.

---

## Acceptance criteria (Implement must meet)

Copied/refined from context SSOT — do not invent extra scope:

- [ ] `GETTING_STARTED.md` at **repo root** with clean-clone path (Phase B)  
- [ ] `INTERVIEW.md` at **repo root** with FAQ covering **all eight** pinned themes (Phase A)  
- [ ] README gains links to both files; does **not** duplicate full Quick Start into three places  
- [ ] Metric honesty: CE **candidate**, delta **0**, proxy lift **forbidden**, no freeze theater  
- [ ] Thin Compose only (port 5433 callout); no ops appendix  
- [ ] Eval smoke = health + one ask + `mecharag eval --golden evals/`; twin ablation → README only  
- [ ] `.env.local` honesty: single copy target `cp .env.example web/.env.local`  
- [ ] Honesty banners: packaging ≠ portfolio v1 complete ≠ public flip ≠ freeze ≠ ≥30 goldens done  
- [ ] No product/ranking/eval code; no freeze; no PrivateGold/Drive/Ford; no assets DoD  
- [ ] Update VISION §9 packaging status and ARCHITECTURE §16 honesty in **this same delivery** after files land (docs match reality)  

---

## Ordered step checklist

All boxes start unchecked. Implement checks them with evidence. **Do not check boxes in Write / Ready-check.**

### Phase A — `INTERVIEW.md` (eight pinned themes)

**Tone (pinned soft default):** Concise staff-interview FAQ — short question, 2–6 sentence answers, point to ARCHITECTURE / MODEL_FREEZE_STATUS / PATH_TO_30 for contracts. Prefer “gotcha + why we chose X” over essay. Aim ≈1–2 FAQ entries per theme (~8–16 Qs total). Peer AG length is a **ceiling**, not a copy target.

- [ ] **A1.** Create `mechanic_rag/INTERVIEW.md` at **repo root** (not under `docs/`).  
- [ ] **A2.** Write FAQ covering **all** required themes below. Exact question wording may be drafted in Implement; theme titles are the checklist. Each theme must appear at least once.

**Required themes + example Q titles (Implement drafts full answers):**

| # | Theme (must cover) | Example Q title (wording flexible) |
|---|--------------------|-------------------------------------|
| 1 | Ranking order (MR2) | Why hybrid → RRF → section dedup → local CE? |
| 2 | Degrade vs ablation | How is `rerank_degraded` different from `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY`? |
| 3 | Public corpus boundary | Why fixtures only — why never Drive / Ford / OEM PDFs here? |
| 4 | Candidates vs freeze | Are embed/CE frozen? What does Guide 02 paired delta `0` mean? Why is proxy `+1` forbidden? |
| 5 | Citations + vehicle scope | Where do citations come from, and how does `vehicle_id` filter? |
| 6 | Eval maturity | Is the eval suite “complete”? Where is path to ≥30? |
| 7 | Packaging honesty banners | Does packaging mean portfolio v1 / public flip / freeze? |
| 8 | Soft residual honesty (secondary) | What does g10 teach about citation∩gold vs `insufficient_evidence` outcome? |

- [ ] **A3.** Theme 4 metric rails (binding): state CE/embed **candidate**; paired ask `ce_vs_rrf_ask_delta_hits=0` (n=12, `gemma4:e2b`, citation∩gold); **forbid** proxy `+1`/`n=5` as lift; **forbid** citing historical `ce_vs_rrf_delta_hits` (no `_ask_`) as Guide 02 lift; keep-with-justification → pointer to `evals/MODEL_FREEZE_STATUS.md` stub — **no invented lift / no freeze theater**.  
- [ ] **A4.** Theme 8 honesty: ablation scores citation∩gold miss; do **not** claim hard-miss reliably returns `insufficient_evidence` (live Guide 02: both arms `citation_gold_hit=false`, `outcome=answered`).  
- [ ] **A5.** Cross-check: no AG1–AG3/Kafka copy; no answer contradicts ARCHITECTURE §7; no claim packaging = v1 Done / public flip / freeze; soft Guide 02 residuals are not primary product narrative.  
- [ ] **A6.** Link from INTERVIEW.md to `docs/ARCHITECTURE.md`, `docs/VISION.md`, `evals/MODEL_FREEZE_STATUS.md`, `evals/PATH_TO_30.md` (paths only; keep FAQ drill-friendly).

### Phase B — `GETTING_STARTED.md` (clone-and-run)

**Role split (pinned):** GETTING_STARTED = clone depth + why; README = skim + link. Avoid duplicating long FAQ or twin-process ablation into GETTING_STARTED.

- [ ] **B1.** Create `mechanic_rag/GETTING_STARTED.md` at **repo root**.  
- [ ] **B2.** Document clean-clone path in order (mirror README Quick Start; teach **why**):  
  1. Prerequisites: Docker, Node/`pnpm`, Python 3.x + venv, host Ollama  
  2. `docker compose up -d` — thin Compose: local Postgres+pgvector on host port **5433** (container `5432`; see `.env.example` / `docker-compose.yml`) — **not** an ops runbook  
  3. `cp .env.example web/.env.local` — **single** copy target; explain Next vs CLI dotenv layering  
  4. Ollama pulls: `nomic-embed-text`, `gemma4:e2b` (fallback `qwen3.5:4b`; do not claim gemma without successful pull/smoke)  
  5. `python -m venv .venv && source .venv/bin/activate && pip install -e .`  
  6. `mecharag ingest --source fixtures`  
  7. `python scripts/checks/public_fail_closed.py fixtures`  
  8. `cd web && pnpm install && pnpm test && pnpm dev`  
  9. Health + one ask — **copy curl targets from README Quick Start** (do not invent vehicle/question): `GET /api/health`; `POST /api/ask` with `vehicle_id=fixture:honda-s2000-demo` and oil-drain-plug question as in README  
  10. Eval smoke: `mecharag eval --golden evals/` with Next **up**; document `--retrieval-only` as escape hatch if Next is down  
- [ ] **B3.** Explicitly **exclude** twin-process paired ablation from GETTING_STARTED DoD — one-line pointer to README “Paired ask ablation eval.”  
- [ ] **B4.** Call out operator footguns: unset `MECHANIC_FORCE_RRF_ONLY` for normal use; `MECHANIC_DIAGNOSTICS=0` default hides CE/ablation fields over HTTP; Compose-first before ingest.  
- [ ] **B5.** Honesty table: packaging ≠ portfolio v1 complete ≠ public flip ≠ freeze ≠ ≥30 done; fixtures only; candidates not frozen.  
- [ ] **B6.** Link back to README + INTERVIEW + VISION + ARCHITECTURE.  
- [ ] **B7.** Update VISION §9 packaging checkboxes / status to reflect that `GETTING_STARTED.md` and `INTERVIEW.md` now exist (honest ticks only — do not claim freeze or public flip).  

### Phase C — README minimal touch

- [ ] **C1.** Add links to root `GETTING_STARTED.md` and `INTERVIEW.md` near the existing README **SSOT** line and/or **Honest limits** (smallest correct edit). **Do not** invent a new top-nav chrome — README has no separate Docs nav today.  
- [ ] **C2.** Update “Missing packaging: GETTING_STARTED, INTERVIEW” (Honest limits) once files land — remove absence claim only after files exist; replace with links if not already added in C1.  
- [ ] **C3.** Keep Quick Start as skim; do **not** paste full GETTING_STARTED prose or INTERVIEW FAQ into README.  
- [ ] **C4.** Keep / strengthen: vertical slice / not v1 complete; candidates; fixtures only; Guide 02 flat delta honesty if mentioned.

### Phase D — Honesty pass + cross-links

- [ ] **D1.** Grep packaging docs for accidental proxy `+1` / `n=5` lift, bare `ce_vs_rrf_delta_hits` (no `_ask_`) presented as Guide 02 lift, “CE improves retrieval,” “frozen,” “v1 Done,” “public flip ready,” or AlphaGuard AG/Kafka copy; fix if introduced.  
- [ ] **D2.** Confirm `web/.env.local` single-copy teaching appears in GETTING_STARTED and stays consistent with README / `.env.example`.  
- [ ] **D3.** Confirm eval smoke ceiling: twin ablation only as README pointer from GETTING_STARTED.  
- [ ] **D4.** Confirm keep-justification is a **pointer** to `MODEL_FREEZE_STATUS.md`, not invented lift prose.  
- [ ] **D5.** Confirm assets/screenshots were **not** added as hard DoD (unless human expanded).  
- [ ] **D6.** Confirm VISION §9 / ARCHITECTURE §16 status language matches packaging reality (files present; freeze/public still honest).  
- [ ] **D7.** Stop. Do not start freeze, PrivateGold, Drive, Ford, path-to-30 expansion, or ranking redesign.

---

## Verification / Definition of Done (this guide)

**Done when all are true:**

1. `GETTING_STARTED.md` exists at repo root and documents the Phase B clone path (Compose thin + 5433, `web/.env.local`, Ollama, ingest, public fail-closed, Next, health + ask, eval smoke).  
2. `INTERVIEW.md` exists at repo root with FAQ covering every required theme in the Phase A table (8 themes).  
3. README links both files; absence claim removed only after files exist; no full Quick Start triplicate.  
4. Metric honesty present: candidate + delta `0` + proxy forbidden + no freeze theater.  
5. Twin-process paired ablation is **not** required in GETTING_STARTED (README pointer only).  
6. No secrets, no `.env` committed, no product/ranking/eval code required for DoD (doc/link-only diffs).  
7. Assets not required; freeze not required; PrivateGold/Drive/Ford not required.  
8. VISION §9 packaging boxes / ARCHITECTURE §16 status updated in this same delivery to match landed files (trustworthy docs).

**Explicitly not required for this guide’s DoD:**

- `docs/assets/` screenshots  
- Human embed/CE freeze  
- Twin-process paired ablation in GETTING_STARTED  
- Path-to-30 corpus expansion  
- PrivateGold / Drive / Ford / OEM PDFs  
- Ranking redesign / hosted CE / true MMR / multimodal / Supabase  
- Invented MR5 numeric public thresholds  
- Rewriting ARCHITECTURE §16 hard text  
- Ticking VISION §9 mid-Implement  
- Fixing g10 grounding residual in product code  

**Suggested verification commands (implementer — after artifacts exist):**

```bash
# From mechanic_rag/
test -f GETTING_STARTED.md
test -f INTERVIEW.md
rg -n 'GETTING_STARTED|INTERVIEW' README.md
rg -n 'web/\.env\.local|5433|mecharag eval|candidate|ce_vs_rrf_ask_delta_hits' GETTING_STARTED.md INTERVIEW.md
rg -n 'proxy|\+1|n=5|ce_vs_rrf_delta_hits|frozen|v1 [Dd]one|public flip|AG1|Kafka' GETTING_STARTED.md INTERVIEW.md || true
# If `ce_vs_rrf_delta_hits` (no _ask_) appears, it must be labeled historical proxy — never as Guide 02 lift
# Theme coverage smoke (titles need not match exactly — themes must be present)
rg -n 'RRF|rerank_degraded|ablation|fixtures|candidate|vehicle_id|PATH_TO_30|insufficient_evidence|portfolio' INTERVIEW.md
# Optional stranger smoke (not required to check Write boxes; Implement/Review evidence):
# docker compose up -d
# cp .env.example web/.env.local
# ... ingest, public_fail_closed, pnpm dev ...
# curl -s localhost:3000/api/health
# mecharag eval --golden evals/
```

Count INTERVIEW themes (8). Spot-check metric rails against Architecture constraints §6.

---

## Blast radius and risks

| Risk | Blast radius | Mitigation in steps |
|------|----------------|---------------------|
| Interview claim theater (proxy `+1` / invent `ce_vs_rrf_delta_hits` lift / freeze language) | Portfolio credibility kill | A3 metric rails; D1 grep; Architecture §6 table |
| `.env.local` footgun (root `.env` only) | Stranger half-working clone | B2 step 3; D2 |
| Compose depth creep | Packaging becomes ops guide | Thin Compose pin; B2 step 2; no ops appendix |
| Twin-process ablation in GETTING_STARTED | False stranger failures (two ports) | B3 smoke ceiling; README pointer only |
| Soft Guide 02 residuals elevated to primary FAQ | Distracts from real contracts | A5; theme 8 secondary only |
| Peer-copy AG1–AG3 / Kafka | Wrong-domain interview answers | A5; Architecture §9 |
| Silent VISION §9 / ARCHITECTURE §16 edits | Status theater | D6; Align owns |
| Public flip premature language | Overclaim vs ARCHITECTURE | B5 honesty table; theme 7 |
| Scope creep to freeze / PrivateGold / Drive / Ford / ≥30 | Calendar burn; pass-12 #4 drift | Stop conditions; core DoD exclusions |
| GETTING_STARTED ↔ README drift | Support burden | Role split: clone depth vs skim+link |
| `MECHANIC_FORCE_RRF_ONLY` left set | Production-looking ask skips CE | B4 footgun callout |

### Rollback

Docs + README links only. **Rollback** = revert the packaging commit(s); delete root `INTERVIEW.md` / `GETTING_STARTED.md` if needed; restore README absence line if rolled back before Align. No DB/migration/runtime flag to unset. Do not leave VISION §9 boxes checked if Align-docs never ran.

---

## Edge-case handling (steps or DoD)

| Edge case | Expected packaging behavior |
|-----------|-----------------------------|
| Ollama missing `gemma4:e2b` | GETTING_STARTED: fallback `qwen3.5:4b`; never claim gemma without pull/smoke |
| Compose on host port **5433** | Call out so health/ask failures are diagnosable |
| `MECHANIC_FORCE_RRF_ONLY=1` left in `.env.local` | Document default-off / unset for normal use |
| `MECHANIC_DIAGNOSTICS=0` (default) | Explain when diagnostics are needed (eval/INTERVIEW); do not imply HTTP always shows CE fields |
| Ingest without Compose / wrong `DATABASE_URL` | Document order: Compose → env → ingest → web |
| Eval against stopped Next | Smoke requires Next up; `--retrieval-only` escape hatch only |
| Public fail-closed points at OEM/private trees | Packaging runs check once on `fixtures` |
| Section dedup env mismatch across ablation arms | Out of thin GETTING_STARTED; README ablation / INTERVIEW note only |
| Generator-era mix in prose | Prefer gemma-era language; label historical qwen proxy as non-evidence |
| Hard-miss g10 | Do **not** claim `insufficient_evidence` reliably; citation∩gold miss is the ablation score |
| INTERVIEW contradicts ARCHITECTURE | ARCHITECTURE wins; fix FAQ |
| Reviewer equates packaging with freeze / public flip | Theme 7 honesty banners required |
| FAQ cites proxy `+1` as CE lift | Ban |
| FAQ cites `ce_vs_rrf_delta_hits` (no `_ask_`) as Guide 02 lift | Ban — historical proxy name; use `ce_vs_rrf_ask_delta_hits` |
| Human wants `docs/assets/` screenshots | Out unless human expands DoD |
| Human wants twin ablation in GETTING_STARTED | Reject — README only (pinned smoke ceiling) |

---

## Stop conditions / non-goals

**Stop when** this guide’s DoD is met (docs + links only).

**Do not:**

- Implement freeze, PrivateGold production ingest, Drive/rclone/Google API, Ford/PTS/CDP/bulk  
- Expand path-to-30 corpus as Guide 03 DoD (pointer only)  
- Redesign ranking, add hosted CE, true MMR, multimodal, Supabase  
- Invent MR5 numeric public thresholds  
- Silently rewrite VISION §9 checkboxes or ARCHITECTURE §16 hard sequencing  
- Re-open Guide 01/02 as unshippable or “fix g10 in product code” under this guide  
- Claim “interview-packaged” / “portfolio v1” / “public flip ready” before Review verifies artifacts  
- Proceed from Write → Ready-check / Implement without human gate  
- Add assets/screenshots as hard DoD unless human expands  

If a stack or contract change seems required, **stop and ask** — packaging must not reopen VISION/ARCHITECTURE locks.

---

## Open decisions pinned (defaults)

These were soft in context (pass 26–27); **this guide locks them** unless a human overrides before Implement.

| Decision | Pinned default | Tradeoff | Override |
|----------|----------------|----------|----------|
| File placement | **Repo root** `GETTING_STARTED.md` + `INTERVIEW.md` | Clone-obvious; noisier root | Human: move under `docs/` |
| Compose depth | **Thin** — one step + port **5433** callout | Keeps packaging, not hardening | Human: authorize ops appendix |
| Eval smoke depth | **Health + one ask + `mecharag eval --golden evals/`** (Next up); `--retrieval-only` escape; twin ablation → README only | Stranger-proof tooling; defers twin-port complexity | Human: require twin ablation in GETTING_STARTED |
| INTERVIEW themes | **Eight numbered themes** (Phase A table) | Closes invent of topics; FAQ wording still Implement craft | Human: add/remove primary themes |
| Keep-justification depth | **Pointer** to `MODEL_FREEZE_STATUS.md` stub; no invented lift | Honest; thin | Human: author longer keep paragraph |
| Assets/screenshots | **Out** of core DoD | Thin packaging; AG had assets, Mechanic handoff does not require | Human: add assets DoD |
| FAQ tone | **Concise staff gotcha FAQ** (2–6 sentence answers) | Drill-friendly; less narrative | Human requests essay tone |
| Align timing for VISION §9 / ARCHITECTURE §16 | **In DoD — same delivery** (pass 33 human) | Trustworthy docs | Human parks Align explicitly |
| README link locus | **SSOT line and/or Honest limits** — no new nav chrome | Matches live README shape | Human: authorize Docs nav |
| Curl ask example | **Copy README Quick Start** (`fixture:honda-s2000-demo` + oil drain plug) | Zero invent of demo IDs | Human: change demo ask |

---

## Honest readiness (Refine pass 30 VERIFY)

- **Refine-dev-guide DoD:** met (verify pass; no material invent gaps).  
- **Ready-check readiness score:** **9 / 10** — delta **0** vs pass 29. Ready for Ready check; soft residuals only. Material pins closed (root placement, thin Compose, eight themes, smoke ceiling, metric rails including ask-vs-proxy field-name ban, README link locus, curl copy-from-README). Not **10**: Implement still authors FAQ sentences under themes + keep-stub pointer prose (craft, not design invent).  
- **Ready for Ready check?** **Yes**  
- **Rollback OK?** **Yes** — docs/links-only revert path under Blast → Rollback (revert packaging commit(s); delete root files if needed; restore README absence line; no DB/runtime flags; do not leave VISION §9 checked if Align never ran).  
- **Not authorized:** creating root GETTING_STARTED/INTERVIEW, README edits, freeze, corpus growth (Implement after Ready check + human gate).  
- **Not claimable:** interview-packaged / portfolio v1 complete / public flip / freeze.  
- **Residual Implement craft:** exact FAQ Q wording under pinned themes; keep-stub pointer prose; SSOT/Honest-limits link wording.  
- **Live spot-check (pass 30):** `GETTING_STARTED.md` / `INTERVIEW.md` still **absent** (root + `docs/`); Implement AC/Phase boxes still `[ ]`; `MODEL_FREEZE_STATUS.md` embed/CE **candidate**, paired `ce_vs_rrf_ask_delta_hits=0`, proxy +1 retired; README still lists “Missing packaging”; README Quick Start curl matches B2 pin; `.env.example` host **5433**.

---

## QUALITY_STANDARD §5 (Refine stage)

- [x] Assumptions listed / soft-pinned as guide defaults; ask-vs-proxy field-name ban pinned  
- [x] Did not rush; unknowns pinned not guessed; no metric lift invented; scores not inflated  
- [x] Mode/Stage/artifacts declared (spoke / Refine-dev-guide pass 30 VERIFY / this path)  
- [x] Edge cases for packaging present (incl. field-name conflation)  
- [x] Blast radius + Rollback present and executable (docs-only revert)  
- [x] Findings written to this guide + refine note + handoff Results  
- [x] Spoke stayed in Mechanic guide 03 packaging slice  
- [x] No scope creep / **no Implement / no code / no Ready READY stamp**  
- [x] Verification / DoD commands clear for later Implement  
- [x] Honest readiness: Refined; Ready-check Yes; score 9 (delta 0); not Implement  
