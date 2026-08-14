> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Review note — Mechanic Guide 12 multi-vehicle PrivateGold (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `22e75cd` (+ context `abae986`)  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_12_status_aware_multi_vehicle_private_gold.md`  
**Ready:** 9.0/10 — `docs/2026-07-19_guide12_ready_check_multi_vehicle_private_gold_pass163_note.md`  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_guide12_pass163_handoff.md`  
**Locks:** A / N1 / S1

## Call

**PASS — shippable as-is** for Guide 12 Met. Thin VISION/ARCHITECTURE Status Align this Review so banners cite Guide 11–12 (not Guide 11 alone). No code Soft Adjust / Hard Adjust. Guide 13 Soft Adjust / Ford / dual-product Done remain out.

### Verified against Guide 12

| Check | Result |
|-------|--------|
| ≥2 distinct `fixture:` vehicles | **Pass** — P1 staging; `distinct_vehicle_ids` → `fixture:demo-s2000-ap1` + `fixture:demo-miata-nb` |
| Optional `gold_status.json` (S1) | **Pass** — `mecharag/gold_status.py`; root-then-release collect; missing OK |
| `zero_gap=false` honesty | **Pass** — INFO log includes `zero_gap=False` + ≠ dual-product Done; does not block load |
| Discover skips sidecar basename | **Pass** — even if sidecar JSON has `documents[]` |
| Invalid sidecar fail closed | **Pass** — `GoldStatusError` |
| N1 invent ban (`cat:` / `private_oem`) | **Pass** — retained + test |
| Guide 11 single-vehicle path | **Pass** — `test_private_gold_source` still green |
| Reuse private-gold CLI | **Pass** — no new `--source` |
| Public fail-closed | **Pass** — OK this Review |
| Tests re-run | **Pass** — **16 passed** |
| File sizes | **Pass** — gold_status 88 / private_gold 203 / ingest 216 (≤300) |
| Scope / invent ban | **Pass** — no ranking/CE/LICENSE/§9/OEM Soft Adjust |

### Soft residuals (non-blocking)

1. Multi-vehicle staging helper lives in `tests/test_gold_status.py` (not a packaged CLI) — fine for Met.  
2. Tests still depend on sibling `second_brain/.../vehicle_rag_gold/valid/` blobs.  
3. Historical “PrivateGold path beyond contract” sequence line still means live Soft Adjust — intentional.

### Status Align this Review

- `docs/VISION.md` — Guide 11–12 PrivateGold fixture Met wording  
- `docs/ARCHITECTURE.md` header — Guide 11–12  
- Guide Status → **Review Pass**

### Explicit non-claims

- Not Guide 13 Soft Adjust / live OEM · Not Ford PTS · Not dual-product Done  
- Not earned CE lift · Not Drive ingest · Not Soft Adjust Review Met  

### QUALITY_STANDARD §5

Evidence re-fetched (tests + public fail-closed + honesty greps + commit scope); spoke stayed in Review slice; no scope creep; honest shippable call.

### Smallest fix set

**Docs Status Align only** (this commit). No code Soft/Hard Adjust required for Pass.
