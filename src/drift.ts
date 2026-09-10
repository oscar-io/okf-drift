/**
 * `okf-drift` — the code oracle. NOT IMPLEMENTED YET.
 *
 * The idea, which is the reason this tool exists rather than being another
 * validator: a document is not wrong because it is malformed, it is wrong
 * because the thing it describes moved. Git already knows when that happened,
 * so no extra bookkeeping is needed to find out.
 *
 * Planned checks, each comparing a document against a reference point:
 *
 *   sources[].resource changed in git since sources[].last_modified   -> stale
 *   sources[].resource changed in git since the newest verified.at    -> stale
 *   sources[].resource no longer exists                               -> gone
 *   stale_after is in the past                                        -> expired
 *
 * Deliberately out of scope for v0.1: guessing which files a document is about
 * when it declares no sources. A wrong guess is worse than no answer, because
 * a check nobody trusts gets switched off.
 *
 * See docs/design/drift-detection.md for the decision and what was rejected.
 */
import type { Bundle } from './bundle.js'
import type { Finding } from './report.js'

export interface DriftOptions {
  /** Repository to read history from. Defaults to the bundle root's repo. */
  repo?: string
  /** Treat a document as stale this many days after its sources changed. */
  graceDays?: number
  /** Clock injection, so tests do not depend on today. */
  now?: Date
}

export interface DriftResult {
  findings: Finding[]
  checked: number
}

export function checkDrift(_bundle: Bundle, _options: DriftOptions = {}): DriftResult {
  // TODO(v0.1): implement the git oracle.
  //
  //  1. `git -C <repo> rev-parse --show-toplevel` to locate the repository, and
  //     report cleanly when the bundle is not in one instead of throwing.
  //  2. For each concept, for each source with a resource that resolves to a
  //     tracked path: `git log -1 --format=%cI -- <path>` for its last change.
  //  3. Compare that instant against `last_modified`, then against the newest
  //     `verified.at`. The later of the two is the fair reference point: a
  //     document reviewed after the code changed is not stale.
  //  4. `git log --oneline --since=<instant> -- <path> | wc -l` for the commit
  //     count that makes the finding concrete in the report.
  //  5. A resource that resolves to nothing is `gone`, which is a different
  //     severity because the fix is deleting or rewriting, not re-reading.
  //
  // Shell out with child_process.execFileSync rather than taking a git
  // dependency: this needs log, ls-files and rev-parse, and nothing else.
  throw new Error(
    'drift detection is not implemented yet — see docs/design/drift-detection.md.\n' +
      'The catalogue check is available today: okf-drift index --check <bundle>',
  )
}
