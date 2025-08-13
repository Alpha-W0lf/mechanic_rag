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

