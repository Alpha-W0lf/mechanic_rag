# Mechanic RAG — Interview FAQ

Staff-interview gotchas for the **hybrid → RRF → section dedup → local CE** vertical slice. Contracts SSOT: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Product / why: [`docs/VISION.md`](docs/VISION.md). Freeze honesty: [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md). Path to ≥30 goldens: [`evals/PATH_TO_30.md`](evals/PATH_TO_30.md).

This is packaging around a shippable Guide 01 path + honest Guide 02 ablation evidence — **not** portfolio v1 Done, **not** public-flip ready, **not** a model freeze.

---

## 1. Why hybrid → RRF → section dedup → local CE?

**MR2** locks the ranking order: vehicle-filtered vector + lexical (independent) → **RRF** fuse → optional **section dedup** → local **cross-encoder** (top N → top K) → context + citations. Hybrid gives complementary recall; RRF fuses ranks without pretending scores are comparable similarities; section dedup diversifies same-section near-dupes before CE; CE reranks query–chunk pairs locally. Do not invent parallel scorers or advertise “MMR” until true embedding-similarity MMR exists with evals. See ARCHITECTURE §7.

## 2. Why section dedup before CE, not after?

Binding order is **RRF → optional section dedup → CE**. Dedup operates on fused IDs so CE scores a diversified shortlist. Running a second competing dedup after CE is out of v1 unless a later eval decision says otherwise. Live `section_dedup` is binary same-section diversification — **not** true MMR.

## 3. How is `rerank_degraded` different from `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY`?

| Signal | Meaning |
|--------|---------|
| `rerank_degraded=true` | CE failed/timed out/returned empty — ask **fails open** to post-RRF (+ dedup) order. Production safety. |
| `ablation_rrf_only=true` / `MECHANIC_FORCE_RRF_ONLY=1` | **Intentional** RRF-only arm for Guide 02 paired ablation. Not a failure. |

Do not conflate degrade with ablation. Degrade rate and ablation diagnostics are separate fields; freeze checklists treat them differently. See ARCHITECTURE §7.5 and README “Paired ask ablation eval.”

## 4. Why fixtures only — why never Drive / Ford / OEM PDFs here?

Public corpus boundary is **`fixtures/` only** (synthetic). Drive sync, Ford/PTS bulk, and OEM PDFs live outside this repo so public git stays legally clean and stranger-cloneable. PrivateGold / Drive / Ford are deferred adapters — packaging must not claim they are in-product here. See ARCHITECTURE §5.

## 5. Are embed/CE frozen? What does Guide 02 paired delta `0` mean?

Embedding (`nomic-embed-text` @ 768) and CE (`Xenova/ms-marco-MiniLM-L-6-v2`) are **candidates**, not frozen. Guide 04 paired ask ablation (n=30, generator `gemma4:e2b`, citation∩gold) recorded `ce_vs_rrf_ask_delta_hits=0` — flat: CE did **not** improve hits vs forced RRF-only on this fixture set. That is honest evidence, not a license to invent lift.

**Guide 05 keep-with-justification:** We **keep** CE in the ranking stack (architecture completeness, N→K demo, latency, degrade-to-fusion) while leaving status **candidate**. See [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md). **Do not** claim CE improved citation hits on the n=30 run.

**Guide 06 formal freeze packaging:** Freeze remains **parked** (insufficient flat delta; Tom lock). See **Formal freeze packaging (Guide 06)** in [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md) — keep ≠ freeze.

**Forbidden as lift / freeze evidence:** historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` (answer-substring era; no `_ask_` in the field name). If that short name appears, label it **historical proxy / non-evidence** only. Do not invent lift language or freeze theater.

## 6. Where do citations come from, and how does `vehicle_id` filter?

Every ask requires a canonical **`vehicle_id`** — no all-vehicle fallback, no VIN lookup. Vector and lexical retrieve only chunks for that vehicle (optional `doc_family` later). Citation labels (`[1]`, `[2]`, …) are server-assigned from DB rows after ranking; the generator may reference only those labels; unknown labels are rejected. Citation metadata is never model-invented paths. See ARCHITECTURE §7.1 / §7.6 / §8.

## 7. Is the eval suite “complete”? Where is path to ≥30?

S2000 fixture golden count is **30** (Guide 04, g01–g30). Paired ask re-baseline at n=30 shows flat `ce_vs_rrf_ask_delta_hits=0` — CE remains **candidate**, not frozen. Deferred themes (second vehicle, wiring) are in [`evals/PATH_TO_30.md`](evals/PATH_TO_30.md). Do not treat flat delta as lift or equate golden count with portfolio v1 Done.

## 8. Does packaging mean portfolio v1 / public flip / freeze?

No. Root `GETTING_STARTED` + `INTERVIEW` are the stranger-clone + FAQ shell around an already-shippable vertical slice. S2000 fixture ≥30 goldens **are** done (Guide 04 — see §7); that still does **not** mean:

- portfolio v1 checklist complete
- public flip ready
- embed/CE frozen
- second-vehicle / wiring eval themes complete

See VISION §9 for honest checkbox status. Public-flip packaging checklist (≠ flip): [`docs/PUBLIC_FLIP_CHECKLIST.md`](docs/PUBLIC_FLIP_CHECKLIST.md).

## 9. What does g10 teach about citation∩gold vs `insufficient_evidence`?

Golden `g10-hard-miss-abs-module` expects a hard miss. Ablation scores **citation∩gold**: both Guide 02 arms correctly show `citation_gold_hit=false`. Live outcome was still `answered` on both arms — a soft grounding residual, not proof that hard-miss reliably returns `insufficient_evidence`. Do not claim that outcome contract is solved; cite the miss metric honesty instead.

---

**Clone path:** [`GETTING_STARTED.md`](GETTING_STARTED.md) · **Skim:** [`README.md`](README.md)
