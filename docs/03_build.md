## Phase 3 — Retrieval, Generation, and API

Objective: Implement retrieval with MMR diversification, prompt construction with citations, and the `/api/ask` route.

### Steps
- [ ] **Retrieval library**
  - [ ] Add Supabase client utilities to query `chunks` by vector similarity (cosine) and MMR.
  - [ ] Implement FTS/BM25 queries via `content_tsv` and `websearch_to_tsquery`.
  - [x] Implement fusion: RRF by default (N≈50 per modality), then MMR and dynamic `k` (baseline: 6–12; default 8). Feature toggle for conditional fusion when vector confidence is high. (Stubbed in `web/src/lib/retrieval/rrf.ts`, `mmr.ts`, and used in `/api/ask`.)
- [ ] **Prompt construction**
  - [ ] Build a system prompt emphasizing citation requirements and safety disclaimers.
  - [ ] Include top-k chunks (de-duplicated) with their `section_path` and page ranges.
- [ ] **Generation model integration**
  - [ ] Default to Gemini 2.5 Flash; add config toggle for Pro.
  - [ ] Handle retries, rate limits, and timeouts gracefully.
- [ ] **`/api/ask` route**
  - [ ] Validate input; embed query; retrieve; construct prompt; call model.
  - [ ] Return answer and normalized citations array (doc name, section, page range).
- [ ] **Minimal UI wiring**
  - [x] Build a simple chat page that displays answers (stubbed retrieval results).
  - [x] Include a compact inline disclaimer.

Exit criteria
- `/api/ask` returns answers with correct, clickable citations in dev.
- Retrieval uses hybrid fusion (RRF + MMR + dynamic k) with a configuration toggle for conditional fusion.
- Basic UX works end-to-end locally.

