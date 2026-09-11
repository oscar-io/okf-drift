---
# OKF v0.2
type: "Feature Idea"
title: "Decide whether a terser catalogue summary is drift"
description: "whether a deliberately shorter description in an index is good editing or a copy that has rotted"
tags: [ backlog, feature-idea, index, open-question ]
status: "draft"
implementation: "partial"
generated: { by: pi/opus-5, at: 2026-09-10T22:25:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T01:52:00Z }
sources:
  - id: decision
    resource: /docs/design/index-command.md
    title: "The decision this ticket would amend, including why formatting is already ignored"
    last_modified: 2026-09-10T22:16:00Z
---

# Decide whether a terser catalogue summary is drift

`DRIFT-0003`

`description-drift` fires when a catalogue entry differs from the document's own
`description`, after normalising away case, punctuation and whitespace. That handles
formatting. It does not handle intent:

| Catalogue                   | Document                           | Should it fire? |
|-----------------------------|------------------------------------|-----------------|
| `caching, per tenant`       | `why prices are cached per-tenant` | probably not    |
| `how the retry queue works` | `why prices are cached per-tenant` | yes             |

The first is someone writing a shorter summary because a list reads differently from a
document header. That is good editing, and the tool currently calls it drift.

## Options

1. **Leave it.** The catalogue is generated; a hand-written summary is unsupported and
   the finding is correct. Cleanest, and it forbids something people will want to do.
2. **Require some token overlap** before reporting — Jaccard below a threshold, say.
   Passes the first row, catches the second. Fuzzy, but this is already a heuristic.
3. **Only compare when the document is the newer of the two**, by git history, so an
   edited document flags its catalogue but an edited catalogue does not flag itself.
   Needs `DRIFT-0002` first.

## Do not decide yet

This wants evidence, not argument. The question is whether row one actually happens, and
a bundle with a dozen documents in it will answer that better than either option can be
reasoned about now. Revisit when this repository's own `docs/` is bigger, or when someone
else's is.
