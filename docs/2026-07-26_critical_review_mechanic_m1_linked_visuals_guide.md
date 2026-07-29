# Critical review — Mechanic M1 linked visuals dev guide

**Date:** 2026-07-26 (~00:15 local)  
**Mode:** multi-repo  
**Stage:** Critical review  
**Slice:** M1 linked visuals (Write guide only — Implement parked)  
**Artifacts in scope:**  
- `mechanic_rag/docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md` (primary)  
- Prior context review: `docs/2026-07-25_critical_review_multimodal_roadmap_m1_m3.md`  
- Evidence: `garage_emit/emit.py` provenance · `ask_response.schema.json` · `citations.ts`

**Stop:** Findings + smallest doc remediations Tom authorized via lock/proceed. No Implement.

### Declare

| Item | Value |
|------|-------|
| Will write | This review · patch M1 guide P1s |
| Will **not** | M1 code · M2 retrieval code · friend live ops |

### Ops note (not in scope)

Ram continue healthy: **4/22** Met; downloading `ram:2017:2500` (~266 MiB at check). Left alone.

---

## Verdict

**Pass with nits — one P1 must be fixed before Ready/Implement.** The guide correctly absorbs prior context review (provenance resolve, cache-only ask *render*, vehicle-scoped assets, Triumph-first). It would still fail a design review on **first-hit UX**: as written, ask only emits `visual_assets` when PNGs already exist, and nothing creates those PNGs unless UI already has an `href` — a closed loop that keeps M1 empty forever.

---

## Ranked findings

### P1 — Chicken-and-egg: cache-only emit vs nothing to warm the cache

**Evidence:** Guide §1.4 / §2 Ask join / §6 B2: append `visual_assets` **only if PNG exists on disk**. §6 C2: GET may rasterize on miss — but UI never calls GET without an `href` from ask.

**Risk:** Triumph smoke Met impossible without a manual pre-warm step the guide never defines as DoD.

**Remediation (smallest):** Redefine “cache-only” as **ask never blocks on rasterize**, not “ask only emits when file exists.”  
- Ask emits `href` when bronze+page are **resolvable** (provenance OK + `page_start` set).  
- GET `/api/assets/...` performs cache hit or `ensure_page_png` (bounded timeout) or 404.  
- Ask still does **not** call `ensure_page_png`.

### P1 — Garage root join for `redacted_locator` underspecified

**Evidence:** Emit sets `redacted_locator` = `bronze/<dirname>/<filename>` (`garage_emit/emit.py`). Guide says resolve via provenance but does not lock absolute join: `$HOME/var/mechanic_garage/` + locator (or env override).

**Risk:** Implement invents a second root or treats locator as absolute.

**Remediation:** Lock garage root default `$HOME/var/mechanic_garage` (env override allowed, e.g. `MECHANIC_GARAGE_ROOT`); resolve = `root / redacted_locator`; reject `..` segments.

### P2 — C2 “optional” rasterize on GET invites bike-shed

**Evidence:** §6 C2 “Optional: on miss, try ensure…”. After P1 fix, GET rasterize is **required** for first-hit, not optional.

**Remediation:** Lock GET miss → `ensure_page_png` with hard timeout (recommend **8s**) else 404.

### P2 — Rasterize library / binary deps unnamed

**Evidence:** No pdftoppm / PyMuPDF / pdf2image choice. Fine for Write; Ready must name one.

**Remediation:** Park to Ready — prefer **PyMuPDF** or **pdftoppm** (explicit in Ready). Do not block M2 Write.

### P2 — Module ownership thin

**Evidence:** Checklist A doesn’t name package path (`mecharag/assets/` vs `web/src/server/`).

**Remediation:** Prefer `mecharag/` pure resolve+render; thin Next route wrappers — note in guide.

### P2 — `href` encoding for `document_id`

**Evidence:** Slugs are usually safe; filenames in provenance can be messy. URL path segments need encodeURIComponent.

**Remediation:** One line in guide C1.

---

## What is actually strong

- Prior P1s from context review landed (provenance, no Gold rewrite, no ask-blocking render intent, Triumph-first).  
- Honest Out of Met / M2–M3 boundary.  
- Security: path traversal + no absolute FS paths in API.  
- Disk honesty (no fleet batch).

---

## Decision flags

| Flag | Recommendation |
|------|----------------|
| Ask emits href when resolvable (not only when cached) | **Lock yes** |
| GET rasterize on miss with timeout | **Lock yes (8s)** |
| Garage root default | **`$HOME/var/mechanic_garage`** |
| Proceed to Write M2/M3 docs | **Yes** (Implement still parked) |

---

## Smallest remediation set

1. Patch M1 guide for P1 chicken-and-egg + garage root + GET timeout lock.  
2. Do **not** Implement.  
3. Next stage: **Write M2** guide (then M3).

**Ready for Implement?** Still **No** — needs Ready check + Tom Go after remediations. **Ready for Write M2?** **Yes**.
