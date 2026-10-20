import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from '@/app/page';
import {
  ASK_IN_FLIGHT_STATUS,
  ASK_QUESTION_PLACEHOLDER,
  CORPUS_COVERS_SUMMARY,
  DEGRADED_ASK_BANNER,
  DEGRADED_OUTCOME_LABEL,
  HEADER_TAGLINE,
  RETRY_SUMMARY_LABEL,
  docFamilyLabel,
  readableSection,
} from '@/lib/ask_copy';

describe('homepage header', () => {
  it('shows the product line and no internal ops text', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html).toContain(HEADER_TAGLINE);
    expect(html).toContain(ASK_QUESTION_PLACEHOLDER);
    for (const internal of [
      'CE off',
      'ce_skip_reason',
      'cross-encoder',
      'Free-tier',
      'rate-limited',
      'VLM',
    ]) {
      expect(html).not.toContain(internal);
    }
    expect(html).not.toMatch(/sorry|apolog/i);
  });
});

describe('Ask copy', () => {
  it('keeps outcome labels plain and the refusal summary free of repeats', () => {
    expect(DEGRADED_OUTCOME_LABEL).toBe('Cited excerpts');
    expect(DEGRADED_ASK_BANNER).toMatch(/citations to the manual pages/i);
    expect(DEGRADED_ASK_BANNER).not.toMatch(/sorry|apolog|rate limit/i);
    expect(ASK_IN_FLIGHT_STATUS).not.toMatch(/gemini|free-tier|retries/i);
    expect(RETRY_SUMMARY_LABEL).toBe('Retry summary');
    expect(CORPUS_COVERS_SUMMARY).toContain('Honda S2000 service manual');
    expect(CORPUS_COVERS_SUMMARY.match(/covers/gi)).toHaveLength(1);
  });

  it('labels citation sources for people', () => {
    expect(docFamilyLabel('owners_manual')).toBe('Owner’s manual');
    expect(
      readableSection('Honda S2000 - Service Manual_2000 - 2008.pdf/page-1143'),
    ).toBeNull();
    expect(readableSection('1-1 Engine oil')).toBe('1-1 Engine oil');
  });

  it('renders answers through the block renderer, not raw text', () => {
    const src = ['../page.tsx', '../answer_view.tsx']
      .map((p) => readFileSync(resolve(__dirname, p), 'utf8'))
      .join('\n');
    expect(src).toContain('parseAnswerBlocks');
    expect(src).not.toContain('dangerouslySetInnerHTML');
    expect(src).not.toContain('{c.chunk_id}</');
  });
});
