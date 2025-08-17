# Ingestion Scripts

- Entry point: `scripts/ingest/ingest.py`
- Run a dry run: `python scripts/ingest/ingest.py --dry-run`
- Inputs: PDFs under `rag_input/` (Owner's Manual, Service Manual, Wiring Diagram)
- Pipeline (to implement): Docling primary, PyMuPDF fallback → structure-aware chunking + semantic refinement → embeddings → upsert to Supabase
- Utilities:
  - `pdf_text.py`: PyMuPDF page text extractor
  - `chunking.py`: fixed-window baseline chunker
  - `jsonl.py`: utility to write JSONL outputs

## Usage

To run the full ingestion pipeline (parse, chunk, embed, and upsert):

```bash
python scripts/ingest/ingest.py
```

### Options

- `--dry-run`: Discovers PDFs and prints the execution plan without writing to the database or output files.
- `--cleanup`: Clears all existing data from the `documents` and `chunks` tables in the database before running the ingestion. This is useful for starting a fresh import.

## Sample run (no DB)

Convert one local PDF to chunk JSONL (first few pages), for testing parsers and chunking without DB access:

```
python scripts/ingest/sample_run.py rag_input/owners_manual.pdf --max-pages 3 --out sample_chunks.jsonl
```
