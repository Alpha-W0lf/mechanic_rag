# Dev Guide 01 — Hybrid → RRF → CE ask path (vertical slice)

**Date:** 2026-07-12  
**Repo:** `mechanic_rag`  
**Work item:** Mechanic RAG v1 — first executable ask path (MR2 ranking showcase)  
**Stage that authored this:** Write dev guide  
**Status:** Guide 01 DoD **met** (pass 8c Implement; pass 9 Review). Embedding/CE **smoke-passed / provisional keep — not frozen** — see `evals/MODEL_FREEZE_STATUS.md`. Generator operator default: **`gemma4:e2b`** (pass 9 live ask smoke OK). Pass 8c golden eval / ask baseline historically ran on fallback **`qwen3.5:4b`** while gemma was mid-upgrade — keep as historical baseline only.  
**Updated:** 2026-07-13 (Align docs pass 10)

---

## Objective

Deliver the **thinnest end-to-end product path** that proves Mechanic’s portfolio story:

**synthetic fixtures → Compose Postgres+pgvector → idempotent FixtureSource ingest → `POST /api/ask` (vehicle-filtered hybrid retrieve → RRF → section dedup **default on** → local cross-encoder N→K with degrade-to-RRF) → Ollama answer + server-derived citations → health readiness → minimal golden-question eval (incl. CE lift / degrade / latency signals).**

Public clone must run on fixtures only. No Drive, Ford, Supabase, multimodal, or hosted-reranker defaults.

---

## Learning notes (short)

| Concept | Plain meaning |
|---------|----------------|
| **Architecture vs dev guide** | Architecture freezes *what must be true* (contracts, order, non-goals). A **dev guide** is the *ordered checklist* a later agent executes — steps, DoD, and stop conditions — without inventing a second ranking design. |
| **Eval harness** | A versioned set of questions with expected evidence (allowed `chunk_id`s / locators) plus a runner that scores retrieval/citations the same way every time. It is how you prove CE helps (or justify keeping it) — not a vibes checklist. |
| **RRF** | Reciprocal Rank Fusion: combine two ranked lists by ranks only (`1/(k+rank)`), not by mixing incompatible similarity scores. |
| **Cross-encoder (CE)** | A model that scores *(query, chunk_text)* together on a shortlist (N), then keeps top K. Slower than bi-encoder retrieve; bounded by N/K + timeout + degrade. |
| **Degrade** | If CE fails/timeouts, still answer using post-RRF (+ dedup) order and set `rerank_degraded=true` — do not invent chunks or fail the whole ask solely for CE. |
| **Candidate vs frozen model** | A **candidate** is a named model you are allowed to try (e.g. `nomic-embed-text@768`). A **frozen** model is the one you lock in `.env` / docs **after** fixture smoke + eval evidence. Naming candidates is planning honesty; claiming lift with an unmeasured “final” ID is theater. |
| **Migration (DB)** | Versioned SQL under `db/migrations/` applied once (Compose `docker-entrypoint-initdb.d` on first volume create, or `scripts/migrate.sh`). Schema changes are deliberate files — not ad-hoc `schema.sql` edits. |
| **Connection pool** | A small set of reusable Postgres connections (`pg.Pool`) so each ask does not open/close a TCP+auth handshake. Borrow with `connect()` / always `release()` — leaks exhaust the pool under load. |

---

## References (paths only)

- `mechanic_rag/docs/ARCHITECTURE.md` (binding SSOT — especially §4–§10, §13, §16)
- `mechanic_rag/docs/VISION.md`
- `mechanic_rag/docs/2026-07-12_context_summary.md`
- `second_brain/docs/2026-07-12_hybrid_rag_reranker_decision.md`
- `second_brain/docs/2026-07-12_portfolio_vision_workspace_and_decisions.md` (MR2)
- `second_brain/docs/2026-07-12_vehicle_docs_library_architecture.md` (Contract 7.2 field semantics)
- `mechanic_rag/web/src/lib/retrieval/rrf.ts` (seed; keep pure)
- `mechanic_rag/web/src/lib/retrieval/section_dedup.ts` (section diversification; **not** true MMR; default on)
- `second_brain/docs/workflow_os/rails/QUALITY_STANDARD.md`

**Non-authoritative for this slice:** `docs/api_contracts.md`, `docs/dev_setup.md`, `db/schema.sql`, `supabase/**`, `docs/rag_tailored_guide.md` (research-era). Retired stub ask lived under deleted `web/app/` — do not resurrect.

---

## Architecture constraints (binding)

1. **Stack:** Next.js App Router under **`web/src/app` only** (MR1); offline Python ingest CLI (`mecharag`); **Compose Postgres + pgvector only** (no Supabase); host **Ollama** (`gemma4:e2b` default, `qwen3.5:4b` fallback); one local embedding adapter; lexical = Postgres `tsvector` + GIN, config **`simple`**.
2. **Ranking order (MR2):** vehicle-filtered vector + lexical (independent, topN each) → **RRF** → **section dedup (default on)** → local **CE (N→K)** → context + citations. Binding order if enabled: **RRF → dedup → CE**. Provisional defaults: `topN=50`, **N=20**, **K=8**, RRF `k=60`. Optional env flag to disable dedup is nice-to-have; do not advertise “MMR”. Tune only with eval evidence.
3. **Module boundary:** CE model load/infer under `web/src/server/`; `web/src/lib/retrieval/` stays pure (RRF / section dedup) — no ONNX/HTTP/model runtime imports.
4. **Score honesty:** distinct `rrf_score` vs `ce_score`; do not claim RRF is `[0,1]` similarity. Update `ScoredResult` types away from the stub’s ambiguous `score` + false “normalized [0,1]” comment.
5. **Degrade:** CE unavailable / timeout / empty-or-invalid IDs → serve top-K from post-RRF (+ dedup) order; set `rerank_degraded=true` in logs and diagnostics (when flag on). Citation validation and insufficient-evidence rules still apply.
6. **Corpus:** public path = **`FixtureSource`** under allowlisted `fixtures/` only; fail-closed on OEM/private PDFs. **PrivateGoldSource** contract may exist but is **out of this guide’s DoD** beyond interface shape if needed.
7. **Identity:** ask requires `vehicle_id` (no all-vehicle fallback; no VIN lookup). Fixtures use `fixture:` prefix. Stable **`chunk_id`** shared across retrievers, RRF, CE, citations.
8. **Ingest:** validate full manifest → atomic document-version upsert; unchanged **`content_hash`** → skip; failed new version leaves prior indexed version queryable.
9. **Models as gates:** use the named **candidates** in the Model candidate gate section below; run fixture benchmarks; then **freeze** embedding model+dim and CE model+runtime **before** claiming hybrid baseline / CE lift. Do not invent alternate “final” IDs outside the candidate list without writing why.
10. **Out of scope for this guide:** public flip, Drive clients, Ford/PTS, multimodal, true neural MMR, hosted Cohere/Voyage as default, GraphRAG/agents, PrivateGold production ingest, UI polish beyond thin ask consumer.
11. Prefer ≤300 lines/file (hard max 400 unless already established). Smallest correct change; do not extend stale Supabase/Gemini paths.

---

## Ordered step checklist

### Phase A — App tree + contracts scaffold

- [x] **A1.** **MR1:** Make `web/src/app` the sole Next app tree. Move live routes from `web/app/api/**` into `web/src/app/api/**` (smallest change: ask + health). Remove root `web/app/` so Next does not ignore `src/app`. Confirm UI under `web/src/app` is the one served.
- [x] **A2.** Add `.env.example` (or refresh `env.example` → `.env.example`) with: Postgres URL for Compose, Ollama base URL + `OLLAMA_MODEL`, embedding model/dim **candidate** placeholders (see Model candidate gate), CE model/runtime **candidate** placeholders, `MECHANIC_DIAGNOSTICS=0|1`, optional section-dedup disable flag (default on), timeouts (DB / Ollama / CE), fixture root path. No secrets in git.
- [x] **A3.** Add versioned contracts under `contracts/` (or equivalent): minimal **NormalizedDocumentManifest** JSON Schema accepting library Contract 7.2 emit fields (`corpus_version`, `content_hash`, `artifact_version`, provenance, page/section locators, vehicle identity). Ask request/response schema matching ARCHITECTURE §8.1 (`vehicle_id` + `question`; citations with `chunk_id` + locators; no `{ "query" }` stub shape).
- [x] **A4.** Fix retrieval types: stable `chunk_id`; separate score fields (`rrf_score`, `ce_score`); drop stub fake IDs (`v1`/`l1`) from product path. Keep RRF pure in `web/src/lib/retrieval/rrf.ts`.
- [x] **A5.** **Rename** section-dedup API off “MMR” (`mmr.ts` → e.g. `section_dedup.ts` / honest symbol names). Ship **enabled by default** (existing same-section diversification). Optional env to disable is fine; **order stays RRF → dedup → CE**. Do **not** advertise true MMR.

### Phase B — Compose Postgres + migrations

- [x] **B1.** Add `docker-compose.yml` with **pinned** Postgres+pgvector image, healthcheck, volume, port. Document `docker compose up -d`. No Supabase services.
- [x] **B2.** Create `db/migrations/` as **sole** schema authority (ARCHITECTURE §6): `vehicles`, `documents`, `chunks` (fixed-dim `embedding`, generated `tsvector` `simple` + GIN, HNSW/IVFFlat on fixed dim), `index_state`. Do **not** extend `db/schema.sql` or `supabase/**` as product paths; leave them marked obsolete or untouched.
- [x] **B3.** Apply migrations on Compose boot (init script or documented migrate command). Verify: extension `vector` present; GIN on lexical; vector index on fixed dimension only. *(verified pass 8c: `vector` 0.8.5; `idx_chunks_content_tsv` GIN; `idx_chunks_embedding_hnsw` on `vector(768)`)*
- [x] **B4.** Smoke: `psql` (or equivalent) connects; empty tables OK. *(verified pass 8c; after ingest: 1 vehicle / 1 doc / 17 chunks)*

### Phase C — Fixtures + FixtureSource + idempotent ingest

- [x] **C1.** Add `fixtures/` with ≥1 synthetic vehicle (`vehicle_id` like `fixture:honda-s2000-demo`), ≥1 document family (`service_manual`), text-only manifests + chunkable text. No PDFs in tracked public paths.
- [x] **C2.** Implement **`FixtureSource`**: allowlisted paths under `fixtures/` only; reject private roots / OEM classes. Shared downstream: validate → text chunk → embed → transactional upsert. *(offline smoke: 1 doc → 17 chunks)*
- [x] **C3.** Offline Python ingest CLI: expected entrypoint **`mecharag ingest`** (package already `mecharag`). Exact flags TBD at scaffold — document in README as you wire them (honest placeholders OK until then). Behavior: validate full manifest before writes; upsert one document version atomically; **unchanged `content_hash` → skip**; log run id, hashes, inserted/skipped/failed, final status. *(live: `mecharag ingest --source fixtures` → inserted=1 then skipped=1)*
- [x] **C4.** Embedding adapter (local; prefer Ollama-hosted if selected): store model+dim on chunks; reject dim/model mismatch; mark `reindex_needed` when versions change. Start from **candidates** in Model candidate gate (primary: Ollama `nomic-embed-text` @ 768); put chosen candidate in `.env.example`; **freeze after** first fixture embed+retrieve smoke — not a guess. *(live smoke passed; formal freeze pending human — `evals/MODEL_FREEZE_STATUS.md`)*
- [x] **C5.** Re-run ingest twice: second run skips unchanged hashes; prior version remains queryable if a deliberate failure test leaves it intact. *(pass 8c: first run `inserted=1` / 17 chunks; second run `skipped=1` same `content_hash=91ecc2804b1c`. Deliberate mid-version failure leave-prior test still residual debt.)*
- [x] **C6.** Public fail-closed check (script or CI step): fail if OEM/private PDF or non-allowlisted class appears under fixtures / default config.

### Phase D — Ask path: hybrid → RRF → CE → generate → citations

- [x] **D1.** Server DB repos under `web/src/server/`: vehicle-filtered **vector ANN** and **lexical FTS** (`simple`), each capped at `topN`, same stable `chunk_id`s. Require `vehicle_id` on every ask (4xx if missing/unknown). Optional `doc_family` filter may stub as unused but must not break contract. *(live ask: vector_count=17, lexical_count=2 after stopword normalize for `simple`)*
- [x] **D2.** Fuse with existing RRF (`k=60`); then **section dedup default on** (**after RRF, before CE** — ARCHITECTURE §7.3). Log vector/lexical counts + latencies, RRF size, dedup drops. Optional flag may disable dedup; order when on is fixed.
- [x] **D3.** **CE adapter** in `web/src/server/` only: load top **N** fused (+ deduped) IDs’ text from DB; score `(query, chunk_text)`; sort by `ce_score`; keep top **K**. Never invent IDs. Bound with **timeout**. Start from **CE candidates** in Model candidate gate (primary: `cross-encoder/ms-marco-MiniLM-L-6-v2`; runtime pick smallest local path — prefer in-process / ONNX over sidecar unless forced). Put candidate + runtime in `.env.example`; **freeze after** fixture benchmark before claiming lift. *(Xenova ONNX port + degrade; freeze pending)*
- [x] **D4.** **Degrade path:** on CE init fail / timeout / empty-or-all-invalid IDs → top-K from post-RRF (+ dedup) order; set `rerank_degraded=true`. Unit-test with a **fake CE** (success + fail/timeout/empty).
- [x] **D5.** Context assembly: bounded char/token budget; server citation labels `[1]…`; pass only labeled context to Ollama; reject unknown labels from model output. *(unit-tested label mapping)*
- [x] **D6.** Citations assembled from **DB rows** only (`chunk_id`, `vehicle_id`, `doc_family`, `document_id`, `section_path`, `page_start`/`page_end`). Response shape per §8.1. No `visual_assets`.
- [x] **D7.** Outcomes: hits → answer + citations; no hits → HTTP 200 insufficient-evidence (empty/minimal citations, no invented torque/procedure advice); Postgres/Ollama down → **non-200**, no fabricated answer. *(live: outcome=answered + DB citations; Ollama abort path observed as 503 during earlier timeout)*
- [x] **D8.** Structured ask logs: request id, `vehicle_id`, retriever counts/latencies, RRF size, dedup drops, **CE N/K**, **CE latency**, **`rerank_degraded`**, chosen `chunk_id`s, embedding/index/generator/**CE** versions, outcome. Never log private chunk bodies by default. `diagnostics` object only when development flag on.
- [x] **D9.** Thin UI consumer: vehicle selector (fixture ids), question, answer + citations, empty/no-evidence and dependency-error states. No retrieval logic in the browser.

### Phase E — Health + golden eval + latency/degrade verification

- [x] **E1.** `GET /api/health`: **liveness** = process up → 200; **readiness** = Postgres + Ollama reachable with bounded timeouts → non-200 if not ready. Retire always-`{"status":"ok"}` stub as the long-term contract. *(live: `{"status":"ready","mode":"readiness","checks":{"postgres":true,"ollama":true}}`)*
- [x] **E2.** Add `evals/` with a **minimal golden set** for this slice: **≥5** versioned fixture cases (document plan to grow to ≥30 before portfolio “complete” claim). Each case: `vehicle_id`, question, allowed evidence (`chunk_id`s and/or section/page locators), optional notes.
- [x] **E3.** Eval harness via expected entrypoint **`mecharag eval`** (or thin wrapper that documents the same name): run retrieval (+ optional full ask) against Compose; report at least Recall@k and/or MRR on fixture ground truth; **citation correctness** (cited ids ⊆ allowed set); **paired RRF-only (or CE-degraded) vs RRF+CE** on the same cases; log **CE latency**, **degrade rate**, and per-stage timings (vector, lexical, RRF, CE, generate) when available. Exact flags TBD at scaffold — document as wired. *(live baseline in `evals/last_run_summary.json`)*
- [x] **E4.** Do **not** invent numeric public-release pass/fail thresholds yet. Record first honest baseline numbers in eval output / a short note. **Keep CE** only if lift shows **or** human-justified keep is written (MR2). *(baseline recorded; CE provisional keep — `evals/MODEL_FREEZE_STATUS.md`)*
- [x] **E5.** Unit/API tests (minimal): RRF stability; section dedup; CE degrade with fake CE; citation label mapping; vehicle filter isolation (no cross-vehicle hits); ask contract (`vehicle_id` required); health readiness failure when DB down (or mocked). *(14 vitest passing after lexical_query tests; vehicle filter = contract-level; cross-vehicle DB isolation + health mock still debt)*
- [x] **E6.** Root README stub update: vertical slice / not “v1 complete”; Compose + fixtures Quick Start; link ARCHITECTURE; honest stub-replacement status. Optional thin GETTING_STARTED if time remains after DoD.
- [x] **E7.** Stop. Do not start Drive ingest, PrivateGold production path, Ford ops, multimodal, true MMR, hosted CE default, or public packaging flip in this guide.

---

## Verification / Definition of Done (this guide)

**Done when all are true:**

1. Root `web/app/` removed; product routes live under `web/src/app` only.
2. `docker compose up -d` brings up Postgres+pgvector; migrations applied from `db/migrations/`.
3. Fixture ingest via **`mecharag ingest`** indexes ≥1 synthetic vehicle idempotently (second run skips same `content_hash`).
4. `POST /api/ask` with `{ "vehicle_id", "question" }` runs **real** hybrid → RRF → section dedup (default on) → CE (or degrade) → Ollama → **validated citations** — no fake candidate arrays.
5. CE timeout/failure path sets `rerank_degraded` and still returns a citation-validated answer or honest insufficient-evidence — never invented mechanical advice from empty evidence.
6. `GET /api/health` distinguishes liveness vs readiness (Postgres + Ollama).
7. Minimal golden eval (≥5 cases) runs and emits retrieval/citation metrics plus **RRF-only vs CE** comparison and **latency/degrade** signals; CE model/runtime and embedding model/dim either **locked with evidence** or explicitly listed as “candidates pending lock” blocking portfolio ranking claims.
8. Unit tests cover CE degrade (fake CE), RRF, and citation mapping; vehicle filter isolation covered.
9. `.env.example` complete; no secrets, no OEM PDFs in fixtures; public fail-closed check exists.
10. README does not claim portfolio-complete or public flip; stack matches ARCHITECTURE (no Supabase path as default).

**Explicitly not required for this guide’s DoD:**

- ≥30 eval cases (debt documented; plan to grow)
- Final numeric release thresholds
- PrivateGoldSource production ingest / Drive / Ford
- True MMR, multimodal, streaming, GraphRAG/agents
- UI polish / INTERVIEW.md depth
- Hosted black-box reranker

---

## Blast radius and risks

| Risk | Blast radius | Mitigation in steps |
|------|----------------|---------------------|
| Dual Next app trees | UI dead / wrong routes shipped | A1 remove root `web/app` first |
| Supabase/schema.sql drift | Implementer builds obsolete path | B2 sole `db/migrations/`; stale paths non-authoritative |
| Unstable / invented chunk IDs | CE + citations corrupt; evals meaningless | Stable `chunk_id` from DB through all stages (D1–D6) |
| Score-domain confusion | Wrong ranking / fake “normalized” claims | Distinct `rrf_score` / `ce_score` (A4, D3) |
| CE latency / RAM on laptop | Ask feels broken; thrash | Small N/K, CE timeout, degrade (D3–D4); log latencies (D8, E3) |
| Shipping CE with zero lift | Interview credibility fail | E3–E4 paired eval; keep only with lift or written justification |
| Stub `{ query }` / fake results left in product | Portfolio honesty failure | D6–D7 replace stub; DoD #4 |
| Public corpus contamination | Legal / packaging failure | C1 fixtures only; C6 fail-closed |
| Embedding/CE model guessed | Silent quality theater | Named candidates + freeze gates (constraints #9; Model candidate gate; E4) |
| Scope creep (Drive/Ford/multimodal) | Burns slice budget | E7 stop; Out of scope section |
| Leaving “MMR” naming / dedup off by accident | Interview honesty + ranking drift | A5 rename + default-on; D2 order RRF → dedup → CE |

---

## Edge-case handling (must appear in implementation or tests)

| Edge case | Expected behavior |
|-----------|-------------------|
| Missing / unknown `vehicle_id` | 4xx; no retrieval |
| Empty / oversized question | 4xx |
| No hits after filters | 200 insufficient-evidence; empty/minimal citations; no invented advice |
| Ollama down / timeout | Non-200; no fabricated answer |
| Postgres down | Readiness non-200; ask non-200 |
| CE unavailable / timeout / empty scores | Degrade to RRF (+ dedup) order; `rerank_degraded=true`; still citation-validate |
| CE returns unknown `chunk_id` | Ignore / degrade; never invent rows |
| Generator cites unknown label | Reject label; do not pass through unchecked |
| Re-ingest same `content_hash` | Skip; idempotent |
| Partial ingest crash mid-version | Prior indexed version remains queryable |
| Embedding dim/model mismatch | Reject at ingest; `reindex_needed` |
| Cross-vehicle retrieval | Forbidden without explicit multi-select API (not v1) |
| Public path sees private/OEM class or PDF | Fail closed (CI/release check) |
| Diagnostics flag off | No private chunk bodies; diagnostics null/omitted |
| Second CE-less ask after degrade | Still works; degrade flag reflects that request only |

---

## Model candidate gate (implementer freezes with evidence; do not invent finals in architecture)

**Candidates** (try these; swap only with a written reason). **Freeze** with fixture evidence before portfolio ranking claims:

| Lock | Candidates (named — not frozen) | Freeze when |
|------|----------------------------------|-------------|
| Embedding model + dimension | **Primary:** Ollama `nomic-embed-text` @ **768** (aligns with AI KB local stack). **Alt:** Ollama `mxbai-embed-large` @ **1024** if fixture smoke shows systematic misses and dim migration cost is accepted. | Before claiming hybrid retrieval baseline |
| CE model + runtime | **Primary:** `cross-encoder/ms-marco-MiniLM-L-6-v2` (local). **Alt:** `BAAI/bge-reranker-base` if MiniLM fails quality on fixture goldens. **Runtime:** prefer in-process (transformers) or ONNX under `web/src/server/`; Python sidecar only if JS path is blocked. | Before claiming CE lift vs RRF-only |

Put the active candidate IDs in `.env.example` as placeholders; replace with frozen values only after smoke/eval evidence.

---

## Suggested verification commands (implementer)

```bash
docker compose up -d
# apply migrations if not auto-applied
# pull Ollama tags: gemma4:e2b (or OLLAMA_MODEL=qwen3.5:4b)
# pull embedding candidate once chosen, e.g.: ollama pull nomic-embed-text

# ingest fixtures — expected CLI name (flags fill in at scaffold)
mecharag ingest --source fixtures
# if flags differ, document the real invocation next to this name in README

# web
cd web && pnpm install && pnpm dev
curl -s localhost:3000/api/health
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"fixture:…","question":"…"}'

# tests + minimal golden eval — expected CLI name
pnpm test   # and/or pytest as wired
mecharag eval --golden evals/
# if eval is a thin script wrapper, keep `mecharag eval` as the documented operator name
```

Expected signals: readiness green when deps up; ask returns answer + DB-backed citations (or honest insufficient-evidence); eval prints retrieval/citation metrics, CE vs RRF-only delta, CE latency + degrade rate; re-ingest skips unchanged hashes.

---

## Stop conditions for the implementer

- Stop when this guide’s DoD is met.
- Do **not** expand into Drive, Ford, PrivateGold production, multimodal, true MMR, hosted CE default, or public flip without a new guide / human gate.
- If a stack change seems required (Supabase return, VIN-centric ask, cloud LLM required), **stop and ask** — do not reopen VISION / ARCHITECTURE locks.

---

## Honest readiness (post-Implement / Align docs pass 10)

- Guide 01 DoD **met** (pass 8c) and **re-verified** (pass 9 Review, including `gemma4:e2b` ask smoke).
- Dual Next app trees: **resolved** (`web/src/app` only).
- Models: embedding + CE remain **candidates** with smoke/provisional keep — **not** frozen for portfolio ranking claims.
- Generator: prefer **`gemma4:e2b`**; `qwen3.5:4b` is fallback + pass-8c historical baseline only.
- Residual debt (not false-checked DoD): deliberate mid-version ingest leave-prior test; DB-level cross-vehicle isolation + health mock tests; true RRF-only ask ablation; grow goldens toward ≥30; GETTING_STARTED / INTERVIEW packaging.
- **Not** portfolio-complete. **Not** public-flip ready. Do **not** expand into Drive / Ford / PrivateGold production / multimodal without a new guide.
