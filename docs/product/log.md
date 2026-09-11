# product: update log

Why the backlog changed. Newest first.

## 2026-09-11

- **Creation** [DRIFT-0008](./tickets/DRIFT-0008.md) rejects adoption for this tool and
  names the suite it belongs to, because a checker that never writes what it cannot derive
  should not also carry the code that guesses front matter.

- **Creation** [DRIFT-0007](./tickets/DRIFT-0007.md) records that `no-index` fails a bundle
  the spec permits, which is the same class of error as DRIFT-0006 and undermines every
  other finding the tool makes.
- **Update** [bundle-workflow.md](./bundle-workflow.md) says whose rule it is: OKF imposes
  no workflow, so the imperative below the preamble binds this repository and nobody else.

- **Creation** [bundle-workflow.md](./bundle-workflow.md) sets out the lifecycle an agent
  is to follow when a document is created, a ticket delivered or a plan completed, so the
  bookkeeping is a rule to apply rather than a trace of what happened.

- **Update** [DRIFT-0001](./tickets/DRIFT-0001.md) is done: an unreadable `verified`,
  `generated` or `last_modified` is reported instead of counting for nothing in silence.

- **Update** [DRIFT-0002](./tickets/DRIFT-0002.md) is done: the git oracle reports documents
  whose cited code moved after they were written or reviewed.

- **Update** [DRIFT-0006](./tickets/DRIFT-0006.md) is done: link targets resolve to paths, so
  the spec's own index example no longer reports five findings on a conformant bundle.

## 2026-09-10

- **Creation** [DRIFT-0006](./tickets/DRIFT-0006.md) collects four ways the tool contradicts the
  specification it enforces, found by reading the spec rather than its examples.
- **Creation** [DRIFT-0004](./tickets/DRIFT-0004.md) and [DRIFT-0005](./tickets/DRIFT-0005.md)
  defer configurable section names and table-shaped regeneration, both out of scope of the
  section decision that created them.
- **Creation** [tickets/](./tickets/index.md) starts the backlog with three tickets, all found by
  using the tool on this repository rather than by planning.
