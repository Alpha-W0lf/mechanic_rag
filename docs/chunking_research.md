## Chunking Research — Aug 2025

Status: Research in progress — decision pending. Baseline parameters below are provisional until eval results.

### Objectives
- Maximize retrieval accuracy while controlling token usage.
- Preserve semantic boundaries (sections, subsections, bullet lists, tables).

### Strategies to Compare
- Fixed-size windows: 800–1200 chars with 150–250 overlap.
- Structure-aware chunking: split on headings (TOC, numbering), preserve bullet blocks and tables.
- Semantic chunking: embedding-aware breakpoints to avoid splitting concepts.
- Hierarchical chunks: include section path context in each chunk.

### Baseline Proposal (MVP)
- 1000–1200 chars, 200 overlap; retain headings and page ranges in metadata.
- Use MMR during retrieval to diversify results.

### Evaluation
- Measure Recall@k, citation correctness rate, and end-to-end answer quality on the curated QA set.
- Tune window size/overlap to meet acceptance criteria (see planning doc Section 12).

### Research To-Do
- Survey recent (currently Aug 2025) techniques for structure-aware and semantic chunking.
- Prototype heading-aware and semantic-aware splitters; compare against fixed windows.
- Validate table-boundary preservation strategies.

### Notes
- Manuals often use numbered headings; leverage these plus PDF outline.
- Keep tables intact within a single chunk when possible.

### Findings from Web Search 1 (Aug 2025) — Structure-Aware Chunking

- Split on semantic/structural boundaries: headings (TOC/outline), numbered sections, bullet blocks, tables; avoid splitting tables and lists mid-block.
- Include hierarchical context: prepend section path (e.g., "13 Clutch > 13-3 Service") to each chunk to aid retrieval and disambiguation.
- Window + overlap remains strong: 800–1200 chars with ~150–250 overlap, but prioritize structure-aware first and use fixed windows as fallback.
- Diversify at retrieval time: apply MMR to reduce near-duplicates; consider dynamic k based on query length and similarity confidence.
- Normalize units/aliases within chunks (N·m↔lb-ft, AP1/AP2) to improve matching consistency without altering source meaning.
- Evaluate chunking via retrieval metrics (Recall@k, nDCG) and end QA accuracy with citations; iterate on split heuristics where failures cluster.

### Findings from Web Search 2 (Aug 2025) — Semantic-Aware Chunking

- Embedding-aware splitters (semantic boundaries) can reduce concept-splitting and improve Recall@k vs naive fixed windows, especially in dense prose.
- Practical approach: start with structure-aware splits, then refine long sections by finding low-similarity valleys (cosine drops) to define boundaries.
- Caveats: higher CPU time (must compute embeddings for candidate boundaries); may overfit to one embedding model—retest if swapping models.
- Hybrid recipe: structure-first, then semantic-refinement for sections > X chars (e.g., >2–3k). Cap chunk size to avoid very long segments.

### Findings from Web Search 3 (Aug 2025) — Hierarchical Chunking & Context Injection

- Parent-child chunks: store fine-grained chunks with references to parent sections; include breadcrumbs (e.g., Manual > Section > Subsection) in metadata and optionally in chunk text prefix.
- Context injection: at retrieval time, merge top-1 parent heading and siblings when useful; cap combined tokens to avoid dilution.
- Use section-aware reranking: prefer chunks where heading terms match query entities (e.g., "torque", "clutch").
- Evaluation: compare flat vs hierarchical retrieval on the QA set; track citation correctness improvements and prompt length overhead.

### Findings from Web Search 4 (Aug 2025) — MMR Retrieval Tuning

- MMR balances relevance and diversity via λ (lambda). Practical defaults: λ≈0.3–0.5 (start at 0.4). Lower λ increases diversity; higher λ emphasizes top similarity.
- Pair MMR with dynamic k: shorter queries k=6, medium k=8, longer/multi-part k=10–12; adjust ±2 based on similarity confidence of top-1.
- Trade-offs: too-diverse results can dilute direct relevance; too-high λ can return near-duplicates from the same section. Monitor citation correctness and answer drift.
- Implementation: normalize vectors; implement a similarity floor (e.g., 0.30) and relax when candidates are too few.

### Findings from Web Search 5 (Aug 2025) — Chunk Size, Overlap, and Evaluation

- Token vs character: token-based limits align better with model context; char-based is simpler and often sufficient if text is normalized. For MVP, use character windows but log token counts; revisit if prompt bloat appears.
- Sizes: start 800–1200 chars (~200–300 tokens) with 150–250 overlap; increase overlap for diagram-heavy pages if references span paragraphs.
- Sentence/paragraph boundaries: prefer splits at sentence ends to reduce mid-sentence truncation; fall back to character windows when boundary detection fails.
- Evaluation: track token budget per answer, Recall@k changes with size/overlap, and citation correctness. Choose parameters that hit acceptance targets with minimal prompt growth.

### Pros/Cons and When to Extend (Aug 2025)

- Structure-aware + overlap (baseline)
  - Pros: simple, robust, preserves headings/tables, good initial recall.
  - Cons: minor prompt bloat; occasional concept splits on long sections.
- Semantic-aware refinement
  - Pros: cleaner boundaries on long sections; better Recall@k in dense prose.
  - Cons: embedding cost during splitting; may overfit to a specific model.
- Hierarchical context
  - Pros: disambiguation via breadcrumbs; improves citation correctness.
  - Cons: extra prompt tokens; needs careful merging.
- Confidence: High for baseline; extend to semantic/hierarchical if evaluation misses targets or specific sections underperform.

