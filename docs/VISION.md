# Mechanic RAG — Portfolio Vision (v1)

**Status:** Active portfolio vision · **Guide 01 vertical slice done** · Formal embed/CE **frozen (Tom override)** · **LICENSE:** PolyForm-NC 1.0.0 (source-available / non-commercial) · **Fixtures-only packaging public flip Met** (Guide 10b) · **GitHub visibility public** (storefront slice 2026-07-31 — distinct from Guide 10b packaging) · Guide 11–**15** **PrivateGoldSource** · Personal-garage multimodal **M1–M3 Met** (Waterfall 2026-07-27; flags default off) · **Not** dual-product Done · **Not** friend Drive→Mechanic ingest · **Not** earned CE lift · **Not** OSI open source  
**Created:** 2026-07-12  
**Updated:** 2026-07-31 (Align: packaging Met ≠ visibility; GitHub public + sales-first storefront; private-garage evals purged from tip+history)  
**Owner:** Tom  
**Repo:** `mechanic_rag` (renamed from `mechainic_rag`; Python import package remains `mecharag`)  

**Hub SSOT (library program):** `second_brain/docs/2026-07-12_vehicle_docs_library_and_mechanic_rag_program.md`  
**Portfolio decisions:** `second_brain/docs/2026-07-12_portfolio_vision_workspace_and_decisions.md`  
**Slice status:** `docs/dev_guides/2026-07-12_dev_guide_01_hybrid_rrf_ce_ask_path.md` · `evals/MODEL_FREEZE_STATUS.md`

**Non-binding archives (do not drive v1 scope):** `docs/enhancements_rough_notes.md`, `docs/multimodal_gemini_approach_plan.md`, assorted `rough_*.md` / numbered build notes — keep for history; this file wins on intent.

---

## 1. What this is

A **public, product-shaped RAG** system over **automotive service documentation**, demonstrating senior AI engineering skills:

- Chunking + embeddings + hybrid retrieval (vector + lexical)
- Citation-backed answers
- Eval harness (≥30 cases)
- Stranger-runnable packaging (GETTING_STARTED, fixtures, no OEM PDF redistribution)
- A data layer designed for a **growing multi-vehicle documentation library** (not a one-off single-manual demo)

**Audience:** GitHub reviewers / interviewers — not a commercial shop product.

**Domain exemplar for public storytelling:** Honda S2000–shaped **synthetic** fixtures.  
**Near-term private data path (locked 2026-07-25):** Tom’s **personal garage** fleet only — curated local **RAG Gold** (Contract 7.2 text + manifest) via `PrivateGoldSource`. Allowlist: 2003 Honda S2000, 2015 Triumph Street Triple, 2021 Yamaha YXZ1000R SS SE, 2016 Ford Transit 350. **Exclude** vehicles no longer owned (Mazda2, WR250X). Never raw OEM PDFs in public git; never Mechanic←Drive ingest.

**Related friend/ops program (separate, unchanged — not Mechanic private corpus):** Shop library for a diesel-mechanic friend; **completed PDFs / HTML ZIPs delivered via Google Drive**. See second_brain vehicle library SSOT. Friend Drive Gold ≠ Mechanic ingest input.

**Public/private boundary:** Real OEM documents are expected in the **private library** and friend-delivery path. The private workflow does not enforce legal/rights gating. This public portfolio repo accepts only synthetic/redistributable fixtures, keeps private corpus roots out of git, and must fail public-release checks if OEM/private artifacts appear.

---

## 2. Portfolio slot

| Slot | Proof |
|------|--------|
| Product RAG | End-to-end ask → retrieve → generate → citations (**Guide 01 path live**) |
| Retrieval quality | Hybrid → RRF → local cross-encoder (N→K) + eval vs RRF-only (**path live**; ≥30 S2000 goldens Guide 04; Guide 07–08 discriminative attempts → n=44 paired ask still flat delta / helps=0; Guide 05 keep history; Guide 09 Path B — embed/CE **frozen (Tom override)**, CE stays in stack; **no** lift claim) |
| Data engineering for RAG | Multi-vehicle catalog, ingest idempotency, status-aware corpus growth |
| Engineering honesty | No fake candidates in product ask; frozen-by-override ≠ earned CE lift; fixtures-only flip ≠ OSI open source; Guide 11–15 PrivateGold Met (fixture + Soft Adjust synthetic + live Soft Adjust pilot + Soft Adjust ask smoke) ≠ friend Drive Soft Adjust Review Met / dual-product Done |

---

## 3. Relationship to the vehicle docs library

Mechanic is the **RAG consumer**, not the Ford bulk downloader.

| Concern | Owner |
|---------|--------|
| Capture queue / raw PDFs / PTS ops | `fetch-ford-service-manuals` (private) |
| Process / unify → per-vehicle service, wiring, connectors packages | Library program (see hub SSOT; near-term likely Ford repo process stages) |
| Chunk → embed → index → ask → eval | **This repo** |
| Public redistributable corpus | Synthetic fixtures in this repo only |

**Status awareness (required in product thinking):**

Operators (and eventually APIs/docs) must distinguish:

1. **Capture status** (Ford queue: pending / incomplete / complete / failed / …)
2. **Process / unify status** (not_started → ready / failed / stale)
3. **RAG index status** (not_indexed / indexed / reindex_needed)

A vehicle that is capture-complete is **not** automatically RAG-ready. Portfolio v1 may implement a **minimal catalog table** even if private Ford sync lands later.

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
| Library program | Hub SSOT in second_brain (vehicle docs library doc) |
| Code | Guide 01 path: Next.js `web/src/app` + hybrid→RRF→section dedup→CE + Ollama citations; stub ask **retired** |
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

Honest progress after Guide 01 (Align docs pass 10). Checked items = **path exists with evidence**. Portfolio **fixtures-only public flip / “v1 Done” marketing** Met Guide 10b — still **not** earned CE lift, **not** OSI open source, **not** Drive-as-ingest / friend Soft Adjust Review Met / dual-product Done (Guide 11–15 PrivateGoldSource = fixture + Soft Adjust synthetic + **live Soft Adjust pilot** + **Soft Adjust ask smoke**; still incomplete Gold).

- [x] Real retrieve path (no fake candidates) — Guide 01
- [x] Hybrid → RRF → local CE + citations in API response (include `vehicle_id` / doc family) — Guide 01; embed/CE later **frozen (Tom override)** Guide 09
- [x] ≥30 eval cases with documented metrics (incl. CE lift vs RRF-only or justified keep) — Guide 04: **30**; Guide 07 Path A: n=**38** flat; Guide 08 T1: n=**44** flat (helps=0/hurts=0); Guide 05 keep history; CE remains in pipeline; **no** lift claim; proxy `+1`/`n=5` retired as freeze evidence
- [x] Clone-and-run with fixtures (no OEM PDFs; Compose Postgres) — README Quick Start; fixtures only
- [x] README + GETTING_STARTED + architecture + FAQ — Guide 03 packaging; Guide 04–10b honesty for n/delta + freeze-override + LICENSE + fixtures-only public flip
- [x] Extensibility notes for multimodal **and** multi-vehicle library growth in architecture (not full private sync required)
- [x] Minimal vehicle catalog (even if fixture-backed) — `vehicles` + fixture ingest
- [x] Formal embed/CE **freeze** — Guide 09 Path B **Tom override** (n=44 `ce_vs_rrf_ask_delta_hits=0`; frozen despite flat delta; **not** earned lift — see `evals/MODEL_FREEZE_STATUS.md`)
- [x] Public flip / portfolio “v1 Done” marketing claim — Guide 10b **fixtures-only** (fail-closed OK; S2 attestation; freeze = Tom override not lift; PolyForm-NC ≠ OSI — see `docs/PUBLIC_FLIP_CHECKLIST.md`)

**§9 checked rows mean capability + fixtures-only public flip packaging exist with evidence.** Guide 09 freezes models by **override** while paired-ask delta stays **0** — freeze ≠ earned CE lift. Guide 10a LICENSE is source-available / non-commercial — **not** OSI open source. Guide 10b flip ≠ Drive / second-vehicle themes. Guide 11–**15** PrivateGoldSource Met (fixture + Soft Adjust synthetic + live Soft Adjust pilot via receipt→`gold_status` + Soft Adjust ask smoke for synthetic Soft Adjust vehicle) ≠ friend Drive Soft Adjust Review Met ≠ dual-product Done.

---

## 10. Alignment with senior AI eng portfolio

Demonstrates production-shaped RAG (not a notebook): APIs, hybrid retrieval → fusion → cross-encoder rerank, evals, packaging, honest limitations, and DE-aware corpus growth — complementary to AlphaGuard (agents/streaming) and Eyeglass (MLOps/CV). The private Ford → process → Mechanic path is the **real** data story for interviews; public git stays legally clean.
