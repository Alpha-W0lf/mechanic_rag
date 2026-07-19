# Review note — Mechanic Guide 11 PrivateGoldSource (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `b509ac0`  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md`  
**Ready:** 8.8/10 — `docs/2026-07-19_guide11_ready_check_private_gold_source_pass163_note.md`  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_guide11_pass163_handoff.md`  
**Locks:** A / N1 fixture-first; live Soft Adjust parked / out of Met

## Call

**PASS — shippable as-is** for Guide 11 Met (fixture-first). Thin Status Align applied this Review so VISION/ARCHITECTURE/MODEL_FREEZE no longer read as “PrivateGold missing entirely.” No code blockers. Live Soft Adjust / Drive / dual-product Done remain out of Met by design.

### Verified against Guide 11

| Check | Result |
|-------|--------|
| Module `private_gold_source.py` | **Pass** — ≤300 lines (195); discover/load/validate library profile; N1 gates; flat upsert map |
| CLI `--source private-gold` | **Pass** — aliases; `MECHANIC_PRIVATE_GOLD_ROOT` / `--root`; fixtures/ root rejected |
| Fail-closed unset env | **Pass** — exit **2** (re-run this Review) |
| Met Contract 7.2 consume | **Pass** — `documents[]` + `text_path`; program `minimal_manifest.json` shape |
| N1 reject `cat:` / `private_oem` | **Pass** — unit test + `_enforce_n1_met` |
| Hash / path escape / Drive URL | **Pass** — tests green |
| Reuse chunk → embed → upsert | **Pass** — `ingest_cmd._ingest_private_gold` |
| FixtureSource / public fail-closed | **Pass** — `public_fail_closed.py fixtures` → OK |
| Tests re-run | **Pass** — `pytest tests/test_private_gold_source.py` + contract suite → **25 passed** |
| Scope blast | **Pass** — no ranking/CE/LICENSE/§9 flip invent |
| Soft Adjust out of Met | **Pass** — honesty docs + reject for Met pack |
| File size guide pin | **Pass** — adapter 195 / ingest_cmd 199 |

### Soft residuals (non-blocking)

1. `sys.path` insert to import `validate_manifest` mirrors existing contract tests — acceptable; optional later package import polish.  
2. Tests depend on sibling `second_brain/.../vehicle_rag_gold/valid/` in multi-root workspace (documented).  
3. Historical Guide 01 sequence line still says “PrivateGold path beyond contract” for live Soft Adjust — intentional residual, not Met claim.

### Status Align this Review

- `docs/VISION.md` — Guide 11 fixture-first Met; ≠ live Soft Adjust / dual-product Done  
- `docs/ARCHITECTURE.md` header + `/api/ask` open cell  
- `evals/MODEL_FREEZE_STATUS.md` — PrivateGold wording  
- Guide Status → **Review Pass**

### Explicit non-claims

- Not live Soft Adjust Review Met · Not Drive ingest · Not dual-product Done  
- Not earned CE lift · Not OSI open source · Not §9 flip change  

### QUALITY_STANDARD §5

Evidence re-fetched (tests + fail-closed + public check + honesty greps + commit scope); spoke stayed in Review slice; no scope creep; honest shippable call.

### Smallest fix set

**Docs Status Align only** (this commit). No code fix required for Pass.
