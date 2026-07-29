# Ready prep — Mechanic M2 multimodal retrieve (planning)

**Date:** 2026-07-26 (readiness uplift)  
**Mode:** waterfall  
**Stage:** Ready check before code (package MR-2) — **not** Implement · **not** Build Go  
**Guide:** `docs/dev_guides/2026-07-26_dev_guide_mechanic_m2_multimodal_retrieve.md`  
**Evidence:** `docs/2026-07-26_spike_evidence_m2_fixture_embed.json`  
**Migration draft:** `db/migrations/00X_chunk_image_embeddings_DRAFT.sql`

### Declare

| Item | Value |
|------|-------|
| Will write | Ready freeze |
| Will **not** | Wire ask/image index until Build Go |

---

## Frozen for Build (MR-2)

| Gate | Freeze |
|------|--------|
| Image embed model | **`openai/clip-vit-base-patch32`** |
| Embedding dim | **512** |
| Query tower | CLIP text tower (same model) |
| Index | Side table `chunk_image_embeddings` `vector(512)` |
| Fusion | Extend RRF; default **`k=60`**; equal contribution from text_vector / lexical / image channel rank lists until ablation |
| Channel field | `retrieve_channel` ∈ `text_vector\|lexical\|image\|fusion` |
| Diagram-only hit | **Option A** |
| Multimodal CE | **Out** |
| Deps | `pyproject.toml` optional `[m2]` (`torch`, `transformers`, `pillow`) |
| Goldens | `evals/golden_m2_diagram_stubs_v1.json` |

**M2 package Ready score:** **8.9 / 10**  
Why not 10: product fusion/harness not wired; multi-channel RRF contract documented (`docs/2026-07-26_build_contract_m2_multichannel_rrf.md`); spike PNGs were Honda owners-manual pages; draft migration `00X_` ordinal pending Build.

**MR-2 includable in Build Go.**
