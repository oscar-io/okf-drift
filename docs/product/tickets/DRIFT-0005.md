---
# OKF v0.2
type: "Feature Idea"
title: "Index Generation: regenerate a section in the shape it already has"
description: "keep a table a table, instead of replacing it with bullets"
tags: [ backlog, feature-idea, index ]
status: "draft"
implementation: "proposed"
generated: { by: pi/opus-5, at: 2026-09-10T23:10:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T06:25:45Z }
sources:
  - id: renderer
    resource: /src/index-cmd.ts
    title: "renderIndex, which emits bullets unconditionally"
    last_modified: 2026-09-10T22:37:02Z
---

# Index Generation: regenerate a section in the shape it already has

`DRIFT-0005`

`parseCatalogue` reads bullets and tables; `renderIndex` writes only bullets. So
regenerating a section written as a table converts it, losing every column the tool does
not model — `Implementation` in the ticket registry, for one.

Until this is built, `--write` must refuse a section it would reshape, rather than
silently reformatting it.

The fix is to detect the existing shape and preserve it, including unknown columns, which
means matching rows by their link target rather than rewriting the row whole.

A table is not decoration. It is chosen when entries carry more than a description, and
that extra is exactly what a bullet cannot hold.
