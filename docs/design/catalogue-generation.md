---
# OKF v0.2
type: "Design Decision"
title: "The catalogue is derived, but never destructive"
description: "why index.md is generated from front matter, and why --write still refuses to delete a sentence it cannot derive"
tags: [decision, index, safety]
status: "stable"
generated: { by: claude-opus-5, at: 2026-09-10T22:15:54Z }
sources:
  - id: implementation
    resource: /src/index-cmd.ts
    title: "checkIndexes, renderIndex and the description comparison this decision describes"
    last_modified: 2026-09-10T22:10:06Z
  - id: tests
    resource: /test/index-cmd.test.ts
    title: "The cases that pin the behaviour, including the regression that prose survives --write"
    last_modified: 2026-09-10T22:10:06Z
---

# The catalogue is derived, but never destructive

## Decision

`index.md` is generated from the `description` in each document's front matter. The
document is the source of truth; the catalogue holds a copy. But `--write` never deletes
a description it cannot derive.

## Why a catalogue at all

Maintaining an index by hand is the bookkeeping that kills wikis. Every new document is
a second edit somewhere else, the second edit is the one that gets skipped, and a
catalogue that is missing half its entries is worse than none: a reader who checks it
and finds nothing concludes nothing is there.

Generating it removes the second edit. `--check` in CI removes the need to remember at
all.

## Why the copy still has to be checked

A derived file that people can edit will be edited. The interesting case is not
malicious: someone writes a better one-line summary in the list than the one in the
front matter, because a list reads differently from a document header. That is good
editing, and the tool cannot distinguish it from a copy that has gone stale.

So the catalogue is compared, not merely regenerated, and the comparison ignores
formatting. Case, punctuation and whitespace are not meaning, and a check that reports
noise gets switched off, which costs more than the differences it would have caught.
`--strict` restores exact comparison for anyone who wants it.

## Why --write cannot be trusted with prose

`description` is optional in OKF; only `type` is required. The first implementation
treated an absent description as an empty one, so regenerating a catalogue silently
deleted any summary that lived only in the list:

```markdown
- [`caching.md`](caching.md) - why prices are cached per-tenant.   before
- [`caching.md`](caching.md)                                       after
```

A documentation tool that deletes documentation gets uninstalled, and rightly. The rule
now: a description already in the catalogue survives regeneration wherever the document
supplies none, and the case is reported as `undescribed-document` so somebody can move
the sentence into the front matter, where every other consumer can read it.

Note the direction. Usually the catalogue lags the document. Here it is *ahead* of it,
and the fix is not to edit the catalogue.

## Consequences

- Deleting a `description` from front matter no longer deletes it from the catalogue.
  Removing it from both is now two edits. That is the correct price for not losing text.
- A non-string `description` is reported as `invalid-description` rather than coerced to
  empty, because silently treating a list as absent is how the deletion bug happened.
- Absence is never an error, only a finding. The spec permits a document with no
  description and this tool must not contradict it.
