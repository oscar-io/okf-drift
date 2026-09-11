# design: update log

Why the decisions in this directory changed. Newest first.

## 2026-09-11

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
