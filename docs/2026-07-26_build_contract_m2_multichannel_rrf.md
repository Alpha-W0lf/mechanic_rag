# Build contract — M2 multi-channel RRF (planning freeze)

**Date:** 2026-07-26  
**Mode:** waterfall · Build  
**Status:** Product `rrf.ts` extended under Build Go — `reciprocalRankFusionMany`

## Today (M0/M1)

`web/src/lib/retrieval/rrf.ts` — `reciprocalRankFusion(vector, lexical, k=60, topN=50)` over **two** lists.

## Build MR-2 must

1. Add pure helper (prefer extend, not fork) e.g. `reciprocalRankFusionMany(lists: RetrieverHit[][], k=60, topN=50)` **or** overload that accepts optional `image` list.  
2. Default **`k=60`** unchanged.  
3. Equal channel contribution (each list adds `1/(k+rank)`).  
4. Tag diagnostics with `retrieve_channel` per contributing list; fused rows may use `fusion`.  
5. Empty image list → behavior identical to today’s two-list RRF (degrade).  
6. Unit tests: ID-only fusion; image-only IDs still require Option A paired text at citation time (not inside RRF).

**Not in M2:** multimodal CE; changing text embed dim 768.
