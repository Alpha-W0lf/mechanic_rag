# Context: Mechanic RAG — GitHub visibility public + sales-first storefront

**Date:** 2026-07-31  
**Repos:** `mechanic_rag` (primary)  
**Also:** `custom_resumes` (LinkedIn / career SSOT), `second_brain` (hub pointer), profile README `Alpha-W0lf/Alpha-W0lf`  
**Status:** Ready-check **Met** (2026-07-31) — **READY for Implement** after Build Go; presentation **9.x targets deflated** (were inflated)  
**Mode last used:** multi-repo  
**Stage last completed:** Ready check before code  
**Implementation guide:** `docs/dev_guides/2026-07-31_dev_guide_mechanic_github_visibility_storefront.md`  

**Related prior slice (different meaning of “public flip”):** Guide 10b Met = **fixtures-only packaging / marketing honesty** for “v1 Done” — **not** the GitHub **visibility** toggle. Repo is still **`PRIVATE`** (`gh repo view`: `isPrivate=true`, empty description, no topics).

---

## Problem

Mechanic RAG is an intentional **portfolio product RAG** (VISION §1–§2): cited answers over automotive service docs, hybrid → RRF → CE, evals, stranger-runnable fixtures, PolyForm-NC. Declared polish / Guide 10b packaging are largely Met — but:

1. **GitHub strangers cannot see the repo** (still private).  
2. **Storefront copy is apology- / status-first**, unlike the locked sales-first pattern just shipped for AlphaGuard, AI Knowledge Base (public), and Eyeglass.  
3. **UI demo chrome still says “not portfolio-complete”**, which contradicts VISION §9 / Guide 10b Met and poisons Featured thumbs / README screenshots.  
4. LinkedIn Featured + GitHub pins currently advertise **four public repos only** — Mechanic is absent from the cold LinkedIn → GitHub path.

Without a visibility flip **and** a presentation pass, Mechanic remains invisible to recruiters/clients even though the engineering slot is strong and complementary to AI KB (domain product RAG vs agent-knowledge RAG).

---

## Positioning (professional / marketing — Gather synthesis)

### Target audiences (priority order)

1. **Recruiter / hiring manager** skimming LinkedIn Featured → GitHub in &lt;60s  
2. **Staff AI eng interviewer** who opens README + Try it  
3. **C2C / Lowd Code warm leads** who want proof you ship product-shaped RAG with citations and evals  
4. **Fellow builders** cloning fixtures (secondary)

### Portfolio slot (do not collapse into AI KB)

| Surface | Mechanic RAG | AI Knowledge Base (public) |
|---------|--------------|----------------------------|
| Job | **Product RAG** for a real domain (service docs → cited answers) | **Keep coding agents current** (hybrid RAG + MCP over AI notes) |
| Proof | Ask UI + citations + ≥30 fixture goldens + Compose pgvector | CLI/MCP + fixtures + LanceDB |
| Category sentence | Synthetic fixtures for strangers; private garage local-only | Synthetic fixtures; architecture is the product |
| License | PolyForm-NC (like AlphaGuard) | MIT |

**Sales thesis (draft for guide lock):** “Ask your service documentation — get **cited** answers from a production-shaped hybrid RAG stack.” Calm category: fixtures demo for the public clone; not a shop SaaS; not OEM redistribution; PolyForm-NC ≠ OSI open source.

### Chat locks to reuse (2026-07-31 portfolio README session)

- Capability / vision / **sales-first** (not apology-limits lead)  
- Claim hygiene as **calm category framing**, not deficiency chorus  
- Borrow Eyeglass narrative shape; no invented GenAI lift metrics  
- Proof: prefer real product UI when honest (Mechanic already has fixture ask screenshots) — refresh after UI banner fix  
- Deeper honesty (CE freeze-by-override, n=44 delta 0) lives in Deeper docs / INTERVIEW — not the emotional lead  
- LinkedIn CTA one-liner OK; no pricing on LinkedIn  

### Story order (proposed — same skeleton as AG / AI KB)

Title → outcome hook → **one calm category sentence** → proof strip (ask UI + citations) → Problem → How it works (mermaid) → **3 key engineering decisions** → Try it (short) → Stack → Deeper docs → LinkedIn CTA  

**Draft hook / category (for Tom lock in Write guide):**

- **Hook:** Cited answers from automotive service docs — hybrid RAG (vector + lexical → RRF → cross-encoder).  
- **Category:** Public clone uses synthetic Honda S2000 fixtures; personal garage stays local. PolyForm-NC — source-available / non-commercial (not OSI open source).

**Draft three engineering decisions (for guide lock):**

1. **Fixtures vs private garage split** — stranger path = `fixtures/` + fail-closed check; private Gold / garage via explicit env roots (never OEM in git).  
2. **Hybrid → RRF → section dedup → CE with degrade** — retrieval spine stays useful if CE fails (`rerank_degraded`).  
3. **Eval-backed ranking honesty** — CE kept in stack by freeze-override; **no** earned citation-lift claim (n=44 delta 0) — depth in INTERVIEW / MODEL_FREEZE_STATUS.

---

## Acceptance criteria

- [ ] Tom locks open decisions below (visibility timing, garage-golden disposition, Featured strategy, UI banner + screenshot refresh)  
- [ ] Implementation guide written covering: pre-flip safety, README sales-first, UI chrome, GitHub metadata, visibility flip, LinkedIn/pin/profile README, SSOT Align  
- [ ] Before visibility → Public: `public_fail_closed.py fixtures` green; no secrets; garage-OEM disposition executed per lock  
- [ ] README first screen matches sales-first locks; no “not portfolio-complete” on public UI chrome or committed demo thumbs  
- [ ] Repo public; description + topics set; GitHub pin + profile README blurb; LinkedIn Featured plan executed (human UI)  
- [ ] Living SSOT (skills §14, hub pointer, this context) match reality — no stale “4 public repos” / “Mechanic private park” after ship  
- [ ] No invented CE lift / OSI open-source / Drive-as-ingest claims  

---

## In scope

- GitHub **visibility** flip (private → public) after safety gates  
- Sales-first README restructure (+ collapse operator ablation into GETTING_STARTED)  
- UI header / meta copy that still says “not portfolio-complete” / apology-stack  
- Re-capture fixture-only demo PNGs after UI copy fix (if banner text is in current thumbs)  
- GitHub description, topics, homepage (if any); pin; profile README project blurb  
- LinkedIn Featured (+ thumb) plan — human publishes  
- Pre-flip: fail-closed re-run; secret / path scan; garage golden disposition  
- Thin VISION / PUBLIC_FLIP / GETTING_STARTED honesty Align so “public flip” language distinguishes **packaging Met** vs **visibility Met**  
- custom_resumes §14 + hub pointer updates  

## Out of scope

- Earned CE lift / ranking redesign / second-vehicle PATH_TO_30  
- Dual-product Done / friend Drive → Mechanic ingest  
- Username rename  
- Changing LinkedIn About / Services / Top skills (already locked)  
- MIT license change  
- Hosted Vercel demo requirement  
- Bulk rewriting every historical Guide 02–15 dated note  

---

## Prior art (paths only)

| Path | Role |
|------|------|
| `mechanic_rag/docs/VISION.md` | Product / portfolio slot SSOT |
| `mechanic_rag/docs/PUBLIC_FLIP_CHECKLIST.md` | Packaging gates (Guide 10b Met ≠ visibility) |
| `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md` | Closed packaging flip |
| `mechanic_rag/README.md` | Current apology-first storefront |
| `mechanic_rag/GETTING_STARTED.md`, `INTERVIEW.md`, `LICENSE` | Operator + FAQ + PolyForm-NC |
| `mechanic_rag/web/src/app/page.tsx` | UI banner: “not portfolio-complete” |
| `mechanic_rag/docs/assets/demo/*.png` | Fixture ask proof (needs re-shot if banner changes) |
| `mechanic_rag/scripts/checks/public_fail_closed.py` | Pre-flip gate (OK on fixtures 2026-07-31) |
| `mechanic_rag/evals/golden_garage_v1.json` | **Risk:** documents intentional OEM substrings |
| `alphaguard/README.md`, `ai-knowledge-base-public/README.md`, `eyeglass_finder/README.md` | Sales-first pattern references |
| `custom_resumes/docs/dev_guides/2026-07-31_dev_guide_portfolio_readme_sales_first.md` | Story-order + claim hygiene locks |
| `custom_resumes/docs/2026-07-30_linkedin_skills_strategy.md` §14 | Pins / Featured / public inventory |
| `custom_resumes/docs/2026-07-30_profile_positioning_doctrine.md` | Strategic surface rules |
| `second_brain/docs/2026-07-30_portfolio_zoom_out_resume_context_summary.md` | D4 park public flip (supersede after this slice) |

---

## Risks and blast radius

| Risk | Blast radius | Mitigation |
|------|--------------|------------|
| **Garage golden OEM substrings go public** | Legal / brand / OEM policy | **Open decision** — scrub, move private-only, or explicit rights framing before flip |
| Private garage trees accidentally committed | OEM leak | `.gitignore` already lists `/mechanic_garage/` etc.; re-scan `git ls-files` before flip |
| Apology UI + README undercut sales-first | Recruiter bounce | Rewrite chrome + README; re-capture thumbs |
| Confusing Guide 10b “public flip Met” with visibility | Doc drift | Align language: packaging vs visibility |
| Featured overcrowding (5th link) | Attention split | Open decision — add vs replace |
| Claiming CE lift after flip | Interview kill | Keep freeze-override honesty in Deeper docs only |
| PolyForm-NC mistaken for MIT/OSI | Compliance | Calm LICENSE line like AlphaGuard |
| Friend/LEMON conflation | Wrong product story | Never imply Drive library is Mechanic ingest |

---

## Edge cases

- Fail-closed green today ≠ green after garage disposition edits — re-run before flip  
- Stranger clone still needs Docker + Ollama + pnpm — Try it stays short; GETTING_STARTED owns footguns  
- Screenshots must remain `fixture:honda-s2000-demo` only (no `cat:*`)  
- Profile README currently lists 3 projects — adding Mechanic requires blurb consistency with repo description  
- GitHub allows only **6 pins** — currently 3 product pins; adding Mechanic is fine  

---

## Locked decisions (Tom — 2026-07-31)

| # | Lock | Summary |
|---|------|---------|
| 1 | **A** | One Implement: safety → storefront → visibility → LinkedIn |
| 2 | **A expanded** | Remove private-garage eval set from tip + gitignore + docs; **history purge before public** (includes `golden_garage_v1`, garage last_run summary, m2 diagram stubs, m3 vision garage goldens — re-scan in Ready) |
| 3 | **A** | Featured + pin Mechanic; keep AI KB |
| 4 | **A** | UI chrome rewrite + re-capture both demo PNGs |
| 5 | **A** | Real fixture UI proof shots |

Pros/cons for each lock are recorded in the implementation guide decision record.

## Unknowns (remaining)

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Exact force-push timing for history purge | Ready check + Tom approve force-push while still private | Yes before visibility |
| Whether additional `evals/golden_m3_vision_stubs*` need purge | Ready scan for `cat:` / OEM | Soft |

## Recommended approach (post-Refine)

1. **Ready check before code** (numeric Implement readiness).  
2. **Implement / Build Go** only after Ready Met + Tom auth.  
3. Order binding: corpus+history → **stranger_smoke** → UI+Featured-grade shots → README → metadata → visibility → LinkedIn/SSOT.

**Write / Critical / Refine guides?** **Met** — see implementation guide bar-raising package.

## Refine locks (Tom — 2026-07-31)

| ID | Lock |
|----|------|
| **R1** | Thin `scripts/stranger_smoke.sh` in this Implement (Try-it → ~9.0) |
| **R2** | Featured-grade screenshot capture brief binding |
| **R3** | Hosted live demo / Loom **parked** (honest ceiling on Try-it/Conversion) |

## Open decisions (human)

None material — R1–R3 locked with decisions 1–5. Implement still gated on Ready + Build Go.

## Evidence opened this pass

- Gather evidence retained; Write pass also scanned `evals/golden*.json` for `cat:` / OEM rights (`golden_m2_diagram_stubs_v1`, `golden_m3_vision_v1` added to purge set)  
- Implementation guide authored (no code changes)

## Critical review (2026-07-31) — staff scrutiny before Ready / Implement

**Artifacts:** implementation guide · this context · current README/UI · AG/AI KB/Eyeglass sales-first locks · skills §14  

**Verdict:** Plan is sound and aligned with the LinkedIn→GitHub sales-first doctrine. Main risks are operational (history purge, screenshot re-capture), not conceptual. Smallest copy remediations applied to the guide; **do not Implement yet**.

### Ranked findings

| Pri | Finding | Evidence | Remediation |
|-----|---------|----------|-------------|
| P0 | History purge before visibility is load-bearing | Lock #2; OEM/`cat:` evals in tip today | Keep stop-the-line in guide (already); Ready must verify purge plan |
| P1 | Category sentence packed license + fixtures (heavier than AG) | Draft cat 149 chars vs AG 114 | **Applied:** license → Deeper docs / footer; category = fixtures/garage only |
| P1 | UI primary still said “Fixture-backed ask demo” (operator noun) | Guide UI draft | **Applied:** outcome-first “Ask service docs — get cited answers” |
| P1 | Featured order unspecified → clutter risk | Lock #3 add 5th card | **Applied:** recommended Featured order in guide |
| P2 | `golden_m3_vision_stubs` is fixture-based — must not be purged with garage set | `fixture:honda-s2000-demo` in stubs | **Applied:** keep unless Ready finds `cat:` |
| P2 | Five Featured cards vs three pins optics | LinkedIn vs GitHub | Accept; pins stay eng-focused; Featured can carry profile+4 products |
| — | Strong: corpus fail-closed, clear slot vs AI KB, real UI proof, PolyForm-NC parity with AG | VISION + Guide 10b + demo PNGs | Keep |

### Decision flags

- No reopen of locks 1–5.  
- Tip-only OEM residual risk remains **explicitly discouraged** (default purge).  
- No new work item for ranking/CE lift.

### Smallest remediation set

Docs-only guide edits above — **done in Critical review**. No code. No visibility flip.

---

## Presentation scorecard — honesty correction (Ready check)

**Prior Refine 9.0–9.5 / overall 9.2–9.4 targets were inflated** (aspirations ≠ earned). Corrected bands live in the implementation guide.

| Fact | Score |
|------|------:|
| **Earned today** (cold LinkedIn→GitHub) | **~3** |
| **Honest projected overall after this slice** | **8.0–8.7** |
| **Rejected inflated overall** | ~~9.2–9.4~~ |

R1–R3 upgrades remain worth doing; they do **not** buy automatic 9.5s. Review after Implement must use deflated bands.

### Ready-check Implement readiness

**Overall 8.5/10 — READY for Implement** after Tom Build Go. See guide Ready section for per-track scores. No coding in Ready stage.

---

## Honest readiness

- **Gather / Write / Critical / Refine / Ready-check:** Met  
- **READY for Implement?** **Yes** — await Tom **Implement** / **Build Go**  
- **Do not** treat presentation as 9.x until Review grades shipped artifacts

## Next stage

Await Tom **Implement** / **Build Go**. Then Implement per guide; Review grades with deflated bands.
