---
# OKF v0.2
type: "Document Authority"
title: "Documentation status and authority"
description: "which documents describe what the tool does today, which describe intentions, and which behaviour is built versus planned"
tags: [ documentation, governance, status ]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-11T00:35:00Z }
verified: { by: "human:oscar-io", at: 2026-09-11T00:40:00Z }
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

It answers *what is true today*. For *what exists here* see [`index.md`](index.md); for *why anything moved* see the `log.md` in each directory.

## Built and true today (`normative/current`)

These describe behaviour you can run.

- [`../README.md`](../README.md) — how to install and run the tool; every command in it works.
- [`../AGENTS.md`](../AGENTS.md) — the working contract for this repository.
- [`product/bundle-workflow.md`](product/bundle-workflow.md) — normative *for this
  repository only*, and its preamble says so: the lifecycle an agent is expected to follow
  here, not one OKF imposes. Every event in it has been performed in this
  repository, and the table of what is and is not enforced is accurate.
- [`design/authoring-guide.md`](design/authoring-guide.md) — house style; the rules marked **enforced** are genuinely enforced, the rest are convention and nothing checks them.
- [`design/index-command.md`](design/index-command.md) — fully implemented, including
  section-scoped `--write` and its refusals.
- [`design/language-choice.md`](design/language-choice.md) — decided and acted on.
- [`design/distribution.md`](design/distribution.md) — decided; the git-install route is
  the only one, and nothing is published.
- [`design/drift-oracles.md`](design/drift-oracles.md) — implemented, including
  `--require-git` and the printed summary of what could not be checked.

## Decided but not built (`design/pending`)

- [`design/index-command.md`](design/index-command.md) — one exception to its entry above:
  **`## Directories` is decided and not generated.** Subdirectory entries are verified
  when present and never written.

## Intentions, not claims (`proposal/deferred`)

These are directions. Nothing in them describes current behaviour.

- [`product/tickets/DRIFT-0008.md`](product/tickets/DRIFT-0008.md) — rejected, and it will
  not be built here. The gap is real: a folder without front matter exits 2 and is called
  empty. The ticket names the tool it belongs to instead.
- [`product/tickets/DRIFT-0007.md`](product/tickets/DRIFT-0007.md) — proposed, and it
  records a live defect: `no-index` fails a conformant bundle today.
- [`product/tickets/DRIFT-0003.md`](product/tickets/DRIFT-0003.md) — deliberately open, and
  should stay open until a larger bundle provides evidence.
- [`product/tickets/DRIFT-0004.md`](product/tickets/DRIFT-0004.md) — proposed; the two
  headings are hardcoded.
- [`product/tickets/DRIFT-0005.md`](product/tickets/DRIFT-0005.md) — proposed; `--write`
  refuses a table rather than preserving its shape, which is the interim behaviour.
- [`plans/git-oracle.md`](plans/git-oracle.md) — a working plan, not a design. Disposable.

## Done (`historical`)

- [`product/tickets/DRIFT-0001.md`](product/tickets/DRIFT-0001.md) — done. A malformed trust
  claim is reported as `malformed-trust` rather than discarded.
- [`product/tickets/DRIFT-0002.md`](product/tickets/DRIFT-0002.md) — done. The git oracle
  works, and its plan is deleted.
- [`product/tickets/DRIFT-0006.md`](product/tickets/DRIFT-0006.md) — done. Kept because it
  records four spec violations and how they were found, which is worth more than the fix.

## What the tool does today

| Command                                  | State                                   |
|------------------------------------------|-----------------------------------------|
| `okf-drift index --check <bundle>`       | works                                   |
| `okf-drift index --write <bundle>`       | works; refuses what it cannot reproduce |
| `okf-drift index --strict`               | works                                   |
| `okf-drift check <bundle>` (the default) | works                                   |
| `okf-drift check --require-git`          | works                                   |

Findings emitted today: `unlisted-document`, `dangling-entry`, `description-drift`,
`undescribed-document`, `invalid-description`, `no-index`, `unreadable`, `write-refused`,
`stale-source`, `unverified-since-change`, `missing-source`, `expired`, `malformed-trust`.

Every finding named in a ticket is emitted.

## Known inaccuracy

None recorded. The dangling `docs/design/drift-detection.md` reference went with the stub.
