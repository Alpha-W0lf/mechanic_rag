# Mechanic RAG Dev Container

This Dev Container configuration provides a clean, self-contained development environment for Mechanic RAG without requiring manual local toolchain installation or multi-GB local model downloads.

## What is included

- **Node 22** with `pnpm`
- **Python 3.12** with `pip` and dev dependencies
- **Postgres 16 + pgvector** database service (pre-configured with migrations `001` through `004`)
- Port forwarding for `3000` (Next.js web app) and `5432` (Postgres)

## Model policy (no multi-GB models required)

You do **not** need Ollama or GPU hardware to develop and test:
1. **Extractive / Degraded / Unit tests:** The test suite and extractive fallback paths run without any external LLM or embedding provider.
2. **Gemini API:** Set `GEMINI_API_KEY` in `web/.env.local` to use the free-tier cloud models (`gemini-embedding-001` and `gemma-4-26b-a4b-it`), matching the hosted demo.
3. **Optional local Ollama:** If you have Ollama running on your host machine, you can point `OLLAMA_BASE_URL` to `http://host.docker.internal:11434`.

## Getting started in Dev Container

Once VS Code connects to the container:
```bash
# Ingest the public synthetic fixtures into the database
mecharag ingest --source fixtures

# Run the test suite
cd web && pnpm test

# Start the dev server
pnpm dev
```
