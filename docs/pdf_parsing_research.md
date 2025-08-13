## PDF Parsing Research (S2000 manuals) — Aug 2025

Status: Research in progress — decision pending. We will conduct multiple web searches and trials before selecting an MVP parser.

### Goals
- Extract high-fidelity text with headings and page numbers.
- Preserve structure for tables and torque specs; capture figure/table captions.
- Optionally extract images/diagrams metadata for future multimodal use.

### Success Criteria (MVP)
- ≥95% of paragraphs correctly captured with minimal artifacts.
- Table content usable as plain text (row/column order preserved) for common maintenance tables.
- Reliable page number mapping and section heading detection.

### Candidate Approaches/Tools
- Text-first parsers:
  - PyMuPDF (fitz): fast, robust text + images + page numbers.
  - pdfminer.six / pdfplumber: detailed text layout; table heuristics (pdfplumber) can help.
  - Unstructured.io: higher-level document partitioning, heading detection; OSS and hosted.
  - Docling (IBM): layout-aware parsing, tables; promising for manuals.
  - Marker / Nougat: ML-based PDF-to-structured text (more for academic PDFs; evaluate suitability).
- Tables:
  - pdfplumber TableFinder, Camelot, Tabula-py; evaluate on service manual tables (torque specs, maintenance schedules).
- Images/diagrams:
  - PyMuPDF to extract images and their bounding boxes; store references and captions.
  - Optional OCR (Tesseract) for embedded text in diagrams; likely v2 feature given cost/complexity.

### Research To-Do
- Web searches (Aug 2025): latest on Docling, Unstructured, pdfplumber, Camelot, Marker/Nougat, and any new layout-aware parsers suitable for our input documents (PDF vehicle manuals).
- Compare text fidelity, heading extraction, table accuracy, diagram parsing, image parsing, speed, resource usage, and any other important factors under free constraints.
- Determine whether a hybrid pipeline (Docling for structure + PyMuPDF for speed) outperforms single-tool approaches and if it is worth the added complexity.

### Proposed Phased Plan
1) Phase 1 (MVP): Text-first
   - Use PyMuPDF or Docling to extract text blocks with page numbers.
   - Heuristic heading detection: PDF outline (if present), font size/style, numbering patterns (e.g., 13-3 Clutch Service).
   - Table handling: attempt pdfplumber; fallback to line-joined text with delimiters.
   - Emit JSONL with fields: document, page_start, page_end, section_path, content, figures, tables_summary.

2) Phase 2 (Enhancement): Tables & diagrams
   - Improve table extraction (Camelot/Docling); store normalized CSV for key tables (torque specs).
   - Extract images and captions; consider lightweight OCR for in-image text if needed.

### Evaluation Protocol
- Build a small gold set: select 10 diverse sections (maintenance schedule, torque specs, diagnostics).
- Compare parsed output against ground truth: paragraph accuracy, table structure fidelity, correct page/section metadata.
- Time and resource usage measured; parser chosen for MVP must be predictable on free tiers.

### Open Questions
- Are S2000 manuals standardized in layout across years? Impacts heading heuristics.
- How often are torque specs in images vs tables? Impacts OCR priority.

### Decision Placeholder
- Default parser candidate: PyMuPDF for MVP; re-evaluate after gold-set test. Docling is second candidate if tables are critical.

