import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { commitsSince, isTracked, lastChanged, repoRoot } from '../src/git.js'

let root: string

/**
 * A real repository, not a mock. Mocking git would test the mock: the whole
 * value of this module is that its answers match what git actually says.
 */
function run(args: string[], cwd = root): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' })
}

/**
 * Commit at a controlled instant.
 *
 * Git timestamps have one-second resolution, so commits made in the same second
 * are indistinguishable by time. Tests that race the wall clock would be
 * flaky; each commit is given an explicit date instead.
 */
let clock = new Date('2026-01-01T12:00:00Z')

function commit(path: string, text: string, message: string, secondsLater = 60): void {
  clock = new Date(clock.getTime() + secondsLater * 1000)
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, text)
  run(['add', path])
  execFileSync(
    'git',
    ['-c', 'user.name=T', '-c', 'user.email=t@e', '-c', 'commit.gpgsign=false', 'commit', '-m', message],
    {
      cwd: root,
      stdio: 'ignore',
      env: { ...process.env, GIT_AUTHOR_DATE: clock.toISOString(), GIT_COMMITTER_DATE: clock.toISOString() },
    },
  )
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'okf-git-'))
  clock = new Date('2026-01-01T12:00:00Z')
  run(['init', '-q', '-b', 'main'])
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('repoRoot', () => {
  it('finds the repository from a subdirectory', () => {
    commit('src/a.ts', 'x', 'add a')
    expect(repoRoot(join(root, 'src'))).toBe(repoRoot(root))
  })

  it('is null outside a repository, which is a state and not an error', () => {
    const loose = mkdtempSync(join(tmpdir(), 'okf-loose-'))
    try {
      expect(repoRoot(loose)).toBeNull()
    } finally {
      rmSync(loose, { recursive: true, force: true })
    }
  })
})

describe('isTracked', () => {
  it('separates a tracked file from one that merely exists', () => {
    commit('src/a.ts', 'x', 'add a')
    writeFileSync(join(root, 'untracked.ts'), 'y')

    expect(isTracked(root, join(root, 'src/a.ts'))).toBe(true)
    expect(isTracked(root, join(root, 'untracked.ts'))).toBe(false)
    expect(isTracked(root, join(root, 'never-existed.ts'))).toBe(false)
  })
})

describe('lastChanged', () => {
  it('reports the instant of the last commit touching a path', () => {
    commit('src/a.ts', 'x', 'add a')
    const first = lastChanged(root, join(root, 'src/a.ts'))
    expect(first).toBeInstanceOf(Date)

    commit('src/b.ts', 'y', 'add b')
    // b moved, a did not.
    expect(lastChanged(root, join(root, 'src/a.ts'))?.getTime()).toBe(first?.getTime())
  })

  it('is null for a path with no history', () => {
    commit('src/a.ts', 'x', 'add a')
    expect(lastChanged(root, join(root, 'nothing.ts'))).toBeNull()
  })
})

describe('commitsSince', () => {
  it('counts only commits after the instant', () => {
    commit('src/a.ts', 'one', 'first')
    const afterFirst = lastChanged(root, join(root, 'src/a.ts'))!

    expect(commitsSince(root, join(root, 'src/a.ts'), afterFirst)).toBe(0)

    commit('src/a.ts', 'two', 'second')
    commit('src/a.ts', 'three', 'third')
    expect(commitsSince(root, join(root, 'src/a.ts'), afterFirst)).toBe(2)
  })

  it('does not count the commit that happened at the same instant', () => {
    // The boundary case that decides whether a freshly-written document reports
    // itself as already one commit behind. git's own --since cannot express it:
    // it is second-granular and inclusive, so the comparison is done in JS.
    commit('src/a.ts', 'one', 'first')
    const at = lastChanged(root, join(root, 'src/a.ts'))!
    expect(commitsSince(root, join(root, 'src/a.ts'), at)).toBe(0)
  })

  it('counts a commit one second later, the finest resolution git records', () => {
    commit('src/a.ts', 'one', 'first')
    const at = lastChanged(root, join(root, 'src/a.ts'))!
    commit('src/a.ts', 'two', 'second', 1)
    expect(commitsSince(root, join(root, 'src/a.ts'), at)).toBe(1)
  })

  it('ignores commits that touch other paths', () => {
    commit('src/a.ts', 'one', 'first')
    const at = lastChanged(root, join(root, 'src/a.ts'))!
    commit('src/other.ts', 'x', 'unrelated')
    expect(commitsSince(root, join(root, 'src/a.ts'), at)).toBe(0)
  })
})
