> **ARCHIVED** — moved under Workflow OS documentation sprawl reform.
> Do not treat this file as living SSOT.
> Living successor: `docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md` · `docs/VISION.md` · `docs/ARCHITECTURE.md`
> Batch: `2026-08_sprawl_c2a_mechanic_guide_stage_notes`
> Date: 2026-08-13

# Ready-check note — Mechanic Guide 11 PrivateGoldSource (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Stage:** Ready check before code  
**Guide:** `docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md` (Write Met `7c46018`)  
**Context:** `docs/2026-07-18_private_gold_source_context_summary.md`  
**Handoff:** `second_brain/docs/2026-07-19_spoke_mechanic_ready_guide11_pass163_handoff.md`  
**Hub lock:** `second_brain/docs/2026-07-19_hub_decision_lock_mechanic_private_gold_write_pass163.md`  
**Locks:** **A** (Write/Implement fixture-first now) · **N1** (Met on `fixture:` Contract 7.2 under private root) · live Soft Adjust Review **parked / out of Met**

## Call

**READY for Implement** under locks **A** / **N1**. **Do not Implement in this stage.** Tom authorized Ready-checks + next steps; hub may chain Implement after this Ready Go.

Implement (when started) lands `PrivateGoldSource` + `--source private-gold` + `MECHANIC_PRIVATE_GOLD_ROOT` fail-closed; proves Met on staged Contract 7.2 `fixture:` pack under a private Gold root; thin honesty docs. Live Soft Adjust / Drive / public flip stay out.

### Implement readiness

| Track | Score | Why not 10 |
|-------|-------|------------|
| Guide 11 PrivateGoldSource (fixture-first) | **8.8 / 10** | (1) Met Gold pack is staged at Implement from program `vehicle_rag_gold/valid/` (or Guide 10 out) into a gitignored/tmp root — path clear, not an in-repo committed private tree. (2) Context AC still soft-mentions synthetic `cat:` while guide+lock **N1** reject `cat:`/`private_oem` for Met — Align residual only. (3) Contract 7.2 `documents[]` + `text_path` → flat upsert mapping is new consumer surface (FixtureSource is still legacy flat); planned but unproven until Implement. (4) Full Compose/Ollama ingest Met may hit env gap — guide allows attestation; fail-closed unit tests must still pass. |

**Not inflated:** Locks A/N1 hub-pinned; guide soft pins / phases / DoD / blast / edges explicit; `PrivateGoldSource` confirmed absent; `ingest_cmd` still fixtures-only gate; live Soft Adjust parked out of Met; public flip untouched.

### Alignment (context ↔ guide ↔ live truth)

| Check | Status |
|-------|--------|
| Locks A / N1 | **Aligned** (hub lock + guide) |
| Live Soft Adjust out of Met | **Aligned** (parked; Soft Adjust follow-on section only) |
| GD2 local root / no Drive | **Aligned** |
| `PrivateGoldSource` unbuilt | **Verified** — `mecharag/private_gold_source.py` absent |
| `ingest_cmd` fixtures-only | **Verified** — unsupported `--source` → exit 2 |
| Contract 7.2 schema + validator | **Met** — `contracts/normalized_document_manifest.schema.json`; `validate_manifest.py --profile library` |
| Met pack shape | **Verified** — `second_brain/.../vehicle_rag_gold/valid/minimal_manifest.json` → `documents[0].vehicle_id=fixture:demo-s2000-ap1`, `rights_class=synthetic_fixture`, units via `text_path` |
| Public flip Guide 10b | **Leave alone** — ≠ PrivateGold Done |
| Guide checklist unchecked | **Correct** for Ready |
| Context vs N1 soft wording | **Non-blocking** — Implement follows guide locks |

### Evidence attached this Ready-check

| Item | Result |
|------|--------|
| Guide Write Met | `7c46018` — pins A/N1, phases A–E, verification DoD, blast/edges |
| Hub lock | A + N1; Soft Adjust parked |
| Adapter absent | `private_gold_source.py` not present |
| Ingest gate | `ingest_cmd.py` L29–31 fixtures-only |
| Met fixture identity | program `minimal_manifest.json` `fixture:demo-s2000-ap1` / `synthetic_fixture` |
| ARCHITECTURE MR3 | Names PrivateGold deferred — honesty update is Implement Phase D |

### Blast radius / rollback

**Blast:** `mecharag/private_gold_source.py` (new), `ingest_cmd.py` / `__main__.py`, tests, thin ARCHITECTURE §5.2 / GETTING_STARTED — **not** ranking/CE, LICENSE, §9 flip, Drive.

**Rollback:** Revert adapter/CLI/docs/test commits; fixtures ingest remains.

### Edge cases (guide covers)

- Env unset → fail closed  
- Hash / validate fail → reject before write  
- Path escape → reject  
- `private_oem` / `cat:` in Met pack → reject (N1 honesty)  
- Empty units after resolve → reject document  
- Drive URL as root → hard fail  

### Refinements still required before Implement?

**None blocking.** Soft Align (optional, not Ready blockers): tighten context AC to N1-only wording; prefer staging `vehicle_rag_gold/valid/` into pytest `tmp_path` / `tmp/private_gold_met/` at Implement Phase A4.

### Explicit non-claims (this stage)

- No Implement started  
- No live Soft Adjust Review Met  
- No Drive ingest  
- No dual-product Done  
- No public-flip / LICENSE / freeze reopen  

### QUALITY_STANDARD §5

Assumptions listed; spoke stayed in Ready slice; blast ≥2 angles; edges planned; numeric score + why not 10; no scope creep; verification plan in guide.

### Stop

Ready DoD Met. Under Tom authorize + locks A/N1, Implement may start on a dedicated Implement stage/handoff — **do not** silent-code from Ready alone.
