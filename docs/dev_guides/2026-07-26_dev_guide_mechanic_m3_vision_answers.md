# Dev guide — Mechanic M3 vision answers (design)

**Date:** 2026-07-26  
**Repo:** `mechanic_rag`  
**Work item:** M3 — optional local VLM path for diagram questions; text remains torque/spec truth  
**Stage that authored this:** Write dev guide  
**Status:** Design guide Met · **Ready prep Met (8.3)** · **Implement Met** (A1–A3 + B1) · **Review Pass-with-nits** 2026-07-27 · **C1 Align Met (MR-4)** · after **MR-2 Met**  
**Depends on:** M1 assets (required) · **M2 Met (required for this finish line)** · VISION §5  
**Context SSOT:** `docs/2026-07-25_mechanic_rag_multimodal_roadmap_m1_m3_context_summary.md`  
**Ready freeze:** `docs/2026-07-26_ready_prep_mechanic_m3_vision_answers.md` · spike `docs/2026-07-26_spike_evidence_m3_vlm_fixture.json`  
**Lens:** Senior AI eng (grounding / safety) + local LLMOps

### Declare (Write)

| Item | Value |
|------|-------|
| Will write | This guide |
| Will **not** | Implement VLM · weaken text citation gate for specs |

### TBD gates

| Gate | Status | Closes at |
|------|--------|-----------|
| Local VLM model ID (Ollama or equiv) | **Frozen `gemma4:e2b`** | Ready spike Met |
| When to invoke VLM (router) | **Frozen** (default off + heuristic/UI) | Ready |
| Latency/cost budget | **Frozen** 45s timeout / ~22s observed | Ready |
| Eval harness for “diagram interpret” vs “spec truth” | **B1 Met** (`golden_m3_vision_v1` + evidence JSON) | Build B1 |

---

## 1. Objective

Some questions need reading a diagram (routing of hoses, connector views). M3 optionally runs a **local vision-language model** on retrieved page image(s) to help interpretation.

**Honest ship claim (M3):** Optional VLM assist for diagram questions; **numeric torque/spec answers remain grounded in text citations**. If VLM is down, M1/M0 text path still works. Never market as “vision RAG replaces manuals.”

**Out of Met:** Cloud-only VLM requirement · VLM-authored torque without text cite · M2 skip claimed as full multimodal.

---

## 2. Locked design defaults (docs)

| Topic | Locked |
|-------|--------|
| Truth rule | **Text citations own torque/spec numbers** |
| Degrade | VLM fail/timeout → text-only answer + optional note |
| Inputs | Page PNGs from M1 asset store (ask citations and/or M2 image hits) |
| Stack | Local (Ollama or documented local runtime) — no required cloud key for portfolio claim |
| CE | Unchanged text-pair unless separate decision |
| Portfolio | Optional path behind flag; default ask remains text+M1 visuals |

---

## 3. DRY / architecture

1. **Business rule:** Spec numbers in the answer must map to text citation labels; VLM prose may describe diagram layout only.  
2. Reuse M1 assets and ask contract; add optional `diagnostics.vlm_*` when flag on — not private page dumps.  
3. Do not fork a second ask API.  
4. Prefer ≤300 lines/file; hard max 400.

---

## 4. Recommended approach (Implement later)

1. Flag `MECHANIC_VLM=1` (name TBD).  
2. After retrieval (+ optional M2), if router says diagram-intent and PNG available, call local VLM with image + short instruction.  
3. Generator: merge VLM diagram notes with text evidence; **filter/refuse** VLM-invented numeric specs without text support (same citation filter discipline).  
4. Evals: (a) diagram interpretation goldens; (b) torque goldens must not regress when VLM on; (c) VLM-down degrade test.

---

## 5. Ordered Implement checklist (when Tom Go + Ready)

- [x] **A1.** Freeze VLM model ID after spike; document pull/preflight. (`gemma4:e2b` vision capability verified)  
- [x] **A2.** Router + timeout + degrade. (`ask_vlm.ts` — `MECHANIC_VLM` default off; 45s; cache-hit PNGs only)  
- [x] **A3.** Prompt/contract: text owns specs. (filter invented Nm/lbf vs citation text; prompt forbids inventing specs)  
- [x] **B1.** Goldens: diagram + torque non-regression + degrade. (`evals/golden_m3_vision_v1.json` + `docs/2026-07-27_m3_vlm_eval_evidence.json`; root-cause: unbound `citedTexts` → fixed `input.citedTexts`)  
- [x] **C1.** Align VISION/ARCHITECTURE honesty; flag default off for public demo unless proven. (2026-07-27 Align)

---

## 6. Definition of Done

- [x] Flag-off path = M1/M0 behavior  
- [x] Flag-on: diagram assist works; torque still text-cited  
- [x] VLM down → degrade, no hang  
- [x] Evals honest  
- [x] Review Pass / Pass-with-nits (`docs/2026-07-27_review_mechanic_m3_vision_answers.md`)  

---

## 7. Blast radius / risks

| Risk | Mitigation |
|------|------------|
| Hallucinated torque | Text-citation gate |
| Latency | Timeout + default off |
| GPU/RAM fight with Ram downloads | Ops serialize; local only when idle |

## 8. Edge cases

- No PNG → skip VLM  
- Multi-image → cap (e.g. 1–2 pages)  
- Insufficient text evidence → insufficient_evidence, do not let VLM invent  

---

## 9. Next

- Finish-line Build packages through M3 + Align are **Met**  
- Batch-3 live remains **OUT** until Ready live≥8 + separate Go (S1 dry-run Ready **8.2** if Tom wants select code next)  

**M3 Implement + Review + C1 Align?** **Met** (Pass-with-nits). Reduced-claim M3-without-M2 remains **OUT** of this finish line.
