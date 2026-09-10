# ticket registry

Each idea gets a stable `DRIFT-####` id and its own file here, whether or not it is
prioritised. An id exists from the moment an idea is written down, so it can be cited in
a source comment or a decision record before any pull request exists — `// see
DRIFT-0002` rather than prose describing a plan nobody can find.

A ticket says what an idea *is*. It does not say when it will be done.

## Minting a new id

1. Find the highest `DRIFT-####.md` here and create the next one, zero-padded to four
   digits. Never reuse a number, even for an abandoned ticket.
2. Give it OKF front matter with `type: "Feature Idea"` and `implementation: proposed`,
   or `partial` when some of it already exists — cite the source that shows what landed.
3. Add a row to the table below.

## Tickets

| Id | Title | Implementation |
|---|---|---|
| [`DRIFT-0001`](DRIFT-0001.md) | Report a malformed `verified` block | proposed |
| [`DRIFT-0002`](DRIFT-0002.md) | The git oracle | partial |
| [`DRIFT-0003`](DRIFT-0003.md) | Decide whether a terser catalogue summary is drift | proposed |
| [`DRIFT-0004`](DRIFT-0004.md) | Configurable index section headings | proposed |
| [`DRIFT-0005`](DRIFT-0005.md) | Regenerate a section in the shape it already has | proposed |
| [`DRIFT-0006`](DRIFT-0006.md) | Conform to the spec's link and index rules | partial |

## Why not GitHub issues

Issues live outside the repository, so an agent reading the checkout cannot see them and
a clone is no longer the whole story. These are markdown in git for the same reason the
rest of `docs/` is: the knowledge travels with the code that will implement it.
