# okf-drift

Tells you when a knowledge bundle has stopped being true.

Documentation does not usually rot because it was written badly. It rots because the
thing it described moved, and nothing complained. `okf-drift` is the thing that
complains.

```
$ okf-drift index --check docs

  MISSING    design/index.md
             the catalogue describes caching.md but the document has no description
             move it into the front matter: description: "why prices are cached per-tenant"

  STALE      design/index.md
             catalogue describes auth.md differently from the document
             document says: how identity is carried between services

2 of 3 catalogues need review.
```

Exits `0` when nothing has drifted and `1` when something has, so it belongs in CI.

## Install

This is not on npm, [on purpose](docs/design/distribution.md). Install it from here.

**As a command, anywhere:**

```bash
npm install -g github:oscar-io/okf-drift
okf-drift index --check docs
```

**As a dependency of one project:**

```bash
npm install --save-dev github:oscar-io/okf-drift
```

```json
{ "scripts": { "docs:check": "okf-drift index --check docs" } }
```

```bash
npm run docs:check
```

**Once, without installing:**

```bash
npx github:oscar-io/okf-drift index --check docs
```

Node >= 20. The bundle it checks can be in a repository written in anything.

## Two oracles

A document is checked against something that is known to be current. There are two such
things, and each is a command:

| Command | Compares | Against |
|---|---|---|
| `okf-drift index` | catalogues (`index.md`) | the documents beside them |
| `okf-drift check` | documents | the code, via git history |

### `okf-drift check`

```
$ okf-drift check docs

  STALE      design/index-command.md
             /src/index-cmd.ts changed 2026-09-11, 3 commits after this document was last reviewed
             reviewed 2026-09-10, source changed 2026-09-11

  GONE       design/queue.md
             /src/queue/worker.ts no longer exists

1 of 12 documents need review.
  13 sources compared against git history.
```

| Finding | Means |
|---|---|
| `stale-source` | cited code changed after `sources[].last_modified` |
| `unverified-since-change` | cited code changed after the newest `verified.at` |
| `missing-source` | a cited file is gone |
| `expired` | `stale_after` is in the past |

A document reviewed *after* the code changed is not stale, so re-reading one and adding a
`verified` entry silences it honestly.

**Without git it still works, and says so.** A bundle in a tarball or an Obsidian vault is
checked as far as it can be — a missing citation is still a missing citation — and the
report names what it could not verify rather than passing silently. Use `--require-git`
where the check must actually have happened.

### `okf-drift index`

```bash
okf-drift index --check docs     # report, exit 1 if anything drifted
okf-drift index --write docs     # regenerate the catalogues
okf-drift index --strict docs    # compare descriptions exactly
```

| Finding | Means |
|---|---|
| `unlisted-document` | the document exists and the catalogue does not mention it |
| `dangling-entry` | the catalogue lists something that is not there |
| `description-drift` | the catalogue describes it differently from its own front matter |
| `undescribed-document` | the catalogue has a description and the document does not |
| `invalid-description` | `description` is present but is not a string |
| `no-index` | the directory has documents and no catalogue |

Formatting is not drift: case, punctuation and whitespace are ignored unless you pass
`--strict`. And `--write` never deletes a description it cannot derive, because a
documentation tool that deletes documentation deserves to be uninstalled.

## In CI

```yaml
- run: npx github:oscar-io/okf-drift index --check docs
```

## As a library

```ts
import { readBundle, checkIndexes } from 'okf-drift'

const { findings } = checkIndexes(readBundle('docs'))
for (const f of findings) console.log(f.code, f.id, f.message)
```

## This repository is the example

`docs/` here is a real OKF bundle describing the tool in `src/`, and CI runs the tool
against it on every push. If you want to see the layout rather than read about it, start
at [`docs/index.md`](docs/index.md) — and
[`docs/log.md`](docs/log.md) is where the format earns its keep, because it records
which decisions were reversed and why.

## Licence

MIT
