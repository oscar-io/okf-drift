---
# OKF v0.2
type: "Plan"
title: "Implementing the git oracle"
description: "the working plan for DRIFT-0002, in the order the pieces should land"
tags: [plan, drift, git, disposable]
status: "draft"
stale_after: 2026-10-11T00:00:00Z
generated: { by: claude-opus-5, at: 2026-09-11T00:25:00Z }
sources:
  - id: ticket
    resource: /docs/product/tickets/DRIFT-0002.md
    title: "The ticket this plan implements, which holds the reasoning"
  - id: stub
    resource: /src/drift.ts
    title: "The stub being replaced"
    last_modified: 2026-09-11T00:00:43Z
---

# Implementing the git oracle

**Disposable.** Delete this file when `DRIFT-0002` is done; anything worth keeping moves
into a decision record first. The *why* lives in the ticket, not here — this is only the
order of work.

## What it is

A document declares `sources[].resource: /src/index-cmd.ts` with a `last_modified`. Git
knows when that file actually changed. If git says later, the document describes code
that has moved, and nobody had to remember anything for the tool to find out.

## Steps

### 1. A git module, `src/git.ts`

Four functions, each shelling out with `execFileSync`. No dependency: the surface is
three subcommands.

```
repoRoot(dir)            git -C <dir> rev-parse --show-toplevel   -> string | null
lastChanged(root, path)  git -C <root> log -1 --format=%cI -- <path> -> Date | null
commitsSince(root, path, since)  git log --oneline --since=... | count -> number
isTracked(root, path)    git -C <root> ls-files --error-unmatch -- <path> -> boolean
```

`repoRoot` returning `null` is not an error: a bundle in a tarball is a legitimate thing
to check, it simply has no history, and the command should say so once and exit cleanly.

### 2. Resolve a `resource` to a real path

Reuse `resolveTarget` from `index-cmd.ts`, or lift it into a shared module — it already
handles a leading `/` as bundle-root-relative, which is the form the guide recommends.

Note the subtlety: `sources[].resource` is rooted at the *repository*, not the bundle, in
every document here (`/src/index-cmd.ts`, not `/docs/...`). Decide and write it down —
this is the one thing in the plan that deserves a decision record rather than a comment.

A URL is skipped, not reported. A path outside the repository is skipped.

### 3. The four checks

| Condition | Finding | Severity |
|---|---|---|
| changed since `last_modified` | `stale-source` | stale |
| changed since the newest `verified.at` | `unverified-since-change` | stale |
| resource does not exist | `missing-source` | gone |
| `stale_after` in the past | `expired` | expired |

The reference point is the **later** of `last_modified` and the newest `verified.at`: a
document reviewed after the code changed is not stale, and reporting it as such is the
kind of noise that gets a check switched off.

### 4. Report concretely

A finding must carry the evidence, or nobody acts on it:

```
STALE      design/index-command.md
           /src/index-cmd.ts changed 2026-09-11, 4 commits after last_modified
           last reviewed 2026-09-10 by human:oscar-io
```

### 5. Wire up

`checkDrift` replaces the stub; `cli.ts` already routes the default command to it. Exit 1
on findings. Add `pnpm docs:drift` and a CI step.

## Testing

A real git repository in a temp directory, built by the test: `git init`, write a file,
commit, write a document citing it with an older `last_modified`, assert one `stale-source`.
Injecting a fake git would test the mock, not the tool.

`DriftOptions.now` already exists for clock injection, so `expired` needs no real clock.

## Out of scope

Guessing sources for a document that declares none — a wrong guess is worse than no
answer. `DRIFT-0002` records the cost: such a document is invisible to drift detection,
and whether to nag about that is left open.
