from __future__ import annotations
from pathlib import Path
from typing import List, Tuple
import time

from PIL import Image
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError
import google.generativeai as genai

# --- Constants ---
OUTPUT_DIR = Path("output")
IMAGES_DIR = OUTPUT_DIR / "images"
MARKDOWN_DIR = OUTPUT_DIR / "markdown"
DPI = 300

def get_gemini_prompt() -> str:
    """Returns the standardized prompt for the Gemini API."""
    return """
You are a technical document specialist. Your task is to meticulously analyze the provided image of a technical manual page and convert its entire content into a well-structured Markdown document.

Instructions:
1.  **Transcribe All Text:** Capture every piece of text on the page, including headers, footers, page numbers, table content, diagram labels, and captions.
2.  **Preserve Structure:** Replicate the document's structure using Markdown. Use headings (`#`, `##`, etc.) for titles and sections. Use lists for itemized information.
3.  **Format Tables:** Recreate any tables using Markdown table syntax. Ensure all rows, columns, and headers are accurately represented.
4.  **Describe Images/Diagrams:** For every diagram, image, or figure, generate a detailed, descriptive caption and embed it in the Markdown using the format `[Image: A detailed description of the visual element.]`.
5.  **Be Exact:** Do not summarize, interpret, or add any information not present in the original document. The goal is a perfect, machine-readable transcription of the page's content and layout.
"""

def parse_document(pdf_path: Path) -> Tuple[str, List[Path]]:
    """
    Parses a PDF into a single Markdown string using a multimodal Gemini model,
    implementing a resumable, page-by-page image conversion strategy.

    Returns:
        A tuple containing the aggregated Markdown content and a list of paths
        to the generated images.
    """
    print(f"Starting multimodal parsing for {pdf_path.name}...")

    # Create document-specific output directories
    doc_images_dir = IMAGES_DIR / pdf_path.stem
    doc_markdown_dir = MARKDOWN_DIR / pdf_path.stem
    doc_images_dir.mkdir(parents=True, exist_ok=True)
    doc_markdown_dir.mkdir(parents=True, exist_ok=True)

    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    prompt = get_gemini_prompt()
    image_paths: List[Path] = []
    
    try:
        # Use pdfinfo to get the number of pages
        from pdf2image import pdfinfo_from_path
        page_count = pdfinfo_from_path(pdf_path, userpw=None, poppler_path=None)['Pages']
    except PDFInfoNotInstalledError:
        print("ERROR: Poppler is not installed or not in PATH. Cannot get page count.")
        raise

    for page_num in range(1, page_count + 1):
        image_path = doc_images_dir / f"page_{page_num}.png"
        markdown_path = doc_markdown_dir / f"page_{page_num}.md"
        image_paths.append(image_path)

        if markdown_path.exists():
            print(f"Skipping page {page_num}, output already exists.")
            continue

        print(f"Processing page {page_num}/{page_count}...")
        
        try:
            # Convert page to image
            page_image = convert_from_path(
                pdf_path,
                first_page=page_num,
                last_page=page_num,
                dpi=DPI,
                fmt="png"
            )[0]
            page_image.save(image_path, "PNG")

            # Call Gemini API
            response = model.generate_content([prompt, page_image])
            
            # Save markdown output
            with open(markdown_path, "w") as f:
                f.write(response.text)
            
            # Simple rate limiting
            time.sleep(2) # Roughly 30 RPM to stay well under Gemini Flash limits

        except Exception as e:
            print(f"ERROR processing page {page_num}: {e}")
            # Log failure and continue
            with open(OUTPUT_DIR / "failed_pages.log", "a") as f:
                f.write(f"{pdf_path.name} - Page {page_num}\n")
            continue

    # Aggregate all markdown files into a single string
    print("Aggregating Markdown content...")
    full_markdown_content = []
    for page_num in range(1, page_count + 1):
        markdown_path = doc_markdown_dir / f"page_{page_num}.md"
        if markdown_path.exists():
            full_markdown_content.append(markdown_path.read_text())
    
    aggregated_content = "\n\n---\n\n".join(full_markdown_content)
    print("Multimodal parsing complete.")
    return aggregated_content, image_paths


