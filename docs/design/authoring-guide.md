---
# OKF v0.2
type: "Reference"
title: "Authoring guide"
description: "the house style for OKF front matter, verifiers and logs, and which rules the tool enforces"
tags: [reference, authoring, front-matter, house-style]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-11T00:20:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF v0.2, which this guide narrows rather than extends"
    author: GoogleCloudPlatform/knowledge-catalog
  - id: parser
    resource: /src/frontmatter.ts
    title: "The actor and instant patterns, and the trust tiers derived from them"
    last_modified: 2026-09-11T00:00:43Z
---

# Authoring guide

How to write a document in this bundle. The spec permits more than this; where it does,
the narrower rule here is a house style, and a document that ignores it is still
conformant.

Rules marked **enforced** are checked by `okf-drift`. The rest are on you.

## Front matter

```yaml
---
# OKF v0.2
type: "Design Decision"
title: "The tool owns two sections of an index"
description: "why generation is scoped to two headings instead of the whole file"
tags: [decision, index, safety]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-11T00:20:00Z }
sources:
  - id: implementation
    resource: /src/index-cmd.ts
    title: "The functions this decision describes"
    last_modified: 2026-09-11T00:00:43Z
---
```

`type` is the only field the spec requires. Everything else is optional, and its absence
means something.

### `description` — **enforced**

The summary a catalogue quotes, so write it as a fragment completing "this document
explains…": lowercase, no trailing full stop, one line.

The tool compares it against the entry in `index.md`, ignoring case, punctuation and
whitespace. A description that lives only in the catalogue is reported, because the
document should hold it where every consumer can read it.

### `sources` — the field drift detection reads

`resource` must point at something real: a path in this repository, or a URL. And
`last_modified` **must come from git**, never from memory:

```bash
git log -1 --format=%cI -- src/index-cmd.ts
```

An invented timestamp makes the tool lie about whether a document is still true. That is
worse than omitting the field.

### `generated` and `verified`

`generated` says who produced the content. `verified` says who confirmed it against its
sources. They are different events and are kept apart.

An actor is one of three shapes, and never a display name:

| Form | For | Example |
|---|---|---|
| `tool/version` | an agent or tool | `pi/opus-5` |
| `human:<handle>` | a person | `human:oscar-io` |
| `process:<name>` | an automated check | `process:link-check` |

A handle has no spaces. `human:Oscar Reyes` is valid YAML, matches no actor pattern, and
silently counts as no verification at all.

`verified` takes a list, or a bare mapping meaning a list of one — both are spec-legal:

```yaml
verified: { by: "human:oscar-io", at: 2026-09-11T00:20:00Z }
verified:
  - { by: "human:oscar-io", at: 2026-09-11T00:20:00Z }
  - { by: process:link-check, at: 2026-09-11T01:00:00Z }
```

Every instant is RFC 3339 with an offset. `2026-09-11` is a date, not an instant, and is
rejected.

### Never write a `human:` verifier

Trust tiers key off the `human:` prefix: no `verified` key is *unverified*, machine actors
only is *machine-confirmed*, a `human:` actor is *human-reviewed*. An agent writing one
forges the highest signal the format has and makes the tier meaningless everywhere.

Write `generated:` and leave `verified:` for a person to add.

### Absence carries meaning

Never fill a field to look complete. A document with no `verified` key has not been
verified, and a reader learns something true from that. A ticket that is a proposal has
nothing to verify *against* — leave it out.

## Decision records

A decision record names **what was rejected** and **the condition that would reverse it**.
One with no alternatives in it is a press release.

State the decision first, then why, then what it costs. If a later decision weakens an
earlier one, say so in both — that is the case the format exists for, and it is invisible
otherwise.

## The log

`log.md` records **why a document moved**, not that it changed; git already has that. An
entry earns its place if a reader six months from now would otherwise repeat a mistake. A
reversal always earns one; a typo fix never does.

Newest first, under an ISO `## YYYY-MM-DD` heading:

```markdown
- **Creation** [distribution.md](./distribution.md) drops npm publishing, and takes the
  registry-reach argument away from [language-choice.md](./language-choice.md).
```

- **Action first**, bold: `Creation`, `Update`, `Deprecation`, `Inception`.
- **Then the document, as a link**, in the opening clause. A reader scanning the file is
  scanning for which document moved.
- **One sentence.** The test is mechanical: cut every entry at its first period and read
  the file top to bottom. If a day still makes sense, the entries are the right shape. A
  second sentence is earned only by a constraint on the next writer.

The spec leaves the shape open, so this is house style and nothing checks it.

## Index files

`index.md` and `log.md` are reserved: they carry no front matter and are not concepts.

An index may be edited by hand. `okf-drift index --write` regenerates the body of
`## Documents` and leaves everything else alone, so prose, extra sections and a curated
subset of the directory all survive. A directory of a hundred documents may list
twenty-five on purpose.

Link forms, all permitted (spec §6.1):

| Form | Resolves from |
|---|---|
| `/tables/customers.md` | the bundle root — recommended, survives a move |
| `./orders.md` | the directory the index is in |
| `archive/` | a subdirectory entry, checked for existence only |
