from __future__ import annotations
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any
from pathlib import Path

@dataclass
class Chunk:
    """A chunk of text from a document."""
    document_id: str
    content: str
    page_start: int
    page_end: int
    section_heading: str
    section_path: str
    image_path: Optional[str] = None
    chunk_index: int = 0

def structure_aware_chunking(
    markdown_content: str,
    document_id: str,
    image_paths: List[Path],
    max_chars: int = 2000,
) -> List[Chunk]:
    """
    Splits Markdown content into semantic chunks based on structure,
    keeping atomic blocks like tables and image captions intact.
    """
    
    atomic_block_regex = re.compile(r"(\[Image:.*?\]|\|.*?\|[\n\s]*\|[-|:]{3,}\|.*?(?:\n\|.*\|)*)", re.DOTALL)
    
    initial_splits = atomic_block_regex.split(markdown_content)
    
    processed_blocks = []
    current_page = 1
    
    for block in initial_splits:
        if not block.strip():
            continue
        
        page_start_match = re.findall(r"PAGE_MARKER_START:(\d+)", block)
        if page_start_match:
            current_page = int(page_start_match[-1])

        clean_block = re.sub(r"PAGE_MARKER_(?:START|END):\d+\n?", "", block).strip()
        if not clean_block:
            continue

        is_atomic = bool(atomic_block_regex.match(block))
        processed_blocks.append({"content": clean_block, "page": current_page, "atomic": is_atomic})

    final_chunks = []
    temp_chunk_content = ""
    temp_chunk_page_start = 1
    
    for i, block in enumerate(processed_blocks):
        block_content = block["content"]
        block_page = block["page"]
        
        if block["atomic"]:
            if temp_chunk_content:
                final_chunks.append({
                    "content": temp_chunk_content.strip(),
                    "page_start": temp_chunk_page_start,
                    "page_end": block_page
                })
                temp_chunk_content = ""
            final_chunks.append({
                "content": block_content,
                "page_start": block_page,
                "page_end": block_page
            })
            temp_chunk_page_start = block_page
            continue

        if not temp_chunk_content:
            temp_chunk_page_start = block_page

        if len(temp_chunk_content) + len(block_content) <= max_chars:
            temp_chunk_content += "\n\n" + block_content
        else:
            if temp_chunk_content:
                final_chunks.append({
                    "content": temp_chunk_content.strip(),
                    "page_start": temp_chunk_page_start,
                    "page_end": block_page
                })
            temp_chunk_content = block_content
            temp_chunk_page_start = block_page

    if temp_chunk_content:
        final_chunks.append({
            "content": temp_chunk_content.strip(),
            "page_start": temp_chunk_page_start,
            "page_end": processed_blocks[-1]["page"]
        })

    chunks_with_metadata = []
    current_section_path = ""
    current_heading = ""
    for i, chunk_data in enumerate(final_chunks):
        content = chunk_data["content"]
        heading_match = re.search(r"^(#+)\s+(.*)", content)
        if heading_match:
            level = len(heading_match.group(1))
            heading = heading_match.group(2).strip()
            
            path_parts = current_section_path.split(" > ")
            if level > len(path_parts):
                 current_section_path = f"{current_section_path} > {heading}" if current_section_path else heading
            else:
                 path_parts = path_parts[:level-1]
                 path_parts.append(heading)
                 current_section_path = " > ".join(path_parts)
            current_heading = heading

        image_path_for_chunk = None
        if "[Image:" in content:
            page_num_for_img = chunk_data["page_start"]
            if page_num_for_img - 1 < len(image_paths):
                image_path_for_chunk = str(image_paths[page_num_for_img -1])

        chunks_with_metadata.append(
            Chunk(
                document_id=document_id,
                content=content,
                page_start=chunk_data["page_start"],
                page_end=chunk_data["page_end"],
                section_heading=current_heading,
                section_path=current_section_path,
                image_path=image_path_for_chunk,
                chunk_index=i
            )
        )
    return chunks_with_metadata


