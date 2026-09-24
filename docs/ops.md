# Ops notes

Short operational policy. Not a monitor implementation (that is a separate ticket).

## Degraded Ask response (JH-46)

When hosted Gemini generate fails with `generator_unavailable` or `rate_limited` **after** the existing retry budget, and retrieval already produced ≥1 citation, `POST /api/ask` returns **HTTP 200**:

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

`error_class` is `rate_limited` when the generator failure was a 429 / `RESOURCE_EXHAUSTED`. No `degraded: true` flag — `outcome` is the discriminator. Database failures stay HTTP 503 `error_class: "database_unavailable"` (not degraded). Zero retrieved chunks keep the existing error / insufficient-evidence path.

## Ask monitor policy

Score a hosted Ask probe as follows:

| Result | Score |
|---|---|
| `outcome: "answered"` (full generated answer) | **pass** |
| `outcome: "degraded"` with **≥1 citation** | **degraded pass** (warn) |
| HTTP error, `error_class` without a degraded body, or degraded with zero citations | **fail** |

A degraded 200 is still useful: extractive manual excerpts plus clickable citations. It is not a full Gemini answer and must not be scored as a silent pass.
