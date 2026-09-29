# Soft query expansion — implementation guide (JH-75)

**Status:** Ready for implementation (Opus planner, 2026-09-28). Grok implements next.
**Brief (locked):** [`2026-09-28_soft_query_expansion_plan.md`](./2026-09-28_soft_query_expansion_plan.md) — soft expansion only; **no** extractive short-circuit.
**Rails:** `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md` + `.cursor/rules/workflow-os-portable.mdc`.
**Git:** its own branch/worktree off `main` (for example `jh-75-soft-query-expansion`), then a PR. Don't share a dirty checkout.

---

## 0. What the planner verified (evidence)

| # | Fact | Status | Where |
|---|------|--------|-------|
| E1 | `handleAsk` passes `req.question` unchanged to `embedText`, `lexicalSearch`, `retrieveImageChannel` (CLIP), `rankAfterFusion` (the cross-encoder, or CE) and `generateAnswer` | Verified | `web/src/server/ask.ts` |
| E2 | Lexical search uses `plainto_tsquery('simple', …)`, which **ANDs every token**. Adding terms to the question string would *narrow* the full-text search (FTS) to zero hits, the opposite of soft | Verified | `web/src/server/retrievers.ts` `lexicalSearch`, `web/src/lib/retrieval/lexical_query.ts` |
| E3 | `lexicalSearch(..., 'or')` already exists (`to_tsquery` with `a \| b \| c`) and `lexicalQueryFromQuestionOr` builds the OR body | Verified | same files; the embed-fail fallback already uses it (`ask_extractive.ts`) |
| E4 | `reciprocalRankFusionMany` takes N lists; **empty lists contribute nothing**, so fusion output is byte-identical when an extra list is `[]` | Verified | `web/src/lib/retrieval/rrf.ts` |
| E5 | The S2000 service manual puts **DIMENSIONS and ENGINE in one table** (Design Specifications, p.36): overall length/width/height first, then `Displacement … 1,997 cm³ (121.9 cu in.)` ('00–03) / `2,157 cm³ (131.6 cu in.)` ('04–08), plus `Bore and stroke` | Verified (source markdown) | `output/markdown/Honda_S2000_Service Manual_2000_2008/page_0036.md` |
| E6 | The owner's manual spec table says `Displacement \| 121.8 cu-in (1,997 cm³)` next to `Bore x Stroke` | Verified | `output/markdown/Honda_s2000_owners_manual_2001/page_0249.md` |
| E7 | The literal token **`F20C` does not appear on either spec page**. In the service manual it shows up on *Chassis and Paint Codes* pages (pp.4–12) | Verified | grep over `output/markdown/` |
| E8 | How p.36 was split into chunks in the hosted DB (one chunk or several, and where the displacement row sits) | **Unknown**. The implementer must check (§4.3) | — |
| E9 | Vague ask `how big is the engine?` on `cat:2003-honda-s2000` often ends `degraded` / `generator_unavailable`; the concrete F20C ask usually `answered` | From the brief (Tom). The planner didn't re-run it | brief |
| E10 | `ask.ts` is **396 lines**. The QUALITY_STANDARD hard max is 400 | Verified (`wc -l`) | — |
| E11 | Hosted serving skips the CE (`hosted_ce_disabled`) and the image channel (`hosted_image_channel_disabled`) | Verified | `ask_ranking.ts`, `ask_image_channel.ts` |

**What this means for the design:** "soft" has to mean *an extra ranked list plus a richer embedding text*. It can't mean appending words to the FTS string (E2). Engine codes like F20C are the wrong boost term (E7). The terms that actually sit next to the number are `displacement`, `bore` and `stroke` (E5, E6).

---

## 1. Business rule (state before code)

> For a question that asks how **big** an **engine/motor** is (size / capacity / litres / cc / cubic), without already saying "displacement" and without naming a fluid, part or weight, add displacement-spec retrieval terms. Never change the question the user sees or the text the generator receives.

- **Input:** `question: string` (already trimmed and length-checked by `validateAskRequest`).
- **Output:** `QueryExpansion = { rules: string[]; embedQuery: string; lexicalBoost: string | null }`
  - No rule fires → `{ rules: [], embedQuery: question, lexicalBoost: null }`. **The same string reference, so behavior is identical to today.**
  - Rule fires → `embedQuery = question + ' ' + EMBED_TERMS`, `lexicalBoost = 'displacement bore stroke'`.
- **Invariants:**
  1. Pure and deterministic: no I/O, no LLM, no env reads, no new dependencies.
  2. Additive only: the original AND lexical search still runs on the original question.
  3. `req.question` stays the only string passed to `generateAnswer`, `rankAfterFusion` (CE), `retrieveImageChannel` (CLIP), `extractiveFallback` and the UI.
  4. Vehicle-agnostic. No `vehicle_id` parameter and no per-vehicle engine-code map (E7: codes pull paint-code pages; hard-coding vehicle facts in server code bypasses the corpus).
- **Fails closed to "no expansion":** empty tokens, or any ambiguity in the tables below.

---

## 2. Expansion rule table

Only one rule ships in this slice: `engine_size_to_displacement`. Tokenize with the existing `lexicalQueryTokens(question)` (DRY: it lowercases, strips punctuation such as `?`, drops stopwords like `how`/`is`/`the`, and keeps tokens of 2+ characters).

**Fires when all three hold:**

| Condition | Token set (exact token match after `lexicalQueryTokens`) |
|-----------|-----------------------------------------------------------|
| A. Engine subject present | `engine`, `engines`, `motor` |
| B. Size/capacity cue present | `big`, `bigger`, `size`, `sized`, `large`, `larger`, `capacity`, `liter`, `liters`, `litre`, `litres`, `cc`, `cubic` |
| C. No blocker present | Already specific: `displacement` · Fluids: `oil`, `coolant`, `fluid`, `fuel`, `tank`, `water` · Parts/places: `bay`, `compartment`, `mount`, `mounts`, `bolt`, `bolts`, `pump`, `filter`, `belt`, `hose`, `valve`, `valves`, `piston`, `pistons`, `bearing`, `bearings`, `gasket` · Weight: `weight`, `heavy`, `weigh` |

**Terms added:**

| Channel | Added text | Why |
|---------|-----------|-----|
| Embedding text (`embedQuery`) | `engine displacement cm³ cu in bore and stroke` appended after the question | Moves the query vector toward spec-table rows (E5/E6) and away from body-dimension rows. The question stays first, so intent is kept. |
| Lexical boost (`lexicalBoost`) | `displacement bore stroke`, run as a **separate OR search** via `lexicalSearch(..., 'or')` | Those words sit in the same table row as the number on both manuals (E5, E6). OR avoids the AND-narrowing trap (E2). Unit tokens (`cm³`, `cu`, `in`) are left out of FTS: `in` matches nearly every chunk, and the way `simple` tokenizes `cm³` is unverified. |

**Worked cases (these become unit tests):**

| Question | Fires? | Why |
|----------|--------|-----|
| `how big is the engine?` | **Yes** | engine + big, no blocker |
| `What size engine does it have` | **Yes** | engine + size |
| `how many liters is the motor` | **Yes** | motor + liters |
| `engine capacity?` | **Yes** | engine + capacity (British usage for displacement) |
| `how many cc is the engine` | **Yes** | engine + cc |
| `What is the engine displacement of the F20C?` | No | blocker `displacement`. The concrete ask behaves exactly as today |
| `What is the front brake pad inspection procedure?` | No | no engine subject |
| `How much oil does the engine hold?` / `engine oil capacity` | No | blocker `oil` |
| `How big is the engine bay?` | No | blocker `bay` |
| `how heavy is the engine` | No | no size cue, and blocker `heavy` |
| `how big is it?` | No | no engine subject. Deliberately conservative |
| `What size are the tires?` | No | no engine subject |
| `` (empty after tokenizing, e.g. `???`) | No | fails closed |

Order-independent: tokens are sets, not phrases. "big engine" and "engine … big" both fire.

---

## 3. Exact files to change

### 3.1 New: `web/src/server/ask_query_expansion.ts` (target under 90 lines)

Same shape as `ask_image_channel.ts`: one module owns a retrieve channel, with a pure core and a thin I/O wrapper.

```ts
/**
 * JH-75 soft query expansion — retrieval-only.
 * Business rules: see docs/backlog/2026-09-28_soft_query_expansion_IMPLEMENT.md §1–2.
 * Never alters the question shown to the user or sent to the generator.
 */
export type QueryExpansion = {
  rules: string[];            // e.g. ['engine_size_to_displacement'] or []
  embedQuery: string;         // === question when rules is empty
  lexicalBoost: string | null;
};

export function expandQueryForRetrieval(question: string): QueryExpansion;  // pure

export async function retrieveExpansionBoost(input: {
  vehicleId: string;
  expansion: QueryExpansion;
  topN: number;
  docFamily?: string;
}): Promise<{ hits: RetrieverHit[]; ms: number }>;
// lexicalBoost null → { hits: [], ms: 0 } with NO DB call.
// else → lexicalSearch(vehicleId, lexicalBoost, topN, docFamily, 'or').
// Errors propagate (same as the main lexicalSearch: the DB is down → the whole Ask fails; see ARCHITECTURE §13).
```

- Token sets are module-level `const … = new Set([...])` with the rule id as an exported constant: `ENGINE_SIZE_RULE = 'engine_size_to_displacement'`.
- Import `lexicalQueryTokens` from `@/lib/retrieval/lexical_query` (don't write a second tokenizer).
- Don't build a generic "rule engine" for a single rule. A second rule can refactor into a table when it exists.

### 3.2 Edit: `web/src/server/ask.ts` (the minimal wiring)

1. Import both functions.
2. **Before** `try {`: `const expansion = expandQueryForRetrieval(req.question);`. It's pure, and hoisting it lets the `catch` log it.
3. `embedText(req.question)` → `embedText(expansion.embedQuery)`.
4. After the main `lexicalSearch` block: `const boost = await retrieveExpansionBoost({ vehicleId: req.vehicle_id, expansion, topN, docFamily: req.doc_family });`
5. `reciprocalRankFusionMany([vector, lexical, image, boost.hits], rrfK, topN)`.
6. Add to `diag` (so it flows to both the response diagnostics and `logAsk`): `query_expansion: expansion.rules`, `expansion_lexical_count: boost.hits.length`, `expansion_lexical_ms: boost.ms`.
7. Add `query_expansion: expansion.rules` to the `logAsk` calls for **insufficient_evidence (both)** and **degraded**, and to the **dependency_error** call.
8. Degraded response: when `degraded.diagnostics` is non-null, set `query_expansion` on it. Do this with a spread when returning, not by mutating inside `ask_degrade.ts`, so `ask_degrade.ts` stays unchanged.
9. **Leave untouched:** the `rankAfterFusion({ question: req.question … })`, `retrieveImageChannel({ question: req.question … })`, `extractiveFallback({ question: req.question … })` and `generateAnswer(… Question: ${req.question} …)` calls.

**Line budget (binding):** `ask.ts` is at 396 lines, and the wiring adds about 15–20 after prettier. If it goes over **400**, first make a **separate, behavior-neutral commit** that moves the VLM fail-open `try { maybeAssistWithVlm } catch { … vlm_internal_error }` block into `ask_vlm.ts` as `maybeAssistWithVlmSafe(input): Promise<VlmResult>` (the rule "VLM must never take down text ask" belongs with the VLM code). Add one unit test for the throw → `vlm_internal_error` mapping. Don't shrink lines with unreadable one-liners.

### 3.3 Edit: `web/src/server/ask_log.ts`, only if needed

`buildAskLogLine` passes arrays through untouched unless the key is in `CHUNK_ID_LIST_KEYS`. `query_expansion` is a short list of rule ids, not question text, so the "never log question text" rule (header comment) still holds. **Expected: no code change.** Add one assertion to `ask_log.test.ts` that `query_expansion` survives and that no question text appears.

### 3.4 New tests

- `web/src/server/__tests__/ask_query_expansion.test.ts`: every row in the §2 worked-cases table, plus:
  - no rule fires → `embedQuery === question` (same reference or `toBe`), `lexicalBoost === null`, `rules` is `[]`
  - rule fires → `embedQuery.startsWith(question)`, `lexicalBoost === 'displacement bore stroke'`
  - `lexicalQueryFromQuestionOr(lexicalBoost)` returns `'displacement | bore | stroke'` (a contract check with the existing OR builder)
  - `retrieveExpansionBoost` with `lexicalBoost: null` makes **no** `lexicalSearch` call (mock `@/server/retrievers`)
- Extend `web/src/server/__tests__/ask_handle_ablation.test.ts` (it already mocks `retrievers` and providers), or add `ask_query_expansion_handle.test.ts` using the same mock pattern:
  1. **Vague:** `question: 'how big is the engine?'` → `embedText` called with a string that starts with the question and contains `displacement`. `lexicalSearch` called twice: once with the original question and default match, once with `'displacement bore stroke'` and `'or'`. The `generateAnswer` user prompt contains `Question: how big is the engine?` and **no** `bore and stroke`. `diagnostics.query_expansion` equals `['engine_size_to_displacement']` (with `MECHANIC_DIAGNOSTICS=1`).
  2. **Concrete:** `'What is the engine displacement of the F20C?'` → `embedText` called with the exact question, `lexicalSearch` called **once**, `query_expansion: []`.
  3. **Brakes:** `'What is the front brake pad inspection procedure?'` → same as the concrete case (no expansion, one lexical call).
  4. **Fusion boost:** mock the boost list to return a chunk that's absent from vector/lexical → the chunk shows up in `loadChunksByIds` ids (proves the 4th RRF list is wired).
- **Must stay green, unmodified:** all of `web/src/server/__tests__/*` (especially `ask_ablation`, `ask_handle_ablation`, `ask_hosted_ce`, `ask_generator_degrade`, `ask_event_log`, `ask_log`, `ask_ranking`) and `web/src/lib/retrieval/__tests__/*`. If an existing test needs editing because a mock now sees a second `lexicalSearch` call, that's only allowed for expansion-firing questions. Explain it in the PR.

### 3.5 Docs (see §6 for wording)

`docs/ARCHITECTURE.md` (§7 pipeline, §7.1, §7.2, §8.1 diagnostics note, §9.2, §13) and `FAQ.md` (new §13). **No README change** (§6.3).

---

## 4. API / telemetry

### 4.1 Recommendation: expose it (yes)

- `diagnostics.query_expansion: string[]` (rule ids, `[]` when none), `expansion_lexical_count`, `expansion_lexical_ms`. Only when `MECHANIC_DIAGNOSTICS=1`, the same gate as every other diagnostic. **The default public response shape doesn't change.**
- `event:ask` log line: `query_expansion` on every outcome. This lets us measure fire rate and outcome split from logs without logging question text.
- **Why yes:** retrieval changed for some asks. An operator reading a bad answer should see *that* expansion ran and *which* rule, without re-deriving it. That's honesty through telemetry, not UI theater.
- **Not exposed:** the expanded embedding text or boost string. They follow from the rule id and add payload noise.

### 4.2 Contract impact

- `AskRequest` / `AskSuccess` / `AskFailure` types: no change (diagnostics is already `Record<string, unknown> | null`).
- UI: no change. The displayed question is `req.question` and is never rewritten.

### 4.3 Pre-merge data check (fills Unknown E8)

Against the hosted DB (read-only; use the ops-approved connection, and never paste the connection string into the PR):

```sql
SELECT chunk_id, page_start, length(content) AS len,
       position('Displacement' IN content) AS disp_pos,
       position('Overall length' IN content) AS dims_pos
FROM chunks
WHERE vehicle_id = 'cat:2003-honda-s2000'
  AND doc_family = 'service_manual'
  AND page_start <= 36 AND page_end >= 36;
```

Record the result in the PR. If displacement and dimensions are in the **same** chunk, expansion still helps that chunk rank, but see Risk R3 (the degraded snippet may show the dimension rows first).

---

## 5. Verification and acceptance

### 5.1 Local gates (must be pasted into the PR as evidence)

```bash
cd web
npm run typecheck
npm run lint
npm test            # full vitest suite, not only the new files
npx prettier --check src/server/ask.ts src/server/ask_query_expansion.ts
wc -l src/server/ask.ts   # must be ≤ 400
```

### 5.2 Acceptance curls (hosted preview or production after merge; `MECHANIC_DIAGNOSTICS` only where it's already enabled for ops)

```bash
BASE=${BASE:-https://mechanic-rag.vercel.app}
VID=cat:2003-honda-s2000
for q in \
  "how big is the engine?" \
  "What is the engine displacement of the F20C?" \
  "What is the front brake pad inspection procedure?"
do
  curl -sS -X POST "$BASE/api/ask" -H 'content-type: application/json' \
    -d "{\"vehicle_id\":\"$VID\",\"question\":\"$q\"}" \
  | jq '{q: "'"$q"'", outcome, error_class, n: (.citations|length),
         pages: [.citations[].page_start], answer: (.answer[:220]),
         qe: .diagnostics.query_expansion}'
done
```

| Ask | Pass criteria |
|-----|---------------|
| Vague `how big is the engine?` | At least one of the **top 3 citations** is a spec-table page (service manual p.36 or owner's manual p.249) **and** the answer or excerpt text contains `1,997` or `2,157` or `cm³` or `cu in`. `outcome` may be `answered` **or** `degraded`: generator flakiness is out of scope. If diagnostics are on, `qe == ["engine_size_to_displacement"]`. |
| Concrete F20C | `outcome: answered` (as today), the answer states displacement with a citation, `qe == []`. Citations are **unchanged** vs a `main` baseline run the same day (record both). |
| Brakes | `outcome: answered`, brake-procedure citations, `qe == []`, citations unchanged vs the `main` baseline. |

**Before/after evidence:** run the three curls against `main` (baseline) and the preview (candidate), 3 runs each (free-tier variance), and paste a compact table into the PR: outcome, top-3 pages, whether a displacement number is visible. **Don't claim a rate improvement from 3 runs.** Report the counts as observed.

### 5.3 Definition of Done

- [ ] All §2 worked cases are unit-tested and pass
- [ ] Handler tests prove the generator/CE/CLIP/UI still get the original question
- [ ] Full `npm test`, typecheck, lint and prettier are green, and `ask.ts` is ≤ 400 lines
- [ ] §4.3 chunk check recorded (E8 resolved to Verified)
- [ ] §5.2 before/after table in the PR. The vague-ask pass criterion met, **or** it fails honestly with the observed pages (a Fail stays a Fail, and the rule can then be tuned in the same PR)
- [ ] ARCHITECTURE + FAQ updated in the same PR (§6). No stale "two rank lists" text left
- [ ] No new dependencies (`package.json` and lockfile unchanged)

---

## 6. Doc diffs outline (public voice: sell the engineering, no fabrication, no hero claims)

### 6.1 `docs/ARCHITECTURE.md`

**§7 pipeline block**: add one line before retrieval:

```text
question ──(retrieval-only soft expansion, deterministic; displayed/generated question unchanged)
vehicle-filtered vector + lexical (+ image when enabled, + expansion lexical when a rule fires)
        → RRF fuse (stable chunk_id)
        → …
```

**§7.1**: new numbered item 6 (sample wording):

> 6. **Soft query expansion (retrieval-only).** A small deterministic rule set (`web/src/server/ask_query_expansion.ts`) spots under-specified asks, today "how big is the engine?"-style size questions, and adds spec vocabulary (`displacement`, `bore`, `stroke`) to the retrieval side only. The embedding text gets the terms appended. Lexical search keeps its AND query on the original question and adds a *separate* OR-query rank list, because appending terms to a `plainto_tsquery` AND query would narrow recall instead of widening it. The question the user typed is what the generator, cross-encoder and UI see, unchanged. No LLM call and no new dependency. When no rule fires, retrieval is byte-identical to the unexpanded path.

**§7.2**: fix the pre-existing stale "over the two rank lists". Replace with:

> Pure reciprocal-rank fusion over the independent rank lists (text vector, lexical, image when enabled, expansion-lexical when a rule fires). Empty lists contribute nothing, so a skipped channel is identical to fusing without it.

**§8.1**, after the `diagnostics` sentence: add `query_expansion` (rule ids) to the list of what diagnostics can contain.

**§9.2**: add `query_expansion` (rule ids only, never question text) to the emitted fields.

**§13 failure-mode table**: new row:

| Vague size ask ("how big is the engine?") | Retrieval-only expansion adds spec terms; the answer stays citation-bound. Generator failure still degrades to cited excerpts (HTTP 200) |

### 6.2 `FAQ.md`: new `## 13. What happens with a vague ask like "how big is the engine?"`

Sample wording (3 short paragraphs, no more):

> Vague size questions are a classic hybrid-retrieval trap: "big" is closer, in both embedding space and keywords, to *overall length / width* rows than to the *displacement* row. In the S2000 service manual both sit in the same Design Specifications table.
>
> Mechanic handles this with **soft, retrieval-only query expansion**: a deterministic rule recognizes an engine-size ask and adds `displacement` / `bore` / `stroke` to the embedding text and to a separate OR full-text rank list that is fused by RRF. The question you typed is what the model answers, unchanged. Specific asks ("engine displacement of the F20C"), fluid-capacity asks ("engine oil capacity") and unrelated asks (brakes) don't trigger it. `diagnostics.query_expansion` shows when it fired.
>
> What it doesn't change: generation on the free Gemini tier can still time out. When that happens, Ask returns the cited excerpts instead of an invented answer (HTTP 200, `outcome: "degraded"`). Expansion improves *which* pages are cited. It doesn't make the free generator always available.

(The implementer may tighten the wording but must keep all three claims: mechanism, unchanged question, residual.)

### 6.3 `README.md`: **no change**

The mermaid `A[Ask] --> H[vector + Postgres FTS] --> R[RRF] …` stays true, because expansion is an input tweak inside the retrieve step, not a new stage. Don't add a "vague asks solved" line (a brief non-goal).

### 6.4 Voice guardrails

- Allowed: "deterministic", "retrieval-only", "byte-identical when no rule fires", "fails closed to no expansion", and naming the AND-narrowing trap. These are real engineering calls, so state them plainly.
- Banned: "solves vague questions", "always answers", any before/after percentage not backed by a written run table, "leveraging…", apologetic closers.

---

## 7. Risks and rollback

| # | Risk | Mitigation |
|---|------|-----------|
| R1 | False positive: an unrelated engine question gets expanded (e.g. "is the engine big enough for a turbo?") | Additive only, and the original lists are untouched. Worst case, spec-table chunks gain one extra RRF vote (`1/(k+rank)`, k=60), and citation filtering still applies. The blocker list covers the common capacity confusions (oil, coolant, fuel). |
| R2 | Boost terms match noise (`stroke` in "4-stroke", `displacement` in oil/water pump rows) | Those hits sit on the same spec pages, so this noise is still on target. `topN` caps the list, and RRF is rank-only, so no score blow-up. |
| R3 | **The degraded snippet may still show dimensions.** `extractiveSnippet` takes the first ~480 chars of a chunk. If p.36 is one chunk, the long image caption plus the DIMENSIONS rows come *before* the Displacement row | Out of scope: changing snippet selection moves toward extractive answering, which the brief forbids. §4.3 records the chunk layout. If the vague-ask pass criterion fails **only** for this reason, record it as a Fail with that cause and open a separate backlog item. Don't widen this slice. |
| R4 | Latency: one extra FTS query when the rule fires | GIN-indexed `to_tsquery` over one vehicle, measured as `expansion_lexical_ms`. Zero cost when no rule fires (no DB call). |
| R5 | Embedding drift for the vague ask (the appended terms dominate a 5-word question) | The question stays first. Terms are spec vocabulary for the same intent. Acceptance requires the concrete and brake asks to be unchanged. |
| R6 | `ask.ts` line cap | §3.2 line budget, with a behavior-neutral extraction commit. |
| R7 | The embed-fail path (`extractiveFallback`) doesn't get expansion | Accepted for this slice (it's the lexical-only degrade path). Listed in out-of-scope below. |

**Rollback:** revert the PR. There's no schema, data or env change, so rollback is code-only and instant on redeploy. (No kill-switch env var: one deterministic rule with its own tests doesn't justify a config surface. Revert is the switch.)

---

## 8. Out of scope

- Extractive short-circuit / skipping Gemini when citations contain a number (**locked no**)
- Generator reliability, paid Gemini, retry-budget tuning
- Changing `extractiveSnippet` / degraded excerpt selection (R3)
- Expansion in `extractiveFallback` (the embed-fail path), in CE input, or in the CLIP image query
- LLM-based query rewriting, HyDE, synonym dictionaries, per-vehicle engine-code maps (F20C etc.)
- Rules beyond `engine_size_to_displacement` (for example torque specs or tire size). Each needs its own evidence first
- README hero claims, LinkedIn/resume edits
- Changing the FTS config (`simple`) or the `content_tsv` column
- Eval-suite additions beyond the unit/handler tests above. A gold eval case for the vague ask is a reasonable follow-up, not this PR

---

## 9. Hand-off note for Grok

If a §2 worked case conflicts with what you see in real chunks (for example, p.249 turns out not to be ingested), **stop and escalate to Opus** with the evidence. Don't retune the token sets by feel. Every token-set change needs a test row that justifies it.
