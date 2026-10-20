from __future__ import annotations
import os
import time
from pathlib import Path
from typing import List, Tuple
from datetime import datetime
import json
import uuid

from google import genai
from google.api_core import exceptions as google_exceptions
from pypdf import PdfReader, PdfWriter
from pdf2image import convert_from_path
from tenacity import retry, stop_after_attempt, wait_exponential, RetryError, retry_if_exception_type
from google.genai.types import HarmCategory, HarmBlockThreshold

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


def ts() -> str:
    return datetime.now().isoformat(timespec="seconds")

RUN_ID = str(uuid.uuid4())
REQUEST_COUNTER = {"n": 0}

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
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((google_exceptions.ServiceUnavailable, google_exceptions.InternalServerError))
)
def generate_content_with_retry(client, model_name, prompt, pdf_file):
    """Wrapper for Gemini API call with exponential backoff retry."""
    # This is the most reliable way to prevent false positives on technical docs.
    safety_settings = [
        genai.types.SafetySetting(
            category=HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold=HarmBlockThreshold.BLOCK_NONE,
        ),
        genai.types.SafetySetting(
            category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold=HarmBlockThreshold.BLOCK_NONE,
        ),
        genai.types.SafetySetting(
            category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold=HarmBlockThreshold.BLOCK_NONE,
        ),
        genai.types.SafetySetting(
            category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold=HarmBlockThreshold.BLOCK_NONE,
        ),
    ]

    # Use the correct GenerateContentConfig class and pass all settings inside it.
    config = genai.types.GenerateContentConfig(
        candidate_count=1,
        stop_sequences=[],
        temperature=0,
        safety_settings=safety_settings
    )
    
    return client.models.generate_content(
        model=model_name,
        contents=[prompt, pdf_file], 
        config=config,
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
    print(f"[{ts()}] Starting multimodal parsing for {pdf_path.name}...")

    # --- 1. Setup Client and Directories ---
    # Instantiate the modern Gemini client
    client = genai.Client()

    doc_images_dir = IMAGES_DIR / pdf_path.stem
    doc_markdown_dir = MARKDOWN_DIR / pdf_path.stem
    temp_pdf_dir = OUTPUT_DIR / "temp_pdfs" / pdf_path.stem
    doc_images_dir.mkdir(parents=True, exist_ok=True)
    doc_markdown_dir.mkdir(parents=True, exist_ok=True)
    temp_pdf_dir.mkdir(parents=True, exist_ok=True)

    image_paths: List[Path] = []
    blocked_chunks_in_doc: List[str] = []
    recent_call_times: List[float] = []  # for RPM window diagnostics
    
    # --- 2. Split PDF into manageable chunks ---
    pdf_chunks = split_pdf_into_chunks(pdf_path, temp_pdf_dir, PDF_CHUNK_SIZE)
    total_pages = len(PdfReader(pdf_path).pages)
    
    # --- 3. Process each chunk ---
    page_offset = 0
    consecutive_error_count = 0
    for chunk_path in pdf_chunks:
        print(f"\n[{ts()}] --- Processing PDF Chunk: {chunk_path.name} ---")
        
        num_pages_in_chunk = len(PdfReader(chunk_path).pages)
        
        # --- 3a. Chunk-level Resumability Check ---
        # Prefer filename-based page range detection for robust skipping
        try:
            range_part = chunk_path.name.split("_chunk_")[1].split(".pdf")[0]
            start_str, end_str = range_part.split("-")
            start_page_num = int(start_str)
            end_page_num = int(end_str)
            print(f"[{ts()}] Inspecting chunk pages {start_page_num}-{end_page_num} for existing outputs...")
            md_all_exist = True
            existing_count = 0
            missing_pages: List[int] = []
            for page_num in range(start_page_num, end_page_num + 1):
                if (doc_markdown_dir / f"page_{page_num:04d}.md").exists():
                    existing_count += 1
                else:
                    md_all_exist = False
                    missing_pages.append(page_num)
            print(f"[{ts()}] Found {existing_count}/10 markdown files for range {start_page_num}-{end_page_num}")
            if missing_pages:
                print(f"[{ts()}] Missing pages in range: {missing_pages}")
            if md_all_exist:
                print(f"[{ts()}] Skipping chunk (by filename range), all output files exist: {chunk_path.name}")
                for page_num in range(start_page_num, end_page_num + 1):
                    image_paths.append(doc_images_dir / f"page_{page_num:04d}.png")
                page_offset += num_pages_in_chunk
                continue
        except Exception:
            pass

        # Fallback to offset-based check
        print(f"[{ts()}] Filename parsing failed or incomplete; using offset-based existence check for {chunk_path.name}")
        output_files_exist = True
        for i in range(num_pages_in_chunk):
            page_num_in_doc = page_offset + i + 1
            markdown_path = doc_markdown_dir / f"page_{page_num_in_doc:04d}.md"
            if not markdown_path.exists():
                output_files_exist = False
                break
        
        if output_files_exist:
            print(f"[{ts()}] Skipping chunk (by offset), all {num_pages_in_chunk} output files already exist.")
            # Still need to populate image_paths for the return value
            for i in range(num_pages_in_chunk):
                page_num_in_doc = page_offset + i + 1
                image_paths.append(doc_images_dir / f"page_{page_num_in_doc:04d}.png")
            page_offset += num_pages_in_chunk
            continue

        pdf_file = None  # Ensure pdf_file is defined for the finally block
        try:
            # --- 3b. Upload chunk to File API ---
            print(f"[{ts()}] Uploading {chunk_path.name} to Gemini File API...")
            upload_config = genai.types.UploadFileConfig(display_name=chunk_path.name)
            up_start = time.time()
            pdf_file = client.files.upload(file=chunk_path, config=upload_config)
            up_elapsed = (time.time() - up_start) * 1000
            print(f"[{ts()}] Uploaded file: {pdf_file.name} (upload_ms={up_elapsed:.0f})")
            
            # --- 3c. Start Analysis ---
            model_name = "models/gemini-2.5-pro"
            
            print(f"[{ts()}] Analyzing {num_pages_in_chunk} pages in one API call...")
            
            # --- 3d. Analyze the entire chunk in one call ---
            prompt = get_chunk_analysis_prompt(num_pages_in_chunk)
            response_text = "" # Initialize to ensure it's always a string
            api_start = time.time()
            REQUEST_COUNTER["n"] += 1
            req_id = REQUEST_COUNTER["n"]
            print(f"[{ts()}] Request #{req_id} RUN_ID={RUN_ID} starting generate_content for {chunk_path.name}")
            response = generate_content_with_retry(client, model_name, prompt, pdf_file)
            api_elapsed = time.time() - api_start
            print(f"[{ts()}] Request #{req_id} completed in {api_elapsed:.2f}s for {chunk_path.name}")
            # RPM window diagnostics
            now_ts = time.time()
            recent_call_times.append(now_ts)
            recent_call_times[:] = [t for t in recent_call_times if now_ts - t <= 60]
            print(f"[{ts()}] rpm_window_count(last60s)={len(recent_call_times)}")
            
            # --- 3e. Handle potential safety blocks ---
            try:
                response_text = response.text
                text_len = None if response_text is None else len(response_text)
                # Response summary diagnostics
                try:
                    cand_count = len(getattr(response, "candidates", []) or [])
                    finish_reasons = []
                    for c in (getattr(response, "candidates", []) or []):
                        fr = getattr(c, "finish_reason", None)
                        finish_reasons.append(getattr(fr, "name", str(fr)))
                    print(f"[{ts()}] Response summary: candidates={cand_count}, finish_reasons={finish_reasons}, text_len={text_len}")
                except Exception as diag_e:
                    print(f"[{ts()}] Response summary logging error: {diag_e}")
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
                print(f"[{ts()}] WARNING: Chunk blocked by safety settings. (Consecutive errors: {consecutive_error_count}) reason={reason}")
                
                if consecutive_error_count >= 3:
                    print(f"[{ts()}] ERROR: 3 consecutive chunks were blocked. Stopping ingestion.")
                    raise ConsecutiveSafetyBlockError
                # The loop will now naturally proceed to the finally block and then the sleep.

            # After a successful API call, the response text can still be None.
            if not response_text:
                # Check if files already exist for this chunk; if so, clarify the log
                try:
                    range_part = chunk_path.name.split("_chunk_")[1].split(".pdf")[0]
                    start_str, end_str = range_part.split("-")
                    start_page_num = int(start_str)
                    end_page_num = int(end_str)
                    md_all_exist = True
                    for page_num in range(start_page_num, end_page_num + 1):
                        if not (doc_markdown_dir / f"page_{page_num:04d}.md").exists():
                            md_all_exist = False
                            break
                    if md_all_exist:
                        print(f"[{ts()}] INFO: API text empty, but files already exist for {chunk_path.name}. Skipping.")
                        # The loop will now naturally proceed to the finally block and then the sleep.
                except Exception:
                    pass
                # Dump debug file for analysis
                try:
                    debug_dir = OUTPUT_DIR / "debug"
                    debug_dir.mkdir(parents=True, exist_ok=True)
                    debug_path = debug_dir / f"{chunk_path.stem}.json"
                    cand_count = len(getattr(response, "candidates", []) or []) if 'response' in locals() else None
                    finish_reasons = []
                    for c in (getattr(response, "candidates", []) or []):
                        fr = getattr(c, "finish_reason", None)
                        finish_reasons.append(getattr(fr, "name", str(fr)))
                    debug_payload = {
                        "ts": ts(),
                        "run_id": RUN_ID,
                        "request_num": req_id,
                        "chunk": chunk_path.name,
                        "range": [start_page_num, end_page_num] if 'start_page_num' in locals() else None,
                        "candidates": cand_count,
                        "finish_reasons": finish_reasons,
                        "text_present": False,
                    }
                    with open(debug_path, "w") as df:
                        json.dump(debug_payload, df, indent=2)
                    print(f"[{ts()}] Wrote debug file: {debug_path}")
                except Exception as dump_e:
                    print(f"[{ts()}] Failed to write debug file: {dump_e}")
                print(f"[{ts()}] WARNING: Chunk {chunk_path.name} resulted in an empty response from the API. Skipping.")
                # The loop will now naturally proceed to the finally block and then the sleep.

            # Split the single response into individual page contents, filtering out empty strings
            if response_text:
                pages_markdown = [md for md in response_text.split("---PAGE_BREAK---") if md.strip()]
                print(f"[{ts()}] Parsed {len(pages_markdown)} page blocks for {chunk_path.name}")
                try:
                    # Map indices to document pages for visibility
                    mapped_pages = [page_offset + i + 1 for i in range(len(pages_markdown))]
                    print(f"[{ts()}] Parsed doc pages: {mapped_pages}")
                except Exception:
                    pass

                # --- 3f. Process and save each page's output (with overwrite) ---
                for i, page_md in enumerate(pages_markdown):
                    if i >= num_pages_in_chunk:
                        print(f"[{ts()}] Warning: Model returned more pages than were in the chunk. Ignoring extra page {i+1}.")
                        continue

                    page_num_in_doc = page_offset + i + 1
                    
                    markdown_path = doc_markdown_dir / f"page_{page_num_in_doc:04d}.md"
                    image_path = doc_images_dir / f"page_{page_num_in_doc:04d}.png"
                    image_paths.append(image_path)
                    
                    # Save the extracted markdown for the page (overwrite existing)
                    with open(markdown_path, "w") as f:
                        f.write(page_md.strip())
                    print(f"[{ts()}] Wrote markdown: {markdown_path.name}")
                    
                    # Extract the corresponding page as a PNG (overwrite existing)
                    extract_page_as_png(pdf_path, page_num_in_doc, image_path, DPI)
                    print(f"[{ts()}] Wrote image: {image_path.name}")

        except RetryError as e:
            # If the retry logic fails, check if the root cause was a quota error.
            last_exception = e.last_attempt.exception()
            if isinstance(last_exception, google_exceptions.GoogleAPICallError) and (
                "429" in str(last_exception) or "RESOURCE_EXHAUSTED" in str(last_exception)
            ):
                print(f"[{ts()}] --- GEMINI DAILY QUOTA EXCEEDED (after retries) ---")
                print(f"[{ts()}] Final error: {e}")
                raise DailyQuotaExceededError
            else:
                # Re-raise other retry errors
                raise e

        except google_exceptions.GoogleAPICallError as e:
            # Catch broader API errors and inspect them for quota issues.
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                 print(f"[{ts()}] --- GEMINI DAILY QUOTA EXCEEDED ---")
                 print(f"[{ts()}] Error: {e}")
                 print(f"[{ts()}] The script will now stop gracefully. Please run it again tomorrow to continue.")
                 raise DailyQuotaExceededError
            else:
                # If it's another API error, let the generic handler below catch it.
                print(f"[{ts()}] API ERROR: {e}")
                raise e
        
        except ConsecutiveSafetyBlockError:
            raise # Propagate to stop the main process
        except DailyQuotaExceededError:
            # Propagate the exception to stop the entire process
            raise
        except Exception as e:
            print(f"[{ts()}] ERROR processing chunk {chunk_path.name}: {e}")
        finally:
            # --- 3d. Cleanup ---
            if pdf_file:
                print(f"[{ts()}] Deleting uploaded file: {pdf_file.name}")
                client.files.delete(name=pdf_file.name)
        
        # --- Rate Limiting (Unconditional) ---
        # This is now outside the main try/except/finally block for the API call,
        # ensuring it runs after every chunk, regardless of success or failure.
        # This is critical to respect the 2 RPM limit.
        print(f"[{ts()}] Sleeping before next chunk...")
        time.sleep(33)
        print(f"[{ts()}] Woke from sleep.")
            
        page_offset += num_pages_in_chunk

    # --- 4. Aggregate Markdown ---
    print(f"\n[{ts()}] Aggregating all Markdown content...")
    full_markdown_content = []
    for i in range(1, total_pages + 1):
        md_path = doc_markdown_dir / f"page_{i:04d}.md"
        if md_path.exists():
            full_markdown_content.append(md_path.read_text())
            
    aggregated_content = "\n\n---\n\n".join(full_markdown_content)
    
    # --- 5. Final Cleanup ---
    # Optionally, clean up the temp_pdf_dir here if desired
    
    print(f"[{ts()}] Multimodal parsing complete.")
    return aggregated_content, image_paths, blocked_chunks_in_doc
