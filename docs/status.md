---
# OKF v0.2
type: "Document Authority"
title: "Documentation status and authority"
description: "which documents describe what the tool does today, which describe intentions, and which behaviour is built versus planned"
tags: [documentation, governance, status]
status: "stable"
generated: { by: claude-opus-5, at: 2026-09-11T00:35:00Z }
verified: { by: "huma:oscar-io", at: 2026-09-11T00:40:00Z }
sources:
  - id: cli
    resource: /src/cli.ts
    title: "The commands and flags that exist, which this register describes"
    last_modified: 2026-09-11T00:00:43Z
  - id: backlog
    resource: /docs/product/tickets/index.md
    title: "The ticket registry, whose implementation column this must agree with"
---

# Documentation status and authority

What a document here is allowed to claim. A document's own `status` and
`implementation` win over its folder name; where a document and this register disagree,
the document is right and this file is stale.

It answers *what is true today*. For *what exists here* see [`index.md`](index.md); for
*why anything moved* see the `log.md` in each directory.

## Built and true today (`normative/current`)

These describe behaviour you can run.

- [`../README.md`](../README.md) — how to install and run the tool; every command in it works.
- [`../AGENTS.md`](../AGENTS.md) — the working contract for this repository.
- [`design/authoring-guide.md`](design/authoring-guide.md) — house style; the rules marked
  **enforced** are genuinely enforced, the rest are convention and nothing checks them.
- [`design/index-command.md`](design/index-command.md) — fully implemented, including
  section-scoped `--write` and its refusals.
- [`design/language-choice.md`](design/language-choice.md) — decided and acted on.
- [`design/distribution.md`](design/distribution.md) — decided; the git-install route is
  the only one, and nothing is published.

## Decided but not built (`design/pending`)

- [`design/index-command.md`](design/index-command.md) — one exception to its entry above:
  **`## Directories` is decided and not generated.** Subdirectory entries are verified
  when present and never written.

## Intentions, not claims (`proposal/deferred`)

These are directions. Nothing in them describes current behaviour.

- [`product/tickets/DRIFT-0001.md`](product/tickets/DRIFT-0001.md) — proposed. A malformed
  `verified` block is still discarded silently today.
- [`product/tickets/DRIFT-0002.md`](product/tickets/DRIFT-0002.md) — partial: `src/drift.ts`
  documents the plan and throws. **The default `okf-drift` command does not work.**
- [`product/tickets/DRIFT-0003.md`](product/tickets/DRIFT-0003.md) — deliberately open, and
  should stay open until a larger bundle provides evidence.
- [`product/tickets/DRIFT-0004.md`](product/tickets/DRIFT-0004.md) — proposed; the two
  headings are hardcoded.
- [`product/tickets/DRIFT-0005.md`](product/tickets/DRIFT-0005.md) — proposed; `--write`
  refuses a table rather than preserving its shape, which is the interim behaviour.
- [`plans/git-oracle.md`](plans/git-oracle.md) — a working plan, not a design. Disposable.

## Done (`historical`)

- [`product/tickets/DRIFT-0006.md`](product/tickets/DRIFT-0006.md) — done. Kept because it
  records four spec violations and how they were found, which is worth more than the fix.

## What the tool does today

| Command | State |
|---|---|
| `okf-drift index --check <bundle>` | works |
| `okf-drift index --write <bundle>` | works; refuses what it cannot reproduce |
| `okf-drift index --strict` | works |
| `okf-drift check <bundle>` (the default) | **throws**, see `DRIFT-0002` |

Findings emitted today: `unlisted-document`, `dangling-entry`, `description-drift`,
`undescribed-document`, `invalid-description`, `no-index`, `unreadable`, `write-refused`.

Not yet emitted, though named in tickets: `malformed-verified`, `stale-source`,
`missing-source`, `expired`.

## Known inaccuracy

`src/drift.ts` points a reader at `docs/design/drift-detection.md`, which does not exist —
the decision it names lives in [`product/tickets/DRIFT-0002.md`](product/tickets/DRIFT-0002.md).
Fix when the oracle lands.
