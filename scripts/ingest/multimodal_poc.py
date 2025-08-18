import os
import pathlib
import textwrap
import google.generativeai as genai
from IPython.display import display
from IPython.display import Markdown
from PIL import Image
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError

# --- Configuration ---
# Configure the Gemini API key
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    exit(1)

# --- Constants ---
PDF_PATH = pathlib.Path("rag_input/Honda_S2000_Service_Manual_2000_2008.pdf")
OUTPUT_DIR = pathlib.Path("scripts/ingest/poc_output")
PAGE_TO_TEST = 35 # A page with a mix of text, tables, and diagrams

# --- Configuration ---
MODELS_TO_TEST = [
    "gemini-2.0-flash-latest",
]
DPIS_TO_TEST = [150, 300, 600]

# --- Functions ---
def convert_pdf_page_to_image(pdf_path: pathlib.Path, page_number: int, output_path: pathlib.Path):
    """
    Converts a single page of a PDF to a high-resolution PNG image.
    """
    print(f"Converting page {page_number} of {pdf_path.name} to image...")
    try:
        images = convert_from_path(
            pdf_path,
            first_page=page_number,
            last_page=page_number,
            dpi=300,  # Use a high DPI for better quality
            fmt="png",
            thread_count=1 # Keep it single-threaded for the PoC
        )
        if images:
            images[0].save(output_path, "PNG")
            print(f"Successfully saved image to {output_path}")
            return True
    except PDFInfoNotInstalledError:
        print("ERROR: Poppler is not installed or not in PATH.")
        print("Please install Poppler and try again.")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False
    return False

# --- Main Execution ---
def main():
    """
    Main function to run the multimodal ingestion proof of concept.
    """
    print("Running Multimodal Ingestion PoC...")
    OUTPUT_DIR.mkdir(exist_ok=True)

    # --- Step 1: Generate Image Variants ---
    image_paths = {}
    for dpi in DPIS_TO_TEST:
        output_path = OUTPUT_DIR / f"page_{PAGE_TO_TEST}_{dpi}dpi.png"
        if not convert_pdf_page_to_image(PDF_PATH, PAGE_TO_TEST, output_path):
            exit(1)
        image_paths[dpi] = output_path

    # --- Step 2: Run Experiments ---
    for model_name in MODELS_TO_TEST:
        for dpi in DPIS_TO_TEST:
            image_path = image_paths[dpi]
            print(f"\n--- Running Experiment: Model={model_name}, DPI={dpi} ---")

            try:
                # Load the image
                img = Image.open(image_path)

                # Instantiate the model
                model = genai.GenerativeModel(model_name)

                # Craft the prompt
                prompt = """
                You are a technical document specialist. Your task is to meticulously analyze the provided image of a technical manual page and convert its entire content into a well-structured Markdown document.

                Instructions:
                1.  **Transcribe All Text:** Capture every piece of text on the page, including headers, footers, page numbers, table content, diagram labels, and captions.
                2.  **Preserve Structure:** Replicate the document's structure using Markdown. Use headings (`#`, `##`, etc.) for titles and sections. Use lists for itemized information.
                3.  **Format Tables:** Recreate any tables using Markdown table syntax. Ensure all rows, columns, and headers are accurately represented.
                4.  **Describe Images/Diagrams:** Where there are images or diagrams, provide a brief, descriptive placeholder in the text, like `[Image: Description of the engine assembly]` or `[Diagram: Wiring schematic for the main fuse box]`.
                5.  **Be Exact:** Do not summarize, interpret, or add any information not present in the original document. The goal is a perfect, machine-readable transcription of the page's content and layout.
                """

                # Call the API
                response = model.generate_content([prompt, img])

                # Save the response to a file
                output_md_path = OUTPUT_DIR / f"output_{model_name}_{dpi}dpi.md"
                with open(output_md_path, "w") as f:
                    f.write(response.text)
                print(f"Successfully saved Markdown to {output_md_path}")

            except Exception as e:
                print(f"An error occurred during the Gemini API call: {e}")
                # Continue to the next experiment
                continue

    print("\nPoC complete. Please review the output files in the 'poc_output' directory.")

if __name__ == "__main__":
    main()
