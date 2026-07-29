# Ready check — Personal garage Contract 7.2 RAG Gold emit

**Date:** 2026-07-25  
**Repo:** `mechanic_rag`  
**Mode:** multi-repo (primary `mechanic_rag`)  
**Stage:** Ready check before code — **Met** · **no Implement**  
**Guide:** `docs/dev_guides/2026-07-25_dev_guide_personal_garage_rag_gold_emit.md`  
**Context:** `docs/2026-07-25_mechanic_rag_orientation_vehicle_docs_wiring_context_summary.md`

### Declare

| Item | Value |
|------|-------|
| Will write | This ready note · pin Ready locks into guide/context |
| Will **not** | Implement · ingest · ask · friend capture |

---

## Verdict

**Go — Implement readiness 8.7 / 10** for the personal-garage emit guide.

Do **not** start coding until Tom says **Implement** (or equivalent explicit authorize). This stage stops here.

---

## Scores (0–10)

| Track | Score | Why not 10 |
|-------|------:|------------|
| **Context ↔ guide alignment** | **9.2** | Locks match (fleet, YXZ 2019–2023, full manuals, paperwork out, local disk, friend separate). Minor: code-package home + `pypdf` install path were “pick in Implement” — **pinned below** this Ready. |
| **Architecture / GD2 honesty** | **9.0** | Copy-then-emit + Contract 7.2 + `gold_status` for `cat:` is correct. Residual: Transit text Gold may be large; still not Drive-as-DB. |
| **Allowlist / inventory evidence** | **9.0** | Drive listings re-checked this pass; S2000 service MD5 duplicate known; YXZ include/exclude explicit. Residual: YXZ `et` owners trim honesty (accepted). |
| **DoD / edge cases / blast radius** | **8.8** | Strong checklist + deny-lists + empty-page / no-OCR rules. Residual: disk tight (~30 GiB free); gold text size for Transit unknown until emit. |
| **Implement readiness (overall)** | **8.7** | Executable enough to code. Prevents 10: dependency pin (`pypdf` only under optional `legacy` today), package home must be fixed, live Transit wall-clock/disk unknown, no prior garage emit sample in-repo. |

**Not ready would require:** missing allowlist, Drive-as-ingest design, or unresolved product scope. None of those apply.

---

## Locked this Ready (Tom agreed recommendations)

| Pin | Locked value |
|-----|--------------|
| Local root | `~/var/mechanic_garage/` (outside git) |
| OCR | **Defer** — empty/image-only pages skip + count (`ocr_not_attempted`) |
| YXZ owners `…et…` 2019 | **Keep** with provenance honesty |
| Code package home | **`mecharag/garage_emit/`** + tests under `tests/test_garage_emit*.py` (or `tests/garage_emit/`) |
| `pypdf` | Add to **main** `project.dependencies` (or a named optional extra installed for Met) — do not rely on undocumented `legacy` only |
| `gold_status.json` shape (per vehicle gold dir) | Mirror Guide 13 Met pack: `schema_hint=mechanic_gold_status/v1`, `present_only=true`, `zero_gap=false`, `complete_library=false`, `publishable=false`, `friend_publish_eligible=false`, `vehicle_ids=[<that cat:>]`, notes that personal garage ≠ friend Done |
| Disk gate | Keep **≥ 8 GiB free** before Transit copy/extract; record `df -h` in receipt; stop and ask if below |
| Scope | Fleet-wide Met (all four); Implement order Triumph → S2000 → YXZ → Transit |
| Out of Met | Ingest · ask · friend dual-product Done · CE reopen |

---

## Alignment checks (evidence)

| Check | Result |
|-------|--------|
| Context vs guide product locks | **Aligned** |
| VISION private garage path | **Aligned** (prior Align) |
| Schema supports page units + `text_path` artifacts | **Yes** (`contracts/normalized_document_manifest.schema.json`) |
| `PrivateGoldSource` needs `gold_status` for `cat:`/`private_oem` | **Yes** (`require_soft_adjust_status`: `present_only` or `zero_gap=false`; reject `friend_publish_eligible=true`) |
| Validator exists | **Yes** `scripts/validate/validate_manifest.py --profile library` |
| Prior extract art | **Yes** `second_brain/.../extract_live.py` (page-dump grain differs — reuse extract ideas only) |
| `pypdf` in mechanic_rag main deps | **No** — only `optional-dependencies.legacy` — **Ready pin to fix in Implement** |
| `~/var/mechanic_garage` exists | **No** — create in Implement A2 |
| Free disk | **~30 GiB** on data volume (2026-07-25 Ready recheck) — above 8 GiB gate |
| Approx bronze PDF mass | **~1.0 GiB** allowlisted — fits; Gold text TBD |
| Drive allowlist files still present | **Yes** (Triumph/YXZ sample re-list this pass) |
| `.gitignore` PDF / private gold patterns | **Partial** — `*.pdf` ignored; prefer out-of-repo root anyway; A3 still applies |

---

## Blast radius / rollback (clear enough)

| Concern | Rollback |
|---------|----------|
| New `mecharag/garage_emit/` + tests + dep | Delete package / revert; fixtures path untouched |
| `~/var/mechanic_garage/` | Delete tree; no git history of OEM |
| Accidental OEM commit | Fail pre-commit / `*.pdf` ignore; Ready prefers out-of-repo root |
| Friend library / Mechanic ask | **Out of Met** — no blast if stop conditions honored |

---

## Refinements required before coding?

**None blocking.** Pins above must be followed in Implement (treat as guide amendments).

Optional later (not Ready blockers): free disk by draining old scratch under `~/var/` if Transit extract pressures space.

---

## Remaining risks (honest, accepted for Go)

1. Transit full-text Gold size/time unknown — may approach disk comfort; gate + stop-and-ask.  
2. Image-only pages → empty skips (no OCR) — corpus may have gaps; honesty via receipt.  
3. YXZ 2019 `et` owners may not perfectly match SS SE trim.  
4. First garage emit path — no in-repo sample release yet (tests must supply synthetic).

---

## Human gate

**Ready: Go (8.7/10).**  

To start coding, say **Implement** (authorize Implement for this guide only).

---

## Stop

Ready check Met. **No implementation started.**
