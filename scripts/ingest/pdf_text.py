from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, List


try:
    import fitz  # PyMuPDF
except Exception as exc:  # pragma: no cover
    fitz = None  # type: ignore


@dataclass
class PageText:
    page_number: int  # 1-based
    text: str


def extract_pages_text(pdf_path: Path) -> List[PageText]:
    if fitz is None:
        raise RuntimeError(
            "PyMuPDF (fitz) is not installed. Install per requirements.txt to enable parsing."
        )

    pages: List[PageText] = []
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc, start=1):
            text = page.get_text("text") or ""
            # Normalize whitespace lightly; leave structure to chunker
            text = "\n".join(line.rstrip() for line in text.splitlines())
            pages.append(PageText(page_number=i, text=text))
    return pages


