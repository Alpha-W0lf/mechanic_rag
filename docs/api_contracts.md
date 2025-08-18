# API Contracts

**Version:** 1.0
**Date:** August 17, 2025

This document provides the formal data contracts for the MechaRAG API endpoints.

---

## 1. `/api/ask`

This is the primary endpoint for interacting with the RAG system.

### 1.1. Request

-   **Method:** `POST`
-   **Body:** `application/json`

```json
{
  "question": "string",
  "history": [
    {
      "role": "enum (user|model)",
      "parts": [{ "text": "string" }]
    }
  ]
}
```

-   **Fields:**
    -   `question` (string, required): The user's current question.
    -   `history` (array, optional): The previous conversation history, used to provide context for the model.

### 1.2. Success Response (200 OK)

-   **Body:** `application/json`

```json
{
  "answer": "string",
  "citations": [
    {
      "document_name": "string",
      "page_number": "integer",
      "section_path": "string"
    }
  ],
  "visual_assets": [
    {
      "caption": "string",
      "path": "string"
    }
  ]
}
```

-   **Fields:**
    -   `answer` (string): The synthesized, Markdown-formatted text answer from the LLM.
    -   `citations` (array): A list of source documents used to generate the answer.
        -   `document_name`: The name of the source PDF file.
        -   `page_number`: The page number within the source document.
        -   `section_path`: The hierarchical section path (e.g., "Clutch > Service Information").
    -   `visual_assets` (array): A list of visual assets (diagrams, tables) relevant to the answer. This array will be empty if no visuals are found.
        -   `caption`: The AI-generated caption for the visual asset (e.g., "[Image: Exploded view of the clutch master cylinder.]").
        -   `path`: The relative path to the PNG image of the page containing the asset.

### 1.3. Error Response (4xx/5xx)

-   **Body:** `application/json`

```json
{
  "error": "string"
}
```

-   **Fields:**
    -   `error` (string): A user-friendly error message.

---

## 2. `/api/health`

A simple endpoint to verify that the API is running.

### 2.1. Request

-   **Method:** `GET`

### 2.2. Success Response (200 OK)

-   **Body:** `application/json`

```json
{
  "status": "ok"
}
```
