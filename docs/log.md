# update log

Why the documents in this bundle moved. Newest first. Entries record decisions and
reversals, not every edit — git already holds those.

## 2026-09-10

**Inception.** Started as a catalogue generator. The premise: keeping `index.md` current
by hand is the bookkeeping that kills wikis, and an agent can now be told to do it for
free. Recorded in [`design/catalogue-generation.md`](design/catalogue-generation.md).

**Decided TypeScript over Go and Python**, and wrote down what would reverse it, because
this is the kind of choice that quietly becomes permanent when nobody records the
alternative. [`design/language-choice.md`](design/language-choice.md).

**Reported catalogue differences instead of only fixing them.** `--write` alone is a
formatter; it cannot run in CI on a pull request and say what is wrong. Splitting
`--check` from `--write` is what makes the tool useful to someone who has not adopted it
yet.

**Loosened the description comparison to ignore formatting.** Exact string equality
flagged a hyphen and a capital letter as drift. A check that reports noise gets switched
off, so the comparison now normalises first and `--strict` keeps the old behaviour for
anyone who wants it.

**Stopped `--write` deleting prose.** A document with no `description` in its front
matter caused regeneration to silently drop a hand-written summary from the catalogue.
Found by asking what happens when an optional field is missing, before running the tool
on this bundle — which would have eaten these descriptions as they were written. The
rule is now that a description already in the catalogue survives.
