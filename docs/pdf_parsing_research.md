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

### Findings from Web Search 1 (Aug 2025)

- **Layout-Aware is Key:** The latest tools (as of mid-2025) heavily emphasize "layout-aware" parsing, moving beyond simple text extraction. This is critical for technical manuals.
- **Vision-Language Models (VLMs) are emerging:** Tools like `olmOCR` and approaches like "Vision-Guided Chunking" are using VLMs (e.g., Gemini, GPT-4o) to interpret the document structure visually, which is a significant leap from older OCR/text-extraction methods. This is highly relevant for our project, as it can preserve the context of tables and diagrams.
- **Specialized Tools vs. Libraries:**
  - **Libraries (e.g., `pdfplumber`, `PyMuPDF`):** Still highly relevant and powerful for granular control. `PyMuPDF` is noted for speed and robustness in extracting text and image bounding boxes. `pdfplumber` excels at table extraction.
  - **Higher-Level Tools (e.g., `Unstructured.io`, `Docling`):** These often use the base libraries but add a layer of document understanding (e.g., identifying headers, titles, lists). `Unstructured.io` is a strong open-source candidate.
  - **ML-based Parsers (`Nougat`, `Marker`):** These are trained specifically to convert PDFs to structured text (like Markdown), which could be a very effective strategy for our manuals. They are designed to handle complex layouts, including academic papers, which share some complexity with technical manuals.
- **Hybrid approach is common:** Many advanced pipelines use a hybrid approach. For example, using a fast tool like `PyMuPDF` to get basic text and structure, then a more specialized tool like `Camelot` or `pdfplumber` for tables, and potentially a VLM to analyze diagrams or complex layouts.
- **Open Source is strong:** Many of the most promising tools (`Unstructured`, `PyMuPDF`, `pdfplumber`, `Marker`, `Nougat`) are open source, which aligns with our project constraints.

### Findings from Web Search 2 (Aug 2025) — Unstructured

- Unstructured provides `partition_pdf` that yields typed elements (e.g., Title, NarrativeText, ListItem, Table, Figure) with structural metadata, which is useful for preserving headings and section boundaries.
- Table handling: returns `Table` elements (not just flattened text) when table inference is enabled; practical accuracy depends on the model backend and document layout. Still advisable to validate with pdfplumber/Camelot on torque/maintenance tables.
- Supports OCR/layout-aware flows for scanned pages; image-based pipelines can recover text from non-selectable PDFs. Expect slower throughput vs text-native PDFs.
- Output formats include element objects convertible to JSON; we can store normalized text plus lightweight structure (section path, page range) for RAG, and optionally keep full JSON for audits.
- Local execution on Apple Silicon (M2 Max) is feasible; heavier inference backends (for table/figure detection) may require extra dependencies and will be CPU-bound without a discrete GPU. For our dataset scale (a few manuals), performance should be acceptable.
- Open-source core with optional hosted API. For our free-tier constraint and privacy posture, local processing is preferred.

### Findings from Web Search 3 (Aug 2025) — Docling

- Docling is an open-source toolkit focused on converting PDFs into richly structured representations (Markdown/JSON), with strong layout analysis and table structure recognition.
- Layout analysis leverages state-of-the-art models (e.g., DocLayNet-class family) to identify headings, paragraphs, images; good fit for manuals with mixed content.
- Table reconstruction uses models like TableFormer to preserve cell structure and relationships; promising for torque spec and maintenance schedule tables.
- Runs on commodity hardware; Python package with API/CLI. On M2 Max, expect CPU-bound performance but workable for our small corpus.
- Exports structured outputs that we can post-process into chunk JSONL while retaining section headings and page ranges.
- Potential role: use Docling as the primary parser for structure; fall back to PyMuPDF for speed-only paths; validate tables against pdfplumber/Camelot on tricky pages.

### Findings from Web Search 4 (Aug 2025) — pdfplumber, pdfminer.six, Camelot

- pdfplumber builds on pdfminer.six and provides practical table extraction; accuracy varies with layout. Deterministic heuristics often need tuning per document; watch for inconsistent column widths and spacing artifacts.
- Performance note: certain precision paths (e.g., decimal conversions) can slow processing on large PDFs; acceptable for small corpora but consider sampling to profile.
- pdfminer.six excels at detailed text extraction and layout metadata but struggles with non-text elements; complex multi-column or nested tables require custom logic.
- Camelot offers two modes: `lattice` (works when table borders are clear) and `stream` (for whitespace-separated tables). For service manuals, lattice may work on bordered spec tables; stream can help lists/schedules. Expect manual tuning and per-page mode selection.
- Practical approach: default to structure-aware parser (Docling/Unstructured) and fall back to pdfplumber/Camelot for targeted pages (e.g., torque spec tables) where structure needs recovery.

### Findings from Web Search 5 (Aug 2025) — Nougat & Marker

- Nougat (Facebook Research): visual transformer to convert PDFs (esp. scientific) into markup; strong on math/tables; ~3 sec/page; higher VRAM needs (~4+ GB). Best for complex formula-heavy pages; may be overkill for typical service-manual prose.
- Marker: fast PDF→Markdown converter; supports images, LaTeX for formulas, tables; ~0.3 sec/page, ~2 GB VRAM, often 10x faster than Nougat. Good general-purpose structured text conversion; equations/tables may need cleanup.
- Both are optimized for digital-native PDFs; performance degrades on heavily scanned content without robust OCR.
- Fit for MVP: viable as a secondary path for problematic layouts; primary pipeline can remain text-first + structure-aware parser to minimize complexity and resources on M2 Max.

### Findings from Web Search 6 (Aug 2025) — PyMuPDF (fitz)

- Fast, robust PDF processing with access to text blocks, spans, and coordinates; supports extraction of images with bounding boxes and metadata.
- Works well for text-native PDFs; performance degrades on highly complex/scanned layouts (then consider OCR integration like Tesseract or a VLM path).
- No native high-level table structure reconstruction; combine with pdfplumber/Camelot when tables matter.
- Apple Silicon (M2 Max) runs fine CPU-only; throughput is strong for our small corpus. Suitable as a speed-first baseline parser and for image reference extraction.

### Recommended MVP Parsing Stack (proposed)

- Primary parser: Docling for layout-aware conversion (headings, sections, tables). Export structured output; normalize to JSONL with `document`, `section_path`, `page_start/end`, `content`.
- Speed path: PyMuPDF for fast text + image references when full structure is unnecessary; attach page numbers and rough block positions.
- Tables: Use pdfplumber/Camelot selectively on torque/spec/maintenance pages to recover reliable cell structures; store a normalized CSV/TSV for key tables.
- Scanned/complex pages: Defer to later phase; consider VLM/OCR (e.g., Nougat/Marker or Tesseract) only for problematic sections after baseline is working.
- Evaluation: Run the gold-set check (10 sections) to validate paragraph fidelity, table accuracy, section/page mapping.
- Status: Proposed; finalize after one small prototype pass on both manuals.

### Comparative Notes & Confidence (Aug 2025)

- Docling vs Unstructured: both target layout-aware parsing; Docling emphasizes structured conversion (Markdown/JSON) with table reconstruction; Unstructured offers flexible element typing and pipelines. We prefer Docling for structure-first output; Unstructured remains a viable fallback.
- PyMuPDF: best speed and reliable text/images; lacks table structure—pair with pdfplumber/Camelot when needed.
- ML-first (Marker/Nougat): strong for complex math/figures; heavier and slower; useful for problematic pages, not MVP default.
- Confidence level: High for the hybrid (Docling + PyMuPDF + targeted tables) given manuals’ needs and free-tier constraints.
- When to research further: If gold-set evaluation shows low table fidelity or missed headings, revisit Unstructured/Docling settings or trial ML-first for specific sections.

