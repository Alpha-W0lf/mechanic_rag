# Soft query expansion — Opus planner brief (Job Hunt / JH-75)

**Status 2026-09-29:** The code is on `main` (PR #45). These two notes lived only on the laptop after GitHub deleted the feature branch. They are kept so the plan is not lost.

**Locked 2026-09-28 CT (Tom):** Soft query expansion ONLY. **No** extractive short-circuit / skip-Gemini when cites contain a number.

## Problem (verified)
Vague ask `how big is the engine?` on `cat:2003-honda-s2000` often returns `outcome=degraded` / `error_class=generator_unavailable` after free Gemini retries. Retrieval still returns service_manual cites, but top chunks can skew to design **dimensions** (overall length/width) rather than **displacement** (F20C cm³). Concrete ask `What is the engine displacement of the F20C?` usually `answered` quickly. Free-tier UX (#44) already explains Cited excerpts — this slice improves retrieval targeting, not UX theater.

## Goal
Add **soft** query expansion before embed + FTS retrieve:
- Keep the **user-facing question string unchanged** for generate prompt and UI.
- Derive expanded **retrieval terms** (append/boost) e.g. displacement / cm³ / cu in / F20C when the ask is vague size/capacity about the engine.
- Soft = do not hard-replace the question; prefer additive terms so unrelated asks are untouched.
- Deterministic rules preferred (no new LLM dependency for expand). No new heavy deps.

## Non-goals
- Extractive answer short-circuit
- Paid Gemini / generator reliability (separate)
- README marketing claim that “vague asks are solved”
- LinkedIn / resume edits

## Code touch (hypothesis — verify)
Primary: `web/src/server/ask.ts` — today `embedText(req.question)` and FTS use `req.question`. Likely introduce `expandQueryForRetrieval(question, vehicle_id?) -> { retrievalQuery, expansionsApplied }` used only for embed + lexical retrieve; generator still gets original `req.question` + context.
Tests: unit tests for expander; existing ask ranking/ablation tests must stay green; add cases for vague size vs concrete displacement vs unrelated brake ask (no expansion).

## Docs (careful, targeted — public-voice)
- Prefer **ARCHITECTURE.md** (how) + **FAQ.md** short honesty Q if FAQ already covers Ask behavior — not a hero README claim.
- Say: soft expansion adds retrieval terms for ambiguous size/capacity asks; displayed question unchanged; does not claim free-tier generate always succeeds; free-tier degrade UX remains.
- Sell mastery without fabricate: name the tradeoff (helps FTS/vector target specs over body dimensions) and residual (generator flakiness still possible).
- Update mermaid in README **only if** the Ask pipeline diagram would otherwise be false — prefer ARCHITECTURE diagram if one exists.

## Workflow OS
Follow `~/Documents/Git/second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md` + repo `.cursor/rules/workflow-os-portable.mdc`: evidence, smallest correct design, tests, no vibe coding, blast-radius noted, deliverable-ready ≠ process-finished.

## Deliverable of THIS Opus run
Write implementer-ready artifact to:
`docs/backlog/2026-09-28_soft_query_expansion_IMPLEMENT.md`

Must include:
1. Exact files to change
2. Expansion rule table (triggers, terms added, non-triggers)
3. API/telemetry: whether to expose expansions in diagnostics (recommend yes for honesty, optional field)
4. Test plan + acceptance curls (vague vs F20C vs brakes)
5. Exact doc diffs outline (which sections, sample wording that sells mastery without overclaim)
6. Risks / rollback
7. Out of scope list

Do **not** implement code in this planner run. Grok implements next.
