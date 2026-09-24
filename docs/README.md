# Mechanic RAG — docs index

Thin map for diligence readers. Start at the repo root for the overview and clone path.

| Doc | Role |
|-----|------|
| [`../README.md`](../README.md) | Overview / skim |
| [`../GETTING_STARTED.md`](../GETTING_STARTED.md) | Clean-clone operator path |
| [`../FAQ.md`](../FAQ.md) | Technical FAQ |
| [`VISION.md`](VISION.md) | Product why |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Contracts / how |
| [`api_contracts.md`](api_contracts.md) | API contracts |
| [`ops.md`](ops.md) | CI gates (what a green run proves) + Ask monitor policy + public Ask abuse shield (JH-42) + Data API lock (JH-52). No scheduled Production smoke here — cited-Ask monitor is JH-41 in a private ops repo (once daily at 12:03 PM America/Chicago). |
| [`incidents/2026-08-jh17-supabase-pause.md`](incidents/2026-08-jh17-supabase-pause.md) | JH-17 hosted-demo pause (cleaned incident note; no project refs) |
| [`../evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md) | Embed/CE freeze honesty (no lift claim) |
| [`../evals/evidence/`](../evals/evidence/) | Multimodal eval + ablation evidence artifacts |

## Engineering research notes

Reference material from the original build (Aug 2025), kept as engineering context:

- [`chunking_research.md`](chunking_research.md)
- [`embedding_research.md`](embedding_research.md)
- [`indexing_research.md`](indexing_research.md)
- [`modern_ingestion_options.md`](modern_ingestion_options.md)

## Operator setup

- [`dev_setup.md`](dev_setup.md) — development environment
- [`manual_build_steps.md`](manual_build_steps.md) — one-time accounts / env / setup
- [`01_build.md`](01_build.md) → [`04_build.md`](04_build.md) — phased build walkthrough

## Historical / ops (not product contracts)

- [`incidents/2026-08-jh17-supabase-pause.md`](incidents/2026-08-jh17-supabase-pause.md) — 2026 hosted-demo outage after Supabase Free inactivity pause (JH-17) and the Phase 7 durability work that followed

The LICENSE is source-available / non-commercial — not OSI open source.
