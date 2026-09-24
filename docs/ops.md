# Ops notes

Short operational policy. Not a monitor implementation (that is a separate ticket).

## CI (this repo)

GitHub Actions workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Two jobs on `ubuntu-latest`, in parallel, PR + push to `main`. No paid runners. No scheduled Production smoke here.

| Job | Gate | What a green run proves |
|---|---|---|
| `web` | `pnpm lint` (`next lint`) | ESLint is clean. Lint **fails the gate** (no `\|\| true`, no `continue-on-error`). |
| `web` | `pnpm typecheck` (`tsc --noEmit`) | TypeScript is clean under `web/tsconfig.json` (app + tests). Pre-existing test mock typing was fixed so this gate is honest — not silenced. Injectable env helpers take `NodeJS.Dict<string>` (type-only; same runtime). |
| `web` | `pnpm test` (`vitest run`) | Existing Vitest unit tests pass. |
| `web` | `pnpm build` | Next.js production compile succeeds. |
| `python` | `public_fail_closed.py fixtures` | Public `fixtures/` has no OEM PDFs, no `private_oem` / `private_gold` path tokens, no forbidden `rights_class`. Fail-closed. |
| `python` | `pytest -m "not integration and not slow"` | Fast unit tests for `mecharag/` + `scripts/` that need **no** network, Ollama, or Postgres. |

**Python pin:** `3.13` (same as [`docs/dev_setup.md`](dev_setup.md) / [`.python-version`](../.python-version)). `pyproject.toml` allows `>=3.11`. Dependencies are cached.

**Markers** (see `[tool.pytest.ini_options]` in `pyproject.toml`):

| Mark | Why it is out of this CI subset |
|---|---|
| `integration` | Needs the sibling `second_brain` program fixtures, a live Vehicle Gold emit, or a running Compose/Next/Ollama stack. Those trees are not in this public clone. |
| `slow` | OEM PDF corpus under gitignored `rag_input/`, or anything that would call network / Ollama / Postgres. |

Local full suite (when you have the sibling repo / live emit): `pytest` from repo root. Tests skip with a reason when those trees are absent; CI **deselects** them so a missing sibling is not a silent skip of an intended gate. `tests/test_parser.py` and `tests/test_chunking.py` are **collect-ignored** (legacy OEM PDF smokes; they import `google.genai` from the `legacy` extra).

**Not in this repo's CI (by design):**

- Full eval suite (`mecharag eval --golden evals/`).
- Production / hosted smoke (`POST /api/ask` against the live demo).
- A scheduled workflow. This clone is dormant by design; GitHub disables schedules on inactive repos.

**Cited-Ask monitor lives in the hub.** [Alpha-W0lf/second_brain](https://github.com/Alpha-W0lf/second_brain) `.github/workflows/mechanic-ask-monitor.yml` (JH-41) is the scheduled fixture Ask probe (every 6 hours + `workflow_dispatch`). Do not add a schedule here to “cover” that. Local `/api/health` remains the clone readiness check.

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
