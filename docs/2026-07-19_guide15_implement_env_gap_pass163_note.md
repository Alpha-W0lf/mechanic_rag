# Guide 15 Implement — Soft Adjust ask env gap (pass 163)

**Date:** 2026-07-19  
**Repo:** `mechanic_rag`  
**Guide:** `docs/dev_guides/2026-07-19_dev_guide_15_soft_adjust_private_gold_ask_eval.md`  
**Locks:** A / Q1 / E1  

## HTTP ask smoke

| Check | Result |
|-------|--------|
| `localhost:3000/api/health` | **Down** this Implement (curl connect fail) |
| Soft Adjust private-gold ingest + live `POST /api/ask` | **Not run** (env gap) |

## Hybrid Met (still Met)

| Attestation | Evidence |
|-------------|----------|
| Soft Adjust ask unit (vitest) | `web/src/server/__tests__/ask_soft_adjust_private_gold.test.ts` — unknown Soft Adjust → 404; Soft Adjust-scoped retrieval; Soft Adjust citations ≠ fixture S2000; empty retrieval → `insufficient_evidence` |
| Soft Adjust pack → Met vehicle (pytest) | `tests/test_soft_adjust_ask_plane.py` — Guide 13 staging loads `cat:demo-synthetic-f150` |
| Soft Adjust regression | Guide 13–14 Soft Adjust pytest green |
| Honesty docs | ARCHITECTURE / GETTING_STARTED Soft Adjust ask smoke Met ≠ Done |

## Operator HTTP smoke (when stack up)

```bash
# stage Guide 13 Soft Adjust pack → $GOLD_SYNTH
export MECHANIC_PRIVATE_GOLD_ROOT="$GOLD_SYNTH"
mecharag ingest --source private-gold
curl -s -X POST localhost:3000/api/ask \
  -H 'content-type: application/json' \
  -d '{"vehicle_id":"cat:demo-synthetic-f150","question":"Drain oil with vehicle level — what is the oil capacity procedure?"}'
```

**Honesty:** Soft Adjust ask Met ≠ dual-product Done ≠ friend Soft Adjust Review Met ≠ live F-150 upsert Met.
