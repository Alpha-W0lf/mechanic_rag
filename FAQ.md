# Mechanic RAG — Technical FAQ

Short answers to common technical questions. Contract details live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); the reranker decision and eval history in [`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md).

---

## 1. Why hybrid → RRF → section dedup → local CE?

The ranking order is locked: vehicle-filtered vector + lexical (independent) → **RRF** fuse → optional **section dedup** → local **cross-encoder** (top N → top K) → context + citations. Hybrid gives complementary recall; RRF fuses ranks without pretending scores are comparable similarities; section dedup diversifies same-section near-dupes before CE; CE reranks query–chunk pairs locally. Do not invent parallel scorers or advertise “MMR” until true embedding-similarity MMR exists with evals. See ARCHITECTURE §7.

## 2. Why section dedup before CE, not after?

Binding order is **RRF → optional section dedup → CE**. Dedup operates on fused IDs so CE scores a diversified shortlist. Running a second competing dedup after CE is out of v1 unless a later eval decision says otherwise. Live `section_dedup` is binary same-section diversification — **not** true MMR.

## 3. How is `rerank_degraded` different from `ablation_rrf_only` / `MECHANIC_FORCE_RRF_ONLY`?

| Signal | Meaning |
|--------|---------|
| `rerank_degraded=true` | CE failed/timed out/returned empty — ask **fails open** to post-RRF (+ dedup) order. Production safety. |
| `ablation_rrf_only=true` / `MECHANIC_FORCE_RRF_ONLY=1` | **Intentional** RRF-only arm for paired ablation evals. Not a failure. |
| `ce_skip_reason=hosted_ce_disabled` (hosted Gemini / `GEMINI_API_KEY` set) | **Intentional** hosted skip: Ask never imports `@xenova/transformers`. Not ablation and not a CE failure (`rerank_degraded` stays false). |

Do not conflate degrade with ablation, or either with the hosted CE skip. Degrade rate and ablation diagnostics are separate fields. See ARCHITECTURE §7.5 and [`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md).

## 4. Why fixtures only in git — what about the hosted demo?

Public git repository boundary is **`fixtures/` only** (synthetic). Raw OEM PDFs live outside this repo, so public git stays legally clean, lightweight and easy to clone.

**Hosted demo vs public clone:**
- **Git clone:** uses synthetic `fixtures/` with public fail-closed validation (`scripts/checks/public_fail_closed.py`).
- **Hosted production demo (`https://mechanic-rag.vercel.app`):** serves cited answers from the complete Honda S2000 service manual, owner's manual and wiring diagrams (`cat:2003-honda-s2000`, 3,760 retrieval chunks), indexed in the hosted Supabase database. The hosted demo demonstrates full-scale OEM manual retrieval, while the repository clone remains clean and reproducible on synthetic fixtures. See ARCHITECTURE §5.3.

## 5. Does the cross-encoder reranker help?

Measured results, including misses and nulls: [README eval results](README.md#eval-results).

The reranker (`Xenova/ms-marco-MiniLM-L-6-v2`) added about 1 point of MRR on the fixture set and adds latency to every question, so the hosted demo runs fusion only and the local stack keeps the reranker. The hosted demo embeds queries with `gemini-embedding-001` @ 768 because serverless hosts can't run Ollama; the local stack uses `nomic-embed-text` @ 768, pinned so eval runs stay comparable. Evidence: [`evals/evidence/2026-09-24_rrf_vs_ce_paired.md`](evals/evidence/2026-09-24_rrf_vs_ce_paired.md). Full history: [`evals/RERANKER_DECISION.md`](evals/RERANKER_DECISION.md).

## 6. Where do citations come from, and how does `vehicle_id` filter?

Every ask requires a canonical **`vehicle_id`** — no all-vehicle fallback, no VIN lookup. Vector and lexical retrieve only chunks for that vehicle (optional `doc_family` later). Citation labels (`[1]`, `[2]`, …) are server-assigned from DB rows after ranking; the generator may reference only those labels; grouped markers such as `[1, 3]` are split into single labels, and unknown labels are rejected. Citation metadata is never model-invented paths. See ARCHITECTURE §7.1 / §7.6 / §8.

## 7. How does the eval score a question the fixture can't answer?

Golden `g10-hard-miss-abs-module` expects a hard miss. Ablation scores **citation∩gold**: both ablation arms correctly show `citation_gold_hit=false`.

## 8. Multimodal (M1–M3): what is public?

The public clone and the hosted demo are text RAG (M0). Three multimodal stages exist in the code behind local env flags and are parked:

| Stage | What it adds | Public clone / hosted demo |
|-------|--------------|----------------------------|
| **M0** | Text RAG | **Yes** |
| **M1** | Linked page/figure assets via `GET /api/assets` | Off |
| **M2** | Image/caption retrieval channel (CLIP optional) | Off |
| **M3** | Optional VLM assist (`MECHANIC_VLM`) | Off by default; text stays the source of torque and spec values |

The public demo never needs the VLM or image channel to run. Private corpora load from outside this repo; public git stays fixtures-only. See VISION §5.

## 9. Can I evaluate Mechanic RAG without downloading multi-GB models?

**Yes.**
- **Hosted path (≤60 seconds):** The live deployment at [mechanic-rag.vercel.app](https://mechanic-rag.vercel.app) runs the complete hybrid retrieval + RRF + section dedup pipeline using free-tier serverless Gemini generation and embeddings. No local software or model downloads required.
- **Local Dev Container / clone:** In `.devcontainer/` or local clone, you can set `GEMINI_API_KEY` in `web/.env.local` to use hosted Gemini generation, or verify the lexical retrieval and extractive degrade path without running local Ollama or pulling multi-GB models. Multi-GB local models (`gemma4:e2b`, `nomic-embed-text`) are only needed if you wish to run fully offline local LLM generation.

## 10. What happens with a vague ask like "how big is the engine?"

Vague size questions are a classic hybrid-retrieval trap: "big" is closer, in both embedding space and keywords, to *overall length / width* rows than to the *displacement* row. In the S2000 service manual both sit in the same Design Specifications table.

Mechanic handles this with **soft, retrieval-only query expansion**: a deterministic rule recognizes an engine-size ask and adds `displacement` / `bore` / `stroke` to the embedding text and to a separate OR full-text rank list that is fused by RRF. The question you typed is what the model answers, unchanged. Specific asks ("engine displacement of the F20C"), fluid-capacity asks ("engine oil capacity") and unrelated asks (brakes) don't trigger it. `diagnostics.query_expansion` shows when it fired.

What it doesn't change: generation on the free Gemini tier can still time out. When that happens, Ask returns short citations to the manual pages instead of an invented answer (HTTP 200, `outcome: "degraded"`). Expansion improves *which* pages are cited. It doesn't make the free generator always available.

---

**Clone path:** [`GETTING_STARTED.md`](GETTING_STARTED.md) · **Skim:** [`README.md`](README.md)
