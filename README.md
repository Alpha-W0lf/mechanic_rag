## Mechanic RAG — Portfolio MVP (text-first, multi-vehicle-ready)

Personal, non-commercial **portfolio** project. A retrieval-augmented generation (RAG) app for automotive service documentation, built for maintainability and a **growing per-vehicle library**.

**Product intent (SSOT):** [`docs/VISION.md`](docs/VISION.md) — text-only v1; local Postgres only; multimodal deferred but extensible; multi-vehicle schema from day one.

**Library program (hub):** `second_brain/docs/2026-07-12_vehicle_docs_library_and_mechanic_rag_program.md` (private Ford capture/processing feeds this app later; public clones use fixtures only).

### Features (target)
- Chat UI with source citations (vehicle, document/family, section, page range)
- Hybrid retrieval (vector + lexical); eval harness
- Local Ollama generator; local Postgres + pgvector via Compose
- Catalog-aware corpus (fixtures now; processed private packages later)
- Polished, minimalist UI with light/dark modes

### Architecture
- Next.js (TypeScript) + API routes
- Postgres + pgvector (**local Docker Compose only** — no Supabase)
- Ingestion for redistributable fixtures (no OEM PDF redistribution)

### Getting Started
See `docs/VISION.md` and (when written) GETTING_STARTED. Current `/api/ask` is still a **stub** — not portfolio-complete.

### Disclaimers
- Advisory only. Verify against your official service manual. Use at your own risk.
- No redistribution of OEM PDFs; only derived/synthetic chunk data for public clones.
- Fork and local runs welcome when the smoke path is documented.
