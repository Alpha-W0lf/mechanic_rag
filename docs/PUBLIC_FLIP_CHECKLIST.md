# Public flip packaging checklist (Guide 06)

**Banner:** This checklist documents what would be required before a portfolio **public flip** / “v1 Done” marketing claim.  
**Checklist ≠ public flip. Checklist ≠ portfolio v1 Done.** Completing Guide 06 packaging does **not** flip VISION §9.

**SSOT for freeze honesty:** [`evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md)  
**Dev guide:** [`docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`](./dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md)

---

## Gates (document status honestly)

| # | Gate | Current status (2026-07-18) |
|---|------|------------------------------|
| 1 | Fixtures-only public corpus; `python scripts/checks/public_fail_closed.py fixtures` green; no OEM / Drive / Ford artifacts in git | **Path exists** (fixtures + fail-closed script). Re-run before any flip. Not a flip by itself. |
| 2 | Stranger-clone path works per `GETTING_STARTED.md` (Compose, `web/.env.local`, Ollama, fixture ingest, health, ask, eval smoke) | **Path documented** (Guide 03). Operator must re-verify before flip. |
| 3 | Honesty surfaces consistent: embed/CE **frozen (Tom override)** Guide 09 with freeze checklist + no-lift honesty; no CE lift theater on n=44 (Guide 08) or prior n=38/n=30; no proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as proof | **Honest today** — frozen by override; paired ask delta **0** on n=44 (helps=0/hurts=0); Guide 05 keep history retained. |
| 4 | Formal freeze gate | **Resolved by Guide 09 Path B override** (freeze Met after Implement) — flat delta; **not** earned lift. Public flip remains a **separate** Tom lock. |
| 5 | VISION §9 / README / INTERVIEW banners | Flip **only after** Tom locks public flip. Guide 09 must **not** check §9 public-flip. |
| 6 | No secrets in git; LICENSE | Secrets: keep fail-closed. **LICENSE file currently absent** — unmet prerequisite for a future flip. **Do not invent LICENSE in Guide 09.** |

---

## Explicit non-claims

- Embed + CE are **frozen by Tom override** (Guide 09) — **not** because CE proved lift on n=30 / n=38 / n=44.
- Paired-ask citation∩gold delta was **0** on n=30, n=38, and n=44 (Guide 08 T1; CE-helps=0 / CE-hurts=0) — do **not** claim CE improved citation hits.
- Guide 05 keep-with-justification **≠** formal freeze. Guide 07–08 flat after discriminative attempts **≠** earned freeze. Guide 09 override freeze **≠** public flip / v1 Done.
- This file existing **≠** public flip ready / v1 Done.

## Deferred (non-blocking for fixtures-only flip narrative)

Second vehicle / wiring themes, PrivateGold, Drive/Ford, g10 grounding residual — out of Guide 06 DoD; may remain open after a fixtures-only public flip if Tom explicitly accepts that scope.
