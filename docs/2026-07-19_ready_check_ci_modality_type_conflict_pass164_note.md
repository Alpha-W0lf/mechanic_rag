# Ready-check note — Mechanic CI/Vercel RetrieverHit modality type conflict (pass 164)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Work item:** Fix `RetrieverHit` / `RrfResult` reduced to `never` (content vs retriever `modality` clash) so `pnpm run build` / GitHub Actions / Vercel succeed  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_ci_modality_fix_pass164_handoff.md`  
**Hub unpark:** `second_brain/docs/2026-07-19_hub_lock_mechanic_unpark_ci_fix_pass164.md`  
**Example CI:** https://github.com/Alpha-W0lf/mechanic_rag/actions/runs/29694947676  
**Tom authorize:** Ready checks + next steps  

## Call

**READY (Go) for Implement** — deploy/CI doneness Soft Adjust only. **Do not Implement in this stage.** Hub may chain Implement after this Ready Go (Tom authorized).

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| CI/Vercel RetrieverHit modality type conflict fix | **9.2 / 10** | (1) Soft residual on **exact rename shape** — recommend `RetrievedChunk.modality` → `content_modality`; keep hit `modality` as `vector\|lexical\|fusion` (also fix `ScoredResult`). Alternatives `Omit<…,'modality'>` or delete unused content field also work — Implement must pick one and not bike-shed. (2) Soft: local evidence is `tsc --noEmit` on retrieval tests; Implement must also prove `pnpm run build` (Next) green. (3) Soft: gh run log fetch Forbidden this Ready host — root cause still reproduced locally with the exact `never` / conflicting `modality` message. |

**Overall:** **9.2 / 10** · **Go**

**Not inflated:** Root cause verified in `web/src/lib/retrieval/types.ts`; content `modality` unused at call sites; retriever channel is the live field; blast tiny; invent ban held (no Guide 16 / Done / friend).

---

## Root cause (verified)

```ts
// types.ts today
RetrievedChunk.modality?: 'text' | 'image' | 'table'   // content kind (unused at call sites)
RetrieverHit = RetrievedChunk & { modality: 'vector' | 'lexical' }
RrfResult    = RetrievedChunk & { modality: 'fusion' }
```

Intersection of incompatible `modality` unions → TypeScript reduces `RetrieverHit` / `RrfResult` to **`never`**. Local `npx tsc --noEmit` (web) reports: *“The intersection 'RrfResult' was reduced to 'never' because property 'modality' has conflicting types”* (and cascading errors in `ranking.test.ts`, ask Soft Adjust tests that build `RetrieverHit`).

Live producers (`retrievers.ts`, `rrf.ts`) set `modality` to **retriever/fusion channel** only. No production code sets content `text|image|table`.

---

## Proposed smallest fix (binding preference for Implement)

| Pin | Choice |
|-----|--------|
| Shape | **Split fields** — rename content field; keep retriever channel name |
| `RetrievedChunk` | `content_modality?: 'text' \| 'image' \| 'table'` (was `modality`) |
| `RetrieverHit` / `RrfResult` / `CeResult` / `ScoredResult` | Keep `modality: 'vector' \| 'lexical' \| 'fusion'` as today |
| Call sites | Expect **no** producer changes (`retrievers.ts` / `rrf.ts` already use channel `modality`) |
| Tests | Should typecheck without logic changes |
| Verify | `cd web && npx vitest run` (retrieval + ask Soft Adjust) + `pnpm run build` |
| Out | Guide 16 invent · dual-product Done · friend Gold · ranking/CE reopen · multimodal invent |

**Alternatives (acceptable if rename blocked):**  
- `Omit<RetrievedChunk, 'modality'> & { modality: … }` on hit types, **or**  
- Delete unused content `modality` from `RetrievedChunk` entirely (smallest lines; loses reserved multimodal field).  

**Prefer rename** — preserves future content modality without overloading the same key.

---

## Blast radius / rollback

**Blast:** `web/src/lib/retrieval/types.ts` (+ any rare imports of content `modality` — none found). Not ask schema, ranking logic, PrivateGold, Soft Adjust policy.

**Rollback:** Revert types commit; CI stays red until fixed.

### Edge cases

| Case | Behavior |
|------|----------|
| Future multimodal content kind | Use `content_modality`, not channel `modality` |
| Deprecated `ScoredResult` | Same split / Omit so it does not reintroduce `never` |
| Vitest vs Next build | Both must pass; vitest alone insufficient for Vercel |

---

## Refinements still required before Implement?

**None blocking.** Soft Implement preference: rename to `content_modality` + `pnpm run build` green.

### Explicit non-claims (this stage)

- No Implement started  
- No Guide 16 · No dual-product Done · No friend rclone · No CE invent  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan explicit.

### Stop

Ready DoD Met (**Go 9.2/10**). Under Tom authorize + hub unpark, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
