# Ready prep — Mechanic M3 vision answers (planning)

**Date:** 2026-07-26 (readiness uplift)  
**Mode:** waterfall  
**Stage:** Ready check before code (package MR-3) — **not** Implement · **not** Build Go  
**Guide:** `docs/dev_guides/2026-07-26_dev_guide_mechanic_m3_vision_answers.md`  
**Evidence:** `docs/2026-07-26_spike_evidence_m3_vlm_fixture.json`  
**Goldens:** `evals/golden_m3_vision_stubs_v1.json`

### Declare

| Item | Value |
|------|-------|
| Will write | Ready freeze |
| Will **not** | Implement VLM until Build Go + MR-2 Met |

---

## Frozen for Build (MR-3)

| Gate | Freeze |
|------|--------|
| VLM model | **`gemma4:e2b`** |
| Env flag | **`MECHANIC_VLM`** (`1`/`true` on; default off) |
| Timeout | **45s** → degrade |
| Router | Flag on ∧ (UI diagram flag ∨ heuristic); torque-only questions do not fire |
| Spec filter | No VLM Nm/lbf unless in cited text |
| Image cap | 1–2 page PNGs |
| Order | **After MR-2 Met** |

**M3 package Ready score:** **8.8 / 10**  
Why not 10: harness not wired; spike page not wiring-diagram-heavy; garage Triumph torque case still Build-time.

**MR-3 includable in Build Go** (Implement only after MR-2 Met).
