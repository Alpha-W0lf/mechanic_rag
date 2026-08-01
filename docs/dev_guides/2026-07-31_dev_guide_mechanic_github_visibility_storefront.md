# Implementation guide: Mechanic RAG — GitHub visibility public + sales-first storefront

**Date:** 2026-07-31  
**Work item:** Mechanic GitHub visibility public + sales-first storefront  
**Repos:** `mechanic_rag` (primary) · `custom_resumes` · `second_brain` · profile README `Alpha-W0lf/Alpha-W0lf`  
**SSOT context:** [`../2026-07-31_mechanic_github_visibility_storefront_context_summary.md`](../2026-07-31_mechanic_github_visibility_storefront_context_summary.md)  
**Status:** Critical review **Met** (2026-07-31) — guide remediations applied; Ready check next; **no Implement**  
**Stage that authored this:** Write implementation guide  
**Prerequisite:** Gather Met; Tom locked decisions 1–5 (2026-07-31)

---

## Objective

Make Mechanic RAG a first-class public portfolio surface on the LinkedIn → GitHub path: **safe corpus**, **sales-first presentation**, **GitHub public visibility**, then **pin + Featured + profile README** — consistent with AlphaGuard / AI KB public / Eyeglass, without inventing CE lift, OSI open-source, or Drive-as-ingest claims.

---

## Locked decisions (Tom — 2026-07-31)

| # | Decision | Lock |
|---|----------|------|
| 1 | Visibility timing | **A** — one Implement: safety → storefront → flip → LinkedIn |
| 2 | Private garage eval / OEM | **A (expanded)** — remove private-garage eval artifacts from git tip + gitignore + docs; **history purge before visibility public** (see §A) |
| 3 | Featured + pin | **A** — add Mechanic as Featured + GitHub pin; keep AI KB |
| 4 | UI banner + screenshots | **A** — rewrite chrome + re-capture both demo PNGs |
| 5 | Proof strip | **A** — real fixture ask UI shots (not designed card first) |

**Expanded lock #2 (binding):** Tip removal alone is **not** enough for a private→public flip: git history becomes public. Before `gh repo edit --visibility public`, purge private-garage eval blobs from history (or stop and get Tom’s written acceptance of tip-only residual risk — default is **purge**).

**Private-garage eval set (minimum remove from tip + history):**

- `evals/golden_garage_v1.json` (OEM substring rights note + `cat:*`)  
- `evals/last_run_summary_garage_v1.json`  
- `evals/golden_m2_diagram_stubs_v1.json` (`cat:*` / private garage notes)  
- `evals/golden_m3_vision_v1.json` (`cat:*` / private garage notes)  

Keep public fixture goldens (e.g. `evals/golden_fixture_v1.json`, `evals/golden_m3_vision_stubs_v1.json` if still `fixture:`-only). Re-scan `evals/` in Ready/Implement for any other `cat:` / OEM-rights files before flip.

---

## Locked storefront copy (use unless Implement finds a stronger equivalent)

**Hook:** Cited answers from automotive service docs — hybrid RAG (vector + lexical → RRF → cross-encoder).

**Category sentence:** Public clone uses synthetic Honda S2000 fixtures; personal garage stays local.

**License line (Deeper docs / Stack footer — not the emotional lead):** PolyForm Noncommercial 1.0.0 — source-available / non-commercial (not OSI open source). Same calm pattern as AlphaGuard.

**Three engineering decisions (binding titles):**

1. **Fixtures vs private garage split** — stranger path = `fixtures/` + fail-closed; private Gold/garage via explicit env roots; no OEM in public git.  
2. **Hybrid → RRF → section dedup → CE with degrade** — spine stays useful if CE fails.  
3. **Eval-backed ranking honesty** — CE kept by freeze-override; **no** earned citation-lift claim (n=44 delta 0) — depth in INTERVIEW / `evals/MODEL_FREEZE_STATUS.md`.

**UI header (replace apology lines in `web/src/app/page.tsx`):**

- Primary (outcome-first): Ask service docs — get **cited** answers from hybrid RAG.  
- Secondary (calm category): Public clone uses synthetic fixtures only; multimodal opt-in locally.  
- **Forbidden on public chrome / committed thumbs:** “not portfolio-complete”, “deliberate vertical slice” as lead framing, deficiency chorus, “demo” as the hero noun.

**GitHub description (draft):**  
`Cited answers from automotive service docs — hybrid RAG (vector + lexical → RRF → CE). Synthetic fixtures for the public clone.`

**Topics (draft):** `rag` `hybrid-search` `pgvector` `nextjs` `ollama` `citations` `evals` `portfolio` `polyform-noncommercial`

**Profile README blurb (draft):**  
**[Mechanic RAG](https://github.com/Alpha-W0lf/mechanic_rag)** — Cited answers from service docs: hybrid RAG → RRF → cross-encoder (fixtures-only public demo).

**LinkedIn Featured order (recommendation for Tom UI):** Place Mechanic with the other engineering proofs — suggested card order after publish: GitHub profile · Mechanic RAG · AlphaGuard · AI KB · Eyeglass (or Mechanic immediately after AI KB). Do **not** demote AI KB.

---

## References (paths only)

| Path | Role |
|------|------|
| Context SSOT | `docs/2026-07-31_mechanic_github_visibility_storefront_context_summary.md` |
| Product truth | `docs/VISION.md`, `docs/ARCHITECTURE.md` |
| Current storefront | `README.md`, `GETTING_STARTED.md`, `INTERVIEW.md`, `LICENSE` |
| Packaging flip (≠ visibility) | `docs/PUBLIC_FLIP_CHECKLIST.md`, Guide 10b |
| UI | `web/src/app/page.tsx`, `web/src/app/layout.tsx` |
| Demo assets | `docs/assets/demo/` |
| Fail-closed | `scripts/checks/public_fail_closed.py` |
| Sales-first pattern | `alphaguard/README.md`, `ai-knowledge-base-public/README.md`, `eyeglass_finder/README.md` |
| Career SSOT | `custom_resumes/docs/2026-07-30_linkedin_skills_strategy.md` §14 |
| Hub | `second_brain/docs/2026-07-30_hub_pointer_lowd_code_c2c_initiative.md` |

---

## Architecture / documentation constraints (binding)

1. **Story order (README):** Title → hook → category sentence → proof strip (ask + citations PNGs) → Problem → How it works (mermaid) → 3 decisions → Try it (short) → Stack → Deeper docs → LinkedIn CTA.  
2. **Sales-first:** No apology/status wall in the first screen. Claim hygiene = calm category framing.  
3. **Guide 10b packaging Met ≠ GitHub visibility.** After flip, living docs must say **visibility public** distinctly.  
4. **No CE lift / OSI open-source / Drive-as-ingest / dual-product Done** claims on storefront.  
5. **DRY:** Move paired-ask ablation encyclopedia from README into GETTING_STARTED (link only).  
6. **Secrets / OEM:** No `.env`, home paths, OEM PDFs, or private-garage goldens in public tip **or** history (default).  
7. **Screenshots:** `fixture:honda-s2000-demo` only; re-capture after UI copy change.  
8. **LICENSE:** Do not rewrite PolyForm-NC.  
9. **Prefer ≤~150–200 lines** README body.  
10. **No app ranking/eval redesign** — storefront + corpus hygiene + visibility only.

---

## Ordered steps (Implement — after Ready + Build Go)

### A. Safety / corpus (before any visibility change)

1. Pull latest `main` on `mechanic_rag`; confirm working tree intent.  
2. Re-run `python3 scripts/checks/public_fail_closed.py fixtures` — must exit 0.  
3. Inventory private-garage eval files (`cat:`, OEM rights notes); confirm minimum set above; expand if Ready finds more.  
4. `git rm` (or equivalent) private-garage eval files from tip; add patterns to `.gitignore` (e.g. `evals/golden_garage*.json`, `evals/last_run_summary_garage*.json`, and other private patterns Ready lists).  
5. Update living operator docs that teach those paths as if public: `GETTING_STARTED.md`, `evals/PATH_TO_30.md` — state private-local only / out of public clone. Do **not** rewrite closed historical guide Met checkboxes into false “never shipped”; add a short honesty note that public tip no longer carries garage goldens.  
6. **History purge (default):** Using `git filter-repo` (or Tom-approved equivalent), remove purged paths from **all** commits on the branch that will be public. Coordinate force-push with Tom (private repo still — safer window). Verify `git log --all -- <path>` empty for purged paths.  
7. Secret scan tip + sample history for `/Users/tom`, API keys, `.env` bodies.  
8. **Stop-the-line:** Do not proceed to visibility public if purge skipped without Tom’s explicit tip-only risk acceptance recorded in context.

### B. UI chrome (sales-first)

9. Edit `web/src/app/page.tsx` header: remove “not portfolio-complete” / vertical-slice apology; apply locked UI copy.  
10. Align `web/src/app/layout.tsx` `metadata.description` with sales-first (fixtures + hybrid RAG).  
11. Run focused web tests if present (`cd web && pnpm test` or existing smoke).  
12. Boot fixture ask path; re-capture `docs/assets/demo/ask-outcome.png` and `citations-scannable.png` (fixture vehicle only); update `c2_b4_evidence.json` if required by existing polish contract.  
13. Confirm new PNGs do **not** contain apology banner text or home paths (`strings` + visual check).

### C. README sales-first

14. Rewrite root `README.md` to locked story order + copy.  
15. Lead proof with re-captured demo PNGs (not designed card).  
16. Mermaid with product nouns (Ask → Retrieve hybrid → Fuse RRF → Rerank CE → Cited answer).  
17. Short Try it; link GETTING_STARTED for ablation / footguns.  
18. Deeper docs: VISION, ARCHITECTURE, INTERVIEW, MODEL_FREEZE_STATUS, PUBLIC_FLIP_CHECKLIST, LICENSE.  
19. One-line LinkedIn CTA (`https://www.linkedin.com/in/tchacko1/`).  
20. Grep README first screen for apology-stack / “not portfolio-complete” — zero hits.

### D. Thin honesty Align (living docs)

21. `docs/VISION.md` — clarify **packaging public-flip Met (Guide 10b)** vs **GitHub visibility public (this slice)** when visibility lands.  
22. `docs/PUBLIC_FLIP_CHECKLIST.md` — add visibility row or banner note (packaging ≠ visibility).  
23. `GETTING_STARTED.md` — stranger path unchanged in spirit; private garage eval instructions → local-only.  
24. Optional thin INTERVIEW cross-link if it still implies garage goldens ship in public tip.

### E. GitHub metadata + visibility

25. Set description + topics (drafts above; refine if needed).  
26. Confirm tip clean, fail-closed green, history purge done (or tip-only waiver recorded).  
27. `gh repo edit Alpha-W0lf/mechanic_rag --visibility public` (or GitHub UI). Confirm `isPrivate=false`.  
28. Verify clone URL works anonymously / logged-out sanity if possible.

### F. Portfolio surfaces (LinkedIn / profile)

29. GitHub pin Mechanic (Tom UI or API).  
30. Update `Alpha-W0lf/Alpha-W0lf` README Featured projects blurb (draft above).  
31. LinkedIn Featured: add Mechanic + thumb (use ask-outcome or citations shot) — **Tom human publish**; keep AG / AI KB / Eyeglass.  
32. Update `custom_resumes/docs/2026-07-30_linkedin_skills_strategy.md` §14 inventory (5th public product repo; Featured/pin Met).  
33. Update hub pointer + zoom-out supersession if still saying “park public flip”.  
34. Update this context acceptance checkboxes; mark Implement Met when done.

### G. Verify + ship commits

35. Secret scan; commit with clear messages on all touched repos; push (force-push only if history purge requires it — **Tom-approved**, private window preferred).  
36. Post-push: `gh repo view` public; README renders; demo images load.

---

## Definition of Done / verification

- [ ] Fail-closed fixtures green after corpus changes  
- [ ] Private-garage eval artifacts absent from tip **and** history (or tip-only waiver recorded)  
- [ ] UI + demo PNGs have no “not portfolio-complete”  
- [ ] README follows sales-first story order; ≤~200 lines; no CE-lift / OSI theater  
- [ ] Repo **public**; description + topics set  
- [ ] Pin + profile README + LinkedIn Featured plan executed (human Featured OK)  
- [ ] Living SSOT (skills §14, hub, context, VISION visibility language) match reality  
- [ ] No secrets / OEM PDFs / absolute home paths in new assets  

---

## Blast radius and risks

| Risk | Mitigation |
|------|------------|
| OEM garage goldens in history after public flip | History purge before visibility (lock #2) |
| Public apology UI cached | UI + screenshots before flip (lock #1/#4) |
| Force-push mistakes | Purge while still private; Tom approves force-push |
| Featured overcrowding | Locked keep AI KB; accept 5 Featured |
| Doc drift Guide 10b vs visibility | Explicit Align language |
| Breaking local garage workflow | Gitignore + local copy instructions in GETTING_STARTED |

---

## Edge cases

- Directory `mecharag eval --golden evals/` loads first `golden*.json` — after removals, ensure fixture golden still resolves; document explicit path.  
- `golden_m3_vision_stubs_v1.json` — if Ready finds `cat:`/OEM, treat as private set too.  
- Screenshot env down — do not flip with old apology thumbs; Ready blocks.  
- LinkedIn Featured UI quirks — agent prepares assets + copy; Tom publishes.  

---

## Explicit non-goals

- Ranking / CE lift unlock  
- Dual-product / Drive ingest  
- MIT license  
- Username rename  
- Rewriting every historical Guide 11–15 Met note body  

---

## Critical review record (2026-07-31)

**Verdict:** Guide is strong enough to enter Ready check after small copy remediations (applied above). Do **not** Implement until Ready + Build Go. Biggest residual risk remains history purge discipline — already gated.

**Remediations applied this Critical review (docs-only):** split license out of category sentence; outcome-first UI primary copy; Featured order note; keep fixture `golden_m3_vision_stubs` unless Ready finds `cat:`.

See context SSOT for full ranked findings + projected presentation scorecard.

## Implement authorization

**Do not implement until:**

1. **Ready check before code** Met on this guide, and  
2. Tom says **Implement** or **Build Go**.

This file alone is not Implement authorization.

---

## Decision record (pros / cons — locked)

### 1) Visibility timing — **A locked**

| | Pros | Cons |
|---|------|------|
| **A one slice** | No public dirty window; one SSOT ship | Larger Implement |
| B two slices | Smaller first PR | Extra session; still private for LinkedIn |
| C flip first | Fastest “public” checkbox | Worst: apology UI + OEM goldens visible |

### 2) Garage OEM evals — **A + history purge locked**

| | Pros | Cons |
|---|------|------|
| **A remove + purge** | Clean fixtures-only public story | Force-push discipline; local re-copy for garage evals |
| B scrub synthetic | Keeps file shapes in CI | Easy to leave OEM residue; still may need purge |
| C keep + disclaimer | Least eng work | Weak under hostile OEM/legal reading |

### 3) Featured + pin — **A locked**

| | Pros | Cons |
|---|------|------|
| **A add Mechanic** | Domain RAG + agent RAG both visible | More Featured cards |
| B replace AI KB | Cleaner Featured count | Hides MCP/agent-knowledge proof |
| C pin only | Low LinkedIn work | Cold LinkedIn traffic still misses Mechanic |

### 4) UI + screenshots — **A locked**

| | Pros | Cons |
|---|------|------|
| **A fix + re-shot** | Thumbs match sales-first | Needs local Next/fixture boot |
| B README only | Faster | Featured thumb contradicts README |

### 5) Proof style — **A locked**

| | Pros | Cons |
|---|------|------|
| **A real UI** | Concrete product proof | Capture ops |
| B designed card | Fast brand match | Weaker “it works” signal |
| C both | Maximum proof | Asset bloat this slice |
