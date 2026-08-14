> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/VISION.md` · `docs/ARCHITECTURE.md` · living guides under `docs/dev_guides/`
> Batch: `2026-08_sprawl_c2c_mechanic_stage_notes`
> Date: 2026-08-13
# Review — Mechanic M2 multimodal retrieve

**Date:** 2026-07-27  
**Mode:** waterfall · Build · **Stage:** Review implementation  
**Guide:** `docs/dev_guides/2026-07-26_dev_guide_mechanic_m2_multimodal_retrieve.md`  
**C1 evidence:** `docs/2026-07-26_m2_paired_image_ablation_evidence.json`  
**Arms:** Terminal `:3000` image ON · `:3002` `MECHANIC_IMAGE_CHANNEL=0`

### Declare

| Item | Value |
|------|-------|
| Will review | Image channel + RRF fusion + degrade + C1 paired ablation honesty |
| Will **not** | Claim invented numeric pass thresholds; ship M3; claim fixture lift |

---

## Guide DoD checklist

| # | DoD | Evidence | Status |
|---|-----|----------|--------|
| 1 | Image channel + fusion wired; text works if image empty/degraded | Ask diagnostics; fixture `image_count=0` still answers; Triumph ON `image_count` 10–50 | **Pass** |
| 2 | Degrade: image off / empty → M1 behavior + diagnostic | OFF arm `image_channel_disabled`; fixtures empty index; HNSW miss previously `image_index_empty_or_no_hits` | **Pass** |
| 3 | Fixture evals honest (lift or recorded keep) | `m2-d06` / `m2-d08` delta≈0; no M2 lift claimed on fixtures | **Pass** |
| 4 | No OEM in git | Goldens + evidence use `cat:` / `fixture:` ids only | **Pass** |
| 5 | M3 still Not Met | M3 guide not implemented this Review | **Pass** |
| 6 | C1 harness ran after full-garage embed | Evidence JSON 8 rows; embed coverage Triumph 1886 image rows | **Pass** |

## C1 paired ablation (citation ∩ gold) — no pass threshold invented

| Case | ON ∩ gold | OFF ∩ gold | Notes |
|------|-----------|------------|-------|
| m2-d01 | 22,23 | 22,23 | Tie / text already strong |
| m2-d02 | 23 | 23 | Tie |
| m2-d03 | 12 | 12 | Tie; ON tighter cite set |
| m2-d04 | **30** | ∅ | Image ON recovers gold page |
| m2-d05 | **27** | ∅ | Image ON recovers gold page |
| m2-d06 fixture | n/a | n/a | `image_count=0` both arms |
| m2-d07 | **22** | ∅ | Image ON recovers gold page |
| m2-d08 fixture | n/a | n/a | Negative / no image bias |

**Honest ship claim:** Hybrid text retrieve remains; image channel contributes IDs when index+CLIP work; Option A citations stay text chunks; diagram-first private cases show **lift on 3/6** Triumph golds and ties on the rest — **not** universal lift.

## Findings (smallest set)

| Sev | Finding | Action |
|-----|---------|--------|
| **Bug (fixed)** | Multi-vehicle HNSW + `vehicle_id` post-filter returned **0** image hits at default `ef_search` (Transit-dominated index) | `imageSearch` now `SET LOCAL hnsw.ef_search` (default **200**, override `MECHANIC_IMAGE_HNSW_EF_SEARCH`) |
| Nit | Ablation `--golden` relative path broke under Python 3.14 `Path.relative_to` | Harness resolves path safely |
| Nit | Ephemeral Next for C1 needs Terminal.app starters | Added `scripts/run-m2-ask-image-{on,off}.command` |

## Verdict

**Pass-with-nits — shippable for M2.** Image channel is real after the HNSW ef fix; degrade paths honest; C1 evidence recorded without fake thresholds.

**M2 Review Met.** Next: M3 Implement (blocked gate cleared) · optional D1 Align docs / VISION honesty · VD-3 hub Align counts.
