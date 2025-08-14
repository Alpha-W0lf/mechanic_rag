# Ingestion Scripts

- Entry point: `scripts/ingest/ingest.py`
- Run a dry run: `python scripts/ingest/ingest.py --dry-run`
- Inputs: PDFs under `rag_input/` (Owner's Manual, Service Manual, Wiring Diagram)
- Pipeline (to implement): Docling primary, PyMuPDF fallback → structure-aware chunking + semantic refinement → embeddings → upsert to Supabase
