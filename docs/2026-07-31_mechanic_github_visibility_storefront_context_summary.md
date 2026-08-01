# Context: Mechanic RAG — GitHub visibility public + sales-first storefront

**Date:** 2026-07-31  
**Repos:** `mechanic_rag` (primary)  
**Also:** `custom_resumes` (LinkedIn / career SSOT), `second_brain` (hub pointer), profile README `Alpha-W0lf/Alpha-W0lf`  
**Status:** Gather Met — ready for Refine or Write implementation guide after Tom locks open decisions  
**Mode last used:** multi-repo  
**Stage:** Gather context  

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

## Unknowns

| Unknown | How to resolve | Blocking? |
|---------|----------------|-----------|
| Exact LinkedIn Featured UI capacity / which link to demote if needed | Tom decides Featured strategy | Yes for LinkedIn publish |
| Whether garage golden OEM substrings are acceptable under PolyForm-NC public | Tom legal/comfort lock | **Yes for visibility flip** |
| Whether Tom wants visibility flip in same Implement as README or after Review of storefront | Tom lock on sequencing | Soft — recommend storefront+safety first, then flip in same guide |

---

## Recommended approach

1. **Lock open decisions** (chat) — especially garage goldens + Featured.  
2. **Write implementation guide** (multi-repo): safety → UI banner → README sales-first → metadata → visibility flip → LinkedIn/pin/profile → SSOT.  
3. **Ready check** with fail-closed + secret scan + screenshot plan.  
4. **Implement** only after Ready + Tom Build Go.  
5. Do **not** flip visibility while UI still says “not portfolio-complete” or while garage-OEM disposition is unresolved.

**Write dev guide next?** **Yes** — after Tom locks the open decisions (or explicitly parks garage disposition with a chosen option). Not trivial: visibility + storefront + legal corpus edge + LinkedIn multi-surface.

---

## Open decisions (human)

### 1) GitHub visibility flip — when?

- **In plain terms:** Make `mechanic_rag` public on GitHub so Featured/pins work.  
- **Options:** (A) Same Implement after storefront+safety green · (B) Storefront first while private, flip in a second thin slice · (C) Flip immediately then polish  
- **Recommendation:** **(A)** — one guide, ordered steps: safety → copy/UI → flip → LinkedIn.  
- **Reasoning:** Public apology UI is worse than private; flipping dirty creates lasting first impressions in Google/GitHub cache.  
- **Tradeoffs:** Slightly larger slice vs two sessions; avoids a public “not portfolio-complete” window.

### 2) `evals/golden_garage_v1.json` OEM substrings

- **In plain terms:** This tracked file says it contains short OEM torque/procedure strings for private garage eval. Public flip would publish them.  
- **Options:** (A) Remove from git / gitignore + document private-only eval · (B) Scrub to synthetic paraphrases · (C) Keep with explicit “short quotes / fair use / owned vehicles” honesty (higher risk)  
- **Recommendation:** **(A)** or **(B)** — prefer **(A)** if private eval can live only on your machine; **(B)** if you need CI without OEM bytes.  
- **Reasoning:** Fixtures-only public story must stay legally clean; Guide 10b spirit is no OEM in public corpus.  
- **Tradeoffs:** (A)/(B) cost a small eng pass; (C) is fastest but weakest under hostile reading.

### 3) LinkedIn Featured + GitHub pin

- **In plain terms:** How Mechanic appears next to AG / AI KB / Eyeglass.  
- **Options:** (A) Add as 5th Featured + 4th pin · (B) Replace AI KB Featured (keep AI KB public/pin only) · (C) Pin on GitHub only; Featured later  
- **Recommendation:** **(A)** — Mechanic is the domain product-RAG proof; AI KB remains the agent-knowledge/MCP proof. Different slots.  
- **Reasoning:** Chat sales-first work already positioned three publics; Mechanic fills the missing “citations over real domain docs” story.  
- **Tradeoffs:** More Featured noise vs incomplete RAG story on LinkedIn.

### 4) UI banner + demo screenshot refresh

- **In plain terms:** `page.tsx` still shows “Deliberate vertical slice; not portfolio-complete,” and that text is in `ask-outcome.png`.  
- **Options:** (A) Rewrite chrome to sales-first + re-capture both demo PNGs in same slice · (B) README-only; leave UI apology (not recommended)  
- **Recommendation:** **(A)**  
- **Reasoning:** Thumbs and live UI are the Featured proof; README alone cannot fix a contradictory screenshot.  
- **Tradeoffs:** Small Next copy change + screenshot ops vs inconsistent storefront.

### 5) Proof strip style

- **In plain terms:** Designed card (like AG) vs real ask UI screenshots (like Eyeglass).  
- **Options:** (A) Real fixture UI shots (after banner fix) · (B) Designed pipeline card · (C) Both  
- **Recommendation:** **(A)** primary — real product UI is stronger for Mechanic; optional thin designed card later if thumbs need brand match.  
- **Reasoning:** You already earned C2/B4 fixture screenshots; sales-first wants proof of the product, not a second abstract diagram.  
- **Tradeoffs:** UI shots need env to re-capture; designed cards are faster but less concrete.

---

## Evidence opened this pass

- `docs/VISION.md`, `README.md`, `PUBLIC_FLIP_CHECKLIST.md`, Guide 10b header  
- `web/src/app/page.tsx` (banner lines ~131–136)  
- `docs/assets/demo/ask-outcome.png` (contains “not portfolio-complete”)  
- `python3 scripts/checks/public_fail_closed.py fixtures` → **OK / exit 0**  
- `gh repo view Alpha-W0lf/mechanic_rag` → **private**, empty description, no topics  
- `evals/golden_garage_v1.json` header — OEM substring rights note  
- `.gitignore` garage path ignores present  
- Sales-first guide + AG/AI KB README heads; skills strategy §14 public inventory  
- Zoom-out D4 “park public flip” (to supersede after this work item)

---

## Honest readiness

- **Gather:** Met for planning depth.  
- **Ready for Write implementation guide?** **Yes, after Tom locks decisions 1–5** (minimum: **#2 garage goldens** and **#1/#3** sequencing/Featured).  
- **Ready for Implement / visibility flip?** **No** — not until guide + Ready check + Build Go; garage disposition unresolved.

---

## Next stage

**Tom:** lock open decisions (recommend A / A-or-B / A / A / A).  
**Then:** **Write implementation guide** for this work item (update this context on Refine if needed).
