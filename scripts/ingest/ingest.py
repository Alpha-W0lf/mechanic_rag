#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path

import google.generativeai as genai
from chunking import structure_aware_chunking
from dotenv import load_dotenv
from jsonl import write_jsonl, read_jsonl
from parse import parse_document
from supabase import create_client, Client
from tqdm import tqdm
from chunking import Chunk
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

def process_pdf(pdf_path: Path, supabase: Client, dry_run: bool) -> None:
    """Process a single PDF file."""
    print(f"\nProcessing {pdf_path.name}...")

    # Step 1: Always get the document ID first.
    if not dry_run:
        doc_to_upsert = {
            "vehicle": "Honda S2000",
            "source_name": pdf_path.name,
            "source_type": "pdf",
            "path": str(pdf_path),
        }
        document = supabase.table("documents").upsert(doc_to_upsert, on_conflict="source_name").execute().data[0]
        document_id = document["id"]
    else:
        # Use a placeholder for dry runs
        document_id = str(uuid.uuid4())

    output_path = RAG_OUTPUT_DIR / f"{pdf_path.stem}.jsonl"

    if output_path.exists():
        print(f"Found existing chunks file, skipping parsing and chunking.")
        chunks = [Chunk.from_dict(c) for c in read_jsonl(output_path)]
    else:
        # Parse PDF into a markdown string
        full_text = parse_document(pdf_path)
        
        # Chunk the document
        chunks = structure_aware_chunking(full_text)
        
        # Write chunks to JSONL file
        write_jsonl(output_path, chunks)
        
        print(f"Wrote {len(chunks)} chunks to {output_path}")

    # Step 2: Always populate the document_id for all chunks.
    for chunk in chunks:
        chunk.document_id = document_id

    # Step 3: Embed and upsert chunks to Supabase
    if not dry_run:
        print("Embedding and upserting chunks to Supabase...")
        
        # Prepare data for embedding and upserting
        chunks_to_embed = [chunk.content for chunk in chunks]
        embeddings = embed_chunks(chunks_to_embed)
        
        # Create a list of dictionaries to upsert
        chunks_to_upsert = []
        for i, chunk in enumerate(chunks):
            chunk_dict = chunk.__dict__
            chunk_dict["embedding"] = embeddings[i]
            chunks_to_upsert.append(chunk_dict)

        upsert_chunks(supabase, chunks_to_upsert)
        
        print(f"Done processing {pdf_path.name}.")

def main() -> None:
    parser = argparse.ArgumentParser(description="Ingestion skeleton")
    parser.add_argument("--dry-run", action="store_true", help="Print plan only; no DB writes")
    parser.add_argument("--cleanup", action="store_true", help="Truncate documents and chunks tables")
    args = parser.parse_args()

    # Initialize Supabase and Gemini clients
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not supabase_url or not supabase_key or not gemini_api_key:
        raise ValueError("Supabase and Gemini API keys must be set in .env file")

    supabase: Client = create_client(supabase_url, supabase_key)
    genai.configure(api_key=gemini_api_key)

    if args.cleanup:
        print("Cleaning up database tables...")
        supabase.table("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("Cleanup complete.")
        return

    pdfs = discover_pdfs()
    print(f"Found {len(pdfs)} PDF(s) in {RAG_INPUT_DIR}")
    for p in pdfs:
        print(f" - {p.name}")

    if args.dry_run:
        print(
            "\nDry run: parsing (Docling/PyMuPDF), chunking (structure+semantic), "
            "embedding, upsert to Supabase."
        )
        return

    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(process_pdf, pdf_path, supabase, args.dry_run) for pdf_path in pdfs]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"Error processing a PDF: {e}")


if __name__ == "__main__":
    main()


