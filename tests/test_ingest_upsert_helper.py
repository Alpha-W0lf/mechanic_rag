"""Unit tests for shared private/fixture ingest upsert helper (DRY)."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

from mecharag.chunking import ChunkDraft
from mecharag.ingest_cmd import IngestItem, _upsert_loaded_documents


def _draft(i: int = 0) -> ChunkDraft:
    return ChunkDraft(
        chunk_id=f"c{i}",
        chunk_index=i,
        content=f"body {i}",
        content_checksum="a" * 64,
        page_start=1,
        page_end=1,
        section_path="s",
        heading="h",
    )


def test_upsert_loaded_documents_counts_inserted_skipped_failed(
    monkeypatch: Any,
) -> None:
    manifests = [
        {
            "document_id": "d1",
            "artifact_version": "1",
            "vehicle_id": "cat:demo",
            "content_hash": "1" * 64,
            "units": [{"text": "a", "page_start": 1, "page_end": 1}],
        },
        {
            "document_id": "d2",
            "artifact_version": "1",
            "vehicle_id": "cat:demo",
            "content_hash": "2" * 64,
            "units": [{"text": "b", "page_start": 1, "page_end": 1}],
        },
        {
            "document_id": "d3",
            "artifact_version": "1",
            "vehicle_id": "cat:demo",
            "content_hash": "3" * 64,
            "units": [],  # empty → fail that item
        },
    ]
    items = [
        IngestItem(manifest=m, error_path=f"p{i}")
        for i, m in enumerate(manifests)
    ]

    def chunk_side(doc_id: str, *_a: Any, **_k: Any) -> list[ChunkDraft]:
        if doc_id == "d3":
            return []
        return [_draft()]

    monkeypatch.setattr(
        "mecharag.ingest_cmd.chunk_manifest_units", chunk_side
    )
    # No pre-existing hashes → all go through chunk/embed/upsert path
    monkeypatch.setattr(
        "mecharag.ingest_cmd.content_hash_exists", lambda *_a, **_k: False
    )

    statuses = iter(["inserted", "skipped"])

    def upsert_side(*_args: Any, **_kwargs: Any) -> str:
        return next(statuses)

    monkeypatch.setattr("mecharag.ingest_cmd.upsert_document_version", upsert_side)

    embedder = MagicMock()
    embedder.model = "nomic-embed-text"
    embedder.dim = 768
    embedder.embed.return_value = [[0.0] * 768]

    inserted, skipped, failed = _upsert_loaded_documents(
        MagicMock(),
        embedder,
        items,
        doc_progress_every=1,
        chunk_progress_every=0,
    )
    assert (inserted, skipped, failed) == (1, 1, 1)


def test_upsert_skips_before_embed_when_content_hash_exists(
    monkeypatch: Any,
) -> None:
    """Idempotent re-run must not chunk or call Ollama for unchanged docs."""
    items = [
        IngestItem(
            manifest={
                "document_id": "d1",
                "artifact_version": "1",
                "vehicle_id": "cat:demo",
                "content_hash": "1" * 64,
                "units": [{"text": "a", "page_start": 1, "page_end": 1}],
            },
            error_path="p0",
        )
    ]
    chunk = MagicMock(side_effect=AssertionError("chunk must not run"))
    upsert = MagicMock(side_effect=AssertionError("upsert must not run"))
    monkeypatch.setattr("mecharag.ingest_cmd.chunk_manifest_units", chunk)
    monkeypatch.setattr("mecharag.ingest_cmd.upsert_document_version", upsert)
    monkeypatch.setattr(
        "mecharag.ingest_cmd.content_hash_exists", lambda *_a, **_k: True
    )

    embedder = MagicMock()
    embedder.model = "nomic-embed-text"
    embedder.dim = 768

    inserted, skipped, failed = _upsert_loaded_documents(
        MagicMock(),
        embedder,
        items,
        doc_progress_every=1,
        chunk_progress_every=0,
    )
    assert (inserted, skipped, failed) == (0, 1, 0)
    embedder.embed.assert_not_called()
    chunk.assert_not_called()
    upsert.assert_not_called()
