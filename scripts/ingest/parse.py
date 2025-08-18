from __future__ import annotations
import os
import time
from pathlib import Path
from typing import List, Tuple

import google.generativeai as genai
from pypdf import PdfReader, PdfWriter
from pdf2image import convert_from_path

# --- Constants ---
OUTPUT_DIR = Path("output")
IMAGES_DIR = OUTPUT_DIR / "images"
MARKDOWN_DIR = OUTPUT_DIR / "markdown"
PDF_CHUNK_SIZE = 500  # Number of pages per chunk to send to the API
DPI = 300 # DPI for the extracted PNG images

def get_page_analysis_prompt(page_num: int) -> str:
    """Returns the standardized prompt for Gemini to analyze a single page."""
    return f"""
You are a technical document specialist. Your task is to meticulously analyze the provided PDF file and convert the entire content of page {page_num} into a well-structured Markdown document.

Instructions:
1.  **Transcribe All Text:** Capture every piece of text on the page, including headers, footers, page numbers, table content, diagram labels, and captions.
2.  **Preserve Structure:** Replicate the document's structure using Markdown. Use headings (`#`, `##`, etc.) for titles and sections. Use lists for itemized information.
3.  **Format Tables:** Recreate any tables using Markdown table syntax. Ensure all rows, columns, and headers are accurately represented.
4.  **Describe Images/Diagrams:** For every diagram, image, or figure, generate a detailed, descriptive caption and embed it in the Markdown using the format `[Image: A detailed description of the visual element.]`.
5.  **Be Exact:** Do not summarize, interpret, or add any information not present in the original document. The goal is a perfect, machine-readable transcription of the page's content and layout.
"""

def split_pdf_into_chunks(pdf_path: Path, temp_dir: Path, chunk_size: int) -> List[Path]:
    """Splits a large PDF into smaller, temporary PDF chunks."""
    print(f"Splitting {pdf_path.name} into chunks of {chunk_size} pages...")
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    chunk_paths = []

    if total_pages <= chunk_size:
        print("PDF is smaller than chunk size, no splitting needed.")
        return [pdf_path]

    for i in range(0, total_pages, chunk_size):
        writer = PdfWriter()
        start_page = i
        end_page = min(i + chunk_size, total_pages)
        chunk_path = temp_dir / f"{pdf_path.stem}_chunk_{start_page + 1}-{end_page}.pdf"

        for j in range(start_page, end_page):
            writer.add_page(reader.pages[j])

        with open(chunk_path, "wb") as f:
            writer.write(f)
        chunk_paths.append(chunk_path)
        print(f"  Created chunk: {chunk_path.name}")

    return chunk_paths

def extract_page_as_png(pdf_path: Path, page_num: int, output_path: Path, dpi: int):
    """Extracts a single page from a PDF and saves it as a PNG."""
    try:
        page_image = convert_from_path(
            pdf_path,
            first_page=page_num,
            last_page=page_num,
            dpi=dpi,
            fmt="png"
        )[0]
        page_image.save(output_path, "PNG")
    except Exception as e:
        print(f"ERROR: Could not extract page {page_num} as PNG. Is poppler installed?")
        raise e

def parse_document(pdf_path: Path) -> Tuple[str, List[Path]]:
    """
    Parses a PDF into a single Markdown string and a set of page images using the
    Gemini 2.5 Pro PDF-native, multi-prompt analysis, and on-demand asset
    extraction strategy.
    """
    print(f"Starting multimodal parsing for {pdf_path.name}...")

    # --- 1. Setup Directories ---
    doc_images_dir = IMAGES_DIR / pdf_path.stem
    doc_markdown_dir = MARKDOWN_DIR / pdf_path.stem
    temp_pdf_dir = OUTPUT_DIR / "temp_pdfs" / pdf_path.stem
    doc_images_dir.mkdir(parents=True, exist_ok=True)
    doc_markdown_dir.mkdir(parents=True, exist_ok=True)
    temp_pdf_dir.mkdir(parents=True, exist_ok=True)

    image_paths: List[Path] = []
    
    # --- 2. Split PDF into manageable chunks ---
    pdf_chunks = split_pdf_into_chunks(pdf_path, temp_pdf_dir, PDF_CHUNK_SIZE)
    total_pages = len(PdfReader(pdf_path).pages)
    
    # --- 3. Process each chunk ---
    page_offset = 0
    for chunk_path in pdf_chunks:
        print(f"\n--- Processing PDF Chunk: {chunk_path.name} ---")
        
        # --- 3a. Upload chunk to File API ---
        print(f"Uploading {chunk_path.name} to Gemini File API...")
        pdf_file = genai.upload_file(path=chunk_path, display_name=chunk_path.name)
        
        try:
            # --- 3b. Start Chat Session ---
            model = genai.GenerativeModel(model_name="gemini-2.5-pro")
            chat = model.start_chat()
            
            num_pages_in_chunk = len(PdfReader(chunk_path).pages)
            
            # --- 3c. Process each page in the chunk ---
            for i in range(num_pages_in_chunk):
                page_num_in_chunk = i + 1
                page_num_in_doc = page_offset + page_num_in_chunk
                
                markdown_path = doc_markdown_dir / f"page_{page_num_in_doc}.md"
                image_path = doc_images_dir / f"page_{page_num_in_doc}.png"
                image_paths.append(image_path)
                
                # --- i. Resumability Check ---
                if markdown_path.exists():
                    print(f"Skipping page {page_num_in_doc}/{total_pages}, output already exists.")
                    continue
                    
                print(f"Analyzing page {page_num_in_doc}/{total_pages}...")
                
                # --- ii. Multi-prompt Analysis ---
                prompt = get_page_analysis_prompt(page_num_in_chunk)
                response = chat.send_message([prompt, pdf_file] if i == 0 else prompt)
                
                # --- iii. Save Markdown ---
                with open(markdown_path, "w") as f:
                    f.write(response.text)
                    
                # --- iv. On-demand Asset Extraction ---
                extract_page_as_png(pdf_path, page_num_in_doc, image_path, DPI)
                
                # --- v. Rate Limiting ---
                time.sleep(13) # ~4.6 RPM, safely under the 5 RPM limit for Gemini 2.5 Pro

        except Exception as e:
            print(f"ERROR processing chunk {chunk_path.name}: {e}")
        finally:
            # --- 3d. Cleanup ---
            print(f"Deleting uploaded file: {pdf_file.name}")
            genai.delete_file(pdf_file.name)
            
        page_offset += num_pages_in_chunk

    # --- 4. Aggregate Markdown ---
    print("\nAggregating all Markdown content...")
    full_markdown_content = []
    for i in range(1, total_pages + 1):
        md_path = doc_markdown_dir / f"page_{i}.md"
        if md_path.exists():
            full_markdown_content.append(md_path.read_text())
            
    aggregated_content = "\n\n---\n\n".join(full_markdown_content)
    
    # --- 5. Final Cleanup ---
    # Optionally, clean up the temp_pdf_dir here if desired
    
    print("Multimodal parsing complete.")
    return aggregated_content, image_paths


