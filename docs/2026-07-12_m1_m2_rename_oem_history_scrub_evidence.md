# Evidence — M1 rename + M2 OEM git-history scrub

**Date:** 2026-07-12
**Repo:** `mechanic_rag` (renamed from `mechainic_rag`)
**Related:** `second_brain/docs/2026-07-12_mechanic_rename_history_scrub_handoff.md`, `second_brain/docs/2026-07-12_portfolio_critical_review_staff_critique.md` (finding C0.1)

## Summary

Before making the (still-private) Mechanic RAG repo public-portfolio-ready, we removed all OEM Honda PDF blobs from git history and renamed the repo/directory from the `mechainic_rag` typo to `mechanic_rag`. Both changes were locked decisions (M1, M2) from the portfolio critique. This note is the receipt: exact commands run, verification results, and final state.

## 1. Backup before rewrite

Taken before any history rewrite, from the pre-scrub working tree:

- Bundle: `/Users/tom/Documents/Git/backups/mechainic_rag-pre-oem-scrub-2026-07-12.bundle` (~60 MB, full history incl. OEM PDFs)
- OEM PDF working copies (Honda S2000 fixtures used as the public/synthetic domain exemplar's real-world source): `/Users/tom/Documents/Git/backups/mechainic_rag-oem-pdfs-working-copy-2026-07-12/`
  - `Honda_S2000_Service Manual_2000_2008.pdf` (~49 MB)
  - `Honda_S2000_Wiring Diagram_2008.pdf` (~11 MB)
  - `Honda_s2000_owners_manual_2001.pdf` (~4 MB)

Pre-scrub `HEAD`: `40d4bd28f6607d1e3d2f76e90d631914559a6bc6`

## 2. History scrub

Command run (from repo root, on a local clone of the pre-scrub history):

```bash
git filter-repo --force --invert-paths --path-glob '*.pdf'
```

This rewrites every commit, dropping any blob ever added at a path matching `*.pdf`, and recomputes all downstream commit hashes — so all SHAs after the earliest touched commit change.

Post-scrub `HEAD` (immediately after filter-repo, before further doc commits): `8b9e9f9313697d1e3d2f76e90d631914559a6bc6`

## 3. Verification (post-scrub, pre-push)

No PDF paths anywhere in history:

```bash
git log --all --diff-filter=A --name-only --pretty=format: | grep -i '\.pdf$'
```

Result: 0 matches.

No blobs over 1 MB anywhere in history (confirms the large OEM PDFs are gone, not just their paths):

```bash
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '$1=="blob" && $3+0 > 1000000'
```

Result: 0 matches (344 total objects remaining in the repo).

## 4. GitHub rename

```bash
gh repo rename mechanic_rag --repo Alpha-W0lf/mechainic_rag
```

- `Alpha-W0lf/mechainic_rag` → `Alpha-W0lf/mechanic_rag`
- Repo remained **private** throughout; GitHub preserves an old-URL redirect, but the local `origin` remote was updated explicitly (see below) rather than relying on the redirect.

## 5. Local rename + remote update

```bash
mv /Users/tom/Documents/Git/mechainic_rag /Users/tom/Documents/Git/mechanic_rag
cd /Users/tom/Documents/Git/mechanic_rag
git remote set-url origin https://github.com/Alpha-W0lf/mechanic_rag.git
```

Old directory `mechainic_rag` no longer exists at `/Users/tom/Documents/Git/`; confirmed only `mechanic_rag` is present.

## 6. Force-push of rewritten history

Rewritten history was pushed to the (private, owner-only, zero-fork) remote:

```bash
git push --force-with-lease origin main
```

This was authorized under the locked M1/M2 decisions specifically because the repo was verified private with zero forks and a single collaborator (owner) before the push — see step 8 below.

## 7. Reference updates (this session)

Applied across repos so nothing points at the old name/path:

- `second_brain/second_brain.code-workspace` — folder entry renamed `mechainic_rag` → `mechanic_rag` (path + label)
- `second_brain/docs/2026-07-12_vehicle_docs_library_and_mechanic_rag_program.md` — path reference updated
- `second_brain/docs/2026-07-12_ai_eng_public_portfolio_strategy_and_runnability.md` — path references updated
- `second_brain/docs/2026-07-12_portfolio_vision_workspace_and_decisions.md` — M1/M2 marked done
- `fetch-ford-service-manuals/docs/2026-07-12_vehicle_library_program_pointer.md` — consumer line updated to `mechanic_rag`
- `mechanic_rag/docs/VISION.md` — `Repo:` field, public/private boundary paragraph
- `mechanic_rag/docs/dev_setup.md` — `cd mechainic_rag` → `cd mechanic_rag`

## 8. Final verification (this session, before/after doc commit)

Re-ran the same checks above against the current `main` (`HEAD` at doc-commit time) with identical results: 0 PDF paths in history, 0 blobs over 1 MB, 344 total objects.

GitHub state confirmed via `gh`:

```json
{"forkCount":0,"isPrivate":true,"name":"mechanic_rag","owner":{"login":"Alpha-W0lf"},"visibility":"PRIVATE"}
```

Collaborators: exactly one — `Alpha-W0lf` (owner, admin role). No unexpected collaborators or forks.

`origin/main` and local `main` were confirmed identical (`git rev-list --left-right --count origin/main...main` → `0  0`) before this session's doc commits were pushed, i.e. the rewritten history had already landed on the remote.

## Status

- [x] Backup bundle + PDF working copies preserved outside git
- [x] History scrubbed (`git filter-repo`), verified clean
- [x] GitHub repo renamed, still private, 0 forks, 1 collaborator (owner)
- [x] Local directory renamed, `origin` updated
- [x] Cross-repo references updated (second_brain, Ford pointer, Mechanic docs)
- [x] Rewritten history force-pushed to `origin/main`
- [ ] Public flip — explicitly **not** done here; separate future decision
- [ ] `mecharag` Python package name change — explicitly **not** done; kept per locked decision
