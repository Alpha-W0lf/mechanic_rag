# API contracts (derived)

**SSOT:** [`ARCHITECTURE.md` §8](./ARCHITECTURE.md#8-ask-api-contract-v1-target) and §7.6 (citation labels + page locators). This page is a short mirror of the live route and types. Do not treat it as a second source of truth.

**Derived from:** `web/src/app/api/ask/route.ts`, `web/src/server/ask_request.ts` (`AskRequest`), `web/src/server/ask.ts` (`AskSuccess` / `AskFailure`), `web/src/server/citations.ts` (`Citation`), `web/src/server/ask_errors.ts`, `web/src/app/api/health/route.ts`.

The 2025 stub (`{question, history}`, `page_number`, `{status:"ok"}` only) is retired.

---

## 1. `POST /api/ask`

### 1.1 Request

- **Method:** `POST`
- **Body:** `application/json`

```json
{
  "vehicle_id": "string",
  "question": "string",
  "doc_family": "string",
  "diagram_assist": false
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `vehicle_id` | yes | Canonical catalog id. No all-vehicle fallback. Stub `{ "query" }` is 400. |
| `question` | yes | Non-empty; max 4000 characters. |
| `doc_family` | no | Optional filter. |
| `diagram_assist` | no | Parked M3: only meaningful when `MECHANIC_VLM` is on. Default omitted/false. |

`history` is not accepted by the live validator.

### 1.2 Success (HTTP 200)

```json
{
  "answer": "string",
  "citations": [
    {
      "label": "1",
      "chunk_id": "string",
      "vehicle_id": "string",
      "doc_family": "string",
      "document_id": "string",
      "section_path": "string|null",
      "page_start": "integer|null",
      "page_end": "integer|null"
    }
  ],
  "outcome": "answered",
  "diagnostics": null,
  "visual_assets": []
}
```

| Field | Notes |
|-------|--------|
| `outcome` | `answered` \| `insufficient_evidence` \| `degraded` |
| `error_class` | Present on `outcome: "degraded"` (and on non-200 failures). Values: `generator_unavailable` \| `embedding_unavailable` \| `database_unavailable` \| `rate_limited` \| `internal` |
| `citations[].label` | Server-assigned `"1"`, `"2"`, … (ARCHITECTURE §7.6). |
| `citations[].page_start` / `page_end` | Locators from DB rows. There is no `page_number` field. |
| `diagnostics` | Object only when `MECHANIC_DIAGNOSTICS=1`; otherwise `null`. Never private chunk bodies. |
| `visual_assets` | Parked M1. Empty on the public text-RAG path. Shape when present: `{ chunk_id, document_id, page_start, content_type, href }`. |

Hosted generate/embed failure after retries with ≥1 citation: HTTP **200** `outcome: "degraded"` plus `error_class` and extractive excerpts (JH-46). That is not a 5xx.

### 1.3 Non-200

| Status | When |
|--------|------|
| 400 | Invalid JSON, missing `vehicle_id` / `question`, oversized question, retired `{query}` stub |
| 404 | Unknown `vehicle_id` |
| 429 | Abuse shield (`error_class: "rate_limited"` + `Retry-After`) |
| 503 | Dependency failure (`error_class` as classified). Database stays 503; local generate failure stays 503 |

```json
{
  "error": "string",
  "error_class": "database_unavailable"
}
```

400 validation bodies may omit `error_class`.

---

## 2. `GET /api/health`

Not a single `{ "status": "ok" }` contract.

| Mode | Behavior |
|------|----------|
| `?mode=live` or `liveness` | Process up → 200 `{"status":"ok","mode":"liveness"}` |
| `?mode=db` | `SELECT 1` only. 200 `ready` / 503 `not_ready` with `checks.postgres` |
| default | Readiness: Postgres required. Ollama required only when `GEMINI_API_KEY` is unset. Hosted Gemini path is ready when Postgres is up. |

Public JSON must not include driver / pooler / host text. Detail: ARCHITECTURE §9.1.
