---
# OKF v0.2
type: "Feature Idea"
title: "Configurable index section headings"
description: "let a bundle name the sections the tool may regenerate, instead of hardcoding two"
tags: [backlog, feature-idea, index]
status: "draft"
implementation: "proposed"
generated: { by: claude-opus-5, at: 2026-09-10T23:10:00Z }
sources:
  - id: decision
    resource: /docs/design/index-command.md
    title: "The decision that hardcodes the two headings this ticket would make configurable"
---

# Configurable index section headings

`DRIFT-0004`

`## Documents` and `## Directories` are hardcoded. The spec names no headings at all — it
says an index body "uses one or more sections, each grouping concepts under a heading" —
so a bundle using `## Concepts` or `## Reference` gets no help from `--write` and has to
adopt our vocabulary to receive any.

Options, in increasing order of ambition: a `--section` flag, a config file, or adopting
whichever heading already contains links.

The third is tempting and is how the table-versus-title bug happened: a tool that guesses
which text is authoritative eventually guesses wrong and edits the wrong thing. Prefer
being told.

Not urgent. Two hardcoded names cost nothing until someone outside this repository wants
different ones.
