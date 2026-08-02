# Mechanic RAG — offline ingest

Public stranger path uses the **`mecharag` CLI** (package entrypoint), not the legacy scripts listed below.

**Full clone path:** [`../../GETTING_STARTED.md`](../../GETTING_STARTED.md)

## Stranger path (fixtures)

With Compose Postgres up and env configured per GETTING_STARTED:

```bash
# from repo root, with the project venv active
mecharag ingest --source fixtures
```

Then run the public fail-closed check as documented in GETTING_STARTED.

## Optional local private corpus

For a local gold root only (not in the public clone):

```bash
export MECHANIC_PRIVATE_GOLD_ROOT=/path/to/local/gold
mecharag ingest --source private-gold
```

Unset `MECHANIC_PRIVATE_GOLD_ROOT` fail-closes (no silent fixtures fallthrough). Details and honesty notes live in GETTING_STARTED / FAQ — not required for the public demo.

## This folder

`scripts/ingest/` holds older helper modules used during early development. Prefer **`mecharag ingest`** for the supported product path. Do not follow Supabase / Docling / `rag_input/` instructions if you find them elsewhere — they are obsolete for the current stack.
