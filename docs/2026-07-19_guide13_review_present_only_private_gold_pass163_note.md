# Review note — Mechanic Guide 13 Soft Adjust present-only PrivateGold (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Implement:** `4f1db07`  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_13_soft_adjust_present_only_private_gold.md`  
**Ready:** 8.9/10 — `docs/2026-07-19_guide13_ready_check_present_only_private_gold_pass163_note.md`  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_review_guide13_pass163_handoff.md`  

## Call

**PASS — shippable as-is** for Guide 13 Soft Adjust Met. Thin Status Align this Review (guide + context → **Review Pass**). No code Soft Adjust / Hard Adjust. Ford / friend rclone / CE invent / dual-product Done / next Guide Write remain out.

### Verified against Guide 13

| Check | Result |
|-------|--------|
| Soft Adjust `cat:` / `private_oem` with `gold_status` | **Pass** — `_enforce_doc_identity` + `require_soft_adjust_status` in `load_all` |
| Missing sidecar fail closed | **Pass** — tested |
| `friend_publish_eligible=true` rejected | **Pass** — even with `zero_gap=true` (Ready preference) |
| Present-only / incomplete honesty | **Pass** — requires `present_only=true` **or** `zero_gap=false` |
| Fixture path unchanged (sidecar optional) | **Pass** — `test_fixture_path_still_optional_sidecar` |
| Drive URL forbidden | **Pass** |
| Synthetic Met (no OEM in git) | **Pass** — pytest `tmp_path` staging; no OEM/PDF pack committed |
| Honesty docs ≠ dual-product Done | **Pass** — ARCHITECTURE / GETTING_STARTED / VISION |
| Soft Adjust honesty INFO | **Pass** — `friend_publish_eligible` in log + Soft Adjust line in ingest |
| Public fail-closed | **Pass** — OK this Review |
| Tests re-run | **Pass** — **25 passed** |
| File sizes | **Pass** — private_gold 236 / gold_status 126 / ingest 222 (≤300) |
| Scope / invent ban | **Pass** — no ranking/CE/LICENSE reopen; no Ford/rclone; Guide 12 not reopened |

### Soft residuals (non-blocking)

1. Soft Adjust status gate runs in `load_all` (ingest path); direct `load_release` alone does not re-check sidecar — acceptable for Met; callers must use `load_all`.  
2. Tests still depend on sibling `second_brain/.../vehicle_rag_gold/valid/` blobs.  
3. Full Compose/Ollama private-gold ingest not re-proven this Review — unit-test attestation matches Ready pin.  
4. Authorizing sidecar is root-first (`statuses[0]`) — intentional.

### Status Align this Review

- Guide Status → **Review Pass**  
- Context summary → Review Pass / Align next optional  

### Explicit non-claims

- Not dual-product Done · Not friend Drive Soft Adjust Review Met  
- Not Ford PTS / live OEM corpus · Not rclone · Not CE invent  
- Not next Guide Write  

### QUALITY_STANDARD §5

Findings tied to guide; spoke stayed in Review slice; blast considered; invent ban held; honest Pass (no Soft/Hard Adjust code); numeric residual list non-blocking.

### Stop

Review DoD Met (**Pass**). Ready-for Align docs if hub wants banner polish only — Implement already updated honesty surfaces.
