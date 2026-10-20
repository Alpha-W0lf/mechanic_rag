"""Deterministic text chunking for Mechanic ingest."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any


@dataclass
class ChunkDraft:
    chunk_id: str
    chunk_index: int
    content: str
    content_checksum: str
    page_start: int | None
    page_end: int | None
    section_path: str | None
    heading: str | None


def stable_chunk_id(
    document_id: str, artifact_version: str, chunk_index: int, content: str
) -> str:
    digest = hashlib.sha256(
        f"{document_id}|{artifact_version}|{chunk_index}|{content}".encode("utf-8")
    ).hexdigest()[:24]
    return f"{document_id}:v{artifact_version}:c{chunk_index}:{digest}"


def chunk_manifest_units(
    document_id: str,
    artifact_version: str,
    units: list[dict[str, Any]],
    *,
    max_chars: int = 1200,
) -> list[ChunkDraft]:
    """One chunk per unit by default; split oversized units on paragraph boundaries."""
    drafts: list[ChunkDraft] = []
    idx = 0
    for unit in units:
        text = (unit.get("text") or "").strip()
        if not text:
            continue
        pieces = _split_text(text, max_chars)
        for piece in pieces:
            checksum = hashlib.sha256(piece.encode("utf-8")).hexdigest()
            drafts.append(
                ChunkDraft(
                    chunk_id=stable_chunk_id(
                        document_id, artifact_version, idx, piece
                    ),
                    chunk_index=idx,
                    content=piece,
                    content_checksum=checksum,
                    page_start=unit.get("page_start"),
                    page_end=unit.get("page_end"),
                    section_path=unit.get("section_path"),
                    heading=unit.get("heading"),
                )
            )
            idx += 1
    return drafts


def _split_text(text: str, max_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paras:
        return [text[:max_chars]]
    out: list[str] = []
    buf = ""
    for p in paras:
        if not buf:
            buf = p
        elif len(buf) + 2 + len(p) <= max_chars:
            buf = f"{buf}\n\n{p}"
        else:
            out.append(buf)
            buf = p
    if buf:
        out.append(buf)
    # Hard-split any still-oversized piece
    final: list[str] = []
    for piece in out:
        if len(piece) <= max_chars:
            final.append(piece)
        else:
            for i in range(0, len(piece), max_chars):
                final.append(piece[i : i + max_chars])
    return final
