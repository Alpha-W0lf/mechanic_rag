import { NextRequest, NextResponse } from 'next/server';
import { reciprocalRankFusion } from '@/lib/retrieval/rrf';
import { mmr } from '@/lib/retrieval/mmr';
import type { ScoredResult } from '@/lib/retrieval/types';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const query = (body.query || '').toString().trim();
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // Stub: fake candidates for vector and lexical
  const vector: ScoredResult[] = [
    { id: 'v1', documentName: 'Owners Manual', sectionPath: 'Intro', pageStart: 1, pageEnd: 1, content: '...', score: 0.9, modality: 'vector' },
    { id: 'v2', documentName: 'Service Manual', sectionPath: '13-3', pageStart: 10, pageEnd: 11, content: '...', score: 0.7, modality: 'vector' },
  ];
  const lexical: ScoredResult[] = [
    { id: 'l1', documentName: 'Service Manual', sectionPath: '13-3', pageStart: 9, pageEnd: 9, content: '...', score: 0.8, modality: 'lexical' },
  ];

  const fused = reciprocalRankFusion(vector, lexical, 60, 50);
  const final = mmr(fused, 0.4, 8);
  return NextResponse.json({ query, results: final });
}
