"""Transactional upsert for one document version."""

from __future__ import annotations

import json
import logging
from typing import Any, Sequence

from mecharag.chunking import ChunkDraft

logger = logging.getLogger(__name__)


def content_hash_exists(conn, vehicle_id: str, document_id: str, content_hash: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM documents
            WHERE vehicle_id = %s AND document_id = %s AND content_hash = %s
            LIMIT 1
            """,
            (vehicle_id, document_id, content_hash),
        )
        return cur.fetchone() is not None


def upsert_document_version(
    conn,
    *,
    manifest: dict[str, Any],
    chunks: Sequence[ChunkDraft],
    embeddings: Sequence[Sequence[float]],
    embedding_model: str,
    embedding_dim: int,
) -> str:
    """
    Atomically upsert vehicle + one document version + chunks.
    Returns status: inserted | skipped | failed (caller handles exceptions).
    """
    if len(chunks) != len(embeddings):
        raise ValueError("chunks/embeddings length mismatch")

    vehicle_id = manifest["vehicle_id"]
    document_id = manifest["document_id"]
    content_hash = manifest["content_hash"]

    if content_hash_exists(conn, vehicle_id, document_id, content_hash):
        logger.info(
            "skip unchanged content_hash vehicle=%s document=%s hash=%s",
            vehicle_id,
            document_id,
            content_hash[:12],
        )
        return "skipped"

    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO vehicles (vehicle_id, year, make, model, engine, trim)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (vehicle_id) DO UPDATE SET
                  year = EXCLUDED.year,
                  make = EXCLUDED.make,
                  model = EXCLUDED.model,
                  engine = EXCLUDED.engine,
                  trim = EXCLUDED.trim
                """,
                (
                    vehicle_id,
                    manifest["year"],
                    manifest["make"],
                    manifest["model"],
                    manifest["engine"],
                    manifest.get("trim"),
                ),
            )

            # New artifact version row (same document_id + new version allowed)
            cur.execute(
                """
                INSERT INTO documents (
                  document_id, artifact_version, vehicle_id, doc_family, document_name,
                  content_hash, corpus_version, manifest_id, provenance, rights_class
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)
                ON CONFLICT (vehicle_id, doc_family, document_id, artifact_version)
                DO UPDATE SET
                  content_hash = EXCLUDED.content_hash,
                  corpus_version = EXCLUDED.corpus_version,
                  manifest_id = EXCLUDED.manifest_id,
                  provenance = EXCLUDED.provenance,
                  document_name = EXCLUDED.document_name,
                  rights_class = EXCLUDED.rights_class
                RETURNING id
                """,
                (
                    document_id,
                    manifest["artifact_version"],
                    vehicle_id,
                    manifest["doc_family"],
                    manifest.get("document_name"),
                    content_hash,
                    manifest["corpus_version"],
                    manifest["manifest_id"],
                    json.dumps(manifest.get("provenance") or {}),
                    manifest.get("rights_class"),
                ),
            )
            document_pk = cur.fetchone()[0]

            # Replace chunks for this document version only
            cur.execute("DELETE FROM chunks WHERE document_pk = %s", (document_pk,))

            for draft, emb in zip(chunks, embeddings, strict=True):
                if len(emb) != embedding_dim:
                    raise ValueError(
                        f"embedding dim mismatch for {draft.chunk_id}: "
                        f"{len(emb)} != {embedding_dim}"
                    )
                cur.execute(
                    """
                    INSERT INTO chunks (
                      chunk_id, document_pk, document_id, artifact_version,
                      vehicle_id, doc_family, chunk_index, content, content_checksum,
                      page_start, page_end, section_path, heading, modality,
                      embedding, embedding_model, embedding_dim
                    ) VALUES (
                      %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'text',
                      %s::vector,%s,%s
                    )
                    """,
                    (
                        draft.chunk_id,
                        document_pk,
                        document_id,
                        manifest["artifact_version"],
                        vehicle_id,
                        manifest["doc_family"],
                        draft.chunk_index,
                        draft.content,
                        draft.content_checksum,
                        draft.page_start,
                        draft.page_end,
                        draft.section_path,
                        draft.heading,
                        "[" + ",".join(str(float(x)) for x in emb) + "]",
                        embedding_model,
                        embedding_dim,
                    ),
                )

            cur.execute(
                """
                INSERT INTO index_state (
                  vehicle_id, doc_family, status, embedding_model, embedding_dim, corpus_version
                ) VALUES (%s,%s,'indexed',%s,%s,%s)
                ON CONFLICT (vehicle_id, doc_family) DO UPDATE SET
                  status = 'indexed',
                  embedding_model = EXCLUDED.embedding_model,
                  embedding_dim = EXCLUDED.embedding_dim,
                  corpus_version = EXCLUDED.corpus_version,
                  updated_at = now()
                """,
                (
                    vehicle_id,
                    manifest["doc_family"],
                    embedding_model,
                    embedding_dim,
                    manifest["corpus_version"],
                ),
            )

    return "inserted"
