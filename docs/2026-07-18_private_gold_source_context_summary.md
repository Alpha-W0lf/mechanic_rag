# Context: PrivateGoldSource — ingest library RAG Gold into Mechanic

**Date:** 2026-07-18  
**Repos:** `mechanic_rag` (+ read `second_brain` Contract 7.2 / Guide 10 / Soft Adjust live RAG)  
**Status:** Draft (Gather — pass 163 spoke)  
**Mode last used:** spoke  
**Handoff:** `second_brain/docs/2026-07-18_spoke_mechanic_gather_private_gold_source_pass163_handoff.md`  
**Hub:** `second_brain/docs/2026-07-18_prioritize_hub_pass163.md` (build residual toward dual-product Done; live RAG Review **parked**)  
**Lens:** AI engineer (RAG ingest adapters) + data engineering (Gold → index)

### Declare

| Item | Value |
|------|-------|
| Mode | spoke |
| Stage | **Gather context only** |
| Will write | This context summary; handoff Results |
| Will not | Write guide body · Implement · public-flip changes · Drive ingest · live Soft Adjust Review |

**Live honesty (pass 163):** Guide 10 **fixture** RAG Gold emit Met / closed. Soft Adjust **live** RAG emit Implement Met (`2017-f-150` present-only) but **Review parked** until friend Drive Gold quality Soft Adjusts / Tom pass-163 locks land. PrivateGoldSource Gather must therefore pin a **fixture-first** Met path and treat live Gold as a **gated** Soft Adjust after Review/Align.

---

## Problem

Mechanic’s dual-product consumer plane is incomplete: architecture names **`FixtureSource` \| `PrivateGoldSource`**, but only `FixtureSource` is implemented. Library Contract **7.2** RAG Gold emit (Guide 10 fixture) can produce validating manifests + text, yet Mechanic cannot ingest a configured **local Gold root** (GD2). Public fixtures-only flip (Guide 10b) is Met and must **not** be reopened as “PrivateGold Done.”

Without PrivateGoldSource, dual-product Done stays blocked on the **consumer** side even when library emit exists.

---

## Acceptance criteria

- [ ] Written path: thin Mechanic Guide for `PrivateGoldSource` + CLI `--source` private-gold (or equivalent) reading **local Gold root** outside git  
- [ ] Fixture-first Met: ingest Contract 7.2–valid synthetic / Guide-10-shaped Gold (`fixture:` or documented synthetic `cat:` pack) without OEM bytes in git  
- [ ] Live path readiness explicit: Soft Adjust live Gold ingest **blocked** until Soft Adjust Review/Align Met + hub unlock (pass 163 park)  
- [ ] Public fail-closed unchanged: `FixtureSource` / public flip honesty unchanged; no Drive as ingest (GD2)  
- [ ] Shared chunk → embed → upsert reused; no ranking/CE reopen; freeze override honesty retained  
- [ ] No invent; no public-flip checkbox / banner changes unless a thin non-claim note  

---

## In scope (this Gather)

- Map live code vs Contract 7.2 / Guide 10 emit  
- Propose lean Write shape for PrivateGoldSource  
- Document fixture-first vs live readiness gates  
- Context under `mechanic_rag/docs/`  
- Fill handoff Results  

## Out of scope

- Implement PrivateGoldSource / any ingest code this stage  
- Soft Adjust live RAG Review / Align (parked — vehicle spoke)  
- Drive Gold / rclone / friend publish redesign  
- Ranking, CE freeze reopen, LICENSE / public-flip marketing changes  
- Fleet ingest · invent/HD · F1 unpause  

---

## Prior art (paths only)

### Mechanic (consumer)

- `docs/ARCHITECTURE.md` §5.1–5.4 — GD2 local Gold; MR3 adapters; fail-closed public  
- `docs/VISION.md` — fixtures-only public flip Met; PrivateGold deferred honesty  
- `mecharag/fixture_source.py` — live adapter pattern  
- `mecharag/ingest_cmd.py` — **fixtures only** today (`unsupported --source` else)  
- `mecharag/chunking.py` / `db_upsert.py` / `embedder.py` — shared downstream  
- `contracts/normalized_document_manifest.schema.json`  
- `contracts/rag_gold_normalized_document_manifest_FIELDS.md`  
- `scripts/validate/validate_manifest.py` — `--profile public` \| `library`  
- `scripts/checks/public_fail_closed.py`  

### Library (emit)

- Contract **7.2** field table — `second_brain/docs/2026-07-12_vehicle_docs_library_architecture.md`  
- Guide 10 fixture emit Met — `docs/dev_guides/2026-07-18_dev_guide_10_vehicle_rag_gold_assembly.md`  
- Package — `docs/dev_guides/builders/vehicle_rag_gold_assembly/`  
- Program fixtures SSOT — `docs/dev_guides/fixtures/vehicle_rag_gold/`  
- Soft Adjust live emit Write/Implement Met — `docs/dev_guides/2026-07-18_dev_guide_10_soft_adjust_live_rag_gold_emit.md`  
- Park ack — `docs/2026-07-18_spoke_vehicle_park_live_rag_review_pass163_handoff.md`  
- Hub pass 163 — Drive Gold quality gates dominate; live RAG Review not authorized  

---

## Current truth map (honest)

| Layer | Status | Implication for PrivateGoldSource |
|-------|--------|-----------------------------------|
| Contract 7.2 schema + validators | **Met** | Consumer can validate before write |
| Guide 10 fixture assemble | **Met / closed** | Fixture-first Gold available as ingest input |
| Soft Adjust live assemble (`2017-f-150`) | **Implement Met; Review parked** | Live Gold on disk/gitignored out may exist — **do not** claim consumer Met on it yet |
| `FixtureSource` + `mecharag ingest --source fixtures` | **Live** | Pattern to mirror |
| `PrivateGoldSource` | **Unbuilt** | This work item |
| Public flip Guide 10b | **Met** | Leave alone; ≠ PrivateGold Done |
| Drive as Mechanic ingest | **Forbidden (GD2)** | Out forever for this adapter |

---

## Recommended approach

1. **Do not Implement in Gather.** Prefer Write-dev-guide next (lean Mechanic Guide — propose **Guide 11 PrivateGoldSource**).  
2. **Fixture-first Met (binding recommendation):** PrivateGoldSource Guide Met = ingest from a **local Gold root** populated by Guide 10–shaped Contract 7.2 artifacts (synthetic / `fixture:` or documented test `cat:` pack under gitignored / operator path). Prove discover → validate (`library` or private profile) → chunk → embed → upsert → ask smoke on one vehicle.  
3. **Live Soft Adjust path = out of Met** until Soft Adjust Review/Align + hub unlock; guide documents Soft Adjust follow-on pins (`private_oem`, `cat:`, present-only receipt honesty).  
4. **Adapter shape:** New `PrivateGoldSource` module mirroring `FixtureSource` interface; `ingest_cmd` adds `--source private-gold` (names TBD at Write) + `MECHANIC_PRIVATE_GOLD_ROOT` (or equivalent) — **never** default public clone to private root.  
5. **Reuse** `validate_manifest.py --profile library` (or private profile if Write pins one); do not fork Contract 7.2.  
6. **Honesty:** Fixture Met ≠ live OEM ingest Done ≠ dual-product Done ≠ public flip change.

**Proposed guide path:** `mechanic_rag/docs/dev_guides/2026-07-18_dev_guide_11_private_gold_source.md`

---

## Risks and blast radius

| Risk | Angle | Mitigation |
|------|-------|------------|
| Pointing public defaults at private Gold | Legal / CI | Separate adapter; env-required root; fail if unset; public fail-closed unchanged |
| Claiming live ingest while Soft Adjust Review parked | Honesty | Fixture-first Met; live Soft Adjust out of Met |
| Schema drift vs Guide 10 emit | Interop | Reuse validators; field inventory SSOT |
| Drive as “easy” Gold root | Architecture | GD2 hard forbid |
| Scope into ranking / freeze | Interview honesty | Docs + adapter only; freeze override retained |
| Partial multi-doc ingest crash | Data integrity | Keep per-doc isolation / prior version queryable (existing upsert pattern) |

**Blast radius (Implement later):** `mecharag/private_gold_source.py` (new), `ingest_cmd.py`, thin GETTING_STARTED / ARCHITECTURE MR3 honesty, tests under `tests/` — **not** ranking, not LICENSE, not §9 flip.

---

## Edge cases

| Case | Behavior |
|------|----------|
| `MECHANIC_PRIVATE_GOLD_ROOT` unset | Fail closed with clear stderr (no silent fixtures fallthrough) |
| Manifest fails library validate | Reject before DB write |
| `rights_class=private_oem` on FixtureSource | Still reject (public path unchanged) |
| Same on PrivateGoldSource | Allow (P1) after schema/hash OK |
| Hash mismatch vs artifact bytes | Reject |
| Live Gold present-only incomplete | Soft Adjust path only; receipt honesty; not fixture Met requirement |
| Soft Adjust Review still parked | Do not Implement live ingest Soft Adjust |
| Public flip banners | No change |

---

## Unknowns

| Unknown | How to resolve | Blocking Write? |
|---------|----------------|-----------------|
| Exact CLI flag / env name | Soft-pin at Write (`private-gold` + `MECHANIC_PRIVATE_GOLD_ROOT`) | Soft |
| First Met Gold pack layout (Guide 10 out vs mirrored fixtures) | Soft-pin: copy/assemble Guide 10 complete fixture into gitignored gold root for tests | Soft |
| Whether synthetic `cat:` pack required for Met vs `fixture:` under private root | Prefer Met on validating Contract 7.2 tree; `cat:` + `private_oem` Soft Adjust after live Review | Soft |
| Soft Adjust Review ETA | Hub / Tom pass-163 Drive quality locks | Blocks **live** Soft Adjust only |

---

## Open decisions (human)

### Decision 1: Start PrivateGoldSource Write now (fixture-first) vs wait for live Soft Adjust Review

- **Plain title:** Should Mechanic Write the PrivateGoldSource guide now using fixture-first Gold, or wait until live RAG Soft Adjust Review/Align is unparked?
- **In plain terms:** Library can already emit Contract 7.2 fixture Gold. Live OEM emit exists but Review is parked for friend Drive quality. Waiting couples consumer work to Drive Soft Adjusts.
- **Options:** (A) Write now — fixture-first Met · (B) Park PrivateGoldSource until Soft Adjust Review Met · (C) Write now but Met requires live `2017-f-150` Gold  
- **Recommendation:** **(A)** Write now, fixture-first Met; live Soft Adjust out of Met.  
- **Reasoning:** Unblocks dual-product **consumer** plane on proven schemas; respects pass-163 park without inventing live readiness. Matches Guide 10 hub lock (“PrivateGoldSource separate after fixture Met”).  
- **Tradeoffs:** A delivers adapter sooner but not live OEM demo yet. B delays both. C blocks on parked Review and friend quality.  
- **Needs from you:** Lock A (recommended), B, or C.

### Decision 2: First Met identity namespace

- **Plain title:** For PrivateGoldSource fixture-first Met, which `vehicle_id` / rights profile is required?
- **In plain terms:** Public fixtures use `fixture:` + `synthetic_fixture`. Private live uses `cat:` + `private_oem`.
- **Options:** (N1) Met on `fixture:` Contract 7.2 tree under private root (prove adapter path) · (N2) Met requires synthetic `cat:` + `private_oem` pack · (N3) Met requires live Soft Adjust out  
- **Recommendation:** **(N1)** for Guide Met; document N2 as Soft Adjust / follow-on when live Review unparks.  
- **Reasoning:** Smallest correct proof of GD2 ingest without OEM in git; N2/N3 can reuse same adapter.  
- **Tradeoffs:** N1 weaker demo of private rights; N2 stronger private shape; N3 blocked.  
- **Needs from you:** Lock N1 (recommended), N2, or N3 (or default N1 if silent).

---

## Evidence opened this pass

- Handoff pass 163; hub pass 163; park live RAG Review handoff  
- `ARCHITECTURE.md` §5; `VISION.md` status  
- `mecharag/fixture_source.py`; `ingest_cmd.py` (fixtures-only gate)  
- Contract 7.2 field inventory + `validate_manifest.py` profiles  
- Guide 10 fixture Met guide; Soft Adjust live emit status (Implement Met / Review parked)  
- Program `vehicle_rag_gold` fixtures README  

---

## Honest readiness

- **Gather DoD:** Met — context written; decisions with recommendation + tradeoffs; **no** Implement; **no** public-flip invent.  
- **Ready for Write dev guide?** **Yes** — lean Guide 11 PrivateGoldSource (fixture-first), pending Decision 1 = A (or Tom override).  
- **Not ready** for Implement until Write + Ready-check.  
- **Not ready** for live OEM PrivateGold Soft Adjust until Soft Adjust Review/Align + hub unlock.  
- **Public flip:** unchanged Met; ≠ PrivateGold Done.
