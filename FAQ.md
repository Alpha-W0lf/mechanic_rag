# Mechanic RAG — Technical FAQ

Staff-facing Q&A for the **hybrid → RRF → section dedup → local CE** vertical slice. Contracts SSOT: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Product / why: [`docs/VISION.md`](docs/VISION.md). Freeze honesty: [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md). Path to ≥30 goldens: [`evals/PATH_TO_30.md`](evals/PATH_TO_30.md).

Packaging around a shippable fixtures clone path + honest paired-ask ablation evidence (current n=44, delta **0**) — embed/CE are **frozen** (not an earned CE-lift claim) — fixtures-only public packaging — **GitHub visibility public** — **not** OSI open source. Private-garage goldens are **not** in the public tip/history. **License:** PolyForm Noncommercial 1.0.0 — source-available / non-commercial (not OSI open source; not MIT).

---

## 1. Why hybrid → RRF → section dedup → local CE?

**MR2** locks the ranking order: vehicle-filtered vector + lexical (independent) → **RRF** fuse → optional **section dedup** → local **cross-encoder** (top N → top K) → context + citations. Hybrid gives complementary recall; RRF fuses ranks without pretending scores are comparable similarities; section dedup diversifies same-section near-dupes before CE; CE reranks query–chunk pairs locally. Do not invent parallel scorers or advertise “MMR” until true embedding-similarity MMR exists with evals. See ARCHITECTURE §7.

## 2. Why section dedup before CE, not after?

Binding order is **RRF → optional section dedup → CE**. Dedup operates on fused IDs so CE scores a diversified shortlist. Running a second competing dedup after CE is out of v1 unless a later eval decision says otherwise. Live `section_dedup` is binary same-section diversification — **not** true MMR.

## 3. How is `rerank_degraded` different from `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY`?

| Signal | Meaning |
|--------|---------|
| `rerank_degraded=true` | CE failed/timed out/returned empty — ask **fails open** to post-RRF (+ dedup) order. Production safety. |
| `ablation_rrf_only=true` / `MECHANIC_FORCE_RRF_ONLY=1` | **Intentional** RRF-only arm for paired ablation evals. Not a failure. |

Do not conflate degrade with ablation. Degrade rate and ablation diagnostics are separate fields; freeze checklists treat them differently. See ARCHITECTURE §7.5 and [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md).

## 4. Why fixtures only — why never Drive / Ford / OEM PDFs here?

Public corpus boundary is **`fixtures/` only** (synthetic). Drive sync, Ford/PTS bulk, and OEM PDFs live outside this repo so public git stays legally clean and stranger-cloneable. PrivateGold / Drive / Ford are deferred adapters — packaging must not claim they are in-product here. See ARCHITECTURE §5.

## 5. Are embed/CE frozen? What does paired ask delta `0` mean?

Embedding (`nomic-embed-text` @ 768) and CE (`Xenova/ms-marco-MiniLM-L-6-v2`) are **frozen by Tom override** (Guide 09 Path B) — **not** because CE proved lift. Guide 08 paired ask ablation (n=44, T1 synthetic confusable sections + g39–g44, generator `gemma4:e2b`, citation∩gold) recorded `ce_vs_rrf_ask_delta_hits=0`, **CE-helps=0**, **CE-hurts=0** — still flat after a harder discriminative attempt. That honesty survives the freeze.

**Guide 05 keep-with-justification (historical):** We **kept** CE in the ranking stack while status was candidate. Guide 09 **supersedes status** → frozen by override; CE **stays in the stack**. See [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md). **Do not** claim CE improved citation hits on the n=30 / n=38 / n=44 runs.

**Guide 06 → Guide 09 → Guide 10b:** Freeze was parked after flat Guide 07–08 evidence; Guide 09 Path B **unparked** via explicit Tom override. Keep ≠ freeze ≠ LICENSE ≠ public flip. Guide 09 freeze **≠** earned CE lift. Guide 10b fixtures-only flip **≠** earned CE lift / OSI open source.

**Forbidden as lift / freeze evidence:** historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` (answer-substring era; no `_ask_` in the field name); “earned freeze from ablation.” If that short proxy name appears, label it **historical proxy / non-evidence** only.

## 6. Where do citations come from, and how does `vehicle_id` filter?

Every ask requires a canonical **`vehicle_id`** — no all-vehicle fallback, no VIN lookup. Vector and lexical retrieve only chunks for that vehicle (optional `doc_family` later). Citation labels (`[1]`, `[2]`, …) are server-assigned from DB rows after ranking; the generator may reference only those labels; unknown labels are rejected. Citation metadata is never model-invented paths. See ARCHITECTURE §7.1 / §7.6 / §8.

## 7. Is the eval suite “complete”? Where is path to ≥30?

**Fixtures-only packaging / “v1 Done” marketing is Met.** Guide 08 paired ask (n=44) is flat (`ce_vs_rrf_ask_delta_hits=0`, helps=0 / hurts=0). Embed/CE are **frozen by override** despite that flat delta — **not** an earned CE-lift claim. Deferred themes (second vehicle, wiring): [`evals/PATH_TO_30.md`](evals/PATH_TO_30.md). Public flip still ≠ private gold / Drive / OSI open source.

## 8. Does packaging mean portfolio v1 / public flip / freeze?

**Fixtures-only packaging / “v1 Done” marketing is Met.** **GitHub visibility public** is a separate storefront gate. Root `GETTING_STARTED` + `FAQ` remain the stranger-clone + Technical FAQ shell. That still does **not** mean:

- earned CE lift from ablation (freeze is an override; n=44 delta **0**)
- OSI open source / MIT licensing (repo is **source-available / non-commercial** — see [`LICENSE`](LICENSE))
- second-vehicle / wiring eval themes complete
- private gold / Drive / OEM corpus in this public repo

See VISION §9.

## 9. What does g10 teach about citation∩gold vs `insufficient_evidence`?

Golden `g10-hard-miss-abs-module` expects a hard miss. Ablation scores **citation∩gold**: both Guide 02 arms correctly show `citation_gold_hit=false`. Live outcome was still `answered` on both arms — a soft grounding residual, not proof that hard-miss reliably returns `insufficient_evidence`. Do not claim that outcome contract is solved; cite the miss metric honesty instead.

## 10. Multimodal M1–M3 — what is Met and what is public?

**M1–M3 are Met** on the personal garage (`cat:*` vehicles) under **local env flags** — not on the public stranger clone path.

| Stage | Met where | Public stranger path |
|-------|-----------|----------------------|
| **M0** | Text RAG (fixtures + garage) | **Yes** — `fixtures/` only |
| **M1** | Linked page/figure assets via `GET /api/assets` | Optional locally; not required for clone |
| **M2** | Image/caption retrieval channel (CLIP optional) | Flags default off; not in public demo |
| **M3** | Optional VLM assist (`MECHANIC_VLM`) | **Default off**; text owns torque/spec truth |

**Binding honesty:**

1. **Flags default off** — `MECHANIC_VLM`, image channel, and multimodal retrieve paths are opt-in env; strangers run **M0 text RAG** only.  
2. **Text owns torque/spec** — M3 VLM may assist diagram questions locally; it is never the default source of spec truth.  
3. **Friend Drive library ≠ Mechanic ingest** — dual-product / Drive→Mechanic is **OUT**; public git stays fixtures-only.  
4. **Do not** imply the public demo requires VLM or image channel to run. See VISION §5 and M1–M3 dev guides.

## 11. Why keep CE if paired-ask delta is 0?

Freeze = **Tom override Guide 09**, **not** earned lift from ablation.

**Evidence (Guide 08, n=44):** `ce_vs_rrf_ask_delta_hits=0`, CE-helps=0, CE-hurts=0 (`evals/last_run_summary.json`). Models are frozen because Tom explicitly locked them despite flat delta — **not** because CE proved citation lift.

**Why CE stays in the stack anyway:**

1. **Architecture completeness** — hybrid → RRF → section dedup → local CE N→K is the designed ranking path (MR2).  
2. **Production degrade path** — when CE fails/times out, `rerank_degraded=true` fails open to post-RRF order (see §3). That is distinct from intentional `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY=1`.  
3. **Demo + measurement** — local rerank, latency, and degrade behavior are portfolio-relevant even without citation∩gold asymmetry.

**Forbidden:** “CE improves citations” on n=30/38/44; historical proxy `ce_vs_rrf_delta_hits=+1` / `n=5` as lift or freeze evidence. Full freeze honesty: [`evals/MODEL_FREEZE_STATUS.md`](evals/MODEL_FREEZE_STATUS.md).

---

**Clone path:** [`GETTING_STARTED.md`](GETTING_STARTED.md) · **Skim:** [`README.md`](README.md)
