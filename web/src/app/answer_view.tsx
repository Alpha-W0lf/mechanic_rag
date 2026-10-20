'use client';
import React from 'react';
import { docFamilyLabel, readableSection } from '@/lib/ask_copy';
import { renderAnswerCitationNodes } from '@/lib/answer_citations';
import { parseAnswerBlocks } from '@/lib/answer_markdown';

export type Citation = {
  label: string;
  chunk_id: string;
  vehicle_id: string;
  doc_family: string;
  document_id: string;
  section_path: string | null;
  page_start: number | null;
  page_end: number | null;
  excerpt?: string;
};

export type VisualAsset = {
  chunk_id: string;
  document_id: string;
  page_start: number;
  content_type: string;
  href: string;
};

function formatPageRange(start: number | null, end: number | null): string {
  if (start == null) return '';
  if (end != null && end !== start) return `p. ${start}–${end}`;
  return `p. ${start}`;
}

export function AnswerCitationText({
  text,
  citations,
}: {
  text: string;
  citations: Citation[];
}) {
  const nodes = renderAnswerCitationNodes(
    text,
    citations.map((c) => c.label),
  );
  return (
    <>
      {nodes.map((node, i) =>
        node.type === 'text' ? (
          node.strong ? (
            <strong key={i}>{node.value}</strong>
          ) : (
            <span key={i}>{node.value}</span>
          )
        ) : (
          <a
            key={i}
            href={node.href}
            aria-label={node.ariaLabel}
            className="font-semibold text-accent underline-offset-2 hover:underline"
          >
            [{node.label}]
          </a>
        ),
      )}
    </>
  );
}

export function AnswerBody({
  text,
  citations,
}: {
  text: string;
  citations: Citation[];
}) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink">
      {parseAnswerBlocks(text).map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <h3 key={i} className="font-semibold text-ink pt-1">
              <AnswerCitationText text={block.text} citations={citations} />
            </h3>
          );
        }
        if (block.kind === 'list') {
          const items = block.items.map((item, j) => (
            <li key={j}>
              <AnswerCitationText text={item} citations={citations} />
            </li>
          ));
          return block.ordered ? (
            <ol key={i} className="list-decimal pl-5 space-y-1">
              {items}
            </ol>
          ) : (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {items}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            <AnswerCitationText text={block.text} citations={citations} />
          </p>
        );
      })}
    </div>
  );
}

export function CitationList({
  citations,
  visualAssets,
}: {
  citations: Citation[];
  visualAssets: VisualAsset[];
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted mb-3">
        Citations ({citations.length})
      </h2>
      <ul className="space-y-3">
        {citations.map((c) => {
          const pages = visualAssets.filter(
            (v) => v.document_id === c.document_id && v.chunk_id === c.chunk_id,
          );
          const pageLine = formatPageRange(c.page_start, c.page_end);
          const section = readableSection(c.section_path);
          return (
            <li
              key={c.chunk_id}
              id={`citation-${c.label}`}
              className="border border-border rounded-[var(--radius-lg)] p-4 text-sm bg-surface"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <a
                  href={`#citation-${c.label}`}
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                >
                  [{c.label}]
                </a>
                <span className="font-medium text-ink">
                  {docFamilyLabel(c.doc_family)}
                </span>
                {pageLine && <span className="text-ink-muted">{pageLine}</span>}
              </div>
              {section && <div className="mt-1 text-ink-muted">{section}</div>}
              {c.excerpt && (
                <blockquote className="mt-2 border-l-2 border-border pl-3 text-ink-muted">
                  {c.excerpt}
                </blockquote>
              )}
              {pages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
                    Page figure
                  </p>
                  <div className="flex flex-col gap-3">
                    {pages.map((v) => (
                      <figure key={v.href}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.href}
                          alt={`Manual page ${v.page_start}`}
                          className="max-w-full border border-border rounded-[var(--radius-md)]"
                        />
                        <figcaption className="text-xs text-ink-muted mt-1">
                          Manual page {v.page_start}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
