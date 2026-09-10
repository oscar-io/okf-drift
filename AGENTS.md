# okf-drift — agent instructions

Read this before changing anything. Then read [`docs/index.md`](docs/index.md), which
says what the tool is for and why it works the way it does.

## The one rule this repository exists to demonstrate

Knowledge lives in `docs/`, next to the code it describes, in git. Not in a wiki, not in
a ticket, not in this file. When you learn something durable — a decision, a rejected
alternative, a constraint that is not obvious from the code — write it there.

## Before you start

- **Read `docs/index.md` first.** It is the entry point and lists the reading order.
- **Read the log** for the directory you are about to change. `docs/log.md` and
  `docs/design/log.md` record why things are the way they are, which is the part the
  code cannot tell you.

## While you work

- **An `index.md` may be edited by hand.** The tool assists; it does not own the file. It
  regenerates the body of `## Documents` and `## Directories` and leaves everything else
  alone, so prose, extra sections and a curated subset of the directory all survive. Run
  `pnpm docs:write` when it saves typing, and edit directly when it does not.
- **A `description` in front matter is the summary the catalogue quotes.** Write it as a
  fragment that completes "this document explains…", lowercase, no trailing full stop.
- **Adding a dependency is a decision.** The runtime dependency is `yaml` and nothing
  else. If you think a second one is needed, write the decision record first and let
  someone read it before you install anything.
- **No logic in a catalogue, no prose in the code.** The tool derives `index.md` from
  front matter; if you find yourself wanting to hand-write an entry, the description
  belongs in the document instead.

## When you are done

```bash
pnpm test         # every behaviour is pinned by a test
pnpm type-check   # strict, and noUncheckedIndexedAccess is on
pnpm docs:check   # the tool, run against this repository's own bundle
```

All three must pass. `pnpm docs:check` is the one that catches documentation you forgot
to update, which is the whole point of the tool.

## Writing a document

Every document under `docs/` carries OKF v0.2 front matter:

```yaml
---
type: "Design Decision"
title: "The catalogue is derived, but never destructive"
description: "why index.md is generated, and why --write refuses to delete a sentence"
tags: [decision, index, safety]
status: "stable"
generated: { by: claude-opus-5, at: 2026-09-10T22:15:54Z }
sources:
  - id: implementation
    resource: /src/index-cmd.ts
    title: "The functions this decision describes"
    last_modified: 2026-09-10T22:10:06Z
---
```

Rules that matter more than the rest:

- **`sources[].resource` must point at something real, and `last_modified` must come
  from git**, not from your sense of when it changed:
  `git log -1 --format=%cI -- src/index-cmd.ts`. The drift check reads these, so an
  invented timestamp makes the tool lie.
- **Absence carries meaning. Never fill a field to look complete.** A document with no
  `verified` key has not been verified, and that is useful information.
- **Never write a `human:` verifier.** `verified` takes actors — `human:oscar`,
  `process:link-check`, `claude-opus-5/v1`. An agent writing `human:` forges the format's
  highest trust tier. Write `generated:` instead and let a person add their own line.
- **A decision record names what was rejected**, and the condition that would reverse the
  decision. One with no alternatives in it is a press release.

## The log

`log.md` records **why a document moved**, not that it changed — git already has that.
An entry earns its place if a reader six months from now would otherwise repeat a
mistake. A reversal is always worth an entry; a typo fix never is.

The spec leaves the shape open. Write new entries this way, newest first, under an ISO
`## YYYY-MM-DD` heading:

```markdown
- **Creation** [distribution.md](./distribution.md) drops npm publishing, and takes the
  registry-reach argument away from [language-choice.md](./language-choice.md).
```

- **The action comes first**, bold: `Creation`, `Update`, `Deprecation`.
- **Then the document, as a link.** A reader scanning the file is scanning for which
  document moved, so it belongs in the opening clause rather than at the end.
- **One sentence.** The test is mechanical: cut every entry at its first period and read
  the file top to bottom. If a day still makes sense, the entries are the right shape. A
  second sentence is earned only by a constraint on the next writer.

This is a house style, not a rule the tool enforces, and a hand-written log that ignores
it is still conformant.

## Style

- Short. State the rule, then explain it.
- Comments in the code explain *why*, never *what*. The `what` is the code.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
