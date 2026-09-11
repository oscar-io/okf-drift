---
# OKF v0.2
type: "Feature Idea"
title: "The git oracle"
description: "compare a document against the code it cites, using history that already exists"
tags: [ backlog, feature-idea, drift, git ]
status: "stable"
implementation: "done"
generated: { by: pi/opus-5, at: 2026-09-10T22:25:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T01:52:00Z }
sources:
  - id: stub
    resource: /src/drift.ts
    title: "The stub, its planned steps and what it refuses to guess"
    last_modified: 2026-09-10T22:10:06Z
---

# The git oracle

`DRIFT-0002`

The reason the tool is called `okf-drift` and not `okf-index`. Implemented in
`src/drift.ts`, on top of `src/git.ts`.

A document is rarely wrong because it is malformed. It is wrong because the thing it
describes moved. Git already knows when that happened, so detecting it needs no extra
bookkeeping — which is the whole argument for keeping knowledge in the repository rather
than in a wiki.

## Checks

| Condition                                                   | Finding   |
|-------------------------------------------------------------|-----------|
| `sources[].resource` changed since `last_modified`          | `stale`   |
| `sources[].resource` changed since the newest `verified.at` | `stale`   |
| `sources[].resource` no longer exists                       | `gone`    |
| `stale_after` is in the past                                | `expired` |

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

Shelled out with `execFileSync`: the surface needed is `rev-parse`, `ls-files` and `log`,
which is not worth a dependency. What happens when git cannot answer became its own
decision, [`drift-oracles.md`](../../design/drift-oracles.md), because a checker that
silently verifies nothing is worse than one that fails.

One thing git cannot do: `--since` is second-granular and inclusive, so "after this exact
moment" is compared in JS instead.
