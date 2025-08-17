from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any


@dataclass
class Chunk:
    """A chunk of text with metadata about its source location and structure."""
    document_id: str
    content: str
    page_start: int | None
    page_end: int | None
    section_path: str | None
    section_heading: str | None
    
    # Enhanced metadata for better retrieval
    chunk_index: int = 0

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Chunk:
        """Create a Chunk object from a dictionary."""
        return cls(
            document_id=data.get("document_id", ""),
            content=data.get("content", ""),
            page_start=data.get("page_start"),
            page_end=data.get("page_end"),
            section_path=data.get("section_path"),
            section_heading=data.get("section_heading"),
            chunk_index=data.get("chunk_index", 0),
        )


@dataclass
class DocumentSection:
    """Represents a hierarchical section within a document."""
    heading: str
    level: int  # 1=main heading, 2=subheading, etc.
    content: str
    page_start: int | None = None
    page_end: int | None = None
    parent_path: str = ""
    
    @property
    def section_path(self) -> str:
        """Generate hierarchical section path."""
        if self.parent_path:
            return f"{self.parent_path} > {self.heading}"
        return self.heading


def parse_markdown_structure(markdown_text: str) -> List[DocumentSection]:
    """Parse markdown text into hierarchical sections.
    
    Extracts heading structure from Docling's markdown output to create
    meaningful section boundaries for chunking.
    """
    sections = []
    lines = markdown_text.split('\n')
    
    current_section = None
    section_content = []
    hierarchy_stack = []  # Track heading hierarchy
    
    for line in lines:
        # Check if line is a heading
        heading_match = re.match(r'^(#{1,6})\s+(.+)', line.strip())
        
        if heading_match:
            # Save previous section if exists
            if current_section and section_content:
                current_section.content = '\n'.join(section_content).strip()
                sections.append(current_section)
            
            # Parse new heading
            level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()
            
            # Update hierarchy stack
            # Remove deeper levels
            hierarchy_stack = [h for h in hierarchy_stack if h[0] < level]
            hierarchy_stack.append((level, heading_text))
            
            # Build parent path
            parent_path = " > ".join([h[1] for h in hierarchy_stack[:-1]])
            
            # Create new section
            current_section = DocumentSection(
                heading=heading_text,
                level=level,
                content="",
                parent_path=parent_path
            )
            section_content = []
        else:
            # Add content to current section
            if line.strip():  # Skip empty lines
                section_content.append(line)
    
    # Don't forget the last section
    if current_section and section_content:
        current_section.content = '\n'.join(section_content).strip()
        sections.append(current_section)
    
    return sections


def structure_aware_chunking(
    markdown_text: str,
    target_chars: int = 1100,
    overlap_chars: int = 200,
    max_chars: int = 1200
) -> List[Chunk]:
    """Create structure-aware chunks with hierarchical context.
    
    Args:
        markdown_text: Docling-generated markdown content
        target_chars: Target chunk size (1000-1200 range)
        overlap_chars: Overlap between chunks
        max_chars: Maximum chunk size before forced split
        
    Returns:
        List of chunks with section metadata and hierarchical context
    """
    sections = parse_markdown_structure(markdown_text)
    chunks = []
    chunk_index = 0
    
    for section in sections:
        if not section.content.strip():
            continue
            
        # Create hierarchical context prefix
        context_prefix = ""
        if section.section_path:
            context_prefix = f"[{section.section_path}]\n\n"
        
        section_text = context_prefix + section.content
        
        # Split long sections into chunks
        if len(section_text) <= max_chars:
            # Section fits in one chunk
            chunks.append(Chunk(
                document_id="",
                content=section_text,
                page_start=section.page_start,
                page_end=section.page_end,
                section_path=section.section_path,
                section_heading=section.heading,
                chunk_index=chunk_index,
            ))
            chunk_index += 1
        else:
            # Split section into overlapping chunks
            section_chunks = smart_split_section(
                section_text,
                target_chars,
                overlap_chars,
                max_chars,
                section
            )
            
            for i, chunk_content in enumerate(section_chunks):
                chunks.append(Chunk(
                    document_id="",
                    content=chunk_content,
                    page_start=section.page_start,
                    page_end=section.page_end,
                    section_path=section.section_path,
                    section_heading=section.heading,
                    chunk_index=chunk_index,
                ))
                chunk_index += 1
    
    return chunks


def smart_split_section(
    text: str,
    target_chars: int,
    overlap_chars: int,
    max_chars: int,
    section: DocumentSection
) -> List[str]:
    """Split a section intelligently, preserving sentence boundaries when possible."""
    chunks = []
    
    # Try to split on paragraph boundaries first
    paragraphs = text.split('\n\n')
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph would exceed max_chars, save current chunk
        if current_chunk and len(current_chunk + "\n\n" + paragraph) > max_chars:
            chunks.append(current_chunk.strip())
            
            # Start new chunk with overlap from previous
            if overlap_chars > 0 and chunks:
                overlap_text = current_chunk[-overlap_chars:].strip()
                current_chunk = overlap_text + "\n\n" + paragraph
            else:
                current_chunk = paragraph
        else:
            # Add paragraph to current chunk
            if current_chunk:
                current_chunk += "\n\n" + paragraph
            else:
                current_chunk = paragraph
        
        # If current chunk is getting large (but under max), check if we should split
        if len(current_chunk) >= target_chars:
            chunks.append(current_chunk.strip())
            
            # Prepare overlap for next chunk
            if overlap_chars > 0:
                overlap_text = current_chunk[-overlap_chars:].strip()
                current_chunk = overlap_text
            else:
                current_chunk = ""
    
    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks


def fixed_window_chunks(text: str, window_chars: int = 1100, overlap_chars: int = 200) -> List[str]:
    """Legacy fixed-window chunking for compatibility."""
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


