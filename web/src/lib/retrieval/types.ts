/** Pure retrieval types — no DB / model runtime imports. */

export type RetrievedChunk = {
  /** Stable chunk identity shared across vector, lexical, RRF, CE, citations. */
  chunk_id: string;
  document_id: string;
  document_name?: string;
  section_path?: string | null;
  page_start?: number | null;
  page_end?: number | null;
  content: string;
  vehicle_id?: string;
  doc_family?: string;
  /** Content kind (text / image / table) — not the retriever channel. */
  content_modality?: 'text' | 'image' | 'table';
};

/**
 * Pre-fusion hit. `modality` here is the retrieve channel
 * (text vector | lexical | image) — not content_modality (text|image|table).
 */
export type RetrieverHit = RetrievedChunk & {
  modality: 'vector' | 'lexical' | 'image';
  /** Retriever-native score (distance, ts_rank, etc.) — not comparable across modalities. */
  retriever_score: number;
  /** Ready freeze alias for diagnostics: text_vector|lexical|image */
  retrieve_channel?: 'text_vector' | 'lexical' | 'image';
};

/**
 * Post-RRF (and optional section-dedup) candidate.
 * `rrf_score` is a rank-derived sum: Σ 1/(k+rank). Not normalized [0,1] similarity.
 */
export type RrfResult = RetrievedChunk & {
  modality: 'fusion';
  rrf_score: number;
};

/** Post-CE candidate. `ce_score` is model-native; not interchangeable with rrf_score. */
export type CeResult = RetrievedChunk & {
  modality: 'fusion';
  rrf_score: number;
  ce_score: number;
};

/** @deprecated Prefer RetrieverHit / RrfResult / CeResult with explicit score fields. */
export type ScoredResult = RetrievedChunk & {
  id?: string;
  score: number;
  modality: 'vector' | 'lexical' | 'fusion';
  rrf_score?: number;
  ce_score?: number;
};
