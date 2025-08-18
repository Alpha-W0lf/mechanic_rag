---
**Version:** 2.0
**Date:** August 17, 2025
**Status:** **Corrected & Finalized**

This document summarizes key details about the Google Gemini API, based on the official documentation provided by the user. The previous version contained incorrect rate limits; this version supersedes all prior analysis.

**Source:** [Official Gemini API Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)

---

### 1. Available Models & Suitability

| Model                                       | Key Characteristics & Use Cases                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **`Gemini 2.5 Pro`**                          | Most capable text model on free tier. Best for high-quality reasoning and complex instruction.                |
| **`Gemini 2.5 Flash`**                        | Faster text model, ideal for high-volume, moderate-complexity tasks.                                          |
| **`Gemini 2.0 Flash Preview Image Generation`** | **Primary Multimodal Candidate.** Can process text and images. Essential for our visual document analysis. |
| **`Gemini Embedding`**                        | Generates vector embeddings for text. This is the model referred to as `text-embedding-004` in the API.      |

---

### 2. Free Tier Rate Limits (Corrected)

Rate limits are applied per project and reset at midnight Pacific time.

| Model                                       | Requests per Minute (RPM) | Tokens per Minute (TPM) | Requests per Day (RPD) |
| ------------------------------------------- | ------------------------- | ----------------------- | ---------------------- |
| **`Gemini 2.5 Pro`**                          | 5                         | 250,000                 | 100                    |
| **`Gemini 2.5 Flash`**                        | 10                        | 250,000                 | 250                    |
| **`Gemini 2.0 Flash Preview Image Generation`** | 10                        | 200,000                 | 100                    |
| **`Gemini Embedding`**                        | 100                       | 30,000                  | 1,000                  |

---

### 3. Architectural Implications & New Strategy

*   **`Gemini 2.5 Pro` is Viable:** The corrected limits (5 RPM / 100 RPD) are much more reasonable than previously thought. While still a constraint, this makes the model viable for lower-volume, high-quality extraction or summarization tasks within our pipeline.
*   **Multimodal Ingestion is a Go:** The `Gemini 2.0 Flash Preview Image Generation` model has clear, workable limits (10 RPM / 100 RPD). This confirms that a multimodal ingestion strategy, where we pass document images to the model for analysis, is a feasible and powerful approach for handling complex layouts, tables, and diagrams.
*   **Embedding Throughput:** The `Gemini Embedding` model has generous limits, which is excellent as embedding is a high-volume step in the ingestion process.

With this verified information, we can confidently proceed with an architecture that leverages Google's multimodal capabilities for the highest-quality data extraction, which was our primary goal. The next step will be to adapt our ingestion script to use this new approach.
