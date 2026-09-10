---
# OKF v0.2
type: "Feature Idea"
title: "Conform to the spec's link and index rules"
description: "four ways the index check contradicts OKF v0.2, found by reading the spec instead of the examples"
tags: [backlog, feature-idea, conformance, index]
status: "draft"
implementation: "proposed"
generated: { by: claude-opus-5, at: 2026-09-10T23:45:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF v0.2 §5.2, §6.1, §8 and §12"
    author: GoogleCloudPlatform/knowledge-catalog
  - id: parser
    resource: /src/index-cmd.ts
    title: "parseCatalogue and checkIndexes, which compare link targets to bare filenames"
    last_modified: 2026-09-10T22:37:02Z
---

# Conform to the spec's link and index rules

`DRIFT-0006`

A tool that enforces a format must first obey it. Four defects, all found by reading the
specification rather than by using the tool.

## Link targets are not filenames

`checkIndexes` compares a link target to a bare filename, so every form §6.1 permits is
reported as `dangling-entry`:

| In an index | Today | Should be |
|---|---|---|
| `[Customers](/tables/customers.md)` | `GONE` | resolved from the bundle root |
| `[Other](./other.md)` | `GONE` | resolved relative to the directory |
| `[Subdirectory](subdir/)` | `GONE` | a directory entry, §8 |

The absolute form is the one the spec *recommends*, and the directory form appears in its
own index example, so the check currently fails on the specification's own sample.

Resolve targets to a path before comparing, and treat a trailing-slash target as a
directory entry: present if the directory exists, `gone` if it does not.

## An index heading may be any level

§8 shows `# Section`; the tool emits and looks for `## Documents`. Section detection must
not assume a level. Related: [`DRIFT-0004`](DRIFT-0004.md).

## Fixed

A bare `verified` mapping is now read as a one-element list. §5.2 permits the form and §11
makes honouring it a **MUST**, so a hand-written single verifier was silently downgraded to
`unverified` — the exact failure [`DRIFT-0001`](DRIFT-0001.md) describes, caused by the
tool rather than by the author.

## Not a defect, worth recording

`okf_version` in a root `index.md` parses correctly, and `log.md` entries are not mistaken
for catalogue entries. Both were checked.
