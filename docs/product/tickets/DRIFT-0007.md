---
# OKF v0.2
type: "Feature Idea"
title: "Separate house rules from conformance failures"
description: "the tool fails a bundle the spec explicitly permits, and nothing in its output says which findings are its own opinion"
tags: [ backlog, feature-idea, conformance, findings ]
status: "draft"
implementation: "proposed"
generated: { by: pi/opus-5, at: 2026-09-11T01:45:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF v0.2 §8 and §11: an index MAY appear, and consumers MUST NOT reject a bundle for missing one"
    author: GoogleCloudPlatform/knowledge-catalog
  - id: check
    resource: /src/index-cmd.ts
    title: "The no-index finding, and the rest that share its severity"
    last_modified: 2026-09-11T00:29:00Z
---

# Separate house rules from conformance failures

`DRIFT-0007`

A minimally conformant bundle — one document, `type` only, no `index.md` anywhere — exits
`1` today:

```
  MISSING    notes/index.md
             no catalogue for 1 document(s) in this directory
```

§8 says an index **MAY** appear. §11 says a consumer **MUST NOT** reject a bundle for a
missing `index.md`. The tool does both, so it fails a bundle the format explicitly allows,
in the same voice it uses for a genuine defect.

This is the same class of error as [`DRIFT-0006`](DRIFT-0006.md): a tool that enforces a
format has to obey it first.

## The distinction the output does not make

| Finding | Whose rule |
|---|---|
| `dangling-entry`, `description-drift`, `undescribed-document` | the bundle contradicts itself — always worth reporting |
| `malformed-trust`, `invalid-description` | a claim nobody can read — always worth reporting |
| `stale-source`, `missing-source`, `expired` | the document contradicts the code — always worth reporting |
| **`no-index`** | **an opinion: that every directory ought to have a catalogue** |

Only the last is a preference. A curated bundle may legitimately have none.

## Options

1. **Drop `no-index` from the default**, and add `--require-index` for anyone who wants it.
   Mirrors `--require-git`, which already establishes the shape: the caller who needs a
   guarantee asks for it.
2. **Keep it, at a lower severity**, and label house rules in the report so a reader can
   see which findings are the tool's taste. The validator in `io-insights` does this with a
   `[spec]` and `[house]` split.
3. **Keep it as is** and document it. Cheapest, and it leaves the tool quietly
   non-conformant.

Option 1 is the smallest honest fix. Option 2 is better if more house rules appear, and
they will: whether an index should list every document is already open in
[`DRIFT-0003`](DRIFT-0003.md).

## Why it matters more than the one finding

The tool's argument is that a document should not claim more than it can support. A
finding that presents a preference as a defect does exactly that, and it is the fastest way
to teach someone to ignore the output.
