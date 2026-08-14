> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-19_dev_guide_14_soft_adjust_live_present_only_private_gold_pilot.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Review note — Mechanic Guide 14 Soft Adjust live PrivateGold pilot (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `3695d84`  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_14_soft_adjust_live_present_only_private_gold_pilot.md`  
**Ready:** 8.8/10 — `docs/2026-07-19_guide14_ready_check_live_present_only_private_gold_pass163_note.md`  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_guide14_pass163_handoff.md`  
**Locks:** A / L1 / B1  

## Call

**PASS — shippable as-is** for Guide 14 Soft Adjust live pilot Met. Thin Status Align this Review (guide + context → **Review Pass**). No code Soft Adjust / Hard Adjust. Ford / friend rclone / CE invent / dual-product Done / Guide 15 Write remain out.

### Verified against Guide 14

| Check | Result |
|-------|--------|
| B1 receipt → `gold_status` mapper | **Pass** — `mecharag/receipt_to_gold_status.py`; `friend_publish_eligible` hard-false; CLI `mecharag receipt-to-gold-status` |
| Release-dir sidecar preference | **Pass** — live fixture writes `cat__2017-f-150/gold_status.json` |
| Live Soft Adjust pilot `cat:2017-f-150` | **Pass** — status gate + ≥1 unit sample load (Ready large-pack attestation) |
| L1 hybrid (synthetic CI) | **Pass** — Guide 13 Soft Adjust suite still green |
| Mapper fixture tests (no OEM) | **Pass** — `tests/test_receipt_to_gold_status.py` |
| Live skip if emit missing | **Pass** — L1 skipif |
| Honesty docs ≠ dual-product Done | **Pass** — ARCHITECTURE / GETTING_STARTED / VISION cite Guide 14 pilot ≠ friend Review Met |
| Public fail-closed | **Pass** — OK this Review |
| Tests re-run | **Pass** — **32 passed** |
| File sizes | **Pass** — receipt_to_gold_status 115 / `__main__` 134 (≤300) |
| Invent ban / scope | **Pass** — no Ford/rclone/CE/Guide 15; no OEM in `mechanic_rag` git |
| Mapped live sidecar on disk | **Pass** — `friend_publish_eligible=false`, `vehicle_ids=[cat:2017-f-150]` |

### Soft residuals (non-blocking)

1. Live Met attests Soft Adjust via **sample unit load** (private `_enforce_doc_identity` / `_to_flat_manifest`) — matches Ready preference for 1086-unit pack; full `load_all` / Compose upsert still optional.  
2. Live pytest depends on sibling gitignored Vehicle `out/live` — skips cleanly when absent (L1).  
3. ARCHITECTURE deferred-table cells still say “live Soft Adjust OEM ingest” in places — residual wording; header/honesty line already Guide 14 accurate.  
4. Unused `RECEIPT_BASENAME` constant — tiny cleanup later.

### Status Align this Review

- Guide Status → **Review Pass**  
- Context summary → Review Pass  

### Explicit non-claims

- Not dual-product Done · Not friend Drive Soft Adjust Review Met  
- Not Ford PTS · Not rclone · Not CE invent  
- Not Guide 15 ask/eval Write  

### QUALITY_STANDARD §5

Findings tied to guide; spoke stayed in Review slice; blast considered; invent ban held; honest Pass (no Soft/Hard Adjust code); residuals non-blocking.

### Stop

Review DoD Met (**Pass**). Ready-for hub Prioritize / Align if desired — Implement already updated honesty surfaces.
