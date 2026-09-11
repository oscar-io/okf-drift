/**
 * The git oracle's only contact with git.
 *
 * Shelling out rather than taking a dependency: the surface needed is three
 * subcommands, and a library that wraps all of git is a large thing to install
 * for `log`, `ls-files` and `rev-parse`.
 *
 * Every function here answers with `null` rather than throwing when git cannot
 * say. A bundle distributed as a tarball has no history, which is a legitimate
 * state and not an error.
 */
import { execFileSync } from 'node:child_process'
import { relative, resolve } from 'node:path'

function git(cwd: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 16 * 1024 * 1024,
    }).trim()
  } catch {
    return null
  }
}

/**
 * The repository a directory belongs to, or `null` when it belongs to none.
 *
 * `null` is the answer for a bundle outside version control, and the caller is
 * expected to report that once rather than treat every document as broken.
 */
export function repoRoot(dir: string): string | null {
  const root = git(dir, ['rev-parse', '--show-toplevel'])
  return root === null || root === '' ? null : resolve(root)
}

/** Whether git tracks a path, which is different from the file existing. */
export function isTracked(root: string, path: string): boolean {
  return git(root, ['ls-files', '--error-unmatch', '--', relative(root, path) || '.']) !== null
}

/**
 * When a path last changed, by committer date.
 *
 * Committer date rather than author date: a rebased or cherry-picked commit
 * keeps its original author date, which would report a change as older than
 * the history it actually sits in.
 */
export function lastChanged(root: string, path: string): Date | null {
  const iso = git(root, ['log', '-1', '--format=%cI', '--', relative(root, path) || '.'])
  if (iso === null || iso === '') return null
  const at = new Date(iso)
  return Number.isNaN(at.getTime()) ? null : at
}

/**
 * How many commits touched a path strictly after an instant.
 *
 * `--since` is second-granular and inclusive of its boundary, so it cannot
 * express "after this exact moment" and a document written in the same second
 * as the commit it describes would report itself one commit behind. It is used
 * only to bound the scan, a second early; the comparison itself is done here.
 */
export function commitsSince(root: string, path: string, since: Date): number {
  const bound = new Date(since.getTime() - 1000).toISOString()
  const out = git(root, ['log', '--format=%cI', `--since=${bound}`, '--', relative(root, path) || '.'])
  if (out === null || out === '') return 0
  return out
    .split('\n')
    .filter((line) => line !== '')
    .map((iso) => new Date(iso).getTime())
    .filter((at) => !Number.isNaN(at) && at > since.getTime()).length
}
