# Mechanic RAG — Portfolio Vision (v1)

**Status:** Active portfolio vision · Formal embed/CE **frozen** (not earned lift) · **LICENSE:** PolyForm-NC 1.0.0 (source-available / non-commercial) · Fixtures-only public packaging · **GitHub visibility public** · Personal-garage multimodal paths exist locally (flags default **off**) · **Not** dual-product Done · **Not** friend Drive→Mechanic ingest · **Not** OSI open source  
**Created:** 2026-07-12  
**Updated:** 2026-08-02 (R2 — product English lead; private hub links removed from outward surface)  
**Owner:** Tom  
**Repo:** `mechanic_rag` (renamed from `mechainic_rag`; Python import package remains `mecharag`)  

**Diligence:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`../GETTING_STARTED.md`](../GETTING_STARTED.md) · [`../FAQ.md`](../FAQ.md) · [`../evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md)

**Non-binding archives:** numbered build notes under `docs/` — history only; this file wins on intent.

---

## 1. What this is

A **public, product-shaped RAG** system over **automotive service documentation**, demonstrating senior AI engineering craft:

- Chunking + embeddings + hybrid retrieval (vector + lexical)
- Citation-backed answers
- Eval harness (≥30 cases)
- Stranger-runnable packaging (GETTING_STARTED, fixtures, no OEM PDF redistribution)
- A data layer designed for a **growing multi-vehicle documentation library** (not a one-off single-manual demo)

**Audience:** GitHub reviewers / hiring diligence — not a commercial shop product.

**Domain exemplar for public storytelling:** Honda S2000–shaped **synthetic** fixtures.  
**Local private data (optional):** a personal garage fleet may be ingested via an explicit local gold root (`PrivateGoldSource`) — never raw OEM PDFs in public git; never Mechanic←Drive ingest. Strangers who only run fixtures see the public Honda demo only.

**Related ops (separate):** A friend shop library / Drive delivery program is **not** Mechanic ingest input and is not linked from this public surface.

**Public/private boundary:** Real OEM documents stay in private libraries. This public portfolio repo accepts only synthetic/redistributable fixtures, keeps private corpus roots out of git, and must fail public-release checks if OEM/private artifacts appear.

---

## 2. Portfolio slot

| Slot | Proof |
|------|--------|
| Product RAG | End-to-end ask → retrieve → generate → citations |
| Retrieval quality | Hybrid → RRF → local cross-encoder (N→K) + eval vs RRF-only (path live; paired-ask still flat — **no** lift claim; CE stays in stack) |
| Data engineering for RAG | Multi-vehicle catalog, ingest idempotency, status-aware corpus growth |
| Engineering honesty | No fake candidates in product ask; freeze-by-override ≠ earned CE lift; fixtures-only flip ≠ OSI open source; local private gold lanes ≠ friend Drive Done |

---

## 3. Relationship to the vehicle docs library

Mechanic is the **RAG consumer**, not a Ford bulk downloader.

| Concern | Owner |
|---------|--------|
| Capture queue / raw PDFs / PTS ops | Separate private capture tooling |
| Process / unify → per-vehicle packages | Separate library program |
| Chunk → embed → index → ask → eval | **This repo** |
| Public redistributable corpus | Synthetic fixtures in this repo only |

**Status awareness (required in product thinking):**

Operators (and eventually APIs/docs) must distinguish:

1. **Capture status** (pending / incomplete / complete / failed / …)
2. **Process / unify status** (not_started → ready / failed / stale)
3. **RAG index status** (not_indexed / indexed / reindex_needed)

A vehicle that is capture-complete is **not** automatically RAG-ready. Portfolio v1 may implement a **minimal catalog table** even if private sync lands later.

**Growth expectation:** Fleet expands for years. Schema, ingest, and evals must assume many `vehicle_id`s and doc families (`service_manual`, `wiring`, `connectors`, …).

---

## 4. v1 scope (text-first, multi-vehicle-ready)

**In scope**
- Text chunks only (synthetic/public fixtures for public clones)
- Hybrid lexical + vector retrieval → RRF → local cross-encoder rerank (N→K; degrade to RRF-only)
- Citations (vehicle, document/family, section, page range when available)
- Eval set + smoke path (incl. CE lift vs RRF-only)
- Docs: README, GETTING_STARTED, architecture, FAQ/tradeoffs, `.env.example`, fork/run welcome
- Generator: local **Ollama** — operator default **`gemma4:e2b`** (pass 9 smoke OK); fallback **`qwen3.5:4b`** (pass 8c historical baseline)
- **Local Postgres + pgvector via Docker Compose only**
- Multi-vehicle **schema + catalog** (even if fixtures only ship 1–2 synthetic vehicles)

**Out of scope for v1**
- Claiming public demo **requires** VLM/image channel on (flags stay default off; M0 text remains the stranger-runnable path) — see §5 for private-garage M1–M3 Met honesty
- Redistributing OEM PDFs
- Supabase or any required/optional hosted DB
- Ford PTS auth, bulk orchestrator, or CDP capture inside this repo
- Required Vercel/hosted demo
- “Perfect” coverage of any real OEM corpus
- Blocking public v1 on completion of Ford processing/unification

---

## 5. Extensibility — multimodal roadmap (design now; implement by stage)

v1 portfolio ship is **M0 text-only**, but architecture must **not paint us into a corner**. Each later stage must remain **public-portfolio viable** (fixtures-only public clone; private OEM stays local; honest claims).

| Stage | Name | Ship claim (honest) | Status (2026-07-27 Align) |
|-------|------|---------------------|---------------------------|
| **M0** | Text RAG (v1) | Hybrid retrieve → RRF → CE → citations over **text** | **Met** (fixtures + personal garage) |
| **M1** | Linked visuals | Text hits can **show** page/figure assets joined by locators | **Met** (Review Pass) — ask never rasterizes; `GET /api/assets` may |
| **M2** | Multimodal retrieve | Also retrieve via image/caption channels; fuse ID lists | **Met** (Pass-with-nits) — CLIP optional `[m2]`; Option A text citations |
| **M3** | Vision answers | Optional VLM path for diagram questions; text remains source of torque/spec truth | **Met** (Pass-with-nits) — `MECHANIC_VLM` **default off**; cache-hit PNGs only |

**Honest public claim:** Fixtures-first portfolio still leads with **M0 text RAG**. M1–M3 are **real on the personal garage** under local flags; do **not** market “vision RAG replaces manuals” or imply VLM is on by default in demos.

**Design rules (binding):**
1. Chunk / retrieval **interfaces** accept a modality field (`text` now; `image` / `table` later).
2. Storage schema leaves room for optional secondary embeddings (nullable columns / separate collections) without rewriting the ask API contract.
3. Fusion / ranking stays modality-agnostic on ID lists: RRF (+ optional section dedup) → local CE on **text** pairs in M0/M1; multimodal CE is M2+.
4. **Anti-rework:** prefer stable page/document locators so text Gold/chunks are not discarded when assets arrive.
5. Do **not** implement M1–M3 inside unrelated text guides; each stage needs its own guide + DoD + eval honesty.

**Explicit:** Multimodal docs must not redefine the **M0 v1** finish line. M1–M3 are roadmap stages, not silent scope on text ingest.

---

## 6. Extensibility — library growth (binding)

1. Every chunk and citation carries `vehicle_id` (and preferably year/make/model metadata).
2. Doc family is first-class (`service_manual` | `wiring` | `connectors` | future).
3. Ingest is **per-vehicle idempotent**; adding vehicle N must not require reindexing 1..N-1 unless schema migrates.
4. Config selects corpus root: `fixtures/` (public) vs private library path (local only).
5. Catalog lists vehicles × families × process/index status (minimal v1 OK).

---

## 7. Foundation strategy

| Layer | Decision |
|-------|----------|
| Product docs | **This VISION** is SSOT for Mechanic product intent |
| Library program | Separate private library program (not linked from this public surface) |
| Code | Next.js `web/src/app` + hybrid→RRF→section dedup→CE + Ollama citations; stub ask **retired** |
| Database | **Local Compose Postgres+pgvector only** — no Supabase |
| Multimodal plans | Archive / defer |
| Scratch wipe? | **No** |
| Real Ford corpus | Private ingest **after** process/unify; not required for public DoD |

---

## 8. Locked decisions (Mechanic)

| ID | Choice |
|----|--------|
| DB | Local Postgres + pgvector (Compose) — **no Supabase optional** |
| Generator default | Ollama **`gemma4:e2b`** (fallback `qwen3.5:4b`) |
| Ranking | Hybrid → RRF → local CE (N→K); degrade to RRF-only; eval lift (MR2) |
| Public corpus | Synthetic redistributable fixtures |
| Modality v1 | Text-only; extensible later |
| Vehicle model | Multi-vehicle schema from v1 |
| OEM PDFs | Never in public git |

---

## 9. Success (portfolio v1)

Honest progress. Checked items = **path exists with evidence**. Fixtures-only public packaging is Met — still **not** earned CE lift, **not** OSI open source, **not** Drive-as-ingest / friend Drive Done / dual-product Done (local private gold lanes may exist; Gold can still be incomplete).

- [x] Real retrieve path (no fake candidates)
- [x] Hybrid → RRF → local CE + citations in API response (include `vehicle_id` / doc family); embed/CE later **frozen** (not earned lift)
- [x] ≥30 eval cases with documented metrics (incl. CE lift vs RRF-only or justified keep) — current discriminative set n=**44** flat (helps=0/hurts=0); CE remains in pipeline; **no** lift claim; proxy `+1`/`n=5` retired as freeze evidence
- [x] Clone-and-run with fixtures (no OEM PDFs; Compose Postgres) — README Try it; fixtures only
- [x] README + GETTING_STARTED + architecture + FAQ — packaging + honesty for n/delta + freeze + LICENSE + fixtures-only public flip
- [x] Extensibility notes for multimodal **and** multi-vehicle library growth in architecture (not full private sync required)
- [x] Minimal vehicle catalog (even if fixture-backed) — `vehicles` + fixture ingest
- [x] Formal embed/CE **freeze** — Path B override (n=44 `ce_vs_rrf_ask_delta_hits=0`; frozen despite flat delta; **not** earned lift — see `evals/MODEL_FREEZE_STATUS.md`)
- [x] Public flip / portfolio “v1 Done” marketing claim — **fixtures-only** (fail-closed OK; freeze = override not lift; PolyForm-NC ≠ OSI)

**§9 checked rows mean capability + fixtures-only public flip packaging exist with evidence.** Freeze-by-override while paired-ask delta stays **0** — freeze ≠ earned CE lift. LICENSE is source-available / non-commercial — **not** OSI open source. Fixtures flip ≠ Drive / second-vehicle themes. Local private gold Met ≠ friend Drive Done ≠ dual-product Done.

---

## 10. Alignment with senior AI eng portfolio

Demonstrates production-shaped RAG (not a notebook): APIs, hybrid retrieval → fusion → cross-encoder rerank, evals, packaging, honest limitations, and DE-aware corpus growth — complementary to AlphaGuard (agents/streaming) and Eyeglass (MLOps/CV). The private capture → process → Mechanic path is the **real** long-horizon data story; public git stays legally clean.
