## Project: Mechanic RAG – MVP Planning (S2000 Focus)

### 1) Goal and Scope (from notes)
- Build a RAG system specialized for the 2003 Honda S2000 using the owner's manual and service manual as initial sources.
- Production-minded MVP: simple, reliable, maintainable foundation, future-extensible to other vehicles and agentic workflows.
- Operate entirely on free tiers, using the Google Gemini API within free limits.

### 2) Constraints and Principles (confirmed and expanded)
- Free hosting and free-tier APIs only (Vercel + free DB/services).
- Prefer the simplest viable architecture (modular monolith mindset) and minimum dependencies.
- Data privacy and licensing considered; include safety/disclaimer messaging without harming UX.
- Strong emphasis on citations for retrieved passages.
- Production-grade presentation: modern, attractive UI and clear documentation as this is a portfolio project.

### 3) Identified Gaps / Risks
- Free-tier quotas: see `docs/gemini_api_notes.md` for verified RPM/TPM and model options; design to those limits.
- PDF parsing fidelity for manuals (tables, diagrams, torque specs) — requires focused research and prototyping.
- API key secrecy (no client exposure) and CORS — minimal backend required.
- Evaluation plan and acceptance criteria for “good answers.”
- Licensing posture that protects OEM IP while enabling a great UX.

### 4) Key Decisions (user-confirmed and open research)
1. Platform & language (CONFIRMED)
   - Next.js (TypeScript) with serverless API routes for a modern web UI and simple backend.

2. Hosting (CONFIRMED)
   - Vercel free tier. Entire project must rely on free/open resources.

3. Vector database (CONFIRMED)
   - Supabase (Postgres + pgvector) free tier for simplicity and durability.

4. Embeddings model (RESEARCH)
   - Candidate: Google `text-embedding-004`. Perform comparative research before committing (see `docs/embedding_research.md`).

5. Generation model (CONFIRMED DEFAULT + TOGGLE)
   - Default: Gemini 2.5 Flash for interactive throughput on free tier.
   - Toggle: Optional configuration to switch to Gemini 2.5 Pro for selected cases within free limits (see `docs/gemini_api_notes.md`).

6. Ingestion & chunking (RESEARCH-DRIVEN)
   - Extract PDF content; preserve headings and page numbers.
   - Start with ~1000–1200 chars, ~200 overlap; confirm via research/benchmarks (see `docs/chunking_research.md`).

7. Security & keys (CONFIRMED APPROACH)
   - Keep keys server-side only. Use Vercel Project Environment Variables for prod; `.env.local` for dev; commit a `.env.example`. Consider 1Password/Vercel integration for team-secret hygiene.

8. Citations (CONFIRMED)
   - Always include source doc, section heading (if available), and page range.

9. Evaluation (TO DEFINE)
   - Curate a realistic S2000 QA set; define acceptance metrics and run an offline eval (see Section 12).

### 5) Proposed MVP Architecture
- Frontend: Next.js app with a modern, attractive chat UI, message history, and source citations.
- API routes:
  - `/api/ask`: receives query, embeds query, retrieves top-k from vector DB with MMR diversification, constructs prompt, calls Gemini, returns answer + citations.
- Ingestion script (Node):
  - `ingest`: read PDFs from `rag_input/`, extract text + metadata, split into chunks, embed via chosen embedding model, upsert into Supabase pgvector (HNSW or IVFFlat index).
- Secrets management: no keys in client. Use Vercel Env Vars for prod, `.env.local` for dev, `.env.example` for onboarding; no secrets in repo or static assets.

### 6) Data Model (Supabase)
- Table `documents`: `id`, `vehicle`, `source_name`, `source_type`, `path`, `ingested_at`.
- Table `chunks`: `id`, `document_id`, `chunk_index`, `content`, `page_start`, `page_end`, `section_heading`, `embedding (vector)`.

### 7) UX Details
- Single-page chat with: question input, model answer, inline citation markers, expandable sources panel.
- Modern, polished styling (shows senior-level care): keyboard shortcuts, copy-to-clipboard, light/dark theme, responsive layout, loading states.
- Persistent disclaimer: not a substitute for a professional mechanic; verify torque specs; consult manuals.

### 8) Operational Concerns
- Rate limiting and retries around Gemini and DB.
- Logging of request ids, retrieval timings, token usage; redact sensitive info.
- Basic analytics: questions count, retrieval latency, top documents used.
- Guardrails: max answer length; ensure citations always present; refuse unsafe repair guidance without proper warnings.

### 9) Decisions: confirmed vs open
- App form factor (CONFIRMED): Web UI (Next.js). No CLI needed.
- Hosting (CONFIRMED): Vercel free.
- Vector DB (CONFIRMED): Supabase pgvector.
- Embeddings (OPEN): Research in `docs/embedding_research.md`.
- Generation model (OPEN): Favor Gemini 2.5 Flash; allow Pro when quotas permit. Validate against `docs/gemini_api_notes.md`.
- Initial documents (CONFIRMED): S2000 Owner’s + Service Manuals in `rag_input/`.
- Chunking (OPEN): Research in `docs/chunking_research.md`.
- Retrieval top-K (PROPOSED): Start k=8 with MMR; rationale in Section 11.
- Must-haves (CONFIRMED): Chat with citations, disclaimer, logging, rate limiting, polished UI.
- Non-goals v1 (CONFIRMED): Agentic workflows, crawling, multi-vehicle, auth.
- PDF parsing approach (OPEN): Research in `docs/pdf_parsing_research.md`.
- Licensing/disclaimer (TO IMPLEMENT): See Section 10.
- Evaluation acceptance criteria (TO IMPLEMENT): See Section 12.

### 10) Licensing & Disclaimer Plan (non-commercial portfolio)
- Purpose: personal, non-commercial portfolio; no monetization.
- Content handling: ingest locally; store embeddings/text snippets; do not host or redistribute full OEM PDFs.
- UI disclaimers: always show a concise, compact notice (e.g., “Advisory only. Verify against your official service manual. Use at your own risk.”). No modal; README clarifies context.
- Source attribution: identify manuals as sources without reproducing them.
- Data privacy: avoid uploading sensitive information to free-tier services; follow the guidance in `docs/gemini_api_notes.md`.

### 11) Retrieval Configuration (k rationale and tuning specifics)
- Start with k=8 to balance recall and prompt length. Manuals are broad; too small k risks missing relevant sections, too large k dilutes relevance and increases tokens.
- Diversification: Use MMR with λ in 0.3–0.5 (start at 0.4) to reduce near-duplicates.
- Dynamic k:
  - Short queries (≤5 tokens): k=6
  - Medium (6–15 tokens): k=8
  - Long (>15 tokens) or multi-part queries: k=10–12
  - If top-1 similarity ≥ 0.7, cap k at 6 to reduce redundancy; if top-1 < 0.4, increase k by +2.
- Similarity thresholding:
  - Normalize vectors; use cosine similarity.
  - Drop chunks with similarity < 0.30 by default; if fewer than 3 chunks remain, relax to 0.25.
  - If all similarities < 0.20, trigger fallback: keyword/BM25 search (if available) or prompt the model to ask for clarification.
- Query rewriting hints:
  - Expand domain acronyms/synonyms: AP1/AP2, VTEC, ECM/PCM, OBD-II, ABS.
  - Unit conversions: N·m ↔ lb-ft; mm ↔ in.
  - Lexical variants: “torque spec”/“tightening torque”/“specification”; “bleed”/“purge”/“air removal”.
  - Light lemmatization and spelling normalization (e.g., “center” vs “centre”).
  - Implement as a lightweight preprocessor; keep original query for traceability.
- Evaluate and tune parameters during offline testing (see Section 12).

### 12) Evaluation Plan & Acceptance Criteria
- Dataset: curate 30–50 S2000 queries across categories: routine maintenance, torque specs, diagnostics, fluids, safety.
- Metrics:
  - Retrieval: Recall@k, MRR@10, nDCG@10.
  - Generation: Citation presence rate, citation correctness (points to the right section/page), answer factuality (manual spot-check), safety compliance (warnings present where needed).
- Acceptance (initial targets):
  - ≥85% answers include at least one correct citation.
  - ≥75% of answers judged factually correct by manual spot-check.
  - ≥80% Recall@8 on the curated set.
- Process: run an offline evaluation script; log detailed per-query diagnostics; iterate on chunking, embeddings, and k.

### 13) Open Research Tracks (see docs/ files)
- Embeddings: `docs/embedding_research.md`
- Chunking: `docs/chunking_research.md`
- PDF parsing (text/tables/images): `docs/pdf_parsing_research.md`

### 14) Portfolio Presentation Plan
- README: rich, with architecture diagram, feature screenshots/GIFs, quick start, limitations, and roadmap.
- Demo: public live demo on Vercel; optional custom domain. Skip video per preference.
- Quality signals: tests, lint/format, CI, type-safe code, Lighthouse pass, accessibility basics, performance notes.
- Observatory: redact-aware logs; metrics panel (optional) without collecting personal data.
- Design polish: cohesive theme, dark/light, micro-interactions; showcase citations UX.

### 15) Initial Task List (post-approval)
- Lock decisions per Sections 9–12.
- Create Next.js app skeleton, polished UI scaffold, and API route stubs.
- Initialize Supabase and create pgvector indexes (HNSW/IVFFlat).
- Begin PDF parsing experiments; pick a parser for MVP.
- Implement ingestion script; ingest manuals; verify metadata (headings/pages).
- Implement retrieval with MMR and citations; integrate Gemini model with config toggle (Flash/Pro).
- Add disclaimer, basic logging, and rate limiting.
- Prepare evaluation set; run baseline; tune chunking/k as needed.

