---
**Version:** 2.0
**Date:** August 17, 2025
**Status:** **Corrected & Finalized**

This document summarizes key details about the Google Gemini API, based on the official documentation provided by the user. The previous version contained incorrect rate limits; this version supersedes all prior analysis.

**Source:** [Official Gemini API Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)

---

### 1. SDK & Library Versioning (Definitive)

-   **Required Library:** The project **MUST** use the `google-genai` Python package.
-   **Legacy Library:** The `google-generativeai` package is **deprecated** and MUST NOT be used. It is unstable and will not receive updates.
-   **Current Version:** The current stable version is `2.0.0`.
-   **Usage Pattern:** All API interactions **MUST** use the `genai.Client()` pattern as documented in the official SDK.

---

### 2. Available Models & Suitability

| Model                                       | Key Characteristics & Use Cases                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **`Gemini 2.5 Pro`**                          | Most capable text model on free tier. Best for high-quality reasoning and complex instruction.                |
| **`Gemini 2.5 Flash`**                        | Faster text model, ideal for high-volume, moderate-complexity tasks.                                          |
| **`Gemini 2.0 Flash Preview Image Generation`** | **Primary Multimodal Candidate.** Can process text and images. Essential for our visual document analysis. |
| **`Gemini Embedding`**                        | Generates vector embeddings for text. This is the model referred to as `text-embedding-004` in the API.      |

---

### 3. Verified Model Capabilities & Identifiers (Definitive)

Based on the canonical documentation, the following is the definitive model strategy for this project.

| Model                               | Verified API Identifier | Key Multimodal Capabilities (Inputs)                                 |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| **`Gemini 2.5 Pro` (Recommended)**    | `gemini-2.5-pro`        | **PDF:** Yes <br> **Image:** Yes <br> **Video:** Yes <br> **Audio:** Yes |
| **`Gemini 2.5 Flash`**                | `gemini-2.5-flash`      | **Image:** Yes <br> **Video:** Yes <br> **Audio:** Yes                |
| **`Gemini Embedding`**                | `text-embedding-004`    | **Text Only**                                                        |

**Conclusion:** **`Gemini 2.5 Pro`** is the most capable model for our task. Its ability to natively ingest PDF documents makes it superior to any other choice.

---

### 4. Free Tier Rate Limits (Corrected)

Rate limits are applied per project.

| Model                | Requests per Minute (RPM) | Tokens per Minute (TPM) | Requests per Day (RPD) |
| -------------------- | ------------------------- | ----------------------- | ---------------------- |
| **`Gemini 2.5 Pro`**   | 2                         | 250,000                 | 50                    |
| **`Gemini 2.5 Flash`** | 10                        | 250,000                 | 250                    |

---

### 5. API Usage Best Practices (New)

#### Correctly Configuring Safety Settings

To prevent false-positives and ensure reliable processing of technical documents, safety settings should be explicitly disabled. The following is the definitive, correct pattern for doing so with the `google-genai` library. The `safety_settings` must be passed inside a `GenerateContentConfig` object.

```python
from google import genai
from google.genai.types import HarmCategory, HarmBlockThreshold

# 1. Define the safety settings as a list of SafetySetting objects.
safety_settings = [
    genai.types.SafetySetting(
        category=HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold=HarmBlockThreshold.BLOCK_NONE,
    ),
    genai.types.SafetySetting(
        category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold=HarmBlockThreshold.BLOCK_NONE,
    ),
    genai.types.SafetySetting(
        category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold=HarmBlockThreshold.BLOCK_NONE,
    ),
    genai.types.SafetySetting(
        category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold=HarmBlockThreshold.BLOCK_NONE,
    ),
]

# 2. Create the configuration object, passing the safety settings inside it.
config = genai.types.GenerateContentConfig(
    candidate_count=1,
    temperature=0,
    safety_settings=safety_settings
)

# 3. Make the API call, passing the single config object.
# client = genai.Client()
# response = client.models.generate_content(
#     model="models/gemini-2.5-pro",
#     contents=[prompt, pdf_file], 
#     config=config,
# )
```

---

### 6. Architectural Implications & New Strategy (Final)

*   **Definitive Model Choice:** We will use **`gemini-2.5-pro`**. Its modest rate limits are acceptable for our one-time ingestion in exchange for its state-of-the-art capabilities.
*   **Simplified Ingestion Pipeline:** The `pdf2image` conversion step is **no longer necessary**. Our core `parse.py` logic will be significantly simplified. We will now send the PDF file directly to the Gemini API.
*   **Solving the Diagram/Table Problem:** The model's native PDF understanding allows for a powerful multi-prompt workflow. We can now design a process where we:
    1.  First, ask the model for a high-level summary or table of contents of the document.
    2.  Then, in subsequent prompts, ask it to perform fine-grained extractions, such as "Generate a detailed Markdown transcription of the content on page 35" or "Extract the table from page 42 and return it as CSV." This provides a clear path to isolating and saving our visual assets.
