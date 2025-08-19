from __future__ import annotations
import os
import time
from pathlib import Path
from typing import List, Tuple

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from pypdf import PdfReader, PdfWriter
from pdf2image import convert_from_path
from tenacity import retry, stop_after_attempt, wait_exponential
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# --- Custom Exceptions ---
class DailyQuotaExceededError(Exception):
    """Custom exception for when the Gemini API daily quota is met."""
    pass

class ConsecutiveSafetyBlockError(Exception):
    """Custom exception for when 3 consecutive chunks are blocked by safety settings."""
    pass

# --- Constants ---
OUTPUT_DIR = Path("output")
IMAGES_DIR = OUTPUT_DIR / "images"
MARKDOWN_DIR = OUTPUT_DIR / "markdown"
PDF_CHUNK_SIZE = 10  # Number of pages per chunk to send to the API
DPI = 300 # DPI for the extracted PNG images

def get_chunk_analysis_prompt(page_count: int) -> str:
    """Returns the standardized prompt for Gemini to analyze a multi-page chunk."""
    return f"""
You are a technical document specialist. Your task is to meticulously analyze the provided PDF file, which contains {page_count} pages.

You must iterate through each page of the document sequentially, from page 1 to page {page_count}.

For each page, perform the following actions:
1.  **Transcribe All Text:** Capture every piece of text, including headers, footers, page numbers, and labels.
2.  **Preserve Structure:** Replicate the document's structure using Markdown (headings, lists, etc.).
3.  **Format Tables:** Recreate any tables using Markdown table syntax.
4.  **Caption Visuals for Retrieval:** For every single image, diagram, chart, or table, you must generate a caption optimized for a search system. The caption must be enclosed in the format `[Image: caption text]`. The caption text itself must:
    a. Be highly detailed and specific.
    b. Explicitly name all key components, parts, and labels shown in the visual. For example, instead of "a diagram of the engine," write "a diagram of the F20C engine block, highlighting the crankshaft, pistons, and connecting rods."
    c. Include any specific data, specifications, or torque values that are part of the image itself. For example, "a diagram showing the oil drain plug with a torque specification of 33 lb-ft."
    d. Describe the visual's purpose. For example, "an exploded view of the clutch master cylinder assembly used for disassembly," or "a wiring diagram for the audio system."
5.  **Insert Separator:** After processing the entire content of a page, you MUST insert the exact separator token `---PAGE_BREAK---` on its own line. This is critical for parsing the output.

Your final output should be a single text response containing the Markdown for all {page_count} pages, each separated by the `---PAGE_BREAK---` token.
"""

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def generate_content_with_retry(model, prompt, pdf_file):
    """Wrapper for Gemini API call with exponential backoff retry."""
    # Create a generation config to explicitly disable all safety filters.
    # This is the most reliable way to prevent false positives on technical docs.
    generation_config = genai.GenerationConfig(
        candidate_count=1,
        stop_sequences=[],
        temperature=0, # Set to 0 for deterministic, factual transcription
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    return model.generate_content(
        [prompt, pdf_file], 
        request_options={'timeout': 1000},
        generation_config=generation_config
    )

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
        # Use 4-digit zero-padding for filenames
        chunk_path = temp_dir / f"{pdf_path.stem}_chunk_{start_page + 1:04d}-{end_page:04d}.pdf"

        # --- Optimization: Skip if chunk already exists ---
        if chunk_path.exists():
            print(f"  Skipping existing chunk: {chunk_path.name}")
            chunk_paths.append(chunk_path)
            continue

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

def parse_document(pdf_path: Path) -> Tuple[str, List[Path], List[str]]:
    """
    Parses a PDF into a single Markdown string, a set of page images, and a list
    of any chunks that were blocked by safety settings.
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
    blocked_chunks_in_doc: List[str] = []
    
    # --- 2. Split PDF into manageable chunks ---
    pdf_chunks = split_pdf_into_chunks(pdf_path, temp_pdf_dir, PDF_CHUNK_SIZE)
    total_pages = len(PdfReader(pdf_path).pages)
    
    # --- 3. Process each chunk ---
    page_offset = 0
    consecutive_error_count = 0
    for chunk_path in pdf_chunks:
        print(f"\n--- Processing PDF Chunk: {chunk_path.name} ---")
        
        num_pages_in_chunk = len(PdfReader(chunk_path).pages)
        
        # --- 3a. Chunk-level Resumability Check ---
        output_files_exist = True
        for i in range(num_pages_in_chunk):
            page_num_in_doc = page_offset + i + 1
            markdown_path = doc_markdown_dir / f"page_{page_num_in_doc:04d}.md"
            if not markdown_path.exists():
                output_files_exist = False
                break
        
        if output_files_exist:
            print(f"Skipping chunk, all {num_pages_in_chunk} output files already exist.")
            # Still need to populate image_paths for the return value
            for i in range(num_pages_in_chunk):
                page_num_in_doc = page_offset + i + 1
                image_paths.append(doc_images_dir / f"page_{page_num_in_doc:04d}.png")
            page_offset += num_pages_in_chunk
            continue

        # --- 3b. Upload chunk to File API ---
        print(f"Uploading {chunk_path.name} to Gemini File API...")
        pdf_file = genai.upload_file(path=chunk_path, display_name=chunk_path.name)
        
        try:
            # --- 3c. Start Analysis ---
            model = genai.GenerativeModel(model_name="gemini-2.5-pro")
            
            print(f"Analyzing {num_pages_in_chunk} pages in one API call...")
            
            # --- 3d. Analyze the entire chunk in one call ---
            prompt = get_chunk_analysis_prompt(num_pages_in_chunk)
            response = generate_content_with_retry(model, prompt, pdf_file)
            
            # --- 3e. Handle potential safety blocks ---
            try:
                response_text = response.text
                consecutive_error_count = 0 # Reset on success
            except ValueError:
                consecutive_error_count += 1
                
                reason = "Unknown"
                try:
                    # Correctly access the finish_reason from the first candidate
                    reason = response.candidates[0].finish_reason.name
                except (IndexError, AttributeError):
                    pass # Keep reason as "Unknown" if the structure is unexpected
                
                log_message = f"{pdf_path.name} - Chunk {chunk_path.name} - Reason: {reason}"
                blocked_chunks_in_doc.append(log_message)
                
                print(f"WARNING: Chunk blocked by safety settings. (Consecutive errors: {consecutive_error_count})")
                
                if consecutive_error_count >= 3:
                    print("ERROR: 3 consecutive chunks were blocked. Stopping ingestion.")
                    raise ConsecutiveSafetyBlockError
                continue # Skips to the finally block and then the next iteration

            # Split the single response into individual page contents, filtering out empty strings
            pages_markdown = [md for md in response_text.split("---PAGE_BREAK---") if md.strip()]

            # --- 3f. Process and save each page's output (with overwrite) ---
            for i, page_md in enumerate(pages_markdown):
                if i >= num_pages_in_chunk:
                    print(f"Warning: Model returned more pages than were in the chunk. Ignoring extra page {i+1}.")
                    continue

                page_num_in_doc = page_offset + i + 1
                
                markdown_path = doc_markdown_dir / f"page_{page_num_in_doc:04d}.md"
                image_path = doc_images_dir / f"page_{page_num_in_doc:04d}.png"
                image_paths.append(image_path)
                
                # Save the extracted markdown for the page (overwrite existing)
                with open(markdown_path, "w") as f:
                    f.write(page_md.strip())
                
                # Extract the corresponding page as a PNG (overwrite existing)
                extract_page_as_png(pdf_path, page_num_in_doc, image_path, DPI)

            # --- Rate Limiting (per chunk, not per page) ---
            time.sleep(13)

        except google_exceptions.ResourceExhausted as e:
            print("\n--- GEMINI DAILY QUOTA EXCEEDED ---")
            print(f"Error: {e}")
            print("The script will now stop gracefully. Please run it again tomorrow to continue.")
            raise DailyQuotaExceededError
        
        except genai.types.StopCandidateException as e:
            print(f"WARNING: Page {page_num_in_doc} was blocked by safety settings and will be skipped.")
            # Log the blocked page for manual review later
            with open(OUTPUT_DIR / "blocked_pages.log", "a") as f:
                f.write(f"{pdf_path.name} - Page {page_num_in_doc} - Reason: {e}\n")
            continue # Skip to the next page

        except ConsecutiveSafetyBlockError:
            raise # Propagate to stop the main process
        except DailyQuotaExceededError:
            # Propagate the exception to stop the entire process
            raise
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
    return aggregated_content, image_paths, blocked_chunks_in_doc


