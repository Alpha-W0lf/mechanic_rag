# Ops notes

Short operational policy. Not a monitor implementation (that is a separate ticket).

## Degraded Ask response (JH-46)

`POST /api/ask` returns **HTTP 200** `outcome: "degraded"` in two cases (both require ≥1 citation):

1. Hosted Gemini **generate** fails after its retry budget → `error_class` is `generator_unavailable` (or `rate_limited` on 429).
2. **Embed** fails (hosted Gemini quota / local Ollama embed down) and lexical retrieval still hits → `error_class` is `embedding_unavailable` (or `rate_limited` on 429). Never `generator_unavailable`.

```json
{
  "answer": "AI summary temporarily unavailable; showing the most relevant manual excerpts.\n\n[1] <verbatim snippet from a retrieved chunk>",
  "citations": [{ "label": "1", "chunk_id": "…", "document_id": "…", "section_path": "…", "page_start": 1, "page_end": 1 }],
  "outcome": "degraded",
  "error_class": "generator_unavailable",
  "visual_assets": [],
  "diagnostics": null
}
```

`error_class` on a degraded body is one of `generator_unavailable` | `embedding_unavailable` | `rate_limited`. No `degraded: true` flag — `outcome` is the discriminator. Database failures stay HTTP 503 `error_class: "database_unavailable"` (not degraded). Zero retrieved chunks (including embed-fail + empty lexical) stay `insufficient_evidence`.

## Ask monitor policy

Score a hosted Ask probe as follows:

| Result | Score |
|---|---|
| `outcome: "answered"` (full generated answer) | **pass** |
| `outcome: "degraded"` with **≥1 citation** (generator or embedding) | **degraded pass** (warn) |
| HTTP error, `error_class` without a degraded body, or degraded with zero citations | **fail** |

A degraded 200 is still useful: extractive manual excerpts plus clickable citations. It is not a full Gemini answer and must not be scored as a silent pass.
