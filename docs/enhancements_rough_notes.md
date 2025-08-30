# MechaRAG Enhancements: Hybrid Multimodal Retrieval Plan

**Status:** Proposed
**Date:** August 17, 2025

---

## 1. Executive Summary

This document outlines a plan to evolve the MechaRAG system from a text-only retrieval system to a state-of-the-art **Hybrid Multimodal Retrieval** system. This enhancement will enable the RAG pipeline to retrieve visual assets (diagrams, tables) based on their actual visual content, not just their textual captions. This directly addresses the primary limitation of the current design and is critical for achieving the highest possible quality and relevance in search results.

The core strategy involves three parts:
1.  **Dual Embeddings:** Storing both text and image embeddings for visual content.
2.  **Hybrid Search:** Querying against both text and image vectors simultaneously.
3.  **Result Fusion:** Intelligently merging the results from both searches into a single, highly relevant list.

---

## 2. Phase 1: Ingestion Pipeline Enhancements

The first step is to modify the existing ingestion process to create the necessary dual embeddings.

### 2.1. Select and Integrate an Image Embedding Model
- **Action:** Choose a suitable multimodal embedding model capable of creating vectors from images. Open-source models based on CLIP (e.g., from the `sentence-transformers` library) are excellent candidates as they are free to run locally and embed images and text into the same vector space.
- **Integration:** Modify `scripts/ingest/parse.py`. After a page's PNG is generated, add a new step to load that image and pass it through the chosen image embedding model to create an `image_embedding` vector.

### 2.2. Update the Database Schema
- **Action:** Modify the database schema in `db/schema.sql` and the corresponding application logic.
- **Change:** Add a new vector column to the `chunks` table, named `image_embedding`. This column will be nullable, as it will only be populated for chunks that are directly associated with a visual asset.
- **Indexing:** Create a second HNSW index on the new `image_embedding` column to ensure fast searches.

### 2.3. Modify the Upsert Logic
- **Action:** Update the `process_pdf` and `upsert_chunks` functions in `scripts/ingest/ingest.py`.
- **Change:** When a chunk is processed, if it has an associated `image_embedding`, this new vector must be included in the data that gets upserted into the database.

---

## 3. Phase 2: Retrieval and API Enhancements

Next, the retrieval logic in the API must be updated to leverage the new dual embeddings.

### 3.1. Implement Dual-Embedding for Queries
- **Action:** Modify the `/api/ask` endpoint logic.
- **Change:** When a user's query string is received, it must be embedded twice:
    1.  Once using the standard text embedding model (`text-embedding-004`) to create a `text_query_vector`.
    2.  A second time using the chosen CLIP-based model to create an `image_query_vector`.

### 3.2. Execute Hybrid Search
- **Action:** Update the database query logic.
- **Change:** Execute two parallel, non-blocking vector search queries against the `chunks` table:
    1.  **Text Search:** Find the top-K chunks by comparing the `text_query_vector` against the `text_embedding` column.
    2.  **Image Search:** Find the top-K chunks by comparing the `image_query_vector` against the `image_embedding` column.

### 3.3. Implement Result Fusion with RRF
- **Action:** Add a new step to the retrieval logic after the parallel searches are complete.
- **Change:** Use a Reciprocal Rank Fusion (RRF) algorithm to merge the two ranked lists of results into a single, unified list. This ensures the final ranking gives fair weight to items found via both text and visual similarity. The existing MMR logic for diversification should be applied *after* this fusion step.

---

## 4. Rationale and Expected Outcome

- **Why:** This enhancement moves the system from a proxy-multimodal to a true-multimodal architecture. It allows the system to find relevant information based on visual similarity, which is impossible in the current design.
- **Expected Outcome:** A significant improvement in the quality and relevance of retrieved results, especially for queries that describe visual elements. This will lead to more accurate answers and a more intuitive user experience, directly contributing to the project's goal of creating a state-of-the-art, portfolio-grade RAG application.
- **Trade-offs:** This approach introduces added complexity to the ingestion pipeline, doubles the vector storage requirements for visual chunks, and slightly increases query complexity. However, the dramatic improvement in retrieval quality justifies these trade-offs.

---

## 5. Free-Tier Feasibility Analysis

The enhanced hybrid multimodal system is **feasible** within the project's perpetual free-tier constraints, with the following key considerations:

-   **Vercel (Compute):** **Feasible.** The primary consideration is the potential for increased latency on serverless function "cold starts" due to the need to load the image embedding model. This must be monitored, but it is not a blocker.
-   **Supabase (Storage):** **Feasible for MVP.** The additional database storage for image vectors is negligible. The 1GB file storage limit for PNGs is the main constraint to be aware of for future expansion (i.e., adding more manuals).
-   **Gemini API (LLM Calls):** **No Impact.** The proposed enhancements use a local, open-source model for image embedding and do not increase our usage of the Gemini API. The system remains compliant with the free-tier quotas.

---

## 6. Further Enhancement: Hybrid Search (Dense + Lexical)

To further improve retrieval robustness, we should add **Hybrid Search** to our near-term roadmap, to be implemented after the multimodal baseline is established.

-   **Concept:** While dense vector search excels at finding semantically similar results, it can be less effective for queries containing specific keywords, part numbers, or acronyms. Lexical search (like Postgres Full-Text Search) is designed for this. A hybrid system executes both searches in parallel and fuses the results.
-   **Implementation:**
    1.  **Schema:** Add a `tsvector` column to the `chunks` table in `db/schema.sql`.
    2.  **Ingestion:** During ingestion, populate this column with the content of each chunk.
    3.  **Retrieval:** In the `/api/ask` endpoint, execute a full-text search query in parallel with the two vector search queries.
    4.  **Fusion:** Use the same Reciprocal Rank Fusion (RRF) algorithm to merge all three result sets (text vector, image vector, lexical) into a single, comprehensive ranked list.
-   **Benefit:** This will create a highly robust retrieval system that can effectively handle both conceptual, semantic queries and precise, keyword-based queries, maximizing the chances of finding the correct information.


Further questions and areas to research/think about. it is currently august/september 2025:
- what are the specific embedding models we will be using for text and visuals? what are the alternatives? what are the pros and cons of each? what are the latest models that we should be aware of and consider for august/september 2025?
- what are the latest rag techniques and alternatives that we should be aware of? is there anything that we should consider to enhance our project or alter our architecture/approach?
- what about cross-encoding? does this have a role in our project? should we consider using it? why or why not?
- what variables like top k, confidence thresholds, mmr diversification, etc. should we think about? what are the default values we should use to start for these various variables?
- what size vectors should we use? 1024? 1536? what are the pros and cons? what are the performance and storage implications?
- what vector database storage options do we have on the perpetual free tier of supabase? in memory, solid state, on disk, etc. if we have a choice, which should we pick? what is the performace impact?
- how should we think about evaluation and observability of our system to evaluate and improve accuracy, performance, recall, etc.?
