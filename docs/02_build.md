# Phase 2 — historical 2025 checklist (not the storefront)

> **Not current product truth.** This file is a 2025 build log. It is **not** the live stack and it does **not** authorize “Gemini 2.5 Pro multimodal production-grade” claims.
>
> **Storefront / stranger path:** text RAG (fixtures → hybrid → RRF → citations). Hosted topology: [`ARCHITECTURE.md` §3.1](./ARCHITECTURE.md#31-production-topology-hosted-demo) (Vercel Hobby + Supabase Free via `pg`/`DATABASE_URL` + Gemini free tier `gemma-4-26b-a4b-it` / `gemini-embedding-001`).
>
> **M1–M3** personal-garage multimodal paths exist in code with flags; they are **parked / not the public demo**. Do not treat `scripts/ingest/parse.py` or the retired supabase-js ingest as the product CLI — use `mecharag ingest`.
>
> SSOT: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Ask contract: [`api_contracts.md`](./api_contracts.md)

**Historical objective (2025, do not repeat as current):** a Gemini-native PDF extract experiment. Checklist below is provenance only.

---

### 1. Pipeline Implementation

-   [x] **1.1: Refactor `parse.py`:** Replace the old logic with the new `Gemini 2.5 Pro` PDF-native approach.
    -   [x] 1.1.1: **Implement Resumable Logic:** Before processing a page, check if the corresponding Markdown output file already exists. If it does, skip the page.
    -   [x] 1.1.2: **Implement PDF Chunking & Upload:** Add logic to split large PDFs into smaller, temporary chunks and upload them using `genai.upload_file`.
    -   [x] 1.1.3: **Implement Multi-Prompt Analysis:** For each page, implement a multi-turn chat sequence to first identify content type and then perform a targeted extraction.
    -   [x] 1.1.4: **Save Markdown Output:** Save the returned Markdown to a corresponding file (e.g., `output/markdown/doc_name/page_N.md`).
    -   [x] 1.1.5: **Implement On-Demand Asset Extraction:** After saving the Markdown, use `pypdf` or a similar library to extract the corresponding page from the source PDF and save it as a PNG (e.g., `output/images/doc_name/page_N.png`).
    -   [x] 1.1.6: **Implement Aggregation:** After all pages are processed, aggregate the individual Markdown files into a single string for chunking.
    -   [x] 1.1.7: **Implement Robust Error Handling:** Wrap API calls in retry logic and handle file I/O exceptions gracefully.

-   [x] **1.2: Enhance Chunking and Data Structures:**
    -   [x] 1.2.1: **Update `Chunk` Dataclass:** Add the `image_path: Optional[str]` field to the `Chunk` dataclass in `scripts/ingest/chunking.py`.
    -   [x] 1.2.2: **Enhance `structure_aware_chunking`:** Modify the chunking logic to recognize and protect Markdown tables and `[Image: ...]` captions as atomic units.
    -   [x] 1.2.3: **Associate Image Path:** Ensure the path to each page's saved PNG is correctly associated with all chunks generated from that page's Markdown.

-   [x] **1.3: Update `ingest.py` Orchestration:**
    -   [x] 1.3.1: **Integrate New Parser:** Update the main `process_pdf` function to call the refactored `parse.py` and receive the aggregated Markdown and list of image paths.
    -   [x] 1.3.2: **Remove Old Caching:** Remove the now-obsolete JSONL caching logic.

---

### 2. Dependency Management & Documentation

-   [x] **2.1: Update `requirements.txt`:** Add `pypdf` and ensure `google-generativeai` is present. Remove `pdf2image`.
-   [x] **2.2: Update `docs/dev_setup.md`:** Remove `poppler` from the system-level dependencies.
-   [x] **2.3: Update Documentation:**
    -   [ ] 2.3.1: Update `scripts/ingest/README.md` to document the new multimodal ingestion process.
    -   [x] 2.3.2: Create `docs/api_contracts.md` to formally document the structured JSON response for the `/api/ask` endpoint.

---

### 3. Final Ingestion Run & Asset Deployment

-   [ ] **3.1: Execute Full Ingestion:** Run the final, refactored ingestion script to populate the local `output/` directory and Supabase database.
-   [ ] **3.2: Deploy Assets to Cloud:** Write and execute a separate utility script (`scripts/deploy_assets.py`) to upload the contents of `output/images/` to Supabase Storage.

