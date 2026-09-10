# index

The knowledge behind `okf-drift`, and the worked example of the layout the tool checks.
This bundle describes the tool in the repository around it, so the documents here are
kept honest by `okf-drift index --check docs` in CI.

Read this first, then the directory you need.

## Directories

- [`design/`](design/index.md) - decisions about how the tool works, and what was rejected.

## Reading order for a newcomer

1. [`design/language-choice.md`](design/language-choice.md) - why TypeScript, and what
   would reverse it.
2. [`design/catalogue-generation.md`](design/catalogue-generation.md) - the rule the
   `index` command implements.
3. [`log.md`](log.md) - why any of it changed.

## Conventions

Every document carries OKF v0.2 front matter. `description` is what the catalogue in
each directory quotes, so it is written as a sentence fragment that completes "this
document explains…".

`index.md` is generated: run `pnpm docs:write` rather than editing a catalogue by hand.
This file is the exception, because the root directory holds no documents of its own and
so nothing generates it.

What changed and why is in [`log.md`](log.md).
