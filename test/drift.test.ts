import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readBundle } from '../src/bundle.js'
import { checkDrift } from '../src/drift.js'

let root: string
let clock: Date

function git(args: string[]): void {
  execFileSync('git', args, { cwd: root, stdio: 'ignore' })
}

/** Commit at a controlled instant; git timestamps have one-second resolution. */
function commit(path: string, text: string, message: string): void {
  clock = new Date(clock.getTime() + 60_000)
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, text)
  git(['add', path])
  execFileSync(
    'git',
    ['-c', 'user.name=T', '-c', 'user.email=t@e', '-c', 'commit.gpgsign=false', 'commit', '-m', message],
    { cwd: root, stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_DATE: clock.toISOString(), GIT_COMMITTER_DATE: clock.toISOString() } },
  )
}

function doc(path: string, frontMatter: string): void {
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, `---\ntype: Design Decision\ndescription: a decision\n${frontMatter}\n---\nBody.\n`)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'okf-drift-'))
  clock = new Date('2026-01-01T12:00:00Z')
  git(['init', '-q', '-b', 'main'])
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('drift against git history', () => {
  it('reports a source that changed after the document recorded it', () => {
    commit('src/cache.ts', 'v1', 'add cache')
    doc('docs/caching.md', 'sources:\n  - { id: impl, resource: /src/cache.ts, last_modified: 2026-01-01T12:01:00Z }')
    commit('src/cache.ts', 'v2', 'change cache')

    const result = checkDrift(readBundle(join(root, 'docs')))
    expect(result.findings.map((f) => f.code)).toEqual(['stale-source'])
    expect(result.findings[0]?.message).toContain('1 commit after')
    expect(result.verified).toBe(1)
  })

  it('passes when the source has not moved since', () => {
    commit('src/cache.ts', 'v1', 'add cache')
    doc('docs/caching.md', 'sources:\n  - { id: impl, resource: /src/cache.ts, last_modified: 2026-01-01T12:01:00Z }')

    expect(checkDrift(readBundle(join(root, 'docs'))).findings).toEqual([])
  })

  it('treats a review after the change as current, not stale', () => {
    // The rule that keeps the check quiet enough to stay switched on.
    commit('src/cache.ts', 'v1', 'add cache')
    commit('src/cache.ts', 'v2', 'change cache')
    doc(
      'docs/caching.md',
      'verified: { by: "human:oscar", at: 2026-01-01T13:00:00Z }\nsources:\n  - { id: impl, resource: /src/cache.ts, last_modified: 2026-01-01T12:01:00Z }',
    )

    expect(checkDrift(readBundle(join(root, 'docs'))).findings).toEqual([])
  })

  it('names the review, not the record, when the review is the newer claim', () => {
    commit('src/cache.ts', 'v1', 'add cache')
    doc(
      'docs/caching.md',
      'verified: { by: "human:oscar", at: 2026-01-01T12:01:30Z }\nsources:\n  - { id: impl, resource: /src/cache.ts, last_modified: 2026-01-01T12:01:00Z }',
    )
    commit('src/cache.ts', 'v2', 'change cache')

    const finding = checkDrift(readBundle(join(root, 'docs'))).findings[0]
    expect(finding?.code).toBe('unverified-since-change')
    expect(finding?.message).toContain('last reviewed')
  })

  it('reports a cited file that no longer exists', () => {
    commit('docs/keep.md', 'x', 'seed')
    doc('docs/caching.md', 'sources:\n  - { id: impl, resource: /src/gone.ts, title: The implementation }')

    const finding = checkDrift(readBundle(join(root, 'docs'))).findings.find((f) => f.code === 'missing-source')
    expect(finding?.severity).toBe('gone')
    expect(finding?.detail).toContain('The implementation')
  })

  it('reports a document past its stale_after, which needs no git at all', () => {
    doc('docs/caching.md', 'stale_after: 2026-01-05T00:00:00Z')

    const result = checkDrift(readBundle(join(root, 'docs')), { now: new Date('2026-01-20T00:00:00Z') })
    expect(result.findings.map((f) => f.code)).toEqual(['expired'])
    expect(result.findings[0]?.message).toContain('15 days ago')
  })

  it('says nothing about a stale_after still in the future', () => {
    doc('docs/caching.md', 'stale_after: 2026-06-01T00:00:00Z')
    expect(checkDrift(readBundle(join(root, 'docs')), { now: new Date('2026-01-20T00:00:00Z') }).findings).toEqual([])
  })
})

describe('what cannot be checked is counted, never silently passed', () => {
  it('skips a URL rather than reporting it', () => {
    doc('docs/caching.md', 'sources:\n  - { id: spec, resource: "https://example.com/spec" }')

    const result = checkDrift(readBundle(join(root, 'docs')))
    expect(result.findings).toEqual([])
    expect(result.skipped).toEqual([{ reason: 'not a file', count: 1 }])
  })

  it('skips a source with nothing to compare against', () => {
    commit('src/cache.ts', 'v1', 'add cache')
    doc('docs/caching.md', 'sources:\n  - { id: impl, resource: /src/cache.ts }')

    const result = checkDrift(readBundle(join(root, 'docs')))
    expect(result.findings).toEqual([])
    expect(result.skipped).toEqual([{ reason: 'no last_modified or verified', count: 1 }])
  })

  it('skips a file git does not track', () => {
    commit('docs/keep.md', 'x', 'seed')
    writeFileSync(join(root, 'untracked.ts'), 'y')
    doc('docs/caching.md', 'sources:\n  - { id: impl, resource: /untracked.ts, last_modified: 2026-01-01T12:01:00Z }')

    const result = checkDrift(readBundle(join(root, 'docs')))
    expect(result.findings).toEqual([])
    expect(result.skipped).toEqual([{ reason: 'not tracked by git', count: 1 }])
  })
})

describe('a bundle outside git', () => {
  let vault: string

  beforeEach(() => {
    vault = mkdtempSync(join(tmpdir(), 'okf-vault-'))
    writeFileSync(join(vault, 'reading.md'), '---\ntype: Note\ndescription: a source note\n---\nBody.\n')
  })

  afterEach(() => {
    rmSync(vault, { recursive: true, force: true })
  })

  it('reports no repository, and checks what it still can', () => {
    // An Obsidian vault is a legitimate bundle. It is less verifiable, not
    // unverifiable: the filesystem still answers whether a citation exists.
    writeFileSync(
      join(vault, 'idea.md'),
      '---\ntype: Note\ndescription: an idea\nsources:\n  - { id: a, resource: ./reading.md }\n  - { id: b, resource: ./deleted.md }\n---\nBody.\n',
    )

    const result = checkDrift(readBundle(vault))
    expect(result.repo).toBeNull()
    expect(result.findings.map((f) => f.code)).toEqual(['missing-source'])
    expect(result.skipped).toEqual([{ reason: 'no git repository', count: 1 }])
  })

  it('finds nothing wrong in a sound vault, and still reports what it skipped', () => {
    writeFileSync(
      join(vault, 'idea.md'),
      '---\ntype: Note\ndescription: an idea\nsources:\n  - { id: a, resource: ./reading.md }\n---\nBody.\n',
    )

    const result = checkDrift(readBundle(vault))
    expect(result.findings).toEqual([])
    expect(result.verified).toBe(0)
    // The summary is the whole point: a green result that verified nothing
    // must say so.
    expect(result.skipped).toEqual([{ reason: 'no git repository', count: 1 }])
  })
})

describe('a trust claim the tool cannot read', () => {
  it('is reported, not silently discarded', () => {
    // The whole point of DRIFT-0001: this document says a human verified it.
    // A reader believes that. The code cannot, and used to say nothing.
    doc('docs/caching.md', 'verified: { by: "human:Oscar Reyes", at: 2026-01-01T12:00:00Z }')

    const finding = checkDrift(readBundle(join(root, 'docs'))).findings.find((f) => f.code === 'malformed-trust')
    expect(finding?.severity).toBe('unreadable')
    expect(finding?.message).toContain('verified.by')
  })

  it('says nothing about front matter it can read', () => {
    doc('docs/caching.md', 'verified: { by: "human:oscar-io", at: 2026-01-01T12:00:00Z }')
    expect(checkDrift(readBundle(join(root, 'docs'))).findings).toEqual([])
  })
})
