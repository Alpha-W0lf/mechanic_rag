## Mechanic RAG (S2000) — MVP

Personal, non-commercial portfolio project. A retrieval-augmented generation (RAG) app specialized for the 2003 Honda S2000, built for maintainability and clarity.

### Features
- Chat UI with source citations (document, section, page range)
- Retrieval using pgvector (Supabase) and embeddings
- Gemini models (free tier) for generation
- Polished, minimalist UI with light/dark modes

### Architecture
- Next.js (TypeScript) frontend + serverless API routes (planned)
- Supabase (Postgres + pgvector) for vector search
- Ingestion script to parse PDFs, chunk, and embed

### Getting Started
1. Clone the repo.
2. Create `.env.local` from `.env.example` and fill in values.
3. Provision Supabase project (free tier) and run `db/schema.sql`.
4. Place manuals in `rag_input/`.
5. (Planned) Run ingestion script to populate embeddings.

### Disclaimers
- Advisory only. Verify against your official service manual. Use at your own risk.
- No redistribution of OEM PDFs; only derived chunk data stored.

