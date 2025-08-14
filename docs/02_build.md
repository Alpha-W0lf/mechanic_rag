## Phase 2 — Data Ingestion: PDF Parsing, Chunking, Embedding Prep

Objective: Choose a practical PDF parsing approach and implement an ingestion pipeline that produces high-quality chunks with metadata.

### Steps
- [ ] **Research (Aug 2025 landscape)**
  - [ ] Populate findings in `docs/pdf_parsing_research.md` (one search at a time; append after each).
  - [ ] Populate findings in `docs/chunking_research.md` and `docs/embedding_research.md` similarly.
- [ ] **Parser prototype**
  - [ ] Implement a text-first parser (Docling primary, PyMuPDF fallback) to extract text, headings, and page numbers.
  - [ ] For tables (maintenance schedule, torque specs), try pdfplumber/Camelot; record fidelity vs complexity.
  - [ ] Wiring diagram handling (MVP): attempt text-layer extraction for labels/legends; capture page references and section paths. Defer OCR/VLM to Phase 2 if image-only.
- [ ] **Ingestion output schema**
  - [ ] Produce JSONL records with: `document`, `page_start`, `page_end`, `section_heading`, `section_path`, `content`.
  - [ ] Validate 10–20 sample pages for fidelity and clean formatting.
- [ ] **Chunking baseline**
  - [ ] Structure-first splits; then semantic-aware refinement for long sections (>2–3k chars). Include hierarchical breadcrumbs in text prefix. Start with ~1000–1200 chars, ~200 overlap. Preserve section info and page ranges in metadata.
  - [ ] Keep tables intact where possible; avoid splitting across chunks.
- [ ] **Embedding preparation**
  - [ ] Integrate selected embedding model (initially `text-embedding-004`, pending research confirmation).
  - [ ] Upsert vectors and metadata into Supabase `chunks`.
  - [ ] Populate embedding provenance columns: `embedding_model`, `embedding_dim`, `embedding_version`, `embedded_at`.
- [ ] **Quality checks**
  - [ ] Spot-check chunk samples and their metadata for correctness.
  - [ ] Verify vector index builds and basic nearest-neighbor queries.

Exit criteria
- Parser selected for MVP with rationale in `docs/pdf_parsing_research.md`.
- Ingestion script (Python, uv-managed venv) creates chunks + metadata and loads Supabase successfully (including provenance columns).
- Wiring diagram text-layer extraction strategy validated on sample pages; OCR/VLM deferred or queued for Phase 2.

