# MechaRAG Ingestion Strategy: The Multimodal Gemini Approach

**Status:** Approved
**Date:** August 17, 2025

---

## 1. Executive Summary

This document outlines the official data ingestion strategy for the MechaRAG project. After extensive research into various parsing methods, we have chosen a state-of-the-art, **multimodal approach using the Google Gemini API**.

The core principle is to treat each page of our source PDF manuals as an **image**, which is then analyzed by a powerful multimodal AI model. This strategy bypasses the limitations of traditional text-extraction tools, allowing us to capture complex layouts, tables, and diagrams with human-like understanding. The goal is to produce the highest possible quality of structured data for our Retrieval-Augmented Generation (RAG) system, enabling a "multimodal retrieval" experience where users can receive not just text, but also the specific images and tables relevant to their query.

---

## 2. Strategic Viability & Model Selection

This approach is feasible within our project's constraints. After careful consideration of the trade-offs between speed, cost, and quality, we have established the following model strategy:

-   **Primary Model:** We will proceed with `Gemini 2.0 Flash Preview Image Generation`. Its free-tier limits (**10 RPM / 100 RPD**) are sufficient for our initial, full-scale ingestion run.
-   **Quality Assurance:** While `Gemini 2.0 Flash` is expected to have sufficient quality, we will design the ingestion pipeline to facilitate future experiments. If necessary, we can later re-process a subset of particularly complex pages with a more powerful model like `Gemini 2.5 Pro`.

---

## 3. The Ingestion Pipeline: Step-by-Step

The end-to-end process for ingesting a single PDF document will be as follows:

1.  **State Management & Resumption:**
    -   **Check for Existing Output:** Before processing a given page (e.g., page `N` of a PDF), the system will first check for the existence of its corresponding output file (e.g., `output/markdown/document-name/page_N.md`).
    -   **Skip if Complete:** If the output file already exists, the system will skip that page and proceed to the next, making the entire pipeline idempotent and resumable.

2.  **Page Iteration & Conversion:**
    -   The system will iterate through the source PDF, page by page.
    -   Each page will be converted into a high-resolution PNG image. We will default to **300 DPI** but will experiment with 150, 300, and 600 DPI in the PoC phase to find the optimal balance of quality and file size.

3.  **Prompt Engineering & API Call:**
    -   For each page image, a carefully crafted prompt will be sent to the Gemini API.
    -   This prompt will instruct the model to act as a technical document specialist, with explicit instructions to:
        -   Transcribe **all** text content verbatim.
        -   Recreate the page's structure and reading order in **Markdown**.
        -   Reformat all tables using **Markdown table syntax**.
        -   For every diagram, image, or figure, generate a **detailed, descriptive caption** and embed it in the Markdown (e.g., `[Image: A detailed diagram showing the torque sequence for the cylinder head bolts.]`).

4.  **Response Processing & Structuring:**
    -   The system will receive the structured Markdown response from the API for each page.
    -   The Markdown for each page will be saved to its own file (e.g., `output/markdown/document-name/page_N.md`) to facilitate the state management described in Step 1.
    -   After all pages are processed, these individual files will be aggregated into a single, complete Markdown document for the next step.

5.  **Chunking & Embedding:**
    -   **Enhanced, Markdown-Aware Chunking:** The aggregated Markdown document will be processed by an enhanced version of our `structure_aware_chunking` logic. This logic will be specifically upgraded to recognize complex Markdown syntax (tables, image captions) and treat them as **atomic, unbreakable units**. This is critical to preserving the contextual integrity of visual elements.
    -   The resulting text chunks will be embedded using the `Gemini Embedding` model.

6.  **Database Upsert:**
    -   The embedded chunks will be upserted into our Supabase vector database.
    -   **Crucially, the metadata for each chunk will include a direct, relative file path** to the source page image (e.g., `output/images/document-name/page_N.png`).

---

## 4. The Retrieval Strategy & API Contract

This ingestion strategy directly enables a superior user experience at query time. To facilitate this, the `/api/ask` endpoint will adhere to a clear, structured contract.

1.  **Retrieval Logic:**
    -   When a user asks a question, the query is embedded and a vector search is performed.
    -   The search will retrieve relevant text chunks, which could be standard paragraphs **or our detailed image/table captions**.
    -   The application logic will recognize when a retrieved chunk's metadata contains an `image_path`.

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
