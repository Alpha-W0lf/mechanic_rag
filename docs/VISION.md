# Mechanic RAG — Portfolio Vision

**Status:** Active portfolio project. Fixtures-only public packaging is complete, and the embedding/cross-encoder model choice is frozen by deliberate decision (see [`MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md) for the honest evidence trail). Not yet true: an earned cross-encoder lift, a completed second-vehicle build, or an OSI-licensed release — the license is PolyForm Noncommercial (source-available, non-commercial).

> **Terminology:** `M1`–`M3` label the three multimodal milestone stages (linked visuals → image retrieval → vision-assisted answers). Read them as stage names; current truth is what this document states.

**Created:** 2026-07-12 · **Updated:** 2026-09-24 (added a hosted topology pointer to ARCHITECTURE §3.1; M1–M3 labeled parked)

**Diligence reading:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`../GETTING_STARTED.md`](../GETTING_STARTED.md) · [`../FAQ.md`](../FAQ.md) · [`../evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md)

**Non-binding archives:** the numbered build notes under `docs/` are history only — this file wins on current intent.

---

## 1. What this is

A public, product-shaped RAG system over automotive service documentation, built to demonstrate senior AI engineering craft:

- Chunking, embeddings, and hybrid retrieval (vector + lexical)
- Citation-backed answers
- A real eval harness (≥30 cases)
- Stranger-runnable packaging (`GETTING_STARTED.md`, fixtures, no OEM PDF redistribution)
- A data layer designed for a growing multi-vehicle documentation library, not a one-off single-manual demo

**Audience:** GitHub reviewers and hiring diligence — this isn't a commercial shop product.

**Public storytelling exemplar:** synthetic, Honda S2000–shaped fixtures. Optionally, a personal garage's real vehicle corpus can be ingested through an explicit local Gold root (`PrivateGoldSource`) — never raw OEM PDFs in public git, and never any kind of automated sync into it. Anyone who only runs the fixtures sees the public Honda demo only.

**Public/private boundary:** real OEM documents stay in private storage. This public repo accepts only synthetic, redistributable fixtures, keeps private corpus roots out of git entirely, and its release checks fail closed if any private artifact appears.

---

## 2. Portfolio slot

| Slot | Proof |
|------|--------|
| Product RAG | End-to-end ask → retrieve → generate → cite, working |
| Retrieval quality | Hybrid → RRF → local cross-encoder, evaluated against RRF-only (the paired-ask result is flat — no lift claim — and the cross-encoder stays in the stack anyway; see §7.4/§7.7 of the architecture doc) |
| Data engineering for RAG | A multi-vehicle catalog, idempotent ingest, status-aware corpus growth |
| Engineering honesty | No fabricated candidates on the live ask path; the model freeze is by deliberate decision, not because it earned a measured lift; fixtures-only packaging is not the same claim as an OSI license |

---

## 3. Relationship to the broader vehicle-docs library

Mechanic is the RAG consumer here, not a bulk document downloader.

| Concern | Owner |
|---------|--------|
| Capture queue, raw source documents | A separate, private capture pipeline |
| Processing / normalizing into per-vehicle packages | A separate library program |
| Chunk → embed → index → ask → eval | This repo |
| Public redistributable corpus | Synthetic fixtures, in this repo only |

**A vehicle being fully captured doesn't mean it's RAG-ready** — those are two different states, and the product needs to track both explicitly:

1. Capture status (pending / incomplete / complete / failed)
2. Process/normalize status (not started → ready / failed / stale)
3. RAG index status (not indexed / indexed / needs reindex)

v1 can implement a minimal catalog table for this even before a private sync system lands.

**Growth expectation:** the fleet is expected to grow for years. Schema, ingest, and evals are all built assuming many `vehicle_id`s and document families (`service_manual`, `wiring`, `connectors`, and more later).

---

## 4. v1 scope

**In scope**
- Text chunks only (synthetic/public fixtures for the public clone)
- Hybrid lexical + vector retrieval → RRF → local cross-encoder rerank (degrades cleanly to RRF-only)
- Citations (vehicle, document/family, section, page range where available)
- An eval set and smoke path, including the cross-encoder-lift comparison
- Full docs: README, GETTING_STARTED, architecture, FAQ, `.env.example` — genuinely fork-and-run friendly
- Generator: local Ollama, defaulting to `gemma4:e2b` (fallback `qwen3.5:4b`); the hosted public demo generates with Gemini instead — see [`ARCHITECTURE.md` §3.1](./ARCHITECTURE.md#31-production-topology-hosted-demo)
- Clone/reproduction database: local Postgres + pgvector via Docker Compose (host port 5433)
- A real multi-vehicle schema and catalog from day one, even while fixtures currently ship only 1-2 synthetic vehicles

**Hosted topology (the public demo, distinct from the clone's own stack):** Vercel Hobby + Supabase Free Postgres (the app uses `pg` + `DATABASE_URL` directly, not a Supabase client library) + the Gemini API free tier. Full detail: [`ARCHITECTURE.md` §3.1](./ARCHITECTURE.md#31-production-topology-hosted-demo). The clone/reproduction path stays Compose + Ollama regardless.

**Explicitly out of scope for v1:**
- Claiming the public demo requires a vision/image channel — the multimodal stages (M1-M3) are parked, personal-garage-only paths behind flags; the text-only path (M0) is what strangers actually run (see §5)
- Redistributing OEM PDFs
- Requiring a cloud database or Vercel account just to clone and run this locally
- Any bulk document-capture tooling (auth flows, capture queues) inside this repo
- Treating the hosted free-tier demo as an SLA-backed service
- Claiming "perfect" coverage of any real OEM corpus
- Blocking the public v1 release on the separate library program's own completion

---

## 5. Multimodal roadmap (designed now, built stage by stage)

The v1 portfolio ship is text-only (M0), but the architecture is deliberately built so later stages don't require a rewrite. Each stage stays public-portfolio viable: fixtures-only on the public clone, private OEM data stays local, and every claim stays honest about what's actually live where.

| Stage | Name | Honest ship claim | Status |
|-------|------|---------------------|--------|
| M0 | Text RAG (v1) | Hybrid retrieve → RRF → cross-encoder → citations, over text | **Live** (fixtures + personal garage) |
| M1 | Linked visuals | Text hits can show a page/figure asset joined by a stable locator | Working in the personal garage; parked for the public storefront — ask never rasterizes an image itself, though the assets endpoint may |
| M2 | Multimodal retrieve | Also retrieves via an image/caption channel, fused into the same ranked ID lists | Working in the personal garage; parked publicly — CLIP is an optional extra, paired with a text citation |
| M3 | Vision answers | An optional vision-model path for diagram questions; text stays the source of truth for torque/spec values | Working in the personal garage; parked publicly — the flag defaults off, and only cache-hit images are served |

**The honest public claim: the storefront is M0, text-only RAG.** M1-M3 are real, working, parked personal-garage capabilities — the code exists, but the flags stay off for the public demo. This is never marketed as "vision RAG replaces manuals," and image retrieval is never implied to be on by default.

**Design rules that keep this true going forward:**
1. Chunk/retrieval interfaces carry a modality field (`text` now; `image`/`table` reserved for later).
2. The storage schema leaves room for optional secondary embeddings (nullable columns or separate tables) without needing to rewrite the ask API contract.
3. Fusion and ranking stay modality-agnostic on ID lists in, ranked list out; the cross-encoder scores text pairs only through M1, with a genuinely multimodal cross-encoder deferred to M2+.
4. Stable page/document locators are preferred throughout, so text Gold data is never discarded once visual assets do arrive.
5. Each stage gets its own scoped implementation and its own honesty check — multimodal work never gets folded silently into unrelated text-path changes.

Multimodal work never redefines the M0 v1 finish line — these are roadmap stages, not silent scope creep on the text-only path.

---

## 6. Library growth (binding)

1. Every chunk and citation carries a `vehicle_id` (and ideally year/make/model metadata).
2. Document family is first-class (`service_manual` | `wiring` | `connectors` | future families).
3. Ingest is per-vehicle idempotent — adding vehicle N never requires reindexing vehicles 1 through N-1, unless the schema itself migrates.
4. The corpus root is a config choice: `fixtures/` for public, or a private library path for local-only use.
5. The catalog lists vehicles × families × process/index status (a minimal version is fine for v1).

---

## 7. Foundation strategy

| Layer | Decision |
|-------|----------|
| Product docs | This vision document is the source of truth for product intent |
| Library program | A separate, private program — not linked from this public surface |
| Code | Next.js `web/src/app` + hybrid → RRF → section dedup → cross-encoder + Ollama-generated, cited answers |
| Database | Clone: Compose Postgres + pgvector. Production demo: Supabase Free via `pg` + `DATABASE_URL` ([ARCHITECTURE §3.1](./ARCHITECTURE.md#31-production-topology-hosted-demo)) — never a Supabase client library |
| Multimodal plans | Archived/deferred until a stage is explicitly authorized |
| Real OEM corpus | Ingested privately, after the separate library program processes it — never required for the public v1 release |

---

## 8. Locked decisions

| Decision | Choice |
|----|--------|
| Database | Clone: Compose Postgres + pgvector. Production: Supabase Free via `DATABASE_URL` (ARCHITECTURE §3.1). The clone must never require a cloud dependency. |
| Default generator | Ollama `gemma4:e2b` (fallback `qwen3.5:4b`) |
| Ranking | Hybrid → RRF → local cross-encoder; degrades to RRF-only; evaluated against a lift target |
| Public corpus | Synthetic, redistributable fixtures only |
| v1 modality | Text-RAG storefront. M1-M3 personal-garage paths exist and stay parked, off the public demo |
| Vehicle model | Multi-vehicle schema from v1 onward |
| OEM PDFs | Never committed to public git |

---

## 9. What's actually proven (portfolio v1)

Every checked item below has real, working evidence behind it — not just an intention.

- [x] A real retrieval path, with no fabricated candidates
- [x] Hybrid → RRF → local cross-encoder + citations in the live API response, including `vehicle_id`/document family
- [x] A ≥30-case eval set with documented metrics, including the cross-encoder-lift comparison — the current discriminative set is n=44, flat (0 cases helped, 0 hurt); the cross-encoder stays in the pipeline regardless, with no lift claimed (an earlier n=5 proxy result is explicitly not treated as evidence — see `MODEL_FREEZE_STATUS.md`)
- [x] Clone-and-run with fixtures only — no OEM PDFs, just Compose Postgres — via the README's "try it" path
- [x] Full packaging: README, GETTING_STARTED, architecture doc, FAQ — including honest documentation of the freeze, the eval delta, the license, and the fixtures-only public boundary
- [x] Documented extensibility for both the multimodal roadmap and multi-vehicle library growth, in the architecture doc
- [x] A minimal vehicle catalog, fixture-backed, with real ingest behind it
- [x] A formal embedding/cross-encoder freeze, made by deliberate decision despite a flat measured delta (see `MODEL_FREEZE_STATUS.md` for the complete evidence trail)
- [x] A public "v1 done" claim scoped honestly to fixtures-only packaging — not to an earned lift, not to an OSI license, and not to a second vehicle's corpus being fully live

**What this list does and doesn't mean, stated once clearly:** each checked item means the capability exists with real evidence behind it — not that every stretch goal is finished. The model freeze is a deliberate decision, not an earned lift. The license (PolyForm Noncommercial) is source-available, not OSI open source. A working private-Gold ingest pilot is not the same claim as a fully completed second-vehicle corpus or an automated intake pipeline. Each of these is a distinct, specific claim, and none of them should be read into the others.

---

## 10. Alignment with the broader senior AI engineering portfolio

This project demonstrates production-shaped RAG — not a notebook: real APIs, hybrid retrieval → fusion → cross-encoder reranking, a genuine eval harness, real packaging, and honestly-stated limitations, with a data-engineering-aware approach to corpus growth. It complements AlphaGuard (agents/streaming) and Eyeglass (MLOps/CV) as a portfolio set. The private capture → process → Mechanic pipeline is the real, long-horizon data story here; the public git history stays legally clean throughout.
