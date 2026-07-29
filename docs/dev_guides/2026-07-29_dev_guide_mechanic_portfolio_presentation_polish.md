# Dev guide — Mechanic portfolio presentation polish (docs + thin UI)

**Date:** 2026-07-29  
**Repo:** `mechanic_rag`  
**Work item:** Portfolio presentation polish — INTERVIEW/README M1–M3 honesty → thin UI demo polish → CE keep-story sharpening  
**Stage:** Ready-check Met · **Implement Checklist B** Met · **C** verification Met (automated)  
**Status:** **Review Met** (Pass-with-nits / shippable) · Checklist **A + B Met** · **C** automated Met · soft C2 manual smoke + B4 screenshots optional  
**Depends on:** M1–M3 Review Met · fixtures public flip Met · Prioritize lock **#77** · frontend rails **#80** · cinematic park **#81**  
**Review:** `docs/2026-07-29_review_mechanic_portfolio_presentation_polish.md`  
**Context SSOT:** `second_brain/docs/2026-07-29_mechanic_portfolio_presentation_polish_context_summary.md`  
**Prioritize:** `second_brain/docs/2026-07-29_prioritize_after_lemon_750_inflight.md`  
**Frontend rails:** `second_brain/docs/2026-07-29_impeccable_frontend_guidance_deep_dive.md`  
**Cinematic park path:** `second_brain/docs/2026-07-29_video_research_cinematic_ai_frontends_nick_saraev.md`  
**Lens:** Senior AI eng (retrieval honesty + eval packaging) + portfolio storytelling + Operate-mode UI craft  

### Declare (Refine)

| Item | Value |
|------|-------|
| Frozen at Refine | INTERVIEW FAQ themes **10–11** · UI tokens · screenshot policy · readiness scores |
| Will **not** | Implement code · reopen M0–M3 retrieval · claim CE lift · add cinematic scroll-video UI · run LEMON capture |

### Locks (do not reopen)

| # | Decision |
|---|----------|
| **#77** | Human/agent focus → Mechanic presentation polish while LEMON 750 runs unattended (ops only) |
| **#80** | Impeccable **Operate-mode** polish rails; clone in workspace; do not let `overdrive` override honesty |
| **#81** | Nick Saraev scroll-video / dither pipelines **parked** for Mechanic ask UI; optional later on `tomchackoIO` |

---

## 1. Objective

Raise **portfolio impressiveness** without rebuilding retrieval. Backend M1–M3 is Met; the ceiling is **storytelling lag** (INTERVIEW/README still read “text-only”) and **thin default Next UI** (functional but not demo-deliberate).

**Ordered sub-slice (Implement later — docs first):**

1. **Docs honesty** — Align `INTERVIEW.md`, `README.md`, and `GETTING_STARTED.md` banners for M1–M3 Met on personal garage; flags default off; text owns torque/spec; no earned CE lift claim.  
2. **Thin UI polish** — One-page ask demo: loading/outcome/citation→page clarity; restrained Operate-mode composition; optional screenshots for README.  
3. **CE keep-story** — Sharpen freeze-by-override narrative in interview-facing docs; delta **0** on n=44; keep CE in stack without fake lift.

**Honest ship claim after this slice:** A stranger or interviewer can skim docs and see a deliberate demo that matches VISION/ARCHITECTURE — multimodal Met privately, M0 text path stranger-runnable, CE frozen by override not lift, UI polished but still thin consumer of `/api/ask`.

**Out of Met:** Product redesign · new pages/routes · Vercel requirement · public multimodal fixture expansion · M4 · Drive→Mechanic ingest.

---

## 2. References (paths only)

| Area | Path |
|------|------|
| Product / why | `docs/VISION.md` (§5 M1–M3; §9 packaging) |
| Contracts / ranking | `docs/ARCHITECTURE.md` |
| Interview FAQ | `INTERVIEW.md` |
| Skim + Quick Start | `README.md` |
| Stranger clone path | `GETTING_STARTED.md` |
| Freeze honesty | `evals/MODEL_FREEZE_STATUS.md` |
| Eval path | `evals/PATH_TO_30.md` · `evals/last_run_summary.json` |
| Thin UI (Implement targets) | `web/src/app/page.tsx` · `web/src/app/globals.css` · `web/src/app/layout.tsx` |
| Hub prioritize | `second_brain/docs/2026-07-29_prioritize_after_lemon_750_inflight.md` |
| Impeccable Operate rails | `second_brain/docs/2026-07-29_impeccable_frontend_guidance_deep_dive.md` · clone `/Users/tom/Documents/Git/impeccable` |
| Cinematic park (#81) | `second_brain/docs/2026-07-29_video_research_cinematic_ai_frontends_nick_saraev.md` |
| M1–M3 guides (do not reopen scope) | `docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md` · `docs/dev_guides/2026-07-26_dev_guide_mechanic_m2_multimodal_retrieve.md` · `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md` |
| Decision log pins | `second_brain/docs/2026-07-26_build_decision_log_waterfall_finish_line.md` rows **#77** · **#80** · **#81** |

---

## 3. Architecture constraints

1. **Thin API consumer** — UI calls `/api/ask`, `/api/vehicles`, `/api/assets/...` only. No retrieval, embedding, or ranking in the browser.  
2. **One page** — Stay on `web/src/app/page.tsx`; no new routes or marketing splash.  
3. **Flags default off** — `MECHANIC_VLM`, image channel, and multimodal paths remain opt-in env; docs must say M0 text is the stranger path.  
4. **No CE lift claim** — Freeze is Tom override (Guide 09); `ce_vs_rrf_ask_delta_hits=0` on n=44. Forbidden: “CE improves citations,” historical proxy `ce_vs_rrf_delta_hits=+1`.  
5. **Impeccable Operate only** — Use `critique` → `typeset` → `layout` → `polish` → `audit` vocabulary; **forbid** cinematic scroll-video / dither / `overdrive` on ask page (#81).  
6. **Anti-slop** — No Inter-default purple SaaS, identical card grids, eyebrow kickers, gray-on-color hero metrics (Impeccable + Tom frontend rules).  
7. **No new UI frameworks** — Tailwind + existing Next App Router; no shadcn wholesale, no Framer scroll-jacking, no WebGL/video-hero dependencies.  
8. **DRY** — Reuse existing ask response types and citation/visual asset shapes; do not fork parallel API clients.  
9. **File size** — Prefer ≤300 lines/file; hard max 400.  
10. **License honesty** — PolyForm-NC; not OSI open source / not MIT.

---

## 4. Recommended approach (Implement later)

### A. Docs honesty (checklist A)

**Problem:** README line 3 still says “Text-only RAG”; INTERVIEW has no M1–M3 FAQ; GETTING_STARTED omits multimodal flags banner.

**Targets:**

| File | Change |
|------|--------|
| `README.md` | Replace “text-only” framing with “M0 text stranger path + M1–M3 Met on personal garage (flags off by default)”; keep Quick Start unchanged; link M1–M3 guides or VISION §5 |
| `INTERVIEW.md` | Add frozen FAQ themes **10** and **11** below (do **not** renumber existing **1–9**) |
| `GETTING_STARTED.md` | Short honesty banner after intro: fixtures-only public corpus; optional local `cat:*` + env flags for multimodal smoke; not required for clone |
| `docs/VISION.md` | Light touch only if Implement finds stale “P2 UI open” vs this slice — prefer cross-link, not rewrite |
| `evals/MODEL_FREEZE_STATUS.md` | Optional one-line cross-link in CE keep section if INTERVIEW points here — no status change |

**Frozen INTERVIEW FAQ outline (Implement verbatim themes — do not renumber 1–9):**

| Theme | Title (Implement) | Required bullets |
|-------|-------------------|------------------|
| **10** | Multimodal M1–M3 — what is Met and what is public? | M1–M3 **Met** on personal garage (`cat:*`) under local flags; **flags default off**; stranger clone path = **M0 text RAG** on fixtures only; **text owns torque/spec** truth (M3 VLM assist optional, never default); friend Drive library **≠** Mechanic ingest (dual-product OUT); public demo must not imply VLM/image channel required |
| **11** | Why keep CE if paired-ask delta is 0? | Freeze = **Tom override Guide 09**, not earned lift; CE stays for **stack completeness** (hybrid → RRF → dedup → CE) + **`rerank_degraded` fail-open** path; cite **n=44** `ce_vs_rrf_ask_delta_hits=0` (helps=0 / hurts=0); **forbid** historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as evidence; cross-link `evals/MODEL_FREEZE_STATUS.md` |

**CE keep-story (part of A — README/GETTING_STARTED echo theme 11):**

- Restate: CE **stays in stack** for architecture completeness + degrade path; **not** because n=44 showed lift.  
- Distinguish `rerank_degraded` vs `ablation_rrf_only` (already in INTERVIEW §3 — ensure README doesn’t blur).

### B. Thin UI polish (checklist B)

**Problem:** `page.tsx` works but reads default Next (gray-600, generic borders, Geist vars unused in `globals.css` body fallback Arial). Outcome `insufficient_evidence` and loading state exist but are not visually deliberate. Citation → page image join is present but easy to miss in demo.

**Frozen UI tokens (Implement — Operate mode, Impeccable #80):**

| Token | Locked value |
|-------|----------------|
| Light ground | `oklch(97% 0.01 85)` |
| Ink / body text | `oklch(22% 0.02 85)` |
| Accent (actions, focus) | steel/teal `oklch(45% 0.08 230)` — **NOT purple** |
| Typography | **Geist Sans** via existing `layout.tsx` variables; wire in `globals.css` body (drop Arial fallback) |
| Radius | **8–12px** on inputs, buttons, cards |
| Motion | **≤2** subtle transitions total; honor **`prefers-reduced-motion: reduce`** (disable or instant) |
| Warn / error / insufficient | Color **plus text label** — never color-only state |

**Operate-mode layout intent:**

| Area | Intent |
|------|--------|
| Hierarchy | Clear title + one-line status banner (fixtures + honesty); form → outcome → citations |
| Loading | Visible in-button state (exists); subtle page-level pending ok if within motion budget |
| Outcomes | Distinct styling for `answered` vs `insufficient_evidence` vs error (use frozen tokens + labels) |
| Citations | Label + section + page line scannable; page thumbnails linked clearly to citation row |
| Visual assets | When M1 assets present, show “Page figure” affordance without implying VLM on |
| Footer | Keep advisory disclaimer; optional one-line “M0 default · multimodal opt-in” |
| `layout.tsx` metadata | Title/description may gain “fixture demo” honesty — no marketing hype |

**Frozen screenshot policy:**

- **Optional** · **max 2** PNGs for README  
- Path: `docs/assets/demo/` only  
- **Fixture-only** content (`fixture:honda-s2000-demo`); no OEM / no private `cat:*` captures  
- Filenames: descriptive (`ask-outcome.png`, `citations-page-thumb.png`)  
- If skipped, DoD still Met — screenshots are polish, not gate

**Explicit forbids (#81):**

- Scroll-driven video scrubbing  
- Dither/procedural full-page effects  
- Hero metrics (“99% accuracy”)  
- New dependencies for Higgsfield/video pipelines  

### C. Definition of Done (checklist C)

**Docs**

- [x] README no longer claims text-only as whole-product framing  
- [x] INTERVIEW includes frozen FAQ themes **10** and **11** (1–9 unchanged)  
- [x] GETTING_STARTED banner: fixtures public · optional multimodal flags for local garage  
- [x] CE keep-story: override vs lift language consistent across INTERVIEW + README + MODEL_FREEZE_STATUS  
- [x] No new CE lift claims; n=44 delta **0** cited where freeze discussed  

**UI**

- [x] Single-page polish only (`page.tsx` + `globals.css` + optional `layout.tsx` metadata)  
- [x] Loading, error, `insufficient_evidence`, and success states visually distinct  
- [x] Citations scannable; page assets visible when returned  
- [x] Impeccable Operate anti-slop pass (no purple gradient / card-grid slop)  
- [x] No cinematic scroll-video / overdrive patterns  

**Verification**

- [x] `cd web && pnpm test` — all pass (45 tests, 2026-07-29)  
- [ ] Manual ask smoke: fixture vehicle, torque question → answer + citations (deferred — no `pnpm dev` this pass)  
- [x] Manual: empty question blocked; vehicle list degrade shows warning (existing behavior preserved in code)  
- [ ] Optional: local `cat:*` vehicle + flags off still works (no regression) — deferred manual  
- [x] `python scripts/checks/public_fail_closed.py fixtures` — pass (no public corpus change)  

**Review / Align (post-Implement)**

- [ ] Hub context summary status updated  
- [ ] Optional README screenshot if captured  

---

## 5. Ordered Implement checklist (when Ready + Tom Go)

### Checklist A — Docs (do first)

- [x] **A1.** Audit README/INTERVIEW/GETTING_STARTED against VISION §5 and ARCHITECTURE multimodal sections  
- [x] **A2.** Rewrite README status paragraph (M0 + M1–M3 honesty)  
- [x] **A3.** Add INTERVIEW FAQ themes **10** and **11** per frozen outline  
- [x] **A4.** Add GETTING_STARTED optional multimodal banner + env flag pointers (names only; no new ops runbook)  
- [x] **A5.** Sharpen CE keep-story cross-links  

### Checklist B — UI (after A merged or same PR if small)

- [x] **B1.** `globals.css` — frozen oklch tokens + Geist Sans + radius 8–12 + reduced-motion  
- [x] **B2.** `page.tsx` — outcome/loading/citation hierarchy polish (Operate mode)  
- [x] **B3.** `layout.tsx` — metadata honesty tweak if needed  
- [ ] **B4.** Optional ≤2 fixture PNGs under `docs/assets/demo/` — **skipped** this pass  
- [x] **B5.** Self-critique against Impeccable anti-slop list (manual — no purple / no cinematic / steel-teal accent)  

### Checklist C — DoD / verification

- [x] **C1.** `pnpm test` — 45 passed  
- [ ] **C2.** Manual ask smoke (fixture) — deferred (no dev server this pass)  
- [x] **C3.** No API contract changes without ARCHITECTURE update  
- [x] **C4.** Review doc — `docs/2026-07-29_review_mechanic_portfolio_presentation_polish.md` (**Pass-with-nits / shippable**)  

---

## 6. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Docs overclaim multimodal in public demo | Repeat “flags default off”; fixtures = M0 text path |
| UI polish breaks ask flow | Thin diff; no fetch logic changes unless bugfix |
| Impeccable overdrive creep | Lock #81; Operate-only commands |
| README screenshots show private OEM | Fixture-only captures; blur/check before commit |
| CE language regression | Copy-paste from MODEL_FREEZE_STATUS; peer review |
| Scope creep to second page / dashboard | One page lock; redirect ideas to backlog |
| LEMON ops distraction | **Do not** run LEMON capture from this slice; ops snapshot only in hub |

---

## 7. Edge cases

- **Vehicle list empty** — Existing `listWarning` path must remain; polish must not hide it  
- **`insufficient_evidence`** — Distinct from HTTP error and from empty answer  
- **Visual assets without citations** — Should not happen in normal path; if present, do not imply VLM  
- **Dark mode** — `globals.css` has `prefers-color-scheme`; ensure contrast still passes after polish  
- **Private `cat:*` vehicles in dropdown** — Banner should clarify public clone uses fixtures; local DB may list more  
- **Flags on locally** — Docs must not imply strangers need M2/M3 env to run clone  
- **Geist vs Arial** — Layout loads Geist but body overrides to Arial today; fix is in scope for B1  

---

## 8. Out of scope

| Item | Why |
|------|-----|
| LEMON 750 pipeline (#79) | Parked; serial download→promote; hub ops only |
| Friend Wave-7 HT keyword | Prioritize #77 parks until 750 Met |
| Drive→Mechanic ingest / dual-product | Explicit OUT |
| Public multimodal fixtures / second-vehicle goldens | Optional backlog 2d in prioritize — separate guide |
| M4+ roadmap | Not started |
| `npx impeccable install` into repo | Only when Tom asks; read clone from workspace for Implement |
| Cinematic AI frontends (#81) | Parked for Mechanic; tomchackoIO later |
| API schema changes | Thin consumer — avoid widening ask contract |
| Hosted Vercel demo | OUT of v1 |
| CE re-ablation or unfreeze | No metric work in this slice |

---

## 9. Readiness scores (Refine-dev-guide — honest 0–10)

| Track | /10 | Why not 10 |
|-------|----:|------------|
| Context ↔ guide | **9.0** | Hub context + prioritize aligned; minor Ready-check wording may tighten |
| Docs checklist | **9.0** | FAQ themes **10–11** frozen; README/GETTING_STARTED diff intent clear |
| UI checklist | **8.7** | oklch tokens + motion budget frozen; live contrast proof waits Implement |
| Constraints / locks | **9.5** | #77/#80/#81 pinned; no reopen |
| Verification | **9.0** | `pnpm test` + manual ask + public_fail_closed path explicit |
| Blast / edges | **9.0** | Fixture screenshot policy + OEM boundary pinned |
| **Overall Refine-dev-guide** | **9.0** | Awaiting Ready-check before code |

---

## 10. Ready-check before code (2026-07-29)

**Gate:** Tom **agree · lock · proceed** → **Implement Go** for this polish slice (Checklist A first).

| Track | /10 | Why not 10 |
|-------|----:|------------|
| Context ↔ guide | **9.2** | Hub context + guide + VISION §5 aligned; Tom locked #77/#80/#81 |
| Docs checklist (A) | **9.5** | FAQ **10–11** frozen verbatim; README/GETTING_STARTED diff scoped; no VISION rewrite needed |
| UI checklist (B) | **8.7** | Tokens + Operate layout frozen; contrast/motion proof deferred to Implement B |
| Constraints / locks | **9.5** | #77 focus · #80 Operate · #81 cinematic park · #79 LEMON ops-only — no reopen |
| Verification (C) | **9.0** | `pnpm test` + manual ask + `public_fail_closed` explicit; screenshots optional |
| Blast / edges | **9.0** | Fixture-only screenshot policy; `rerank_degraded` vs ablation edge pinned |
| **Overall Ready (Implement)** | **9.1** | Docs A executable now; UI B/C follow same PR or next pass |

**Ready?** **Yes** — overall **≥8.5**; guide executable; Tom Go recorded.

---

## 11. Next

1. ~~**Ready-check**~~ — Met (§10).  
2. ~~**Implement**~~ — Checklist **A** Met · **B** Met · **C** automated Met.  
3. ~~**Review-implementation**~~ — **Met** (`docs/2026-07-29_review_mechanic_portfolio_presentation_polish.md` · shippable).  
4. Soft residuals only: optional C2 manual `pnpm dev` smoke · optional B4 screenshots.  
5. **No new program Build** for polish — open waterfall Implement remains Friend LEMON 750 (#74).

**Implement polish again?** **No** — Review Met; soft C2/B4 backlog only.
