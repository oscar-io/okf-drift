/**
 * Walking a bundle: which files are concepts, and which are the two reserved
 * catalogue files that describe them.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { type FrontMatter, type ParsedDocument, FrontMatterError, splitFrontMatter } from './frontmatter.js'

/** Reserved per directory by the spec, and never concepts themselves. */
export const RESERVED = ['index.md', 'log.md'] as const

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', '__pycache__'])

export interface Concept {
  /** Absolute path on disk. */
  path: string
  /** Path relative to the bundle root, POSIX separators. Also the concept id. */
  id: string
  /** Directory relative to the bundle root, `''` for the root itself. */
  dir: string
  meta: FrontMatter
  body: string
}

export interface BundleDirectory {
  /** Directory relative to the bundle root, `''` for the root itself. */
  dir: string
  concepts: Concept[]
  hasIndex: boolean
  hasLog: boolean
}

export interface Bundle {
  root: string
  concepts: Concept[]
  directories: BundleDirectory[]
  /** Documents that could not be parsed, reported rather than thrown. */
  unreadable: { id: string; reason: string }[]
}

function toPosix(path: string): string {
  return sep === '/' ? path : path.split(sep).join('/')
}

function markdownFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue
      found.push(...markdownFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      found.push(full)
    }
  }
  return found
}

/**
 * Read a bundle from disk.
 *
 * A file with no front matter is not a concept. That rule is what lets a bundle
 * live inside a repository that already has a README and a CONTRIBUTING file
 * without those being catalogued as knowledge.
 */
export function readBundle(root: string): Bundle {
  if (!statSync(root).isDirectory()) {
    throw new Error(`not a directory: ${root}`)
  }

  const concepts: Concept[] = []
  const unreadable: { id: string; reason: string }[] = []
  const seenDirectories = new Map<string, BundleDirectory>()

  const directoryFor = (dir: string): BundleDirectory => {
    let record = seenDirectories.get(dir)
    if (!record) {
      record = { dir, concepts: [], hasIndex: false, hasLog: false }
      seenDirectories.set(dir, record)
    }
    return record
  }

  for (const path of markdownFiles(root).sort()) {
    const id = toPosix(relative(root, path))
    const dir = toPosix(relative(root, join(path, '..')))
    const name = id.slice(id.lastIndexOf('/') + 1)
    const record = directoryFor(dir)

    if (name === 'index.md') {
      record.hasIndex = true
      continue
    }
    if (name === 'log.md') {
      record.hasLog = true
      continue
    }

    let parsed: ParsedDocument
    try {
      parsed = splitFrontMatter(readFileSync(path, 'utf8'))
    } catch (error) {
      if (error instanceof FrontMatterError) {
        unreadable.push({ id, reason: error.message })
        continue
      }
      throw error
    }

    if (parsed.meta === null) continue

    const concept: Concept = { path, id, dir, meta: parsed.meta, body: parsed.body }
    concepts.push(concept)
    record.concepts.push(concept)
  }

  const directories = [...seenDirectories.values()].sort((a, b) => a.dir.localeCompare(b.dir))
  return { root, concepts, directories, unreadable }
}
