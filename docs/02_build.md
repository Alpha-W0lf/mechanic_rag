
# Phase 2: Multimodal RAG Implementation

**Objective:** Implement a production-grade, multimodal ingestion pipeline using the Gemini 2.0 Flash Preview Image Generation model to achieve the highest possible quality of data extraction from complex PDF documents.

---

### 1. Proof of Concept (PoC)

-   [ ] **1.1: Execute Enhanced PoC Experiments:** Run `scripts/ingest/multimodal_poc.py` to gather empirical data for our final configuration.
    -   [ ] 1.1.1: **Test DPI Variants:** Generate images for three distinct page types (text-heavy, table-heavy, diagram-heavy) at 150, 300, and 600 DPI.
    -   [ ] 1.1.2: **Test Prompt Variants:** Craft and test at least two prompt variants against the different page types to find the most robust version for extracting structured Markdown.
    -   [ ] 1.1.3: **Analyze and Decide:** Review the output Markdown files to make a final, data-driven decision on the optimal DPI and prompt to be used in the production pipeline.

---

### 2. Pipeline Integration

-   [ ] **2.1: Refactor `parse.py`:** Replace the current `unstructured.io` logic with the new Gemini-based multimodal approach.
    -   [ ] 2.1.1: **Implement Resumable Logic:** Before processing a page, check if the corresponding Markdown output file already exists in a dedicated output directory (e.g., `output/markdown/`). If it does, skip the page.
    -   [ ] 2.1.2: **Integrate PDF-to-Image Conversion:** Use `pdf2image` to convert the current page to a PNG image and save it to a structured path (e.g., `output/images/`).
    -   [ ] 2.1.3: **Implement API Call Logic:** Call the Gemini API (`Gemini 2.0 Flash`) with the page image.
    -   [ ] 2.1.4: **Save Page Output:** Save the returned Markdown to a corresponding file (e.g., `output/markdown/`).
    -   [ ] 2.1.5: **Implement Aggregation:** After processing all pages for a document, read all the individual page Markdown files and concatenate them into a single string for the chunking process.
    -   [ ] 2.1.6: **Implement Robust Error Handling:** Wrap API calls in retry logic. If a page fails permanently, log it to `failed_pages.log` and continue.

-   [ ] **2.2: Enhance Chunking and Data Structures:**
    -   [ ] 2.2.1: **Update `Chunk` Dataclass:** Add a new optional field, `image_path: str`, to the `Chunk` dataclass in `scripts/ingest/chunking.py`.
    -   [ ] 2.2.2: **Enhance `structure_aware_chunking`:** Modify the chunking logic to recognize and protect Markdown tables and `[Image: ...]` captions as atomic units.
    -   [ ] 2.2.3: **Pass Image Path:** Ensure the path to each page's saved image is passed into the `image_path` field of the corresponding chunk metadata during processing.
    -   [ ] 2.2.4: **Remove Old Caching:** Remove the now-redundant JSONL-based caching logic from `ingest.py`.

---

### 3. Dependency Management & Documentation

-   [ ] **3.1: Update `requirements.txt`:** Add any new Python libraries (e.g., `pdf2image`).
-   [ ] **3.2: Update `docs/dev_setup.md`:** Add any new system-level dependencies (e.g., `poppler` for `pdf2image`).
-   [ ] **3.3: Update Documentation:**
    -   [ ] 3.3.1: Update `scripts/ingest/README.md` to document the new multimodal ingestion process.
    -   [ ] 3.3.2: Create a new `docs/api_contracts.md` file to formally document the structured JSON response for the `/api/ask` endpoint.

---

### 4. Final Ingestion Run & Asset Deployment

-   [ ] **4.1: Execute Full Ingestion:** Run the final, refactored ingestion script to process all documents and populate the local `output/` directory and Supabase database.
-   [ ] **4.2: Deploy Assets to Cloud:** Write and execute a separate utility script (`scripts/deploy_assets.py`) to upload the contents of `output/images/` to Supabase Storage.

