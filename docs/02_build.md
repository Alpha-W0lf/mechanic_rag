## Phase 2 — Data Ingestion: PDF Parsing, Chunking, Embedding Prep

Objective: Choose a practical PDF parsing approach and implement an ingestion pipeline that produces high-quality chunks with metadata.

### Steps
- [x] **Research (Aug 2025 landscape)**
  - [x] Populate findings in `docs/pdf_parsing_research.md` (one search at a time; append after each).
  - [x] Populate findings in `docs/chunking_research.md` and `docs/embedding_research.md` similarly.
- [ ] **Parser prototype**
  - [x] Implement a text-first parser (candidate: PyMuPDF or Docling) to extract text, headings, and page numbers.
  - [ ] For tables (maintenance schedule, torque specs), try pdfplumber/Camelot; record fidelity vs complexity.
- [ ] **Ingestion output schema**
  - [ ] Produce JSONL records with: `document`, `page_start`, `page_end`, `section_heading`, `section_path`, `content`.
  - [ ] Validate 10–20 sample pages for fidelity and clean formatting.
- [ ] **Chunking baseline**
  - [ ] Start with ~1000–1200 chars, ~200 overlap. Preserve section info and page ranges in metadata.
  - [ ] Keep tables intact where possible; avoid splitting across chunks.
- [ ] **Embedding preparation**
  - [ ] Integrate selected embedding model (initially `text-embedding-004`, pending research confirmation).
  - [ ] Upsert vectors and metadata into Supabase `chunks`.
- [ ] **Quality checks**
  - [ ] Spot-check chunk samples and their metadata for correctness.
  - [ ] Verify vector index builds and basic nearest-neighbor queries.

Exit criteria
- Parser selected for MVP with rationale in `docs/pdf_parsing_research.md`.
- Ingestion script creates chunks + metadata and loads Supabase successfully.

