import { lexicalQueryFromQuestion } from '@/lib/retrieval/lexical_query';
import type { RetrieverHit } from '@/lib/retrieval/types';
import { query } from './db';

export type ChunkRow = {
  chunk_id: string;
  document_id: string;
  vehicle_id: string;
  doc_family: string;
  content: string;
  section_path: string | null;
  page_start: number | null;
  page_end: number | null;
  document_name: string | null;
};

export async function vehicleExists(vehicleId: string): Promise<boolean> {
  const res = await query<{ ok: number }>(
    'SELECT 1 AS ok FROM vehicles WHERE vehicle_id = $1 LIMIT 1',
    [vehicleId],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function vectorSearch(
  vehicleId: string,
  embedding: number[],
  topN: number,
  docFamily?: string,
): Promise<RetrieverHit[]> {
  const params: unknown[] = [vehicleId, `[${embedding.join(',')}]`, topN];
  let familyClause = '';
  if (docFamily) {
    familyClause = 'AND c.doc_family = $4';
    params.push(docFamily);
  }
  const res = await query<ChunkRow & { distance: number }>(
    `
    SELECT c.chunk_id, c.document_id, c.vehicle_id, c.doc_family, c.content,
           c.section_path, c.page_start, c.page_end, d.document_name,
           (c.embedding <=> $2::vector) AS distance
    FROM chunks c
    JOIN documents d ON d.id = c.document_pk
    WHERE c.vehicle_id = $1
      ${familyClause}
    ORDER BY c.embedding <=> $2::vector
    LIMIT $3
    `,
    params,
  );
  return res.rows.map((row) => ({
    chunk_id: row.chunk_id,
    document_id: row.document_id,
    document_name: row.document_name ?? undefined,
    section_path: row.section_path,
    page_start: row.page_start,
    page_end: row.page_end,
    content: row.content,
    vehicle_id: row.vehicle_id,
    doc_family: row.doc_family,
    modality: 'vector' as const,
    retriever_score: Number(row.distance),
  }));
}

export async function lexicalSearch(
  vehicleId: string,
  question: string,
  topN: number,
  docFamily?: string,
): Promise<RetrieverHit[]> {
  const lexicalQ = lexicalQueryFromQuestion(question);
  if (!lexicalQ) return [];
  const params: unknown[] = [vehicleId, lexicalQ, topN];
  let familyClause = '';
  if (docFamily) {
    familyClause = 'AND c.doc_family = $4';
    params.push(docFamily);
  }
  const res = await query<ChunkRow & { rank: number }>(
    `
    SELECT c.chunk_id, c.document_id, c.vehicle_id, c.doc_family, c.content,
           c.section_path, c.page_start, c.page_end, d.document_name,
           ts_rank_cd(c.content_tsv, plainto_tsquery('simple', $2)) AS rank
    FROM chunks c
    JOIN documents d ON d.id = c.document_pk
    WHERE c.vehicle_id = $1
      AND c.content_tsv @@ plainto_tsquery('simple', $2)
      ${familyClause}
    ORDER BY rank DESC
    LIMIT $3
    `,
    params,
  );
  return res.rows.map((row) => ({
    chunk_id: row.chunk_id,
    document_id: row.document_id,
    document_name: row.document_name ?? undefined,
    section_path: row.section_path,
    page_start: row.page_start,
    page_end: row.page_end,
    content: row.content,
    vehicle_id: row.vehicle_id,
    doc_family: row.doc_family,
    modality: 'lexical' as const,
    retriever_score: Number(row.rank),
  }));
}

export async function loadChunksByIds(
  chunkIds: string[],
): Promise<Map<string, ChunkRow>> {
  if (chunkIds.length === 0) return new Map();
  const res = await query<ChunkRow>(
    `
    SELECT c.chunk_id, c.document_id, c.vehicle_id, c.doc_family, c.content,
           c.section_path, c.page_start, c.page_end, d.document_name
    FROM chunks c
    JOIN documents d ON d.id = c.document_pk
    WHERE c.chunk_id = ANY($1::text[])
    `,
    [chunkIds],
  );
  return new Map(res.rows.map((r) => [r.chunk_id, r]));
}

export async function listFixtureVehicles(): Promise<string[]> {
  const res = await query<{ vehicle_id: string }>(
    `SELECT vehicle_id FROM vehicles WHERE vehicle_id LIKE 'fixture:%' ORDER BY vehicle_id`,
  );
  return res.rows.map((r) => r.vehicle_id);
}
