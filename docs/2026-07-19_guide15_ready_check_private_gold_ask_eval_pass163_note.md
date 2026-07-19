# Ready-check note — Mechanic Guide 15 Soft Adjust PrivateGold ask/eval (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md` (Write Met `66e3dc9`)  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide15_pass163_handoff.md`  
**Locks:** **A** (Soft Adjust ask/eval) · **Q1** (synthetic `cat:demo-synthetic-f150`) · **E1** (ask smoke + honesty)  
**Prereqs:** Guide 14 Review Pass `c4254b3` · Prioritize `2636aa1`  
**Tom authorize:** Ready checks + next steps; no Ford 1–2 weeks  

## Call

**READY (Go) for Implement** under locks **A / Q1 / E1**. **Do not Implement in this stage.** Tom authorized Ready-checks; hub may chain Implement after this Ready Go.

Implement (when started) stages Guide 13 Soft Adjust synthetic pack, Soft Adjust private-gold ingest when env up, proves `POST /api/ask` for `cat:demo-synthetic-f150` (contract-valid `answered` **or** `insufficient_evidence`, vehicle-scoped), updates honesty docs — **not** dual-product Done / friend Review Met / Ford / live F-150 upsert Met / Soft Adjust golden suite.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 15 Soft Adjust PrivateGold ask/eval plane | **8.8 / 10** | (1) **HTTP ask smoke** needs Compose + Next + Ollama (+ embeddings) — env may gap; guide correctly allows hybrid unit/contract Soft Adjust ask-scoping attestation, but Implement must still pick the smallest attestation shape (mock `vehicleExists` + vehicle-filtered retrieval vs integration-only). (2) Soft residual: example curl question “oil capacity” matches synthetic text topic (`minimal_p1.txt` oil-capacity procedure) but content is thin / demo-AP1 wording — Prefer a question grounded in staged phrasing; `insufficient_evidence` remains OK for Met. (3) Optional E1 `--retrieval-only` Soft Adjust golden is sketched but not pinned — treat as **optional**, not Met gate. (4) Soft Adjust ask tests do not exist yet (expected pre-Implement). |

**Overall:** **8.8 / 10** · **Go**

**Not inflated:** A/Q1/E1 Tom-authorized; Write Met; Guide 13 Soft Adjust staging + ask path verified this Ready; Soft Adjust unit suite **31 passed**; checklist unchecked; Ford / rclone / Done / live upsert / CE invent out.

### Alignment (guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / Q1 / E1 | **Aligned** |
| Write Met | **Verified** — `66e3dc9` |
| Guide 13 Soft Adjust staging | **Verified** — `stage_present_only_cat` / `CAT_VID=cat:demo-synthetic-f150` |
| Ask path | **Verified** — `ask.ts` requires `vehicle_id`; `vehicleExists` → 404 unknown; searches pass `vehicle_id` |
| Synthetic text for smoke | **Verified** — program `minimal_p1.txt` / `minimal_p2.txt` oil capacity / filter (no OEM) |
| Soft Adjust unit suite | **Green** — 31 passed (`private_gold_*` + `gold_status` + `receipt_to_gold_status`) |
| Soft Adjust ask tests | **Absent** — expected pre-Implement |
| Live F-150 upsert / Ford / rclone / Done | **Out** |
| Checklist unchecked | **Correct** for Ready |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Write Met | `66e3dc9` |
| HEAD (pre-Ready commit) | `66e3dc9` |
| Soft Adjust pytest | **31 passed** (`uv run pytest` present_only + gold_status + receipt_to_gold_status + private_gold_source) |
| Ask anchors | `web/src/server/ask.ts` · `retrievers.vehicleExists` · contracts present |
| Q1 staging helper | `tests/test_private_gold_present_only.py` |

### Blast radius / rollback

**Blast:** Soft Adjust staging/ingest ops for Met vehicle; optional thin Soft Adjust ask test helper; thin ARCHITECTURE / GETTING_STARTED honesty — **not** ask schema fork, ranking/CE, Guide 13–14 Soft Adjust policy reopen, live corpus upsert, UI Soft Adjust packaging, friend rclone, Ford PTS.

**Rollback:** Revert Guide 15 Soft Adjust ask/docs commits; Guide 13–14 Soft Adjust ingest Met remains; fixture ask unchanged.

### Edge cases (guide covers)

- Soft Adjust vehicle not ingested → 404 unknown  
- Weak Soft Adjust retrieval → `insufficient_evidence` OK  
- Cross-vehicle fixture citation → fail Met  
- Env down → hybrid attestation + document gap  
- Live `cat:2017-f-150` ask → out of Met  

### Refinements still required before Implement?

**None blocking.** Soft Implement preferences (not Ready No-Go):

1. Prefer **reuse** `stage_present_only_cat` (or extract shared staging helper) — do not reinvent Soft Adjust pack.  
2. Prefer grounded Soft Adjust question from staged text; accept `insufficient_evidence` if retrieval thin.  
3. Prefer smallest Soft Adjust ask-scoping unit attestation if HTTP env gap; do **not** expand into Soft Adjust golden suite (E2).  
4. Do **not** require live F-150 upsert for Guide 15 Met.

### Explicit non-claims (this stage)

- No Implement started  
- No Ford PTS / friend rclone / CE invent  
- No dual-product Done · No live PrivateGold upsert Met  
- No friend Soft Adjust Review Met  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan in guide.

### Stop

Ready DoD Met (**Go 8.8/10**). Under Tom authorize + A/Q1/E1, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
