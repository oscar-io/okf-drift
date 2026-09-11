---
# OKF v0.2
type: "Reference"
title: "The lifecycle an agent should follow in this bundle"
description: "the workflow this repository follows when a document is created, a ticket delivered or a plan completed, and which files to update each time"
tags: [ reference, workflow, agent, index, log ]
status: "stable"
generated: { by: pi/opus-5, at: 2026-09-11T01:14:21Z }
verified: { by: "human:oscar-io", at: 2026-09-11T01:52:00Z }
sources:
  - id: guide
    resource: /docs/design/authoring-guide.md
    title: "How to write the front matter this workflow moves around"
  - id: status
    resource: /docs/status.md
    title: "The register several of these events update"
  - id: check
    resource: /src/index-cmd.ts
    title: "The catalogue check that enforces the index half of it"
    last_modified: 2026-09-11T00:29:00Z
---

# The lifecycle an agent should follow in this bundle

**Follow this, here.** An OKF bundle is only useful to the next session if it is true when
this one ends, and keeping it true is mechanical work — an index entry, a log line, a
status flag. Mechanical work is exactly what an agent should absorb.

Each event below lists the files to update. The check at the end of every one is the same.
When in doubt about whether something is worth recording, the test is always the next
reader, never the size of the change.

## Whose rule this is

**OKF imposes no workflow.** It is a document format: markdown with front matter in a
directory. It says an `index.md` *may* exist and a `log.md` *may* exist, and it says
nothing whatever about when to write to them. That restraint is the format's best
property, because it is what lets one bundle serve a team's process and another serve a
single person's notes.

So this document is **one workflow, chosen by this repository**. Three separate voices get
confused if they are not kept apart:

| Layer         | Force          | Example                                           |
|---------------|----------------|---------------------------------------------------|
| The spec      | `MUST` / `MAY` | `type` is required; an index is optional          |
| `okf-drift`   | an exit code   | a catalogue must match the documents beside it    |
| This document | house rule     | a delivered ticket is rewritten in the past tense |

Only the first is binding on anybody. The third is binding *here*, and the imperative mood
below is deliberate: an agent given a menu of options will pick differently on Tuesday than
on Wednesday, and a bundle updated inconsistently is worse than one updated by a rule
somebody disagrees with. **The value is that a choice was made, not that this is the right
choice.**

Copy it, or replace it with your own. A team tracking work in pull requests would put
numbers in log entries; one with reviewers would use `verified` far more than this bundle
does. Both are conformant. What is not worth doing is leaving it unwritten and hoping.

## The events

### A document is created

1. Write it with front matter: `type`, `title`, `description`, and `sources` if it cites
   anything.
2. Add it to the directory's `index.md` — `pnpm docs:write`, or by hand.
3. Add a **Creation** line to that directory's `log.md`.
4. If it is a decision or a claim about behaviour, add it to [`status.md`](../status.md) under
   the section that says what it may claim.

### A document is updated

Only two of the four move. **The index does not change** unless the `description` changed,
and `log.md` gets an entry **only if a future writer needs to know**. A typo fix earns
nothing; a reversal always earns a line.

If the update changes what the document is allowed to claim — a proposal becoming a
description of built behaviour — `status.md` moves too.

### A ticket is delivered

1. `implementation: "done"`, and `status: "stable"` if it was `draft`.
2. Update the row in the ticket registry.
3. **Rewrite the ticket in the past tense**, saying what was built. A delivered ticket that
   still reads as a proposal misleads every later reader.
4. **Record the gaps in the ticket itself**, not in a commit message. `DRIFT-0006` closed
   with a section naming what it did not cover; that section is why the next reader does
   not assume `## Directories` works.
5. Move it to the done section of `status.md`, and log it.

A ticket is not deleted when it is delivered. It keeps *why* the thing exists, which
outlives the change.

### A ticket is rejected

The same, with `implementation: "rejected"`. Rewrite it to lead with the decision and keep
the reasoning: a rejected ticket exists so the idea is not proposed again from scratch, so
the half worth keeping is why it was turned down, not what it proposed.

### A plan is completed

**Delete it.** A plan describes intent, and intent that has happened is no longer true.
Before deleting, move anything durable into a decision record — usually there is exactly
one thing, and if there is nothing, that is a healthy plan.

Log it as a **Deprecation** naming where the durable part went. That line is the only trace
the plan needs.

### A decision is superseded

Do not silently rewrite it. Either:

- **Amend it** and log an **Update** saying what changed and why, or
- **Write a new decision** and add a sentence to the old one pointing at it.

The second is right when the old reasoning still explains something. When
[`distribution.md`](../design/distribution.md) removed an argument that
[`language-choice.md`](../design/language-choice.md) relied on, both documents said so. A
later decision quietly weakening an earlier one is invisible otherwise, and that is the
failure the format exists to prevent.

### Two documents turn out to say the same thing

Merge them, and log an **Update** naming the ones absorbed. Duplication in a bundle is not
untidiness, it is a future contradiction: two copies of a rule will diverge, and then
neither is trustworthy.

### A document is retired

Delete it and log a **Deprecation** saying what replaced it. If nothing did, say that — a
document deleted because it was never true is worth one line.

### A session ends

Nothing special, and that is the point. The bundle is the handoff. Anything a scratch file
would have said belongs in a ticket, a log entry or `status.md`; whatever is left is
workflow state, which has no claim to be kept true.

## After every event

```bash
pnpm docs:check    # the catalogue matches the documents
pnpm docs:drift    # the documents match the code they cite
```

The first catches the index entry that was forgotten. The second catches a document whose
`sources` moved on without it. Both belong in CI, where they run whether or not anyone
remembered.

## What the tool enforces, and what it cannot

|                  |                                                                                                                                                                               |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Enforced**     | index entries, descriptions matching front matter, cited files existing, cited code changing after a document was written or reviewed, `stale_after`, unreadable trust claims |
| **Not enforced** | whether a log entry was earned, whether a decision names its alternatives, whether `status.md` is honest, whether a plan was deleted                                          |

The second column is the interesting half, which is why it is written down rather than
automated. A check that cannot fail teaches nothing.

Note that the first column mixes the spec's rules with this tool's opinions. `okf-drift`
reports a directory that has documents and no `index.md`, which the spec explicitly
permits; that is a house rule enforced by a tool, not a conformance failure. See
[`DRIFT-0007`](tickets/DRIFT-0007.md).

## The one rule underneath all of it

**Record before the session ends, not before the work is done.** A commit is a good
moment; a session boundary is a hard one. Everything not written to disk is lost, and an
agent has no memory that survives it — which is the whole reason the bundle is in the
repository rather than in a conversation.
