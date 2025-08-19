#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

# Add project root to the Python path
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from google import genai
from scripts.ingest.chunking import Chunk, structure_aware_chunking
from dotenv import load_dotenv
from scripts.ingest.parse import (
    parse_document, 
    DailyQuotaExceededError, 
    ConsecutiveSafetyBlockError
)
from supabase import create_client, Client
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid
import warnings
from typing import Any
import logging

# --- Suppress gRPC Logs ---
# The gRPC library used by Google's SDK is very noisy.
# We will set its logging level to ERROR to silence non-critical warnings.
logging.getLogger('grpc').setLevel(logging.ERROR)
# ---------------------------

# Suppress the specific UserWarning from unstructured about PDF text extraction
warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    message="The PDF.*contains a metadata field indicating that it should not allow text extraction.*"
)

# Load environment variables from .env.local
dotenv_path = Path(__file__).resolve().parents[2] / "web" / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    print("Warning: .env.local file not found. Skipping.")


RAG_INPUT_DIR = Path(__file__).resolve().parents[2] / "rag_input"
RAG_OUTPUT_DIR = Path(__file__).resolve().parents[2] / "rag_output"
RAG_OUTPUT_DIR.mkdir(exist_ok=True)


def discover_pdfs() -> list[Path]:
    if not RAG_INPUT_DIR.exists():
        return []
    return sorted([p for p in RAG_INPUT_DIR.iterdir() if p.suffix.lower() == ".pdf"])


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """Embed a list of text chunks using the Gemini API."""
    print(f"Embedding {len(chunks)} chunks...")
    embeddings = genai.embed_content(
        model="models/text-embedding-004",
        content=chunks,
        task_type="retrieval_document",
    )
    return embeddings["embedding"]

def upsert_chunks(supabase: Client, chunks: list[dict]) -> None:
    """Upsert chunks and their embeddings into the Supabase database."""
    print(f"Upserting {len(chunks)} chunks to Supabase...")
    try:
        supabase.table("chunks").upsert(chunks).execute()
    except Exception as e:
        print(f"Error upserting chunks: {e}")
        raise

def process_pdf(pdf_path: Path, supabase_client: Client, genai_client: Any, dry_run: bool = False):
    """
    Processes a single PDF and returns a list of any chunks that were blocked.
    """
    try:
        document_name = pdf_path.name
        print(f"Processing {document_name}...")

        # --- 1. Get or create document ID ---
        if dry_run:
            document_id = str(uuid.uuid4())
            print(f"  [DRY RUN] Generated document ID: {document_id}")
        else:
            print("  Upserting document to get a stable ID...")
            doc_data = {
                "source_name": document_name, 
                "source_type": "PDF",
                "vehicle": "Honda S2000" # Add the required vehicle field
            }
            response = supabase_client.table("documents").upsert(doc_data, on_conflict="source_name").execute()
            document_id = response.data[0]['id']
            print(f"  Got document ID: {document_id}")

        # --- 2. Multimodal Parsing ---
        # This step generates the local markdown and image files
        full_markdown_content, image_paths, blocked_chunks = parse_document(pdf_path)

        # --- 3. Add page number markers to content for chunking ---
        pages_content = full_markdown_content.split("\n\n---\n\n")
        content_with_markers = ""
        for i, page_text in enumerate(pages_content):
            page_num = i + 1
            content_with_markers += f"PAGE_MARKER_START:{page_num}\n"
            content_with_markers += page_text
            content_with_markers += f"\nPAGE_MARKER_END:{page_num}\n\n"

        if not full_markdown_content.strip():
            print(f"Warning: No content extracted from {document_name}. Skipping.")
            return

        # --- 4. Structure-Aware Chunking ---
        print(f"  Performing structure-aware chunking for {document_name}...")
        chunks = structure_aware_chunking(
            markdown_content=content_with_markers,
            document_id=document_id,
            image_paths=image_paths,
        )
        print(f"  Created {len(chunks)} chunks.")

        if not chunks:
            print(f"  No chunks were created for {document_name}. Nothing to embed or upsert.")
            return

        # --- 5. Embed Chunks ---
        print(f"  Embedding {len(chunks)} chunks for {document_name}...")
        chunks_to_embed = [chunk.content for chunk in chunks]
        embeddings = embed_chunks(chunks_to_embed)
        
        # Create a list of dictionaries to upsert
        chunks_to_upsert = []
        for i, chunk in enumerate(chunks):
            chunk_dict = chunk.__dict__
            chunk_dict["embedding"] = embeddings[i]
            chunks_to_upsert.append(chunk_dict)

        # --- 6. Upsert Chunks ---
        print(f"  Upserting {len(chunks)} chunks to Supabase for {document_name}...")
        upsert_chunks(supabase_client, chunks_to_upsert)
        
        print(f"Done processing {document_name}.")
        return blocked_chunks
    except DailyQuotaExceededError:
        # This is a special signal to stop processing new documents.
        # We re-raise it so the main thread can catch it and shut down.
        raise
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")
        return [f"{pdf_path.name} - GENERIC_ERROR - Reason: {e}"]

def main():
    parser = argparse.ArgumentParser(description="Ingestion script for MechaRAG")
    parser.add_argument("--dry-run", action="store_true", help="Run the script without making API calls or database insertions.")
    args = parser.parse_args()

    # --- Load Environment Variables ---
    env_path = project_root / 'web' / '.env.local'
    load_dotenv(dotenv_path=env_path)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not all([supabase_url, supabase_key, gemini_api_key]):
        print("ERROR: Supabase URL, Key, or Gemini API Key are not set. Check your .env.local file.")
        return

    # --- Initialize Clients ---
    supabase_client = create_client(supabase_url, supabase_key)
    
    # The new google-genai library uses the GOOGLE_API_KEY environment variable
    # automatically, so genai.configure() is no longer needed.
    # genai.configure(api_key=gemini_api_key)
    
    pdf_files = list((project_root / "rag_input").glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} PDF(s) to process in {project_root / 'rag_input'}.")
    
    if args.dry_run:
        print("\n--- DRY RUN MODE ---")
        print("The script will simulate the ingestion process without making API calls or writing to the database.")
        # In a dry run, we still need to initialize the Gemini client for the parser
        pass
    
    all_blocked_chunks = []
    try:
        # Limit to 2 workers to stay safely under the 5 RPM limit for the API.
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                executor.submit(process_pdf, pdf_path, supabase_client, genai, args.dry_run)
                for pdf_path in pdf_files
            }
            
            for future in tqdm(as_completed(futures), total=len(pdf_files)):
                try:
                    blocked_list = future.result()
                    if blocked_list:
                        all_blocked_chunks.extend(blocked_list)
                except ConsecutiveSafetyBlockError:
                    print("Consecutive safety block error caught in main thread. Shutting down.")
                    executor.shutdown(wait=False, cancel_futures=True)
                    break 
                except DailyQuotaExceededError:
                    print("Daily quota error caught in main thread. Shutting down gracefully.")
                    executor.shutdown(wait=False, cancel_futures=True)
                    break 
                except Exception as e:
                    print(f"An error occurred in a worker thread: {e}")
    finally:
        # --- Final Step: Update the blocked chunks log ---
        # This block is guaranteed to run even if the script is interrupted.
        log_path = project_root / "output" / "blocked_chunks.log"
        if all_blocked_chunks:
            print(f"\nUpdating blocked chunks log with {len(all_blocked_chunks)} entr(y/ies)...")
            with open(log_path, "w") as f:
                for line in sorted(all_blocked_chunks):
                    f.write(f"{line}\n")
        else:
            print("\nNo chunks were blocked in this run. Clearing log file.")
            if log_path.exists():
                log_path.unlink() # Delete the file if it's empty

    print("\nIngestion complete.")

if __name__ == "__main__":
    main()


