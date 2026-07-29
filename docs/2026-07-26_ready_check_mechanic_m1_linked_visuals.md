# Ready check — Mechanic M1 linked visuals

**Date:** 2026-07-26 (~00:30 local)  
**Mode:** multi-repo  
**Stage:** Ready check before code  
**Guide:** `mechanic_rag/docs/dev_guides/2026-07-25_dev_guide_mechanic_m1_linked_visuals.md`  
**Reviews:** context + guide Critical reviews (Pass-with-nits; guide P1s patched)  
**Stop:** Ready verdict + scores — **no Implement** until Tom explicit Go

### Declare

| Item | Value |
|------|-------|
| Will write | This Ready note |
| Will **not** | Write M1 code · start rasterize fleet · fight Ram disk |

---

## Zoom-out alignment

| Check | Result |
|-------|--------|
| Context ↔ guide | Aligned after 2026-07-26 guide patch (href when resolvable; GET ≤8s render) |
| Prior Critical reviews | Context Pass-with-nits absorbed; guide chicken-and-egg P1 patched |
| Blast radius | Local garage assets + ask schema + thin UI; rollback = flag off / omit visuals |
| Edge cases | Null page, missing bronze, traversal, timeout 404 — listed |
| M2/M3 creep | Out of Met; separate guides |
| Friend live conflict | Ram was 5/22 at Ready writing; **as of 2026-07-26 noon: 21/22 Met**, 1 skip — on-demand M1 no longer disk-blocked like before; still no fleet warm |

---

## Implement readiness score

| Track | Score | Ready to Implement if Tom Go? | Why not 10 |
|-------|------:|-------------------------------|------------|
| **M1 linked visuals** | **8.3 / 10** | **Yes — conditional Go** | (1) One Triumph page PNG size@150 DPI unmeasured. (2) Ask schema/ARCHITECTURE Align happens in Implement. (3) Should not run heavy render while Ram needs disk — ops serialize. Renderer now locked in guide (`pdf2image`+Poppler). |

**Not Ready (blocking):** None for thin Triumph+fixture slice **if** Tom accepts renderer lock below and schedules Implement when disk allows.

**Do not Implement yet** — waiting for Tom’s explicit Implement Go (and preferably Ram wave quieter or explicit accept of light on-demand only).

---

## Soft residuals to lock at Go (not Refine-required)

1. **Renderer:** **Locked** — `pdf2image` + Poppler (`pdftoppm`); preflight in Implement. (Patched into M1 guide A4.)  
2. **First slice:** Triumph only + synthetic fixture PNG for CI.  
3. **Ops:** On-demand GET render only; no fleet warm while Ram/batch-2 live.  
4. **Measure:** Log one Triumph page PNG bytes at first successful render (honesty, not a gate).

---

## Rollback

- Omit `visual_assets` / disable asset route → M0 text ask remains.  
- Delete `$HOME/var/mechanic_garage/assets/` cache if corrupt.  
- Schema: optional field — old clients ignore.

---

## Open decision (human)

### Implement Go now vs after Ram?

- **Recommendation:** **Authorize Ready (8.1)** but schedule **Implement after Ram wave clears** (or only if you accept light on-demand GET during Ram).  
- **Reasoning:** Guide is Ready; disk ~25 GiB class + Ram ZIP growth still competes with accidental warm scripts.  
- **Tradeoffs:** Delays M1 code vs safer ops.

---

## Verdict

**Ready for Implement = Yes (8.3/10)** pending Tom **Implement Go** + ops soft locks above.  
**Coding starts only after you say Go.**
