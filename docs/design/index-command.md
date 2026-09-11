---
# OKF v0.2
type: "Design Decision"
title: "The Index Command: how a catalogue is read, and when it is written"
description: "why a catalogue is checked rather than owned, and why generation touches two sections and nothing else"
tags: [ decision, index, safety ]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-10T23:20:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T06:25:45Z }
sources:
  - id: implementation
    resource: /src/index-cmd.ts
    title: "parseCatalogue, renderIndex and checkIndexes"
    last_modified: 2026-09-10T22:37:02Z
  - id: tests
    resource: /test/index-cmd.test.ts
    title: "The cases that pin this behaviour, including that prose survives --write"
    last_modified: 2026-09-10T22:37:02Z
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF §8, Index files: sections under headings, and MAY generate"
    author: GoogleCloudPlatform/knowledge-catalog
---

# The Index Command: how a catalogue is read, and when it is written

## Decision

`index.md` is **checked** against the documents beside it. It is **not owned**: `--write`
regenerates the body of `## Documents` and `## Directories` and leaves every other line
alone. A file that exists and has neither heading is reported, never rewritten. A file
that does not exist is created whole, because there is nothing to destroy.

## Why a catalogue at all

Maintaining an index by hand is the bookkeeping that kills wikis. Every new document is a
second edit somewhere else, the second edit is the one that gets skipped, and a catalogue
missing half its entries is worse than none: a reader who checks it and finds nothing
concludes nothing is there.

`--check` in CI removes the forgetting. `--write` removes the typing. Only the first is
essential, which is the order of priority when the two conflict.

## Why the copy still has to be checked

The document is the source of truth and the catalogue holds a copy, so the copy rots. The
interesting case is not neglect: someone writes a better one-line summary in the list than
the one in the front matter, because a list reads differently from a document header.

So entries are compared, and the comparison ignores formatting. Case, punctuation and
whitespace are not meaning, and a check that reports noise gets switched off, which costs
more than the differences it would have caught. `--strict` restores exact comparison.

Whether a deliberately terser summary should count as drift is open:
[`DRIFT-0003`](../product/tickets/DRIFT-0003.md).

## Why generation is scoped to two sections

An earlier version of this decision said "the catalogue is derived", which is true of the
*list* and false of the *file*. Acting on it, `--write` replaced a ticket registry — its
id-minting rules, its table, its rationale — with a seven-line template. Only a `git diff`
caught it.

The spec is explicit that the rest belongs to the author: an index body "uses one or more
sections, each grouping concepts under a heading", and a producer only **MAY** generate
one. Index files are markdown rather than JSON precisely so they can hold more than a
list.

A heading is the right boundary because it is already the spec's structure, it survives
every edit above it, and it explains itself to a reader. The alternatives do not:

- **An HTML comment** (`<!-- okf-drift:begin -->`) is invisible, so a reader cannot see
  why a region is special.
- **A line range in front matter** is forbidden outright — the spec allows no front matter
  in an index beyond a root `okf_version` — and it breaks whenever a line is added above
  it, so the tool would maintain a pointer to its own output and then check that pointer
  for drift.

Only `## Documents` is implemented; `## Directories` is not yet generated. A heading at
any level matches, and the section runs to the next heading of the same or higher level.
Naming the headings is [`DRIFT-0004`](../product/tickets/DRIFT-0004.md).

## Why --write cannot be trusted with prose

`description` is optional in OKF; only `type` is required. Treating an absent one as empty
made regeneration delete any summary that lived only in the list:

```markdown
- [`caching.md`](caching.md) - why prices are cached per-tenant.   before
- [`caching.md`](caching.md)                                       after
```

A documentation tool that deletes documentation gets uninstalled, and rightly. A
description already in the catalogue now survives, and the case is reported as
`undescribed-document` so the sentence can be moved into the front matter where every
consumer can read it. Note the direction: the catalogue is *ahead* of the document, and
the fix is not to edit the catalogue.

The same rule bans reshaping. Entries are generated as bullets, so a section written as a
table would lose the columns the tool does not model; until
[`DRIFT-0005`](../product/tickets/DRIFT-0005.md) preserves shape, `--write` refuses it and
reports `write-refused` rather than writing anything.

## Link targets are paths, not filenames

An entry is resolved before it is compared (spec §6.1): a leading `/` from the bundle root,
anything else from the directory the index is in. A trailing slash marks a subdirectory
entry (§8), which is checked for existence and not described.

## Curation is legitimate

A directory of a hundred documents may list twenty-five on purpose. `unlisted-document`
therefore reports a question, not a defect, and a document listed under any other heading
counts as listed — the tool reads the whole file and regenerates only its two sections.

## Consequences

- An index may be edited by hand. The tool assists; it does not own the file.
- Deleting a `description` from front matter no longer deletes it from the catalogue, so
  removing it from both is two edits. That is the correct price for not losing text.
- A non-string `description` is `invalid-description` rather than silently empty, because
  coercing it away is how the deletion bug happened.
- Absence is never an error, only a finding. The spec permits a document with no
  description and this tool must not contradict it.
