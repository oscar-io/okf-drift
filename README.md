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
| `okf-drift` | documents | the code, via git history |

The second one is not implemented yet. See
[`docs/design/`](docs/design/index.md) for where it is going.

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
