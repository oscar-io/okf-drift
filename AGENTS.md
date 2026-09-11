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

## Writing a document

**Read [`docs/design/authoring-guide.md`](docs/design/authoring-guide.md).** It is the
house style for front matter, actors, verifiers, decision records and logs, and it marks
which rules the tool enforces.

The three that cause the most damage when ignored:

- **`sources[].last_modified` comes from git**, never from memory:
  `git log -1 --format=%cI -- <path>`. Drift detection reads it, so a guess makes the
  tool lie.
- **Never write a `human:` verifier.** Write `generated:` and leave `verified:` to a
  person.
- **Absence carries meaning.** Never fill a field to look complete.

## While you work

- **An `index.md` may be edited by hand.** The tool assists; it does not own the file.
  Run `pnpm docs:write` when it saves typing, and edit directly when it does not.
- **Adding a dependency is a decision.** The runtime dependency is `yaml` and nothing
  else. If you think a second one is needed, write the decision record first and let
  someone read it before you install anything.
- **A ticket earns an id before a pull request exists.** Anything deferred goes in
  [`docs/product/tickets/`](docs/product/tickets/index.md) so it can be cited from a
  comment or a decision record.
- **Comments explain *why*, never *what*.** The `what` is the code.

## When you are done

```bash
pnpm test         # every behaviour is pinned by a test
pnpm type-check   # strict, and noUncheckedIndexedAccess is on
pnpm docs:check   # the tool, run against this repository's own bundle
```

All three must pass. `pnpm docs:check` is the one that catches documentation you forgot
to update, which is the whole point of the tool.

Then use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
