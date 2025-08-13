## Phase 3 — Retrieval, Generation, and API

Objective: Implement retrieval with MMR diversification, prompt construction with citations, and the `/api/ask` route.

### Steps
1) Retrieval library
   - Add Supabase client utilities to query `chunks` by vector similarity (cosine) and MMR.
   - Implement similarity thresholding and dynamic `k` (baseline: 6–12; default 8).

2) Prompt construction
   - Build a system prompt emphasizing citation requirements and safety disclaimers.
   - Include top-k chunks (de-duplicated) with their `section_path` and page ranges.

3) Generation model integration
   - Default to Gemini 2.5 Flash; add config toggle for Pro.
   - Handle retries, rate limits, and timeouts gracefully.

4) `/api/ask` route
   - Validate input; embed query; retrieve; construct prompt; call model.
   - Return answer and normalized citations array (doc name, section, page range).

5) Minimal UI wiring
   - Build a simple chat page that displays answers and expandable citations.
   - Include a compact inline disclaimer.

Exit criteria
- `/api/ask` returns answers with correct, clickable citations in dev.
- Basic UX works end-to-end locally.

