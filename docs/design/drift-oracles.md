---
# OKF v0.2
type: "Design Decision"
title: "What the tool does when it cannot check"
description: "why an unverifiable source is announced rather than passed or failed, and why git is one oracle rather than the oracle"
tags: [decision, drift, git, safety]
status: "stable"
generated: { by: claude-opus-5, at: 2026-09-11T00:45:00Z }
sources:
  - id: git
    resource: /src/git.ts
    title: "The module whose null return this decision interprets"
    last_modified: 2026-09-11T00:29:00Z
  - id: ticket
    resource: /docs/product/tickets/DRIFT-0002.md
    title: "The checks this decision governs"
---

# What the tool does when it cannot check

## Decision

"I could not check this" is a **third outcome**, distinct from pass and fail, and it is
always said out loud. A bundle outside git is checked as far as it can be, told plainly
what was skipped, and exits `0`. `--require-git` turns that into a failure for callers who
need the check to have actually happened.

## Why not simply pass

A tool that finds nothing to check and prints nothing has just told CI that everything is
fine. That is the most expensive failure a checker can have, because the green tick is
believed. Anyone who moves a bundle out of a repository, or runs it in a container without
git, would silently lose the check and never learn.

## Why not fail

Failing punishes a legitimate state. A knowledge bundle is markdown in a directory: it can
be an Obsidian vault, a tarball, a documentation folder with no code anywhere near it.
Refusing to run there says the tool only serves repositories that look like this one.

The spec is on the side of leniency — bundles "MAY" be distributed as an archive, and
consumers "MUST NOT" reject a bundle for missing optional structure. Absent git is missing
optional structure.

## Git is an oracle, not the oracle

The reference point for staleness is whatever is known to be current. Git is the best one
available when a document cites code, because history is already there and needs no
bookkeeping. It is not the only one:

| Source cited | Oracle |
|---|---|
| a file in a git repository | `git log` — implemented |
| a file with no history | the filesystem: does it still exist |
| a URL | none today; fetching is out of scope |
| `stale_after` | the clock, which needs nothing |

So a bundle outside git is not unverifiable, only less verifiable. **`missing-source` and
`expired` work with no git at all**, and a vault of notes citing other notes gets a real
answer: the thing this document points at is gone.

## Per-source outcomes

| Source | Behaviour |
|---|---|
| tracked, changed since `last_modified` or the newest `verified.at` | `stale-source` |
| tracked, unchanged | pass |
| exists but untracked | skipped, counted in the summary |
| does not exist | `missing-source` |
| a URL, or a path outside the bundle's repository | skipped, counted |

## What was rejected

**Treating an unreadable source as `gone`.** It reads as decisive and is a lie: the tool
does not know the resource is missing, only that it could not look. A finding that might
be false teaches people to ignore findings.

**Falling back to filesystem mtime when git is absent.** Tempting, and wrong: mtime is
reset by a fresh clone, a copy, or an unzip, so it would report a whole bundle as changed
the moment it was moved. A signal that is wrong precisely when the bundle travels is worse
than no signal, and the format exists to travel.

**Requiring git.** Rejected as the default and kept as `--require-git`, because the caller
who needs a guarantee is the one who knows they need it.

## Consequences

- The skipped count is part of the report, not a debug line. `41 sources, 12 not
  verifiable` is information a reader must see.
- Exit `0` when nothing could be checked is deliberate and, without the printed summary,
  would be indefensible.
- `--require-git` exits `2`, the usage code, rather than `1`: nothing has drifted, the
  caller's precondition was not met.
