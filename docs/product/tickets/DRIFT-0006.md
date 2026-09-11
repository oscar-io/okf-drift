---
# OKF v0.2
type: "Feature Idea"
title: "Conform to the spec's link and index rules"
description: "four ways the index check contradicted OKF v0.2, found by reading the spec instead of the examples"
tags: [ backlog, feature-idea, conformance, index ]
status: "stable"
implementation: "done"
generated: { by: pi/opus-5, at: 2026-09-11T00:12:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T01:52:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF v0.2 §5.2, §6.1, §8 and §12"
    author: GoogleCloudPlatform/knowledge-catalog
  - id: parser
    resource: /src/index-cmd.ts
    title: "resolveTarget, and the checks that now compare resolved paths"
    last_modified: 2026-09-11T00:00:43Z
---

# Conform to the spec's link and index rules

`DRIFT-0006`

A tool that enforces a format must first obey it. Four defects, all found by reading the
specification rather than by using the tool. All four are fixed.

## Link targets are not filenames

`checkIndexes` compared a link target to a bare filename, so every form §6.1 permits was
reported as `dangling-entry` *and* the document it pointed at as `unlisted-document` — the
spec's own index example produced five findings on a conformant bundle.

| In an index                         | Was    | Now                                |
|-------------------------------------|--------|------------------------------------|
| `[Customers](/tables/customers.md)` | `GONE` | resolved from the bundle root      |
| `[Other](./other.md)`               | `GONE` | resolved relative to the directory |
| `[Subdirectory](subdir/)`           | `GONE` | a directory entry, §8              |

`resolveTarget` turns a link into a bundle-relative path before anything is compared: a
leading `/` is rooted at the bundle, everything else at the directory holding the index,
`.` and `..` collapse, and a fragment or query is dropped. A trailing slash survives,
because it is what distinguishes a subdirectory entry, which is checked for existence and
nothing more.

## An index heading may be any level

§8 shows `# Section`. Section matching accepts `#` through `######`, and a section ends at
the next heading of the same or higher level.

## A bare verified mapping is one event

§5.2 permits a single verifier without the list dash and §11 makes honouring it a **MUST**.
Requiring a list silently downgraded a hand-written verification to `unverified` — the
failure [`DRIFT-0001`](DRIFT-0001.md) describes, caused by the tool rather than the author.

## Not a defect, worth recording

`okf_version` in a root `index.md` parses correctly, and `log.md` entries are not mistaken
for catalogue entries. Both were checked.

## What this does not cover

`## Directories` is decided but not generated, so a subdirectory entry is verified when
present and never written. Naming the sections is [`DRIFT-0004`](DRIFT-0004.md).
