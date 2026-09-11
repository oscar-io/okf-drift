---
    # OKF v0.2
type: "Design Decision"
title: "TypeScript, over Go and Python"
description: "why a tool that should not care what language a project uses is written in TypeScript anyway"
tags: [decision, tooling, distribution]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-10T22:15:54Z }
verified: { by: "human:oscar-io", at: 2026-09-10T22:18:00Z }
sources:
  - id: package
    resource: /package.json
    title: "The bin entry, ESM type and Node engine range this decision produced"
    last_modified: 2026-09-10T22:10:06Z
---

# TypeScript, over Go and Python

## Decision

Write `okf-drift` in TypeScript, publish it to npm, and run it with `npx okf-drift`.

## Why

**Trial friction decides adoption for a tool discovered in an article.** The reader is
not looking for a documentation linter; they are reading about knowledge rot and might
try one. `npx okf-drift` costs them one line and installs nothing permanent. "Download
the binary for your platform" loses most of them before they see any output.

**The neighbours are on npm.** `okf-kit` validates OKF bundles and is at v0.10; `okf`,
`okf-tools` and `okf-lint` are stubs someone reserved. Publishing to the same registry
makes this findable by anyone already searching the term, and lets the README state the
difference in one line: *okf-kit validates that a bundle is well formed, okf-drift tells
you when a well-formed bundle has stopped being true.* A Go binary is invisible to that
search.

That second reason was later given up: [`distribution.md`](distribution.md) decides not
to publish, so the tool is not findable in the registry at all. The decision below
stands on trial friction and audience alone.

**Performance is irrelevant here**, which removes Go's usual advantage. The work is
`git log` over a few dozen markdown files: I/O bound, and over in milliseconds.

## What was rejected

**Go** is the more principled answer and lost on reach, not on merit. A knowledge bundle
lives in Java, Ruby and Rust repositories too, and a static binary is honest about a
documentation tool having no business caring which. `goreleaser` plus a thin npm wrapper
would give both `npx` and a standalone binary. Revisit this if the tool is ever adopted
outside JavaScript-shaped projects; the cost is a rewrite of roughly 600 lines, which is
cheap enough that this decision is not a trap.

**Python** was rejected for a different reason: an OKF validator already exists in
Python, and porting it would produce a transliteration rather than a tool. Nothing would
be learned and nothing new would exist.

## Consequences

- Node >= 20 is required to run the tool, in a repository that may contain no JavaScript.
- `yaml` is the only runtime dependency. Argument parsing is hand-rolled, because the
  surface is two commands and three flags, and a dependency that formats help text is
  not worth a supply chain.
- The choice is reversible per the note above, and deliberately not defended past the
  point where the evidence changes.
