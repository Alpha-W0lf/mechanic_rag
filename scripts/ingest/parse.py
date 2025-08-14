from __future__ import annotations

from pathlib import Path
from typing import List

from .pdf_text import extract_pages_text, PageText


def parse_with_docling(pdf_path: Path) -> List[PageText]:  # pragma: no cover
    """Optional Docling-based parsing stub.

    If Docling is available and appropriate for the input PDF, use it to extract
    structured text with headings. This stub intentionally does not depend on the
    docling package until it's pinned in requirements.txt after evaluation.
    """
    raise NotImplementedError("Docling integration not yet implemented")


def parse_document(pdf_path: Path) -> List[PageText]:
    """Parse a PDF into page-level text blocks.

    Strategy (MVP): try Docling later; for now rely on PyMuPDF text layer.
    """
    # TODO: when Docling is pinned, try it here and fall back to PyMuPDF
    return extract_pages_text(pdf_path)


