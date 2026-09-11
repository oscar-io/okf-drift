---
# OKF v0.2
type: "Feature Idea"
title: "Adoption belongs to a different tool"
description: "why helping a folder of markdown become a bundle is out of scope here, and what the tool that does it looks like"
tags: [ backlog, feature-idea, adoption, scope, rejected ]
status: "draft"
implementation: "rejected"
generated: { by: pi/opus-5, at: 2026-09-11T01:49:29Z }
verified: { by: "human:oscar-io", at: 2026-09-11T01:52:00Z }
sources:
  - id: walker
    resource: /src/bundle.ts
    title: "readBundle, which skips any file without front matter and so cannot see a folder worth adopting"
    last_modified: 2026-09-11T00:29:00Z
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: "OKF v0.2 §4.1: type is the only required field"
    author: GoogleCloudPlatform/knowledge-catalog
---

# Adoption belongs to a different tool

`DRIFT-0008`

**Rejected for this tool.** Recorded because the need is real and the reasoning is the
useful part.

## The gap

Point `okf-drift` at a real ADR directory — MADR format, `# 1. Use PostgreSQL`, a
`Status:` line, no front matter — and it says:

```
okf-drift: no documents with front matter under docs/adr
```

Exit `2`. Two perfectly good decision records, invisible, because `readBundle` treats
front matter as the thing that makes a file a concept. That rule is right for checking and
useless for adopting: **the folder most worth converting is the one with none.**

Nothing here helps anyone who already has documentation, which is everyone.

## Why not here

The first draft of this ticket proposed `okf-drift adopt` and argued it "belongs here, but
only just". That is not a reason, it is a shrug. The honest version:

**The commands divide on what they write.**

|             | Reads                  | Writes               | Depends on                                |
|-------------|------------------------|----------------------|-------------------------------------------|
| adoption    | prose, no front matter | front matter         | guessing, and a human accepting the guess |
| cataloguing | front matter           | `index.md`, `log.md` | derivation only                           |
| drift       | front matter and git   | nothing              | comparison only                           |

`okf-drift` never writes anything it cannot derive. That is its safety property, argued out
in [`index-command.md`](../../design/index-command.md) after `--write` destroyed a file.
Adoption writes metadata it *guessed*. Putting both in one binary means the tool that runs
on every push also carries the code that invents `type` fields.

**Adoption runs once, ever.** Per repository, at the moment of migration. Drift runs
forever. A one-shot converter shipped to every CI user is the wrong unit.

The only argument for keeping it here was a shared walker and parser — perhaps two hundred
lines. That is a reason to share code, not to share a tool.

## The shape it belongs to

A suite, of which this repository would be one part:

```
okf init      # a folder of markdown becomes a bundle: propose front matter, accept, write
okf update    # record new and changed documents in index.md and log.md
okf drift     # is any of it still true — this tool
```

`init` and `update` are where an LLM earns its place: deciding that a directory of
`NNNN-*.md` files are decision records, or writing a `description` that reads well in a
list. `drift` must stay deterministic, because a check that is occasionally creative is a
check nobody can put in CI.

That split — **generative for authoring, deterministic for verifying** — is the interesting
design idea, and it is not something to bolt onto this tool.

Naming is unresolved and not urgent: `okf` and `okf-kit` are taken on npm, `okf-cli` is
free, and there is no reason for the suite to be a Node project at all. A single static
binary would serve a Ruby or Python repository better, which was the runner-up argument in
[`language-choice.md`](../../design/language-choice.md).

## What must not happen, wherever it lands

The failure mode is a hundred hand-written notes becoming a hundred documents with
plausible, wrong metadata. That is worse than not adopting: it looks maintained and is not,
which is precisely what this project exists to detect.

Three fields must never be invented:

- **`description`** — a judgement about what a document is *for*, and the one field a
  machine cannot fake. Absence is honest; `undescribed-document` will ask for it later.
- **`verified`** — a trust claim only a person may make.
- **`sources`** — a guess here makes the drift check lie, which poisons the tool downstream.

`type` may be proposed, but shown as a proposal and never applied silently.

## What this leaves open here

Whether `okf-drift index --write` should move to `okf update` when that exists, leaving
this tool as a pure checker with no write path at all. That would be cleaner than what
exists today and would settle the unease in [`DRIFT-0007`](DRIFT-0007.md), but it removes a
working feature, so it is a decision for when the second tool is real rather than
hypothetical.
