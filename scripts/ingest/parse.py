from __future__ import annotations

from pathlib import Path
from typing import List

# Configure PyTorch for optimal M2 Max performance
try:
    from .torch_config import suppress_warnings
    suppress_warnings()
except ImportError:
    try:
        from torch_config import suppress_warnings
        suppress_warnings()
    except ImportError:
        pass  # Continue without optimization if not available

try:
    from .pdf_text import extract_pages_text, PageText
except ImportError:
    # Fallback for direct execution
    from pdf_text import extract_pages_text, PageText


def parse_with_docling(pdf_path: Path) -> List[PageText]:
    """Parse PDF using Docling for layout-aware text extraction.
    
    Uses Docling's DocumentConverter to extract structured text with better
    handling of headings, tables, and document layout compared to PyMuPDF.
    """
    try:
        from docling.document_converter import DocumentConverter
    except ImportError as exc:
        raise RuntimeError(f"Docling not available: {exc}") from exc
    
    # Initialize converter with default settings
    converter = DocumentConverter()
    
    try:
        # Convert the PDF document
        result = converter.convert(str(pdf_path))
        
        # Extract structured markdown content (includes headings, tables, etc.)
        markdown_content = result.document.export_to_markdown()
        
        # For now, create a single PageText object with all content
        # Docling provides document-level structured content rather than page-by-page
        # TODO: Later implement page boundary detection if needed for chunking
        if markdown_content and markdown_content.strip():
            pages = [PageText(
                page_number=1,  # Document-level content from Docling
                text=markdown_content.strip()
            )]
            print(f"Docling extracted {len(markdown_content)} chars from {pdf_path.name}")
            return pages
        else:
            raise RuntimeError(f"No content extracted from {pdf_path.name}")
            
        return pages
        
    except Exception as exc:
        raise RuntimeError(f"Docling parsing failed for {pdf_path}: {exc}") from exc


def parse_document(pdf_path: Path) -> List[PageText]:
    """Parse a PDF into page-level text blocks.

    Strategy: Docling primary parser with PyMuPDF fallback for robustness.
    """
    # Try Docling first (layout-aware parsing)
    try:
        return parse_with_docling(pdf_path)
    except RuntimeError as exc:
        print(f"Docling parsing failed for {pdf_path.name}, falling back to PyMuPDF: {exc}")
        # Fallback to PyMuPDF for reliability
        return extract_pages_text(pdf_path)


