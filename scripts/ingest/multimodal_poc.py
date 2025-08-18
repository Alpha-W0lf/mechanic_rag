import os
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv
from pypdf import PdfReader, PdfWriter

# --- Configuration ---
load_dotenv(dotenv_path="web/.env.local")
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    exit(1)

# --- Constants ---
PROJECT_ROOT = Path(__file__).parent.parent.parent
PDF_PATH = PROJECT_ROOT / "rag_input/Honda_S2000_Service Manual_2000_2008.pdf"
TEMP_PDF_PATH = PROJECT_ROOT / "scripts/ingest/temp_pdf_chunk.pdf"

# A list of pages to test, chosen for their different content types
PAGES_TO_TEST = [
    {"page": 35, "description": "a dense table of engine specifications"},
    {"page": 85, "description": "procedural text with numbered lists"},
    {"page": 158, "description": "a complex exploded-view diagram of a transmission component"}
]

# --- Functions ---
def split_pdf_chunk(
    original_pdf: Path,
    output_pdf: Path,
    page_range: range
):
    """Creates a smaller PDF from a page range of a larger one."""
    print(f"Creating a temporary PDF with pages {page_range.start}-{page_range.stop-1}...")
    reader = PdfReader(original_pdf)
    writer = PdfWriter()
    for i in page_range:
        writer.add_page(reader.pages[i-1]) # pypdf is 0-indexed
    with open(output_pdf, "wb") as f:
        writer.write(f)
    print(f"Temporary PDF saved to {output_pdf}")

# --- Main Execution ---
def main():
    """
    Runs a multi-turn experiment for several page types to test Gemini 2.5 Pro's
    PDF understanding capabilities.
    """
    print("--- Starting Gemini 2.5 Pro PDF Capability Experiment ---")
    
    # Create a single PDF chunk containing all pages we want to test
    all_page_numbers = sorted([p["page"] for p in PAGES_TO_TEST])
    min_page, max_page = all_page_numbers[0], all_page_numbers[-1]
    
    pdf_file = None
    try:
        # Step 1: Create a single PDF chunk that includes all pages
        split_pdf_chunk(PDF_PATH, TEMP_PDF_PATH, range(min_page, max_page + 1))

        # Step 2: Upload the PDF chunk
        print(f"Uploading {TEMP_PDF_PATH.name}...")
        pdf_file = genai.upload_file(path=TEMP_PDF_PATH, display_name="S2000 Manual Chunk")
        print(f"Upload complete: {pdf_file.uri}")

        # Step 3: Start a chat session
        model = genai.GenerativeModel(model_name="gemini-2.5-pro")
        chat = model.start_chat()

        # --- Run experiment for each page type ---
        for page_info in PAGES_TO_TEST:
            page_num = page_info["page"]
            description = page_info["description"]
            
            print(f"\n\n--- Testing Page {page_num} ({description}) ---")

            # --- Turn 1: General Transcription ---
            print(f"\n--- Turn 1: Transcribing page {page_num}... ---")
            prompt1 = f"""
            Analyze the uploaded PDF file. Your task is to meticulously transcribe
            the entire content of page {page_num} into a well-structured Markdown document.
            """
            response1 = chat.send_message([prompt1, pdf_file] if page_info == PAGES_TO_TEST[0] else prompt1)
            print("Model Response (Turn 1):")
            print(response1.text)

            # --- Turn 2: Fine-grained Analysis ---
            print(f"\n--- Turn 2: Analyzing the main content of page {page_num}... ---")
            prompt2 = f"""
            From the document, look at page {page_num} again.
            Describe the main content of this page, focusing on {description}.
            """
            response2 = chat.send_message(prompt2)
            print("Model Response (Turn 2):")
            print(response2.text)
            print("--------------------------------------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Step 4: Clean up
        if 'pdf_file' in locals() and pdf_file:
            print(f"Deleting uploaded file: {pdf_file.name}")
            genai.delete_file(pdf_file.name)
        if TEMP_PDF_PATH.exists():
            print(f"Deleting temporary PDF: {TEMP_PDF_PATH.name}")
            TEMP_PDF_PATH.unlink()
        print("Cleanup complete.")

    print("\n--- Experiment Complete ---")

if __name__ == "__main__":
    main()
