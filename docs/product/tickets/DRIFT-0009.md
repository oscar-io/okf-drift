---
# OKF v0.2
type: "Feature Idea"
title: "A commit is not evidence that a source changed"
description: "why renaming a field across the bundle marked six documents stale, and what a cheaper signal than a commit count would be"
tags: [ backlog, feature-idea, drift, noise ]
status: "draft"
implementation: "proposed"
generated: { by: pi/opus-5, at: 2026-09-11T01:58:13Z }
sources:
  - id: oracle
    resource: /src/drift.ts
    title: "checkDrift, which treats any commit touching a path as a change worth reporting"
    last_modified: 2026-09-11T00:42:00Z
  - id: git
    resource: /src/git.ts
    title: "commitsSince, which counts commits and knows nothing about what they did"
    last_modified: 2026-09-11T00:29:00Z
---

# A commit is not evidence that a source changed

`DRIFT-0009`

Renaming the producer actor across thirteen documents, and letting an editor reformat some
markdown tables, marked six documents stale. Nothing they describe had moved.

```
STALE   design/language-choice.md
        /package.json changed 2026-09-11, 2 commits after this document was last reviewed
```

One of those two commits added a script; the other adjusted whitespace. The check cannot
tell them apart, because `commitsSince` counts commits and a commit is a unit of *authoring*,
not of *meaning*.

## Why this matters more than it looks

The tool's whole claim is that a finding is worth acting on. A check that fires when a file
was reformatted trains a reader to skim past it, and once that habit forms the real
findings go unread too — the same argument that made description comparison ignore
formatting in [`index-command.md`](../../design/index-command.md).

There is already evidence of the habit forming: seven findings in this bundle today, of
which perhaps three describe code that actually moved.

## Candidate signals, none obviously right

1. **Ignore whitespace-only diffs.** `git log -w` exists and is nearly free. Catches the
   reformatting case and nothing else.
2. **Count changed lines, not commits**, and report a proportion: *"14 lines of 240 changed
   since"*. More informative than a commit count, and a reader can judge it.
3. **Ignore commits that touch only front matter**, when the source is itself a document.
   Fixes the actor rename precisely, and is fiddly.
4. **Let a document opt out per source**, some `significant: false`. Rejected on sight: a
   field whose only purpose is to silence a check will be set once and never revisited.

Option 1 is cheap and partial. Option 2 changes the report from a verdict into evidence,
which suits a tool that is meant to prompt a human rather than gate a build, and it
subsumes much of option 1.

## Do not fix by moving the timestamps

The tempting non-fix is to bump every `last_modified` to now. That silences the report and
destroys the only record of when anybody actually checked. The point of the field is that
it is a claim someone made, not a cache of the file's mtime.

## Related

[`DRIFT-0003`](DRIFT-0003.md) is the same question for descriptions: how different is
different enough to report. Whatever answers one should probably answer both.
