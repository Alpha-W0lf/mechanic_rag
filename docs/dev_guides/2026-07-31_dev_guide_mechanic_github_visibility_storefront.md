# Implementation guide: Mechanic RAG — GitHub visibility public + sales-first storefront

**Date:** 2026-07-31  
**Work item:** Mechanic GitHub visibility public + sales-first storefront  
**Repos:** `mechanic_rag` (primary) · `custom_resumes` · `second_brain` · profile README `Alpha-W0lf/Alpha-W0lf`  
**SSOT context:** [`../2026-07-31_mechanic_github_visibility_storefront_context_summary.md`](../2026-07-31_mechanic_github_visibility_storefront_context_summary.md)  
**Status:** Implement **Met** (2026-07-31) — repo **public**; tip+history purge verified; storefront shipped. Human residual: GitHub pin + LinkedIn Featured. Next stage: **Review** (deflated bands).  
**Stage that authored this:** Write · Critical review · Refine-dev-guide · Ready check · Implement  
**Prerequisite:** Gather Met; decisions 1–5 + R1–R3 locked; score honesty correction in Ready check; Tom Build Go

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
**[Mechanic RAG](https://github.com/Alpha-W0lf/mechanic_rag)** — Cited answers from service docs: hybrid RAG → RRF → cross-encoder (synthetic fixtures for the public clone).

**Problem section (README — binding draft, 3–4 sentences):**  
Service manuals bury torque specs and procedures across sections and pages. Teams and owners still dig by hand. Mechanic RAG retrieves with **hybrid search**, fuses candidates (**RRF**), optionally reranks (**cross-encoder**), and returns an answer with **citations** (document, section, page). The public clone proves the product path on synthetic fixtures — not a notebook demo and not OEM redistribution.

**How this differs from AI Knowledge Base (one calm line in Deeper docs or end of Problem — not a dunk):**  
AI KB keeps **coding agents** current (RAG + MCP over AI notes). Mechanic is **product RAG over vehicle service docs** with citation-backed answers and a multi-vehicle catalog shape.

**LinkedIn Featured order (locked for Tom UI):** GitHub profile · **Mechanic RAG** · AlphaGuard · AI KB · Eyeglass. Do **not** demote AI KB. Featured thumb: prefer **citations-scannable** (citation proof) or ask-outcome if citations crop is weak.

**LinkedIn Featured title/subtitle paste (draft for Tom):**  
- Title: `Mechanic RAG — cited answers from service docs`  
- Description: `Service manuals bury torque specs and procedures across sections and pages. This system uses hybrid retrieval and ranking to return answers with citations you can check — document, section, page. Citation-backed RAG over vehicle service docs; public demo uses synthetic fixtures.`

**CTA (README close — match AG tone):**  
Building citation-backed document RAG for a real domain? Reach me on [LinkedIn](https://www.linkedin.com/in/tchacko1/).

---

## Presentation scores — honesty correction (Ready check 2026-07-31)

**Admission:** Prior Refine “targets” of **9.0–9.5+ / overall 9.2–9.4** were **inflated**. They mixed (a) aspirational ceilings, (b) checklist completion, and (c) unearned post-Implement grades. **Nothing in this table is earned until Implement + Review with cold-reader evidence.**

**Earned today (pre-Implement):** ~**3/10** overall for cold LinkedIn→GitHub (private repo, empty description, apology UI in live thumbs, garage OEM evals still tracked).

**Conservative projected band after full guide Implement** (not guaranteed; Review may score lower):

| # | Category | Inflated target (rejected) | **Honest projected band** | Why the lower band |
|---|----------|---------------------------:|--------------------------:|--------------------|
| 1 | First-screen sales posture | 9.5 | **8.5–9.0** | Craft must ship; 9.5 needs cold-reader Review, not checklist |
| 2 | Claim hygiene | 9.5 | **8.5–9.0** | Freeze-override / PolyForm nuance easily leaks into lead |
| 3 | Visual proof | 9.0–9.5 | **8.0–8.5** | Dark “internal tool” UI ≠ Eyeglass gallery punch even with good crops |
| 4 | Narrative structure | 9.5 | **8.5–9.0** | Structure can be excellent; prose execution varies |
| 5 | Portfolio-set consistency | 9.5 | **8.0–8.5** | Heavier stack than AI KB; Try-it will still feel longer |
| 6 | Discoverability | 9.5 | **8.5–9.0** | Public+pin+meta are mechanical; Featured is human/timing residual |
| 7 | Stranger Try-it clarity | 9.0 | **7.5–8.5** | R1 script helps a lot; still Docker+Ollama+pnpm+Next after it — not AG `make smoke` |
| 8 | Legal / corpus safety | 9.5 | **8.5–9.5** | **9.5 only if** tip+history purge verified; else ≤8 if tip-only |
| 9 | Slot differentiation | 9.5 | **8.5–9.0** | One vs-AI-KB line is enough for ~9; not automatic 9.5 |
| 10 | Conversion readiness | 9.0–9.2 | **7.5–8.5** | Clone-only + CTA; no live URL; Eyeglass has live galleries |
| | **Overall** | 9.2–9.4 | **8.0–8.7** | Honest staff band for this slice without hosted demo |

**True 9.5+ in Try-it or Conversion:** still requires later hosted demo/Loom (**R3 parked**) — do not chase with theater.

### Refine locks (Tom — 2026-07-31, agreed) — upgrades kept; score promises corrected

| ID | Lock | Pros | Cons |
|----|------|------|------|
| **R1** | Thin **stranger smoke script** (preflight → compose → ingest → fail-closed → print Next steps) | Real Try-it lift (~+0.5–1.0 vs no script) | Still not one-command ask; maintenance |
| **R2** | **Screenshot capture brief** binding | Needed so thumbs stop apologizing | Does not make UI Eyeglass-level |
| **R3** | **Hosted live demo / Loom parked** | Avoids fake deploy | Caps Try-it/Conversion |

**Do not** invent CE lift, hosted Vercel, or OEM corpus to chase scores.

### Forbidden first-screen / thumb phrases (DoD grep)

`not portfolio-complete` · `vertical slice` · `Not earned` · `Not dual-product` · `Tom override` · `helps=0` · `interview lab` · hero use of `demo` as the product noun (fixtures framing in category sentence is OK)

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
10. **No app ranking/eval redesign** — storefront + corpus hygiene + visibility + thin stranger-smoke script only.  
11. **No hosted demo / Loom** this slice (R3 park).  
12. README first screen must pass forbidden-phrase grep (see bar-raising package).

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

### B. Stranger smoke (R1 — Try-it lift toward ~8.0–8.5, not 9.0)

9. Add thin `scripts/stranger_smoke.sh` (executable): preflight `docker` + `ollama` (clear errors), `docker compose up -d`, ensure `web/.env.local` from `.env.example` if missing, `mecharag ingest --source fixtures` (venv/`uv` as repo already documents), `python3 scripts/checks/public_fail_closed.py fixtures`, print next commands for `pnpm` + health + one ask. **No** twin-process ablation. Prefer stdlib/bash; do not add heavy deps.  
10. Document script in README Try it (3–8 lines) + GETTING_STARTED pointer.

### C. UI chrome + Featured-grade capture (R2)

11. Edit `web/src/app/page.tsx` header: apply outcome-first locked UI copy; remove apology lines.  
12. Align `web/src/app/layout.tsx` `metadata.description` with sales-first.  
13. Run focused web tests if present (`cd web && pnpm test`).  
14. Boot fixture ask; capture **Featured-grade** PNGs per brief: answered torque question on `fixture:honda-s2000-demo`; citations panel visible in one shot; ~1200px wide; no apology banner; no home paths; minimize incidental IDE/browser chrome. Replace `ask-outcome.png` + `citations-scannable.png`; refresh `c2_b4_evidence.json` if required.  
15. `strings` + visual check on new PNGs.

### D. README sales-first (9.5 narrative / posture)

16. Rewrite root `README.md` to locked story order + Problem draft + vs-AI-KB calm line + CTA.  
17. Lead proof with re-captured PNGs (citations + ask).  
18. Mermaid product nouns (Ask → Hybrid retrieve → RRF fuse → CE rerank → Cited answer).  
19. Try it: stranger_smoke script first; link GETTING_STARTED for ablation / footguns.  
20. Deeper docs: VISION, ARCHITECTURE, INTERVIEW, MODEL_FREEZE_STATUS, PUBLIC_FLIP_CHECKLIST, LICENSE.  
21. Forbidden-phrase grep on README first screen + `page.tsx` header — zero hits.

### E. Thin honesty Align (living docs)

22. `docs/VISION.md` — clarify **packaging public-flip Met (Guide 10b)** vs **GitHub visibility public (this slice)** when visibility lands.  
23. `docs/PUBLIC_FLIP_CHECKLIST.md` — add visibility row or banner note (packaging ≠ visibility).  
24. `GETTING_STARTED.md` — stranger_smoke + private garage eval local-only.  
25. Optional thin INTERVIEW cross-link if it still implies garage goldens ship in public tip.

### F. GitHub metadata + visibility

26. Set description + topics (drafts above).  
27. Confirm tip clean, fail-closed green, history purge done (default — no tip-only waiver).  
28. `gh repo edit Alpha-W0lf/mechanic_rag --visibility public` (or GitHub UI). Confirm `isPrivate=false`.  
29. Verify clone URL / logged-out sanity if possible.

### G. Portfolio surfaces (LinkedIn / profile) — discoverability track

30. GitHub pin Mechanic.  
31. Update `Alpha-W0lf/Alpha-W0lf` README blurb (no “demo” hero noun).  
32. LinkedIn Featured: add Mechanic + **citations** thumb when possible — **Tom human publish**; locked card order; paste title/subtitle from this guide.  
33. Update `custom_resumes` §14 + LinkedIn draft changelog with Featured paste pack.  
34. Update hub pointer + zoom-out supersession.  
35. Update context acceptance checkboxes; mark Implement Met when done.

### H. Verify + ship commits

36. Secret scan; commit all touched repos; push (force-push only for history purge — **Tom-approved**, while still private).  
37. Post-push: public repo; README + images; stranger_smoke dry-run notes in Implement evidence.

---

## Definition of Done / verification

- [x] Fail-closed fixtures green after corpus changes  
- [x] Private-garage eval artifacts absent from tip **and** history (default: no tip-only waiver)  
- [x] `scripts/stranger_smoke.sh` exists, documented, runs preflight→ingest→fail-closed (or fails closed with clear errors)  
- [x] UI + demo PNGs pass capture brief + forbidden-phrase grep  
- [x] README follows sales-first story order; Problem + vs-AI-KB + CTA; ≤~160–200 lines; no CE-lift / OSI theater  
- [x] Forbidden-phrase grep clean on README lead + UI header  
- [x] Repo **public**; description + topics set  
- [ ] Pin + profile README + LinkedIn Featured (order + paste pack) executed — **profile README done**; pin + Featured = **Tom human** (no pin API)  
- [x] Living SSOT match reality  
- [x] No secrets / OEM PDFs / absolute home paths in new assets  

## Implement evidence (2026-07-31)

| Item | Evidence |
|------|----------|
| Tip purge | `git rm` garage goldens + gitignore patterns |
| History purge | `git filter-repo --invert-paths` on 4 paths; `git log --all -- <path>` = 0 each; force-push while private |
| Fail-closed | `python3 scripts/checks/public_fail_closed.py fixtures` → OK |
| Stranger smoke | `./scripts/stranger_smoke.sh` → OK (ensurepip bootstrap for pip-less venv) |
| UI / PNGs | Header outcome-first; Featured-grade 1200px S2000 answered torque; `c2_b4_evidence.json` refreshed |
| README | Sales-first rewrite; ablation → GETTING_STARTED |
| Visibility | `isPrivate=false`; description + topics set |
| Miata clarification | `fixture:demo-miata-nb` = Guide 12 PrivateGold **synthetic** in local DB only — **not** in public `fixtures/`, **not** personal fleet |
| Profile README | `Alpha-W0lf/Alpha-W0lf` includes Mechanic blurb |
| Human residual | Pin Mechanic + LinkedIn Featured add (paste pack in skills §14) |

## Ready check before code (2026-07-31)

### Evidence (commands / state)

| Check | Result |
|-------|--------|
| `public_fail_closed.py fixtures` | OK / exit 0 |
| Private garage evals still on tip | **Yes** — `golden_garage_v1`, m2 stubs, m3 vision (purge still Implement work) |
| `scripts/stranger_smoke.sh` | **Missing** (Implement) |
| GitHub visibility | **Private**; description empty |
| Guide / context / locks | Present; score inflation corrected this Ready |

### Implement readiness scores (0–10 — not inflated)

| Track | Score | Why not 10 |
|-------|------:|------------|
| Context ↔ guide alignment | **9** | Score honesty corrected; locks stable |
| Corpus / history purge plan | **8.5** | Steps clear; filter-repo/force-push still operational risk |
| Storefront copy / UI / shots | **8.5** | Drafts locked; zero pixels rewritten yet |
| Stranger smoke (R1) | **8** | Spec clear; script absent; env-dependent |
| LinkedIn / discoverability pack | **8.5** | Paste pack ready; human Featured residual |
| Blast radius / rollback | **8.5** | Visibility + force-push are hard to unwind socially |
| Edge cases / secrets / OEM | **9** | Fail-closed green; purge set listed; stubs keep rule |
| Presentation-score honesty | **9** | Deflated bands recorded; earned≠projected called out |
| **Overall Implement readiness** | **8.5** | Not 10: purge/force-push, screenshots, stranger_smoke, Featured are still ahead |

### Remaining refinements before Implement?

**None material** — do not re-inflate scores. Optional later (out of this Ready): hosted demo for true Try-it/Conversion 9.5.

### Verdict

**READY for Implement** — wait for Tom **Implement** / **Build Go**.  
**Do not start coding in this stage.**  
Post-Implement Review must grade presentation with the **deflated bands** (overall expect **~8.0–8.7**, not 9.2–9.4).  

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
- Hosted Vercel/Loom live demo (**R3 park** — needed for honest Try-it/Conversion **9.5+**)  
- Full UI redesign (capture + header copy only)  
- Rewriting every historical Guide 11–15 Met note body  

---

## Critical review record (2026-07-31)

**Verdict:** Guide is strong enough to enter Ready check after small copy remediations (applied above). Do **not** Implement until Ready + Build Go. Biggest residual risk remains history purge discipline — already gated.

**Remediations applied this Critical review (docs-only):** split license out of category sentence; outcome-first UI primary copy; Featured order note; keep fixture `golden_m3_vision_stubs` unless Ready finds `cat:`.

See context SSOT for ranked findings. Presentation scorecard was later **deflated** in Ready check (reject 9.2–9.4 overall).

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
