# Public flip packaging checklist (Guide 06 → Guide 10b)

**Banner:** Packaging checklist for portfolio **fixtures-only public flip** / “v1 Done” marketing.  
**Guide 10b (2026-07-18):** VISION §9 packaging public flip **Met** (fixtures-only). Checklist history ≠ earned CE lift; ≠ OSI open source; ≠ PrivateGold/Drive complete.

**Important distinction (2026-07-31):** Guide 10b **packaging Met ≠ GitHub repository visibility**. Visibility public + sales-first storefront is a separate slice — see [`docs/dev_guides/2026-07-31_dev_guide_mechanic_github_visibility_storefront.md`](./dev_guides/2026-07-31_dev_guide_mechanic_github_visibility_storefront.md).

**SSOT for freeze honesty:** [`evals/MODEL_FREEZE_STATUS.md`](../evals/MODEL_FREEZE_STATUS.md)  
**Flip guide:** [`docs/dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md`](./dev_guides/2026-07-18_dev_guide_10b_public_flip_packaging.md)  
**Packaging guide (historical):** [`docs/dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md`](./dev_guides/2026-07-17_dev_guide_06_formal_freeze_packaging.md)

---

## Gates (document status honestly)

| # | Gate | Current status (2026-07-18 Guide 10b) |
|---|------|----------------------------------------|
| 1 | Fixtures-only public corpus; `python3 scripts/checks/public_fail_closed.py fixtures` green; no OEM / Drive / Ford artifacts in git | **Met (re-verified Guide 10b)** — fail-closed OK / exit 0 at Ready + Implement. Not a CE-lift claim. |
| 2 | Stranger-clone path works per `GETTING_STARTED.md` (Compose, `web/.env.local`, Ollama, fixture ingest, health, ask, eval smoke) | **S2 Met** — fail-closed + GETTING_STARTED attestation; health/ask **env gap** at Ready/Implement (Next `:3000` down; Compose Postgres up) — soft attestation only, not full twin. |
| 3 | Honesty surfaces consistent: embed/CE **frozen (Tom override)** Guide 09 with freeze checklist + no-lift honesty; no CE lift theater on n=44 (Guide 08) or prior n=38/n=30; no proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as proof | **Honest today** — frozen by override; paired ask delta **0** on n=44 (helps=0/hurts=0); Guide 05 keep history retained. |
| 4 | Formal freeze gate | **Resolved by Guide 09 Path B override** (freeze Met) — flat delta; **not** earned lift. Flip is separate (Guide 10b). |
| 5 | VISION §9 / README / INTERVIEW banners | **Met Guide 10b** — fixtures-only public flip / “v1 Done” marketing; freeze = Tom override not lift; PolyForm-NC ≠ OSI. |
| 6 | No secrets in git; LICENSE | Secrets: keep fail-closed. **LICENSE present** — **PolyForm Noncommercial License 1.0.0** (`PolyForm-Noncommercial-1.0.0`, Guide 10a). Source-available / non-commercial — **not** OSI open source / **not** MIT. |
| 7 | GitHub **visibility** public + sales-first storefront (description, topics, no apology thumbs) | **Separate from Guide 10b packaging** — Met when storefront slice lands (2026-07-31). Private-garage eval artifacts must be absent from tip **and** history before flip. |

---

## Explicit non-claims

- Embed + CE are **frozen by Tom override** (Guide 09) — **not** because CE proved lift on n=30 / n=38 / n=44.
- Paired-ask citation∩gold delta was **0** on n=30, n=38, and n=44 (Guide 08 T1; CE-helps=0 / CE-hurts=0) — do **not** claim CE improved citation hits.
- Guide 05 keep-with-justification **≠** formal freeze. Guide 07–08 flat after discriminative attempts **≠** earned freeze. Guide 09 override freeze **≠** earned CE lift.
- Guide 10a LICENSE (PolyForm-NC) **≠** OSI open source / MIT.
- Guide 10b fixtures-only public flip **≠** earned CE lift · **≠** OSI open source · **≠** PrivateGold / Drive / second-vehicle complete.

## Deferred (non-blocking for fixtures-only flip narrative)

Second vehicle / wiring themes, PrivateGold, Drive/Ford, g10 grounding residual — out of Guide 06/10b DoD; may remain open after a fixtures-only public flip.
