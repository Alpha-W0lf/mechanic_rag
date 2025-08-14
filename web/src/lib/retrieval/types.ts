export type RetrievedChunk = {
  id: string;
  documentName: string;
  sectionPath?: string | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  content: string;
};

export type ScoredResult = RetrievedChunk & {
  score: number; // normalized [0,1]
  modality: 'vector' | 'lexical' | 'fusion';
};


