# design: update log

Why the decisions in this directory changed. Newest first.

## 2026-09-11

- **Update** every decision here takes a `Topic: assertion` title, because one read on its
  own named a conclusion without its subject and the filename that supplied it is not a
  field any consumer promises to show.

- **Update** [authoring-guide.md](./authoring-guide.md) corrects its own actor example: it
  offered a bare model name under a heading reading `tool/version`, and thirteen documents
  copied it.

- **Creation** [drift-oracles.md](./drift-oracles.md) makes "I could not check this" a third
  outcome, because a checker that silently verifies nothing is worse than one that fails.

- **Creation** [authoring-guide.md](./authoring-guide.md) collects the house style out of
  `AGENTS.md`, so rules the tool enforces can cite the code that enforces them.

## 2026-09-10

- **Update** [index-command.md](./index-command.md) is implemented: `--write` now edits one
  section in place and refuses a file it cannot reproduce, instead of overwriting it.
- **Update** [index-command.md](./index-command.md) absorbs `catalogue-generation.md` and
  `index-sections.md`, which stated one safety rule twice and would have drifted apart.
- **Creation** [index-command.md](./index-command.md) scopes generation to two headings after
  `--write` destroyed a hand-written registry, so an index may now be edited by hand.
- **Creation** [distribution.md](./distribution.md) drops npm publishing, and takes the
  registry-reach argument away from [language-choice.md](./language-choice.md).
- **Creation** [language-choice.md](./language-choice.md) picks TypeScript over Go, and names the
  condition that would reverse it.
