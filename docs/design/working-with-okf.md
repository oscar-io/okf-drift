---
# OKF v0.2
type: "Reference"
title: "How a change actually moves through this bundle"
description: "the working loop that produced this repository, reconstructed from what happened rather than from what was planned"
tags: [reference, workflow, process]
status: "stable"
generated: { by: claude/opus-5, at: 2026-09-11T00:50:36Z }
sources:
  - id: tickets
    resource: /docs/product/tickets/index.md
    title: "The six tickets, five of which were found by using the tool rather than by planning"
    last_modified: 2026-09-11T00:42:55Z
  - id: status
    resource: /docs/status.md
    title: "The register that closes the loop, and the last artefact to be invented"
    last_modified: 2026-09-11T00:42:55Z
---

# How a change actually moves through this bundle

Reconstructed from sixteen commits, not from a process anyone designed up front. It is
written down because the order is not obvious and getting it wrong is expensive: the two
worst defects in this repository both came from writing a decision and implementing it
later, in different sittings.

## The loop

```
notice → ticket → decide → implement → run the tool → record → check
```

**Notice.** Nearly everything started here, and almost nothing started with a plan. Five
of six tickets exist because the tool was used on its own documents and misbehaved: it
reported a table-shaped registry as empty, deleted a hand-written one, rejected the
specification's own index example, and silently discarded a verification a human wrote by
hand. The sixth came from reading the spec properly. **None came from a roadmap.**

**Ticket, before deciding.** An id exists from the moment an idea is written down, which
is what lets a decision record cite `DRIFT-0005` instead of describing a plan nobody can
find. Cheap enough that deferring something costs one file, so deferring stops being a
loss and becomes a recorded choice.

**Decide, when there is an alternative to reject.** Not every ticket earns a decision
record. `DRIFT-0006` was four bugs and a fix, so it never got one. But "what happens when
git is absent" had three defensible answers and the wrong one would have been silently
harmful, so it earned [`drift-oracles.md`](drift-oracles.md) before a line was written.

**Implement, in the same sitting as the decision.** The single most expensive mistake here
was writing [`index-command.md`](index-command.md), agreeing it, and implementing it an
hour later. In between, `--write` still had the old behaviour, and it destroyed the ticket
registry. A decision that is written and not built is a claim the repository cannot
support.

**Run the tool.** `pnpm docs:check` and `pnpm test`, every time. This is the step that
found four of the six defects.

**Record, in three places, each answering a different question.**

| Question | File |
|---|---|
| What is this document? | its own front matter |
| What is in this directory? | `index.md` |
| Why did it move? | `log.md` |
| Is it built, or only intended? | `status.md` |

**Check again, then commit.** `pnpm docs:check` after the recording, because updating a
document is exactly what makes its catalogue stale.

## What the order actually protects

**Ticket before decision** stops a decision growing an appendix of everything it chose not
to do. Each deferral becomes an id the decision can point at.

**Decision before code** is only worth it when an alternative is being rejected. Otherwise
it is ceremony, and ceremony is what makes people stop writing documents.

**Code in the same sitting as the decision.** Written-and-unbuilt is the state that caused
real damage.

**Recording before committing**, because the commit is where a session can end. Anything
not written down by then is lost, and this repository was built across three sessions with
a context wipe between each.

## The rule that made the rest work

**Use the tool on itself.** Four defects came from this and none from unit tests:

| Found by | Defect |
|---|---|
| writing a ticket registry as a table | the parser only understood lists |
| running `--write` on it | it replaced the whole file |
| reading the spec | three link forms rejected, one MUST violated |
| hand-writing a verifier | a display name silently unverified the document |

A test asks whether the code does what its author expected. Using the tool asks whether
that expectation was right. Only the second kind found anything here.

## What is deliberately not in the loop

**A plan document, except in flight.** One was written for the git oracle and deleted the
day it landed, exactly as it instructed. Its single durable question became a decision
record. A plan that outlives its work becomes a description of a past intention that
reads like a current commitment.

**A handoff file.** One existed across two session boundaries and was retired once
`status.md`, the tickets and `AGENTS.md` covered its content. Workflow state is not
knowledge; it has no claim to be kept true, so a checker would only ever find it stale.

**Deciding early.** [`DRIFT-0003`](../product/tickets/DRIFT-0003.md) has been open all along
and should stay open: the evidence needed to settle it is a bundle bigger than this one.
An open question recorded as open is worth more than a decision made on no evidence.
