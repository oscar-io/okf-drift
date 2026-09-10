---
# OKF v0.2
type: "Feature Idea"
title: "The git oracle"
description: "compare a document against the code it cites, using history that already exists"
tags: [backlog, feature-idea, drift, git]
status: "draft"
implementation: "partial"
generated: { by: claude-opus-5, at: 2026-09-10T22:25:00Z }
sources:
  - id: stub
    resource: /src/drift.ts
    title: "The stub, its planned steps and what it refuses to guess"
    last_modified: 2026-09-10T22:10:06Z
---

# The git oracle

`DRIFT-0002`

The reason the tool is called `okf-drift` and not `okf-index`. `src/drift.ts` exists,
documents the plan, and throws.

A document is rarely wrong because it is malformed. It is wrong because the thing it
describes moved. Git already knows when that happened, so detecting it needs no extra
bookkeeping — which is the whole argument for keeping knowledge in the repository rather
than in a wiki.

## Checks

| Condition | Finding |
|---|---|
| `sources[].resource` changed since `last_modified` | `stale` |
| `sources[].resource` changed since the newest `verified.at` | `stale` |
| `sources[].resource` no longer exists | `gone` |
| `stale_after` is in the past | `expired` |

The reference point is the later of `last_modified` and `verified.at`: a document
reviewed after the code changed is not stale.

## What it must not do

Guess which files a document is about when it declares no `sources`. A wrong guess is
worse than no answer, because a check nobody trusts gets switched off — and switched-off
checks are how the first version of this tool would have failed.

That restraint has a cost worth stating: a document with no `sources` is invisible to
drift detection entirely. Whether that is acceptable, or whether an `undeclared-sources`
finding should nag about it, is open.

## Notes

Shell out with `execFileSync`. The surface needed is `rev-parse`, `ls-files` and `log`,
which is not worth a dependency. Report cleanly when the bundle is not in a repository
at all, rather than throwing.
