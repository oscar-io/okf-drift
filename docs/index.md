# index

The knowledge behind `okf-drift`, and the worked example of the layout the tool checks.
This bundle describes the tool in the repository around it, so the documents here are
kept honest by `okf-drift index --check docs` in CI.

Read this first, then the directory you need.

## Documents

- [`status.md`](status.md) - which documents describe what the tool does today, which describe intentions, and which behaviour is built versus planned.

## Directories

- [`design/`](design/index.md) - decisions about how the tool works, and what was rejected.
- [`product/tickets/`](product/tickets/index.md) - the backlog, one file per idea, with a stable id.
- [`plans/`](plans/index.md) - working plans, deleted once the work lands.

## Reading order for a newcomer

1. [`design/language-choice.md`](design/language-choice.md) - why TypeScript, and what
   would reverse it.
2. [`design/working-with-okf.md`](design/working-with-okf.md) - the loop a change moves
   through, and why the order matters.
3. [`design/authoring-guide.md`](design/authoring-guide.md) - how to write a document
   here, and which rules the tool enforces.
4. [`design/index-command.md`](design/index-command.md) - the rule the `index` command
   implements, and the file it is not allowed to own.
5. [`status.md`](status.md) - what is built and what is only intended.
6. [`log.md`](log.md) - why any of it changed.

## Conventions

Every document carries OKF v0.2 front matter. `description` is what the catalogue in
each directory quotes, so it is written as a sentence fragment that completes "this
document explains…".

`index.md` is generated: run `pnpm docs:write` rather than editing a catalogue by hand.
This file is the exception, because the root directory holds no documents of its own and
so nothing generates it.

What changed and why is in [`log.md`](log.md).
