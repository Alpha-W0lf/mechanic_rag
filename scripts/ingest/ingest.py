#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

# Add project root to the Python path
project_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

import google.generativeai as genai
from scripts.ingest.chunking import Chunk, structure_aware_chunking
from dotenv import load_dotenv
from scripts.ingest.parse import parse_document
from supabase import create_client, Client
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import uuid
import warnings

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

def process_pdf(pdf_path: Path, supabase_client, gemini_client, dry_run: bool = False):
    """
    Process a single PDF file: parse, chunk, embed, and upsert.
    """
    try:
        print(f"Processing {pdf_path.name}...")
        
        # Upsert document entry and get document_id
        source_name = pdf_path.name
        if not dry_run:
            doc_to_upsert = {
                "vehicle": "Honda S2000",
                "source_name": source_name,
                "source_type": "pdf",
                "path": str(pdf_path),
            }
            doc_response = supabase_client.table("documents").upsert(doc_to_upsert, on_conflict="source_name").execute()
            document_id = doc_response.data[0]['id']
        else:
            document_id = "dry-run-doc-id"

        # --- Step 1: Parse Document (Multimodal) ---
        markdown_content, image_paths = parse_document(pdf_path)

        if not markdown_content.strip():
            print(f"Warning: No content extracted from {pdf_path.name}. Skipping.")
            return

        # --- Step 2: Chunk Content ---
        print(f"Chunking {pdf_path.name}...")
        chunks = structure_aware_chunking(
            markdown_content=markdown_content,
            document_id=document_id,
            image_paths=image_paths
        )

        if not chunks:
            print(f"No chunks generated for {pdf_path.name}. Skipping.")
            return

        # --- Step 3: Embed Chunks ---
        print(f"Embedding {len(chunks)} chunks for {pdf_path.name}...")
        chunks_to_embed = [chunk.content for chunk in chunks]
        embeddings = embed_chunks(chunks_to_embed)
        
        # Create a list of dictionaries to upsert
        chunks_to_upsert = []
        for i, chunk in enumerate(chunks):
            chunk_dict = chunk.__dict__
            chunk_dict["embedding"] = embeddings[i]
            chunks_to_upsert.append(chunk_dict)

        # --- Step 4: Upsert Chunks ---
        print(f"Upserting {len(chunks)} chunks to Supabase for {pdf_path.name}...")
        upsert_chunks(supabase_client, chunks_to_upsert)
        
        print(f"Done processing {pdf_path.name}.")
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Ingestion script for MechaRAG")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Runs the script without writing to the database.",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Deletes all documents and chunks from the database before running.",
    )
    args = parser.parse_args()

    # Initialize Supabase and Gemini clients
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not supabase_url or not supabase_key or not gemini_api_key:
        raise ValueError("Supabase and Gemini API keys must be set in .env file")

    supabase_client: Client = create_client(supabase_url, supabase_key)
    genai.configure(api_key=gemini_api_key)

    if args.cleanup:
        print("Cleaning up database tables...")
        supabase_client.table("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase_client.table("chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleanup complete.")
        # If only cleanup is requested, exit after it's done.
        return

    pdf_files = discover_pdfs()
    print(f"Found {len(pdf_files)} PDF(s) to process in {RAG_INPUT_DIR}.")

    if args.dry_run:
        print("\n--- DRY RUN MODE ---")
        print("The script will perform parsing and chunking but will not embed or upsert data.")
        # In a dry run, we still need to initialize the Gemini client for the parser
        genai.configure(api_key=gemini_api_key)
    
    # Use ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
        futures = {
            executor.submit(process_pdf, pdf_path, supabase_client, genai, args.dry_run)
            for pdf_path in pdf_files
        }
        
        for future in tqdm(as_completed(futures), total=len(pdf_files)):
            try:
                future.result()
            except Exception as e:
                print(f"An error occurred in a worker thread: {e}")
    
    print("\nIngestion complete.")

if __name__ == "__main__":
    main()


