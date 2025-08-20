## MechaRAG Technical Reference — Tailored Guide (S2000 Multimodal RAG)

Status: Draft v1 tailored to this repository. Living document; designed to be extended with decisions, research notes, and evaluation results over time.

This guide replaces the generic/classification‑oriented reference with a system design focused on MechaRAG: a high‑quality, multimodal RAG for the Honda S2000 manuals. It assumes a production‑minded MVP on free tiers, strong citations, and retrieval of both text and visuals (tables/diagrams).

Important scope note:
- Ingestion is locked and considered out of scope for change in this guide. We only summarize its interface because all downstream design depends on it.
- Post‑ingestion components (chunking, embeddings, vector store, retrieval/reranking, API contract, evaluation, ops) are the focus here and intentionally leave space for further research and tuning.


## 1) Overview and Goals

What we are building
- A reliable, production‑minded RAG that answers S2000 maintenance/service questions with accurate citations and, when relevant, the exact diagrams/tables matched to the question.
- MVP operates entirely on free tiers (Vercel + Supabase + Gemini), with careful quota awareness.

Non‑goals v1
- Agentic workflows, multi‑vehicle scope, knowledge graphs. These are future roadmap items.

Quality bar
- High retrieval precision with faithful, grounded answers.
- Always include citations; when visual content is relevant, return the specific visual assets (diagrams/tables) alongside text.

Where to find supporting docs in this repo
- Ingestion strategy (locked): `docs/multimodal_gemini_approach_plan.md`
- Planning and constraints: `docs/rough_planning.md`, `docs/rough_notes.md`
- Research tracks: `docs/embedding_research.md`, `docs/chunking_research.md`, `docs/indexing_research.md`, `docs/modern_ingestion_options.md`


## 2) System Lifecycle at a Glance

1. Ingestion (Locked): Multimodal extraction via Gemini 2.5 Pro → per‑page Markdown + per‑page PNG image; aggregated Markdown for chunking.
2. Chunking (Open to tuning): Markdown‑aware structure with atomic tables and image captions; fallback windowing; breadcrumbs.
3. Embeddings (Open to evaluation): Embed chunks; store model metadata; normalize; plan for model swaps.
4. Vector Store & Indexing (Mostly decided for MVP): Supabase Postgres + pgvector; prefer HNSW (cosine); organize metadata.
5. Retrieval & Ranking (Open to tuning): Vector search with MMR, dynamic k, thresholds; optional reranking (future); optional lexical fallback (future).
6. Generation & Response (MVP): Compose grounded answer with strict citations and optional `visual_assets`.
7. Evaluation & Ops (Open and critical): Define metrics, run offline evals, logging, quotas, rate limits, retries, cost visibility.

Locked vs Open summary
- Locked: Ingestion (see Section 3)
- Defaults (tune later): Chunking policy, MMR λ and dynamic k, similarity thresholds, embeddings model choice for MVP
- Open: Reranking strategy, lexical fallback, schema refinements, evaluation gates, ops budgets, storage URL strategy details


## 3) Ingestion (Locked — Do Not Change Here)

Authoritative source: `docs/multimodal_gemini_approach_plan.md`

Contract produced by ingestion
- Per‑page Markdown files capturing text, tables (as Markdown), and rich `[Image: ...]` or `[Table: ...]` captions.
- Per‑page PNG extracted from the original PDF, saved locally (e.g., `output/images/<doc>/page_<N>.png`).
- Aggregated Markdown document per source after all pages are processed; ready for chunking.

Why this matters downstream
- The chunker can rely on well‑formed Markdown (tables, captions) and accurate page mapping.
- Visual asset paths are available for inclusion in chunk metadata and later surfaced in answers.


## 4) Chunking Strategy (Canonical Policy for MVP; Open to Enhancements)

Objectives
- Preserve document structure and semantic coherence while creating retrieval‑friendly segments that map cleanly back to pages and visuals.

Canonical policy (MVP)
- Markdown‑aware chunker that treats tables and `[Image: ...]`/`[Table: ...]` captions as atomic, unbreakable units.
- Preserve and include hierarchical breadcrumbs (e.g., `section_path`, `section_heading`) in chunk text prefix and metadata to aid retrieval and citation clarity.
- Fallback windowing when structure cues are insufficient: 800–1200 characters with 150–250 character overlap, favoring sentence boundaries when possible.
- Always track `page_start`/`page_end` of the originating content range.

Suggested enhancements to evaluate
- Semantic refinement for long sections: split on low‑similarity valleys after initial structure‑aware pass (compute candidate boundaries and choose splits that minimize concept breakage).
- Hierarchical chunk references: parent/child relationships enabling optional sibling context injection at retrieval time (keep token budget in check).
- Normalization hints baked into chunk text for recall (unit aliases, acronyms), while preserving source fidelity.

Open questions / To research and decide
- Should we add per‑chunk token counts to better manage prompt budgets?
- Best overlap values for dense diagram sections vs prose‑heavy sections.
- Whether to include a short, machine‑generated summary per chunk for improved reranking later (off by default for MVP).


## 5) Chunk Metadata Schema (MVP and Extensions)

Required (MVP)
- `document_id`: foreign key to `documents`
- `page_start`, `page_end`: inclusive page range backing the chunk
- `section_path`: hierarchical breadcrumb (e.g., `13 Clutch > 13-3 Service`)
- `section_heading`: leaf heading/title of the chunk’s main section
- `content`: the chunk text (includes heading prefix if applied)
- `embedding`: vector (cosine‑normalized storage recommended)
- `image_path` (optional per chunk): relative path to page image when chunk corresponds to a caption/visual or when attaching the most relevant visual page

Recommended additions
- `vehicle` (e.g., `S2000`), `source_name` (owners/service manual), `source_type` (manual/pdf)
- `embedding_model` (name), `embedding_dimensions`, `embedding_version`
- `content_checksum` (e.g., sha256 for idempotency), `tokens_estimate`
- `units_normalized` (boolean) and/or `unit_map` (JSON) when normalization is applied

Open questions / To research
- Whether to store per‑chunk sparse features later (for hybrid dense+sparse retrieval).
- Best strategy to associate precise image regions (cropped diagrams) vs page‑level PNGs for v1.

Documents table (context for foreign key)
- `documents`: `id`, `vehicle`, `source_name`, `source_type`, `path`, `ingested_at`, optional `pages` count
- Open: add `checksum` and `ingest_version` for provenance; consider `storage_bucket`/`base_url` for asset mapping


## 6) Embeddings (Model, Normalization, Migration)

MVP default
- Google `text-embedding-004`, cosine similarity, vectors stored normalized (or normalized at query time; pick one and be consistent).
- Store `embedding_model`, `embedding_dimensions`, `embedding_version` in metadata for safe migrations.

Migration plan
- Keep an env‑driven toggle to swap to `text-embedding-005` (or alternatives like Cohere/OpenAI) after evaluation. Avoid hard‑coding dimensions anywhere.

Query preprocessing (lightweight; can be evolved)
- Normalize units and aliases (e.g., `N·m ↔ lb‑ft`, `mm ↔ in`).
- Expand common acronyms/synonyms (AP1/AP2, ECM/PCM, OBD‑II, ABS, VTEC).
- Spelling normalization and Unicode normalization.
- Keep the original query for traceability; log pre/post forms.

Open questions / To research
- Compare `text-embedding-004` vs alternatives on a curated QA set; decide thresholds for a model switch based on Recall@k and citation precision.
- Whether to apply separate embeddings for special content types (captions vs prose vs visuals) or keep a single stream for simplicity.


## 7) Vector Store & Indexing (Supabase + pgvector)

Baseline
- Supabase Postgres with `pgvector` for dense vectors.
- Operator class: cosine (`vector_cosine_ops`).
- Index: Prefer HNSW for interactive retrieval. If unavailable in some environment, use IVFFlat with lists ≈ sqrt(N) and probes ≈ 10.

Current stance
- We have verified HNSW is available in our Supabase project; adopt HNSW as the default for MVP.

Operational considerations
- Plan capacity: vector footprint ~3KB per 768‑dim float32; add index overhead and metadata. Keep an eye on quotas.
- Keep vectors co‑located with app for low latency; mind cold starts.
- Periodic maintenance (vacuum/analyze) and index rebuilds if needed after large upserts.

HNSW baseline parameters (to be tuned)
- `m ≈ 16`, `ef_construction ≈ 200`, `ef_search ≈ 100` as practical starting points for cosine.
- Measure recall@k and p95 latency on the QA set; adjust `ef_search` upward for recall at cost of latency.

Open questions / To research
- Namespacing strategy (multi‑vehicle future) and partitioning by `vehicle`/`source_name`.
- Whether to store visual assets in Supabase Storage and reference via signed/public URLs (see Section 9) or other good approaches for how to store visual assets.


## 8) Retrieval & Ranking (Defaults Now; Expect Iteration)

Retrieval policy (MVP defaults)
- Similarity: cosine.
- Candidate count: dynamic k
  - Short queries (≤5 tokens): k=6
  - Medium (6–15 tokens): k=8
  - Long (>15 tokens) or multi‑part: k=10–12
  - Confidence adjustment: if top‑1 ≥ 0.7, cap k at 6; if top‑1 < 0.4, increase k by +2
- MMR diversification: λ ≈ 0.4
- Similarity floor: drop chunks < 0.30; if fewer than 3 remain, relax to 0.25; if all < 0.20, consider fallback behavior

Visual‑aware behavior
- Treat caption chunks as valid first‑class retrieval results. If selected, surface associated `image_path` as a visual asset.
- For prose chunks that reference a figure/table, prefer merging a nearby caption chunk when available (bounded by token budget).

Optional reranking (research item; off for MVP due to free‑tier constraints)
- Cross‑encoder or hosted reranker (e.g., Cohere Rerank) to re‑score top‑K candidates for improved precision at small K.
- Gate via feature flag; log deltas to measure lift before enabling in production.

Potential lexical fallback (research item)
- When dense vector sims are uniformly low, consider BM25 or Postgres full‑text as a second‑chance retrieval. Track precision/recall trade‑offs before adopting.

Rank fusion (repo support exists)
- Consider Reciprocal Rank Fusion (RRF) to combine rankings from multiple retrievers (e.g., dense + lexical) or multiple embedding models. The repo includes utilities for MMR and RRF; evaluate fusion lift vs complexity.

Open questions / To research
- Empirical tuning of λ, k, and floors on the curated QA set.
- Cost/latency of rerankers vs accuracy gains; candidate sizes for rerank.
- Best available approaches, methods, and tools for ensuring high quality and relevance in text and visual retrieval.
- UX for showing multiple visual assets when several captions match.

Caching & deduplication
- Cache frequent query embeddings and retrieval results (short TTL) to reduce cost/latency on popular questions.
- Deduplicate near‑duplicate chunks at retrieval time (MMR helps) and avoid presenting redundant citations.


## 9) API Contract and Frontend Integration (Multimodal)

Endpoint: `/api/ask` (server‑side; no client exposure of secrets)

Request (conceptual)
- `query`: user question (raw)
- Optional: `vehicle` (default `S2000`), `max_tokens`, `debug` (boolean)

Response (canonical fields; extendable)
```json
{
  "answer": "string",
  "citations": [
    {
      "document_id": "string",
      "vehicle": "S2000",
      "source_type": "manual/pdf",
      "source_name": "string",
      "section_path": "string",
      "section_heading": "string",
      "page_start": 123,
      "page_end": 124,
      "chunk_id": "string",
      "similarity": 0.83
    }
  ],
  "visual_assets": [
    {
      "caption": "[Diagram: ...]",
      "path": "string (URL or relative path)",
      "page": 123,
      "figure_number": "optional string",
      "bbox": [x1, y1, x2, y2]
    }
  ],
  "debug": {
    "retrieved": [
      { "chunk_id": "string", "similarity": 0.83 }
    ],
    "mmr_lambda": 0.4,
    "k": 8
  }
}
```

Contract principles
- Citations are mandatory for all answers; include `page_start`/`page_end` for precise traceability.
- `visual_assets` included when a caption chunk or figure/table reference is part of the retrieved set; `path` may be a local path during dev and a Supabase Storage URL in prod.
- Keep `debug` optional and protected; never expose secrets or internal prompts.

Image path strategy (dev → prod)
- During ingestion/dev: `image_path` is a repo‑relative path (e.g., `output/images/.../page_123.png`).
- On deployment: programmatically prefix with a configurable base URL pointing to Supabase Storage (public or signed URLs). This decouples DB content from hosting topology and avoids DB rewrites. Public‑read is simpler; signed URLs provide access control. Choose based on UX and privacy posture.

Open questions / To research
- Additional fields beneficial for UI (e.g., `excerpt` highlights, figure numbers) without bloating payloads.
- Policy for multiple asset returns and layout in the UI.

Future visual pipeline (research)
- Evaluate adding image embeddings (e.g., CLIP/ViT) and late fusion with text scores for visually distinctive queries; consider storing optional image vectors in a parallel table.

Answer composition & prompting (guidelines)
- System prompt: emphasize safety, concision, and strict grounding; require citations for every factual claim; ask for clarification if retrieval confidence is low.
- Few‑shot style: include 1–2 formatted examples showing inline citation markers and when to attach `visual_assets`.
- Formatting: concise steps, torque specs with units, and explicit warnings where safety‑critical.

Citation formatting policy
- In text, reference sources as `[Source: <source_name>, p.<page_start>–<page_end>]` and ensure these align with `citations` payload.
- Avoid citing without page numbers unless truly unavailable; prefer the narrowest correct page range.

Errors & guardrails
- On invalid or empty retrieval (e.g., all sims < 0.20), return a helpful clarification request instead of guessing; include a `reason` in `debug`.
- For unsafe queries (e.g., instructions that could cause harm), refuse or prepend safety warnings per UI disclaimer policy.


## 10) Evaluation and Acceptance Criteria (Proposed Defaults; Revisit After Baseline)

Targets (proposed starting points)
- ≥ 85% of answers include at least one correct citation.
- ≥ 75% of answers judged factually correct by manual spot‑check against the manuals.
- ≥ 80% Recall@8 on the curated S2000 QA set.

These are sensible MVP gates to start with. Expect to refine after the first offline eval pass; track business/UX impact alongside retrieval metrics.

Evaluation plan
- Curate 30–50 S2000 queries across maintenance, torque specs, diagnostics, fluids, safety.
- Metrics:
  - Retrieval: Recall@k, MRR@10, nDCG@10
  - Generation: citation presence rate, citation correctness, faithfulness/factuality
- Frameworks to consider: RAGAs, TruLens, FlashRAG. Start lightweight with a script that logs per‑query diagnostics; adopt a framework when iteration accelerates.

Offline eval harness (lightweight outline)
- Inputs: curated QA CSV/JSON with question, expected section/page, and notes.
- Steps: run retrieval only; compute Recall@k and citation correctness; log per‑query diagnostics; then run full answer generation gated by retrieval results.
- Outputs: summary metrics, confusion cases, and suggested parameter adjustments.

E2E test scaffolding (lightweight)
- Snapshot tests for answer formatting (citations present, page numbers rendered, asset list structure).
- Guardrail tests: unsafe queries trigger disclaimers/refusals; low‑confidence paths request clarification rather than guessing.

Open questions / To research
- Scoring rubric and inter‑annotator agreement for factuality checks.
- Cost‑aware evaluation cadence (stay within free tier).


## 11) Operations: Logging, Quotas, Reliability (Define, Measure, Improve)

Per‑request structured logging (recommended fields)
- `request_id`, `timestamp`, `query_raw`, `query_normalized`
- retrieved `chunk_ids` with similarities (pre/post MMR if applicable)
- `mmr_lambda`, `k`, similarity thresholds applied
- latency breakdowns (embedding, DB query, MMR, LLM generation)
- token usage and estimated cost (where available)
- returned citations and visual asset paths
- error class and retry counts on failure

Metrics & dashboards
- Retrieval quality (confidence histograms, similarity floors triggered)
- Answer lengths, citation presence rate, asset usage rate
- Latency p50/p95/p99, error rates, retry rates
- Cost per 1k answers (estimate) and free‑tier usage burn‑down

Rate limiting and retries
- Document Gemini quotas (RPM/RPD) and Supabase limits; implement exponential backoff with jitter; circuit‑break Tier 2/LLM if needed.
- Non‑interactive operations must pass `--yes`/no‑prompt flags where applicable and avoid blocking calls.

Open questions / To research
- Precise current quotas for Gemini 2.5 Pro/Flash, Supabase free tier project limits, Vercel free tier limits; codify budgets.
- Background jobs for batch ingestion/re‑embedding and index maintenance without impacting live traffic.

Safety & disclaimers (UI and policy)
- Persistent, compact disclaimer: “Advisory only. Verify against your official service manual. Use at your own risk.”
- Safety‑critical answers must include warnings and torque verification notes; consider a `safety_flag` in `debug` for analytics.

Secrets & security
- Keys server‑side only; environment variables via Vercel for prod and `.env.local` for dev. No secrets in client or static assets.
- Strict CORS on API routes; redact logs; avoid storing raw queries if sensitive data could appear.

Versioning & migrations
- Version models, prompts, and indexes; store provenance with each embedded chunk.
- Re‑embedding workflow: support side‑by‑side indexes during migration with feature flags/canaries.

Monitoring & alerting
- Alerts on spikes in low‑confidence answers, missing citations, latency SLO breaches, and quota nearing.
- Daily/weekly reports on retrieval quality and asset usage.

Cost controls
- Track token/compute usage per 1k answers; cap LLM invocations via feature flags; prefer Flash when quality allows.

HITL feedback loop (lightweight MVP)
- Provide a reviewer action to mark an answer as correct/incorrect and attach the correct citation if needed.
- Feed corrections back into the KB (re‑embed corrected text) and maintain a small “golden set” for eval.


## 12) Decision Logs and TODO Placeholders

Use this section to record finalized decisions and link to PRs/evidence.

- Embedding model switch criteria: [TODO]
- MMR and k final defaults after first eval: [TODO]
- Reranker selection and gating plan: [TODO]
- Lexical fallback adoption decision: [TODO]
- Supabase Storage policy (public vs signed) and URL mapping: [TODO]
- Metadata schema freeze for v1: [TODO]


## 13) Future Roadmap (Beyond MVP)

- Reranking: add a small cross‑encoder or hosted reranker; measure precision gains at K≤5.
- Hybrid retrieval: combine dense vector search with BM25/full‑text; add sparse features per chunk.
- Knowledge graph / GraphRAG: extract entities/relations (systems, parts, torques) for multi‑hop queries.
- Image region precision: store cropped diagram regions and figure numbers; improve caption matching.
- Model distillation: fine‑tune or distill a smaller local model for embedding/answering to reduce cost/latency.
- Multi‑vehicle expansion: namespacing, partitioning, and per‑vehicle evaluation sets.


## Appendix A — Classification RAG Patterns (Brief)

Although out of scope for MechaRAG MVP, classification RAG patterns (category‑first, example reranking, tiered decisions) may be useful for future subsystems (e.g., auto‑tagging content). Keep these as architectural inspirations; they are not part of the core QA flow here.


## Appendix B — Glossary

- MMR: Maximal Marginal Relevance; a diversification technique balancing relevance and novelty.
- HNSW: Hierarchical Navigable Small World graph; an ANN index for fast nearest‑neighbor search.
- Caption chunk: Chunk representing an image/table description, prefixed with `[Image: ...]` or `[Table: ...]`.


## Appendix C — Document Map

- Ingestion (authoritative): `docs/multimodal_gemini_approach_plan.md`
- Planning: `docs/rough_planning.md`, `docs/rough_notes.md`
- Research: `docs/embedding_research.md`, `docs/chunking_research.md`, `docs/indexing_research.md`, `docs/modern_ingestion_options.md`
