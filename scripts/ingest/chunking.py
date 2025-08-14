from __future__ import annotations

from dataclasses import dataclass
from typing import List


@dataclass
class Chunk:
    content: str
    page_start: int | None
    page_end: int | None
    section_path: str | None
    section_heading: str | None


def fixed_window_chunks(text: str, window_chars: int = 1100, overlap_chars: int = 200) -> List[str]:
    if window_chars <= 0:
        return []
    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + window_chars)
        chunk = text[start:end]
        chunks.append(chunk)
        if end == n:
            break
        start = max(0, end - overlap_chars)
    return chunks


