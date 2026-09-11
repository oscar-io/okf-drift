---
# OKF v0.2
type: "Feature Idea"
title: "Report a malformed verified block"
description: "front matter that looks verified to a reader and parses as nothing to the code should be a finding, not silence"
tags: [backlog, feature-idea, front-matter, trust]
status: "stable"
implementation: "done"
generated: { by: pi/opus-5, at: 2026-09-10T22:25:00Z }
sources:
  - id: helpers
    resource: /src/frontmatter.ts
    title: "verificationEvents and trustTier, which drop invalid entries without reporting them"
    last_modified: 2026-09-10T22:10:06Z
---

# Report a malformed verified block

`DRIFT-0001`

Found by writing one wrong, by hand, in this repository's own bundle.

`verificationEvents()` filters `verified` down to entries whose `by` matches an actor and
silently discards the rest. Two mistakes therefore vanish:

```yaml
verified: { by: "human:oscar", at: ... }        # a mapping, not a list
verified:
  - { by: "human:Oscar Reyes", at: ... }        # a display name, not a handle
```

Both are valid YAML. Both leave `trustTier()` returning `unverified` while the file, read
by a person, plainly claims otherwise. That is the worst kind of failure this tool can
have: the document and the code disagree, and nothing says so.

## Built

A `malformed-trust` finding, severity `unreadable`, reported by `okf-drift check` for each
unreadable claim, naming the field and the reason:

- `by` is not an actor — `human:<handle>`, `process:<name>` or `<tool>/<version>` — and a
  handle contains no spaces
- `at` is not an RFC 3339 instant with an offset

The same applies to `generated` and to `sources[].last_modified`.

## Why it is not just validation

This is about the consequence: an unverified document that looks verified is a trust claim the repository cannot support, and trust is what the `verified` field exists to carry. The finding belongs next to the drift findings, not in a schema checker.
