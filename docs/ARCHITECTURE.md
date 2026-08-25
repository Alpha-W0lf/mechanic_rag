# Mechanic RAG — Architecture (v1)

**Status:** Binding contracts SSOT · *(2026-08-25: hosted public demo serves queries via Gemini — see `evals/MODEL_FREEZE_STATUS.md`; contracts unchanged)* · Vertical slice implemented · Formal embed/CE **frozen (owner decision)** · **LICENSE:** PolyForm-NC 1.0.0 · Fixtures-only public packaging complete · Private-gold-source path implemented (fixture + synthetic + live pilot) · Personal-garage multimodal M1–M3 done (flags default off) · **Not** dual-product Done · **Not** friend Drive→Mechanic · **Not** earned CE lift · **Not** OSI open source  
**Created:** 2026-07-12  
**Updated:** 2026-07-27 (Align: M2 image channel + M3 optional VLM contracts)  
**Owner:** Tom  
**Lenses:** Senior AI Engineer (primary); Data Engineer; Backend  

**SSOT vision:** [`VISION.md`](./VISION.md)  
**Freeze honesty:** [`../evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md)`

This document freezes v1 components, data contracts, ranking, corpus boundaries, and failure behavior. It does **not** authorize public redistribution beyond fixtures, Drive/Ford operations, multimodal work, or claims of portfolio completeness beyond what is documented here.

> **Terminology:** `Guide NN` tags mark numbered internal build milestones — historical provenance for when a capability landed. They are read-only history; current truth is what this document states.

**Non-authoritative for v1:** `docs/api_contracts.md`, `docs/dev_setup.md`, `db/schema.sql`, `supabase/**`, Supabase/Gemini/multimodal research notes, and the **retired** stub ask under deleted `web/app/`. Live product path is `web/src/app/api/ask` + `web/src/server/ask.ts`.

---

## 1. Purpose

Mechanic RAG is a **public, product-shaped RAG** over automotive service documentation: hybrid retrieval, citation-backed answers, eval harness, and clone-and-run fixtures — designed for a **growing multi-vehicle library**, not a single-manual demo.

| Audience | GitHub reviewers / interviewers |
|----------|--------------------------------|
| Public corpus | Synthetic / redistributable fixtures only |
| Private corpus | Local Gold RAG artifacts (outside git) |
| Not this product | Commercial shop tool, Ford capture, Drive client, VIN lookup |

---

## 2. Locked stack (do not reopen)

| Concern | Choice | Lock |
|---------|--------|------|
| Web app | Next.js App Router under **`web/src/app`** | MR1 |
| Offline ingest | Python CLI (`mecharag` package); not a web service | — |
| Database | Local **Compose Postgres + pgvector only** — **no Supabase** | D3, D12 |
| Generator | Host **Ollama**; portfolio default `gemma4:e2b`, fallback `qwen3.5:4b` | D4, D1 |
| Embeddings | One **local** embedding adapter (prefer Ollama-hosted); fixed model + dimension locked after fixture benchmark | — |
| Lexical | Postgres generated **`tsvector` + GIN**, config **`simple`** | MR2 |
| Ranking | Vector + lexical → **RRF** → optional **section dedup** → **local cross-encoder** (N→K); **degrade to RRF-only** on CE failure; eval must show lift or justify keep | MR2 |
| Modality v1 | Text-only; multimodal hooks only | D10 |
| Vehicle identity | year + make + model + engine (+ nullable trim). **Not VIN-centric** | S4 |
| Public corpus | Fixtures only; fail-closed | D5, P1 |
| Private corpus | Local Gold root; Drive is **human delivery only** | GD1–GD5 |
| Cloud DB / hosted demo | Rejected | D12, D11 |

---

## 3. Runtime overview

```text
Public fixtures/  OR  private local Gold root (config; never both as default)
        │
        ▼
 FixtureSource | PrivateGoldSource
        │  (one versioned NormalizedDocumentManifest interface)
        ▼
 validate → text chunk → embed → transactional upsert
        │
        └──── offline Python ingest CLI ────┘
                          │
                          ▼
             Compose Postgres + pgvector
                          ▲
                          │ vehicle-filtered vector + FTS
 Browser → Next (web/src/app)
              → ask service (web/src/server)
              → vehicle-filtered vector + FTS
              → RRF (+ optional section dedup)
              → local cross-encoder (N→K; degrade → RRF order)
              → Ollama (host)
              → server-derived citations
```

**Exactly two executable product processes in v1:**

1. **Offline Python ingest CLI** — adapters, validation, chunking, embedding, upsert.
2. **Next.js web/API** — ask orchestration, retrieval, generation, citations, health.

**Integration boundary:** Postgres. Do not add FastAPI, queues, a second vector store, Kafka, or Drive/Google APIs to v1.

**Host Ollama:** generation (and embeddings if selected). Never a required cloud LLM/DB.

---

## 4. Repository layout (target)

| Path | Role |
|------|------|
| `web/src/app/` | **Canonical** pages + HTTP route handlers (`/api/ask`, `/api/health`, UI) |
| `web/src/server/` | Server-only ask orchestration, DB repos, retrievers, **cross-encoder adapter** (model I/O), Ollama adapter, citation assembly |
| `web/src/lib/retrieval/` | Pure ranking/fusion/dedup types and algorithms (RRF, section dedup); **no** DB, Next, or CE model runtime imports |
| `scripts/ingest/` + Python package | Offline CLI: sources, validate, chunk, embed, upsert |
| `contracts/` | Versioned Gold/fixture manifest schema + public API schemas |
| `db/migrations/` | **Sole** schema authority (Compose init/migrate applies these) |
| `fixtures/` | Synthetic/redistributable manifests + text only |
| `evals/` | Versioned fixture cases + harness inputs (no private corpus) |
| `docker-compose.yml` | Postgres+pgvector only |

**MR1 — app tree (done in Guide 01):** Canonical tree is **`web/src/app` only**. Root `web/app/` is **removed**. Do not recreate a dual app tree — Next ignores `src/app` when root `app/` exists.

**Stale paths (do not extend):** `db/schema.sql`, `supabase/**`, Gemini multimodal ingest, `scripts/deploy/upload_assets.py` as product paths.

---

## 5. Corpus boundary (binding)

### 5.1 Drive vs Mechanic (GD1–GD5)

| Rule | Binding |
|------|---------|
| **GD1** | Google Drive = **human delivery** endpoint only (Tom / mechanic friend). |
| **GD2** | Mechanic **private** ingest reads a configured **local Gold root** — never Drive. |
| **GD3–GD4** | Drive publish is operator `rclone copy` (one-way local → Drive). Never `sync`. Never Mechanic←Drive. |
| **GD5** | Backup of Bronze/catalog is a library/ops concern — not a Mechanic runtime dependency. |

Mechanic must **not** implement Drive OAuth, listing, download, or upload clients.

### 5.2 Adapters (MR3)

One versioned **NormalizedDocumentManifest** interface; two adapters:

| Adapter | Input | Trust |
|---------|-------|-------|
| **`FixtureSource`** | Allowlisted paths under `fixtures/` only | Public-safe; CI/release must reject PDFs, private roots, `private_oem`, and non-allowlisted classes |
| **`PrivateGoldSource`** | Configured local Gold root via `MECHANIC_PRIVATE_GOLD_ROOT` / `--root` (outside default `fixtures/`) | **Guide 11–12** fixture Met. **Guide 13** Soft Adjust synthetic `cat:`/`private_oem` + required `gold_status`. **Guide 14 Soft Adjust live pilot:** map Vehicle `present_only_receipt.json` → `gold_status.json` (`mecharag receipt-to-gold-status`); ingest/load local live emit (e.g. `cat:2017-f-150`). **Guide 15 Soft Adjust ask smoke:** synthetic `cat:demo-synthetic-f150` through `/api/ask` (unit/contract Met; HTTP when stack up) — incomplete Gold may yield `insufficient_evidence` — **not** friend rclone Review Met / dual-product Done / Ford PTS / live F-150 upsert Met. **Never** Drive (GD2). |

Downstream chunk/embed/upsert code is shared. Do **not** use a single adapter toggled by a dangerous “trust mode” flag that can point public defaults at private roots.

### 5.3 Public fail-closed

Public clone/CI/release checks **fail closed** if:

- OEM/private PDFs or extracted OEM text appear in tracked paths
- Private Gold roots / credentials appear in default config or fixtures
- Manifest class is not in the public allowlist

Private local ingest intentionally does **not** enforce a legal/rights gate (P1). The two worlds must never share roots, credentials, or default config.

### 5.4 Gold granularity (MR4)

| Layer | Owns |
|-------|------|
| Upstream (vehicle library / Ford process) | Parse/normalize → **validated page/section text + lineage** Gold artifacts |
| Mechanic | **Retrieval chunking**, embedding, index state |
| Shared catalog (when present) | Canonical **`vehicle_id`** issuance |

Mechanic v1 consumes **text-first Gold / fixtures**, not raw PDFs. Fixtures use reserved **`fixture:`** `vehicle_id` prefix; catalog-issued private IDs use **`cat:`** . Same identity fields (year/make/model/engine/+trim); no VIN keys.

**Shared field SSOT (semantic):** Mechanic `NormalizedDocumentManifest` must accept the library emit fields (`corpus_version`, `content_hash`, `artifact_version`, provenance, page/section locators). **Schemas-as-code:** `mechanic_rag/contracts/normalized_document_manifest.schema.json` + field inventory `rag_gold_normalized_document_manifest_FIELDS.md`; validator `scripts/validate/validate_manifest.py`.

---

## 6. Relational model (v1)

`db/migrations/` is the only schema authority. Supabase-era `db/schema.sql` is obsolete.

### 6.1 `vehicles`

| Field | Notes |
|-------|-------|
| `vehicle_id` | Stable text PK; `fixture:` (public) or `cat:` (catalog-issued private) |
| `year`, `make`, `model`, `engine` | Required identity |
| `trim` | Nullable |
| — | **No VIN column as identity key**; VIN may appear only as optional instance metadata later, never as catalog key |

### 6.2 `documents`

| Field | Notes |
|-------|-------|
| Stable document + **version** identity | Same logical doc across versions (`document_id` + `artifact_version`) |
| `vehicle_id` | FK (`fixture:` or `cat:` per §5.4) |
| `doc_family` | `service_manual` \| `wiring` \| `connectors` \| … |
| Source / provenance | Upstream `adapter_id`/`source_id`, opaque source IDs, redacted locator, `observation_id`(s), `export_id` as available |
| `content_hash` | For idempotent skip |
| `artifact_version` | Gold/fixture version |
| `corpus_version` / release pointer | From library Gold manifest; bump → `reindex_needed` |
| Page/section metadata | `page_start`/`page_end`, `section_path`, heading — enough for citation locators before chunking |

Uniqueness is **per vehicle × family × source/version**, not a global unique `source_name`.

### 6.3 `chunks`

| Field | Notes |
|-------|-------|
| **Stable `chunk_id`** | Shared by vector retriever, lexical retriever, RRF, **cross-encoder**, citations — CE never invents IDs |
| Document/version FK | |
| `vehicle_id`, `doc_family` | Denormalized or join-enforced for filters |
| Page/section locator | `page_start`/`page_end`, `section_path`, heading |
| `content`, content checksum | |
| `modality` | `'text'` in v1 |
| `embedding` | **Fixed dimension** matching locked embedding model |
| Lexical | Generated `tsvector` (`simple`) + **GIN** index |
| Embedding model/version | Stored for compatibility checks |

Vector index: HNSW or IVFFlat over the **fixed-dimension** column only. Do not leave unbounded `vector` with a non-expression IVFFlat index.

### 6.4 `index_state`

Mechanic-owned only:

- Keys: `vehicle_id` × `doc_family` (and index/embedding/chunker versions as needed)
- Status: `not_indexed` \| `indexed` \| `reindex_needed` \| `blocked`
- Does **not** store capture, process/unify, or Drive upload state (those stay upstream — L2)
- **Cross-encoder is query-time only** — do **not** key `index_state` on CE model version; log CE version on ask instead

### 6.5 Ingest transactions

1. Validate the full manifest before writes.
2. Upsert one document version **atomically**.
3. Unchanged `content_hash` → skip.
4. Failed new version → leave prior indexed version queryable.
5. Embedding/chunker/schema version change → mark affected vehicle×family `reindex_needed`; reject incompatible vectors at ingest.

---

## 7. Ranking contract (binding — MR2)

This is the portfolio RAG ranking product surface (Mechanic = primary teaching showcase). Implement exactly this order; do not invent parallel scorers.

**Pipeline (binding order):**

```text
vehicle-filtered vector + lexical (independent, topN each)
        → RRF fuse (stable chunk_id)
        → optional section dedup
        → take top N → local cross-encoder → top K
        → context assembly + citation labels
```

Provisional sizes (document defaults; **tune only with eval evidence** — do not leave stages optional or unordered):

| Symbol | Meaning | Provisional default |
|--------|---------|---------------------|
| `topN` | Cap per independent retriever (vector / lexical) | 50 |
| **N** | CE shortlist size after RRF (+ optional dedup) | 20 |
| **K** | Final chunks after CE for context assembly | 8 |

### 7.1 Retrieve independently

1. Require a canonical **`vehicle_id`** on every ask (no all-vehicle fallback; no VIN lookup).
2. Optionally filter by `doc_family` when the API supplies it.
3. Run **vector** ANN and **lexical** FTS as **independent** queries against Postgres.
4. Both result lists must use the **same stable `chunk_id`** values for the same chunk rows.
5. Cap each list at `topN` (provisional default 50).

**Lexical:** Postgres `to_tsvector('simple', …)` / `plainto_tsquery('simple', …)` (or equivalent generated column) + GIN. Not a separate OpenSearch/Elastic service. Optional trigram/exact supplementation only if fixture evals show systematic misses — not v1 day-one scope.

### 7.2 Fuse with RRF

- Pure reciprocal-rank fusion over the two rank lists:  
  `rrf_score(id) += 1 / (k + rank)` with default `k = 60`.
- RRF scores are **rank-derived sums**, not normalized `[0,1]` similarity. Types/docs must not claim otherwise.
- Existing `web/src/lib/retrieval/rrf.ts` is a valid seed once IDs are stable across retrievers.

### 7.3 Section deduplication (honest naming)

- Optional pass **after RRF and before CE** may drop or demote near-duplicate chunks that share the same document + `section_path` (deterministic section diversification).
- Binding order with CE: **RRF → optional section dedup → CE**. Do not run a second competing dedup pipeline after CE unless a later eval decision says so.
- Live `web/src/lib/retrieval/section_dedup.ts` implements **that** behavior (binary same-section penalty; default on in ask path). It is **not** true MMR (no candidate–candidate embedding similarity). The old `mmr.ts` name is retired.
- **v1 binding name:** section deduplication. Do **not** advertise “MMR” until a true embedding-similarity MMR exists **and** evals justify it.

### 7.4 Cross-encoder rerank (required — MR2)

1. Take the top **N** fused (+ optional deduped) **`chunk_id`s** — CE operates only on IDs already present in the fused list; **never invent rows**.
2. Load chunk text from DB for those IDs; score **(query, chunk_text)** pairs with a **local** cross-encoder.
3. Sort by **`ce_score`**; keep top **K** for context assembly.
4. **Score-domain honesty:** do not reuse a single ambiguous `score` field across stages. Prefer distinct names (`rrf_score`, `ce_score`) in types, diagnostics, and logs. RRF and CE scores are **not** interchangeable or `[0,1]`-normalized unless a specific model documents that scale.
5. **Module boundary:** CE model load/infer lives under `web/src/server/` (adapter). Keep `web/src/lib/retrieval/` free of ONNX/HTTP/model runtimes — pure fusion/dedup only.
6. **Local CE preferred** (offline/privacy). Hosted Cohere/Voyage-as-default without N/K, degrade, and eval is **rejected**. Final CE model weights/runtime for portfolio claims are locked in `evals/MODEL_FREEZE_STATUS.md` (Guide 09 Path B Tom override — flat delta honesty).
7. **Latency:** bound CE with a timeout; small K keeps cost/latency acceptable. Tradeoff vs RRF-only is accepted per portfolio decision note.

### 7.5 Degrade to RRF-only

If the reranker fails, **fail open to fused (+ optional dedup) order** — do not fail the ask solely because CE failed, and do not fabricate answers.

| Case | Required behavior |
|------|-------------------|
| CE unavailable / init fail | Serve top-K from post-RRF (+ dedup) list; mark `rerank_degraded=true` |
| CE timeout | Same degrade; do not block ask forever |
| CE returns empty / all invalid IDs | Same degrade; never invent chunks |
| CE succeeds | Use CE order for context top-K |

`rerank_degraded` must appear in structured ask logs and in `diagnostics` when the development flag is on. Degrade skips CE only — citation validation and insufficient-evidence rules still apply.

### 7.6 Context assembly

1. Take top **K** chunks (CE order, or RRF order if degraded) within a bounded token/char budget.
2. Assign server-side citation labels (`[1]`, `[2]`, …).
3. Pass only labeled context to Ollama.
4. Generator may reference only those labels; unknown labels are rejected.
5. Citation metadata is assembled from DB rows — never from model-invented paths.

### 7.7 Model locks (gates, not invented IDs)

| Lock | When |
|------|------|
| Embedding model + dimension | Before claiming hybrid retrieval eval baseline |
| CE model + runtime | Before claiming CE lift vs RRF-only |

Architecture names the gates. Portfolio model IDs are **frozen (Tom override)** in `evals/MODEL_FREEZE_STATUS.md` (Guide 09 Path B) despite n=44 flat paired-ask delta — not an earned-lift freeze.

---

## 8. Ask API contract (v1 target)

Supersedes `docs/api_contracts.md` and the retired stub route. Guide 01 implements this shape in `web/src/server/ask.ts`.

### 8.1 `POST /api/ask`

**Request (required fields):**

```json
{
  "vehicle_id": "string",
  "question": "string"
}
```

Optional later (not required for vertical slice): `doc_family`, bounded `history`. Stub’s `{ "query" }` shape is retired.

**Success 200:**

```json
{
  "answer": "string",
  "citations": [
    {
      "label": "1",
      "chunk_id": "string",
      "vehicle_id": "string",
      "doc_family": "string",
      "document_id": "string",
      "section_path": "string|null",
      "page_start": "integer|null",
      "page_end": "integer|null"
    }
  ],
  "diagnostics": null
}
```

`diagnostics` (retriever counts, latencies, model/index versions) only when a **development flag** is on — never private chunk bodies in logs or default responses.

**No evidence:** HTTP 200 with an explicit insufficient-evidence answer and empty/minimal citations — **not** invented mechanical advice.

**Dependency failure** (Postgres/Ollama timeout/unreachable): non-200 error — do not fabricate an answer.

**Out of default response:** VLM notes until `MECHANIC_VLM` is on. **M3 Met (2026-07-27):** optional local VLM assist (`gemma4:e2b`), fail-open, text citations own torque/spec; cache-hit PNGs only.

**M1 optional:** `visual_assets[]` with `{ chunk_id, document_id, page_start, content_type, href }` when bronze+page resolvable. Ask never rasterizes; `GET /api/assets/...` may render on miss (≤8s) or 404.

**M2 (Build):** Image retrieve channel via side table `chunk_image_embeddings` (`openai/clip-vit-base-patch32`, **512-d**). Query uses CLIP text tower (`mecharag clip-query`). Fusion: `reciprocalRankFusionMany` over text_vector + lexical + image (`k=60`). Empty/degraded image list → identical to M1 two-list RRF. Diagram hits require paired text chunk (**Option A**). Deps: optional `[m2]` only. Embed scope: full personal garage `cat:*`.

**M3 (Build Met 2026-07-27):** Optional `MECHANIC_VLM` (default off). Router: flag on ∧ (diagram UI flag ∨ heuristic); torque-only questions skip. Timeout 45s → degrade. Filter strips VLM Nm/lbf not present in cited text. Evidence: `evals/evidence/2026-07-27_m3_vlm_eval_evidence.json` · Review Pass-with-nits.

### 8.2 Frontend

Thin consumer of the ask contract: vehicle selector, question, answer + citations, empty/no-evidence and dependency-error states. No retrieval logic in the browser. UI polish is post-vertical-slice (P2).

---

## 9. Health and observability

### 9.1 `GET /api/health`

| Mode | Behavior |
|------|----------|
| Liveness | Process up → `200` |
| Readiness | Checks Postgres connectivity and Ollama reachability (bounded timeouts); not ready → non-200 |

Live `GET /api/health` distinguishes liveness (`?mode=live`) vs readiness (Postgres + Ollama). Do not regress to always-`{"status":"ok"}` as the only contract.

### 9.2 Ask path logs (structured)

Emit: request id, `vehicle_id`, vector/lexical counts + latencies, RRF result size, section-dedup drops (if any), **CE N/K**, **CE latency**, **`rerank_degraded`**, chosen `chunk_id`s, embedding/index/generator/**CE** versions, outcome. **Do not** log private chunk bodies by default.

### 9.3 Ingest logs

Emit: run id, manifest id, hashes, inserted/skipped/failed counts, final atomic status.

### 9.4 Bounds

- Max question length / context size enforced server-side.
- DB and Ollama calls time out; support request cancellation where practical.
- Portfolio obs (LangSmith/Phoenix) is optional for Mechanic v1; not a blocker for the vertical slice.

---

## 10. Evaluation (MR5)

| Layer | What |
|-------|------|
| Unit | Manifest validation, chunking determinism, RRF, section dedup, **CE degrade path (fake CE)**, citation label mapping |
| Integration | Idempotent re-ingest; vehicle filter isolation; Compose Postgres |
| API | Contract tests with fake Ollama (+ fake CE for degrade/success paths) |
| Eval set | ≥30 versioned fixture cases (grow after path works; start smaller for the slice) |

**Metrics to define now (thresholds later):**

- Retrieval: Recall@k, MRR (and/or nDCG@k) on fixture ground truth
- Citation: cited `chunk_id` / locator correctness vs allowed evidence set
- **Rerank lift (MR2):** paired comparison on the **same** fixture cases — **RRF-only (or CE-degraded) vs RRF+CE** on retrieval + citation metrics; log degrade rate in harness runs
- Generation: graded only after retrieval baseline is honest; do not gate public release on invented answer scores

**Keep CE only if** fixture evals show lift **or** a human-justified keep is recorded (MR2). Shipping a CE checkbox with zero proof fails the portfolio senior bar.

**Numeric public release thresholds:** lock only after the first honest fixture baseline (human gate). Architecture must not invent pass/fail numbers.

Broken existing `test_*.py` files are non-authoritative until rewritten against this architecture.

---

## 11. Multimodal extension hooks (design + staged roadmap — D10)

v1 **public** path ships **M0 text** by default. Staged roadmap (VISION §5): **M1** linked visuals → **M2** image retrieval → **M3** vision answers — each stage its own guide/DoD. **Private garage Waterfall (2026-07-27):** M1–M3 **Met** with optional flags; public portfolio claims stay honest per stage.

1. Chunk/retrieval types: `content_modality` on chunks (`text` now; `image` / `table` later); retriever hits use a separate channel field `modality` (`vector` / `lexical` / `fusion`) — do not overload one key.
2. Schema may reserve nullable secondary embedding columns or separate tables — **do not implement** image extraction, storage, or visual API fields in M0.
3. Fusion stays modality-agnostic: ranked ID lists in → ranked list out (CE still scores text pairs in M0/M1; multimodal CE is M2+).
4. Prefer stable `document_id` + `page_*` locators so text Gold is not discarded when assets arrive.
5. Multimodal research docs remain proposals until an explicit M1+ guide is authorized — not M0 DoD.

---

## 12. Ownership vs vehicle library

| Concern | Owner |
|---------|--------|
| Capture / PTS / Ford queues | `fetch-ford-service-manuals` |
| Process / unify / Gold build / Drive publish | Library program (near-term Ford-adjacent) |
| Shared catalog `vehicle_id` | Catalog contract / future shared repo |
| Chunk → embed → index → ask → eval | **Mechanic** |
| Public fixtures | Mechanic `fixtures/` |

Mechanic must not query Drive, Ford queues, PTS, or raw Bronze. It may store imported provenance / upstream artifact IDs for lineage but must not mutate upstream status machines.

---

## 13. Failure modes and edge cases

| Case | Required behavior |
|------|-------------------|
| Missing/unknown `vehicle_id` | 4xx; no retrieval |
| Empty question / oversized question | 4xx |
| No hits after filters | Insufficient-evidence response |
| Ollama down / timeout | Non-200; no hallucinated answer |
| Postgres down | Non-200 readiness/ask failure |
| Partial ingest crash | Prior document version remains queryable |
| Re-ingest same hash | Skip; idempotent |
| Embedding dim/model mismatch | Reject at ingest; mark `reindex_needed` |
| Public path sees private class/PDF | Fail closed (CI/release) |
| Dual Next app trees | Forbidden after MR1 implement; root `app/` removed |
| Cross-vehicle retrieval | Forbidden without explicit multi-select API (not v1) |
| CE unavailable / timeout / empty scores | Degrade to RRF (+ dedup) order; set `rerank_degraded`; still citation-validate |

---

## 14. Explicit non-goals (v1)

- Hosted black-box reranker as default (Cohere/Voyage) without N/K, degrade, and eval lift
- Second-stage **LLM** re-score as a substitute for the local CE stage
- True MMR (unless later evals justify; then separate decision)
- Supabase / cloud Postgres
- Drive or Google API clients
- Ford capture / CDP / bulk ops inside this repo
- Raw PDF ingest as the public path
- VIN-centric identity or VIN-required ask
- Multimodal retrieval / `visual_assets`
- Streaming answers, queues, FastAPI sidecar, second vector DB
- Public flip before packaging DoD
- Final numeric eval thresholds invented without baseline
- Final CE/embedding model IDs invented without fixture benchmark

---

## 15. Current code vs this architecture (honest — Align docs pass 10)

Guide 01 vertical slice landed. This table is **post-slice**, not pre-implement.

| Area | Guide 01 today | Still open (portfolio v1 / later) |
|------|----------------|-----------------------------------|
| App tree | `web/src/app` only; root `web/app` gone | Do not recreate dual trees |
| `/api/ask` | Real hybrid → RRF → section dedup → CE → Ollama + DB citations; **Guide 15 Soft Adjust ask smoke** (synthetic Soft Adjust vehicle) | Packaging polish; live Soft Adjust full-corpus upsert (ops) |
| Deps | `pg` + `@xenova/transformers` in `web/package.json`; Ollama via HTTP | — |
| Compose | `docker-compose.yml` Postgres+pgvector | — |
| Ingest | `mecharag ingest --source fixtures`; **private-gold** Guide 11–**14** (fixture + Soft Adjust synthetic + live Soft Adjust pilot) | Friend Drive Soft Adjust Review Met / dual-product Done (out) |
| Schema | `db/migrations/001_init.sql` (§6-shaped) | Grow catalog features as library sync lands |
| Ranking | §7 order live; `section_dedup.ts`; CE with degrade; Guide 02 env ablation `MECHANIC_FORCE_RRF_ONLY` + paired ask fields | LICENSE Met Guide 10a; fixtures-only public flip Met Guide 10b |
| Health | Liveness ≠ readiness | — |
| Evals/tests | **n=44** S2000 fixture goldens (Guide 04–08; T1 +3 synthetic confusable sections) + vitest; lexical metrics `*_lexical_proxy`; ask lift = citation∩gold; Guide 08 paired ask delta **0** / helps=0; Guide 05 keep history; Guide 09 Path B freeze-override; Guide 11–15 PrivateGold / Soft Adjust ask unit tests | Soft Adjust golden suite (E2) deferred; live Soft Adjust full upsert ops |
| Generator | Default / smoke: `gemma4:e2b`; fallback `qwen3.5:4b` (pass 8c historical proxy baseline) | — |

**Honesty line:** The vertical slice and fixtures-only public packaging are complete — that does **not** mean earned CE lift, OSI open source, or dual-product Done. The private-gold-source path is implemented (fixture multi-vehicle, synthetic present-only, a live receipt→`gold_status` pilot, and a synthetic ask smoke where incomplete Gold may return `insufficient_evidence`) — that does **not** mean friend-Drive review, Ford PTS, Drive ingest, or full live-corpus upsert are done. Embedding + CE are **frozen by explicit owner decision** (`evals/MODEL_FREEZE_STATUS.md`) despite the n=44 paired-ask delta of **0** / helps=0 (**no** lift claim). The keep history is retained. **LICENSE** is PolyForm-NC 1.0.0 (source-available / non-commercial — **not** OSI open source / **not** MIT). A small early proxy run (`ce_vs_rrf_delta_hits=+1`, n=5) is **not** freeze evidence.

---

## 16. Smallest implementation sequence (Guide 01 — historical)

Order used by Write-dev-guide / Implement. Steps **1–7 done** for Guide 01; step 8 remains deferred.

1. ~~Canonical `web/src/app` + remove root `web/app`~~
2. ~~Compose + `db/migrations` for §6~~
3. ~~One synthetic fixture manifest + `FixtureSource`~~
4. ~~Idempotent ingest CLI → Postgres~~
5. ~~Vehicle-filtered vector + FTS → RRF → section dedup → local CE (N→K) with degrade-to-RRF~~
6. ~~Ollama answer + validated citations~~
7. ~~Health readiness + minimal tests/evals (incl. CE degrade unit tests + first baseline)~~
8. Defer: doc archive, frontend polish, PrivateGold path beyond contract, true MMR, multimodal, Drive/Ford, hosted CE, ~~formal model freeze~~ (**Guide 09 Path B Tom override — frozen; n=44 delta 0 honesty**) ~~GETTING_STARTED/FAQ packaging~~ (**packaging landed Guide 03**) ~~≥30 evals~~ (**≥30 S2000 goldens Guide 04**; **Guide 08 T1 n=44 flat re-baseline**)

---

## 17. Decision trace

| ID | Resolution in this doc |
|----|------------------------|
| MR1 | §4 canonical `web/src/app` (**implemented**) |
| MR2 | §7 ranking + lexical + **local CE (N→K)** + degrade + eval lift (**path live**; models **frozen Tom override** Guide 09; delta 0 honesty) |
| MR3 | §5.2 adapters (FixtureSource live; PrivateGoldSource Guide 11–15 fixture + Soft Adjust synthetic + live Soft Adjust pilot + Soft Adjust ask smoke Met; friend Drive Review out) |
| MR4 | §5.4 Gold / chunking / `vehicle_id` |
| MR5 | §10 metrics now (incl. CE lift); thresholds later; first baseline recorded (n=5) |
| D3/D4/D10/D12 | §2 stack |
| S4 | §6.1 not VIN-centric |
| GD1–GD5 | §5.1 Drive human-only; local Gold ingest |
| P1 | §5.3 public fail-closed; private permissive |

**Embedding model/dimension** and **CE model/runtime:** **Frozen (Tom override)** Guide 09 — `nomic-embed-text@768`; Xenova MiniLM CE / `classification`. Paired-ask n=44 delta **0** (no lift claim). See `evals/MODEL_FREEZE_STATUS.md`. Do not reopen as Supabase/cloud/hosted-reranker-default.

**Superseded:** Pass 2 “no neural/cross-encoder reranker in v1” — overridden 2026-07-12 by portfolio MR2 + `hybrid_rag_reranker_decision.md`.
