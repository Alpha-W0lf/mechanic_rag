# MechaRAG Ingestion Strategy: The Multimodal Gemini Approach

**Status:** Approved
**Date:** August 17, 2025

---

## 1. Executive Summary

This document outlines the official data ingestion strategy for the MechaRAG project. After extensive research into various parsing methods, we have chosen a state-of-the-art, **multimodal approach using the Google Gemini API**.

The core principle is to treat each page of our source PDF manuals as an **image**, which is then analyzed by a powerful multimodal AI model. This strategy bypasses the limitations of traditional text-extraction tools, allowing us to capture complex layouts, tables, and diagrams with human-like understanding. The goal is to produce the highest possible quality of structured data for our Retrieval-Augmented Generation (RAG) system, enabling a "multimodal retrieval" experience where users can receive not just text, but also the specific images and tables relevant to their query.

---

## 2. Strategic Viability & Model Selection

This approach is feasible within our project's constraints. After extensive PoC testing, we have established the definitive model and strategy:

-   **Primary Model:** We will use `Gemini 2.5 Pro`. Its ability to natively ingest and analyze large PDF documents, combined with its state-of-the-art reasoning, makes it the ideal choice. Its free-tier limits (**5 RPM / 100 RPD**) are sufficient for a throttled ingestion run.
-   **Core Strategy:** We will upload multi-page chunks of the source PDFs directly to the Gemini API. The model will be prompted to analyze and transcribe the content on a page-by-page basis. This is more efficient and powerful than pre-converting every page to an image.

---

## 3. The Ingestion Pipeline: Step-by-Step

The end-to-end process for ingesting a single PDF document will be as follows:

1.  **State Management & Resumption:**
    -   **Check for Existing Output:** Before processing a given page (e.g., page `N` of a PDF), the system will first check for the existence of its corresponding output file (e.g., `output/markdown/document-name/page_N.md`).
    -   **Skip if Complete:** If the output file already exists, the system will skip that page and proceed to the next, making the entire pipeline idempotent and resumable.

2.  **PDF Chunking & Uploading:**
    -   Large source PDFs (>1000 pages) will be split into smaller, temporary PDF "chunks" that comply with the API's page limits.
    -   Each chunk will be uploaded to the Gemini File API.

3.  **Multi-Prompt Page Analysis:**
    -   For each page within the uploaded chunk, a carefully crafted, multi-turn prompt sequence will be sent to the Gemini API.
    -   This sequence will instruct the model to:
        1.  First, **identify the content type** on the page (e.g., text, table, diagram).
        2.  Second, use a **targeted prompt** to meticulously extract that content into well-structured Markdown. This is crucial for handling complex tables and describing diagrams accurately.

4.  **On-Demand Asset Extraction:**
    -   **Crucially, after the AI returns the Markdown for page `N`**, the ingestion script will then programmatically extract that single page from the original source PDF and save it as a high-resolution PNG image (e.g., `output/images/document-name/page_N.png`). This step ensures we have a discrete visual asset for every processed page.

5.  **Response Processing & Structuring:**
    -   The Markdown for each page will be saved to its own file (e.g., `output/markdown/document-name/page_N.md`) to facilitate state management.
    -   After all pages are processed, these individual files will be aggregated into a single, complete Markdown document for the next step.

6.  **Chunking & Embedding:**
    -   **Enhanced, Markdown-Aware Chunking:** The aggregated Markdown document will be processed by an enhanced version of our `structure_aware_chunking` logic. This logic will be specifically upgraded to recognize complex Markdown syntax (tables, image captions) and treat them as **atomic, unbreakable units**. This is critical to preserving the contextual integrity of visual elements.
    -   The resulting text chunks will be embedded using the `Gemini Embedding` model.

7.  **Database Upsert:**
    -   The embedded chunks will be upserted into our Supabase vector database.
    -   The metadata for each chunk will now include the correct, relative file path to the source page image generated in Step 4 (e.g., `output/images/document-name/page_N.png`).

---

## 4. The Retrieval Strategy & API Contract

This ingestion strategy directly enables a superior user experience at query time. To facilitate this, the `/api/ask` endpoint will adhere to a clear, structured contract.

1.  **Retrieval Logic:**
    -   When a user asks a question, the query is embedded and a vector search is performed.
    -   The search will retrieve relevant text chunks, which could be standard paragraphs **or our detailed image/table captions**.
    -   The application logic will then inspect the *content* of the retrieved chunks. If a chunk's content matches a caption pattern (e.g., it starts with `[Image: ...]` or `[Table: ...]`), it will be treated as a visual asset, and its `image_path` from the metadata will be used.

2.  **API Response Contract:**
    -   When visual assets are relevant to a query, the API will return a structured JSON object that explicitly separates the textual answer from the visual assets. This provides a clean, predictable contract for the frontend.
    -   **Example Response:**
        ```json
        {
          "answer": "The torque spec for the brake caliper bolts is 55 lb-ft.",
          "citations": [ ... ],
          "visual_assets": [
            {
              "caption": "[Diagram: Exploded view of the front brake caliper assembly.]",
              "path": "output/images/Honda_Service_Manual/page_123.png"
            }
          ]
        }
        ```

---

## 5. Deployment & Asset Storage Strategy

To ensure a smooth transition from local development to production deployment on a serverless platform like Vercel, we will adopt the following asset storage strategy:

-   **Local Development:** During ingestion, page images will be saved to a local, version-controlled directory (e.g., `output/images/`). The relative path to these images will be stored in the chunk metadata.
-   **Production Deployment:** For the deployed application, the local image paths will be programmatically prefixed with a base URL pointing to a cloud storage provider. We will use **Supabase Storage** for this purpose, as it integrates seamlessly with our existing database. This approach ensures no data changes are needed in our database when we deploy.

---

## 6. Pros & Cons

-   **Pros:**
    -   **Unmatched Quality:** Achieves the highest possible fidelity for complex, scanned documents with mixed content.
    -   **Enables Multimodal Retrieval:** This is the key user-facing benefit and a major feature for the portfolio project.
    -   **Simpler Core Logic:** Offloads the most difficult computer vision tasks to a robust, managed API.

-   **Cons:**
    -   **Slow Ingestion Time:** The process will be throttled by API rate limits and will take significantly longer than a local-only approach.
    -   **Dependent on Prompt Quality:** The success of this strategy hinges on meticulous prompt engineering. We must test our chosen prompt against a variety of page layouts (e.g., text-heavy, table-heavy, diagram-heavy) to ensure its robustness.

---

## 6. Justification

We have chosen this approach because it best aligns with our primary project goal: to build a **production-grade, high-quality, and impressive portfolio piece**. It represents the current state-of-the-art in RAG, directly solves the core challenge of our complex source documents, and builds a foundation for powerful, user-centric features.
