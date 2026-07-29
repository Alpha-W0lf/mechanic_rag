# Ready check — Personal garage private-gold ingest

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo (primary `mechanic_rag`)  
**Stage:** Ready check before code — **Met** · **no Implement**  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_private_gold_ingest.md`

### Declare

| Item | Value |
|------|-------|
| Will write | This ready note · pin Ready locks into guide/context |
| Will **not** | Implement · live ingest · ask · multimodal |

---

## Verdict

**Go — Implement readiness 8.6 / 10** for garage private-gold ingest.

Do **not** start coding/ingest until Tom says **Implement**.

---

## Scores (0–10)

| Track | Score | Why not 10 |
|-------|------:|------------|
| **Context ↔ guide alignment** | **9.3** | Emit Review Pass + ingest Write align; M0/DRY explicit. Soft: `.env.example` still lacks `MECHANIC_PRIVATE_GOLD_ROOT` (A3). |
| **Architecture / DRY** | **9.0** | Reuse `PrivateGoldSource` + `mecharag ingest` is correct. Residual: fixture/private loops still duplicated until Implement touches file. |
| **Gold / data evidence** | **9.2** | Live load **13 docs / 4 vehicles / 13286 units**; Drive root reject OK. |
| **Ops preconditions** | **7.8** | Ollama up + `nomic-embed-text` present. **Compose Postgres not running** this Ready (`docker compose ps` empty). Disk ~**29 GiB** free — OK above prior 8 GiB gate. |
| **DoD / edges / blast** | **8.7** | Strong; full-fleet embed wall-clock unknown (per-chunk HTTP). |
| **Implement readiness (overall)** | **8.6** | Guide executable; ops must bring Compose up; long embed is accepted risk under lock A. |

**Not ready would require:** missing Gold, missing embed model, or inventing a parallel ingest path. None apply.

---

## Locked this Ready (Tom agreed recommendations)

| Pin | Locked value |
|-----|--------------|
| Met scope | **(A) Full fleet** — all four `cat:` vehicles / all 13 docs |
| Phased Triumph-only Met | **No** |
| Ask smoke in Met | **No** — DB + idempotent re-run attestation only |
| Progress logging | **Yes** — thin INFO every N documents (and/or every N chunks if cheap) during private-gold ingest |
| `ingest_cmd.py` edit | Progress logging **will** touch this file → **B1 DRY helper required** (shared upsert loop for fixtures + private-gold) |
| New CLI / `--vehicle` | **No** unless full-fleet ingest fails for a documented ops reason |
| Embed / CE models | Unchanged (frozen) |
| Multimodal | Out of Met |

---

## Alignment checks (evidence)

| Check | Result |
|-------|--------|
| Gold load | **13** docs, **4** vehicles, **13286** units |
| GD2 Drive reject | **Pass** |
| `nomic-embed-text` in Ollama | **Present** |
| Ollama HTTP | **Reachable** (`/api/tags`) |
| Compose Postgres | **Down** this Ready — Implement D2 must `docker compose up -d` before D3 |
| Free disk | ~**29 GiB** |
| `.env.example` private root | **Missing** — A3 in Implement |
| Duplicate ingest loops | Confirmed in `ingest_cmd.py` (fixture + private) |

---

## Blast radius / rollback

| Concern | Rollback |
|---------|----------|
| DRY helper in `ingest_cmd.py` | Revert file; fixtures tests catch regressions |
| Live garage upsert | Delete garage `vehicle_id` rows / re-compose volume if needed; Gold on disk unchanged |
| Long embed | Stop process; idempotent skip on resume for completed docs |

---

## Refinements before coding?

**None blocking.** Implement must:

1. Start Compose (ops).  
2. Do A3 `.env.example`.  
3. DRY + progress logs when editing `ingest_cmd.py`.  
4. Full-fleet ingest + idempotent re-run.

---

## Human gate

**Ready: Go (8.6/10).**  

Say **Implement** to authorize Implement for this ingest guide only.

---

## Stop

Ready check Met. **No implementation started. No ingest run.**
