/**
 * `okf-drift index` — the catalogue check.
 *
 * The first oracle: a document against the `index.md` that claims to list it.
 * This is drift with the cheapest possible reference point, no git required,
 * and it is the bookkeeping that made people abandon wikis before an agent
 * could be told to do it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Bundle, BundleDirectory, Concept } from './bundle.js'
import type { Finding } from './report.js'

/** A line in a catalogue: `- [`file.md`](file.md) - description.` */
const ENTRY = /^\s*[-*]\s*\[`?([^\]`]+?)`?\]\(([^)]+)\)\s*(?:[-—:]\s*(.*))?$/

export interface CatalogueEntry {
  target: string
  description: string
}

export function parseCatalogue(text: string): CatalogueEntry[] {
  const entries: CatalogueEntry[] = []
  for (const line of text.split(/\r?\n/)) {
    const match = ENTRY.exec(line)
    if (!match) continue
    const target = (match[2] ?? '').trim()
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue // skip external links
    if (target === 'log.md' || target === 'index.md') continue // navigation, not a listing
    entries.push({ target, description: (match[3] ?? '').trim().replace(/\.$/, '') })
  }
  return entries
}

function conceptName(concept: Concept): string {
  return concept.id.slice(concept.id.lastIndexOf('/') + 1)
}

/**
 * A document's `description`, distinguishing the three states that matter.
 *
 * `description` is optional in OKF: only `type` is required for conformance, so
 * absence is never an error. A value that is present but not a string is a
 * different thing entirely, and is reported rather than coerced away.
 */
export type Description =
  | { kind: 'present'; text: string }
  | { kind: 'absent' }
  | { kind: 'invalid'; found: string }

export function describe(concept: Concept): Description {
  const description = concept.meta.description
  if (description === undefined || description === null) return { kind: 'absent' }
  if (typeof description !== 'string') {
    return { kind: 'invalid', found: Array.isArray(description) ? 'a list' : typeof description }
  }
  const text = description.trim().replace(/\.$/, '')
  return text === '' ? { kind: 'absent' } : { kind: 'present', text }
}

/**
 * Compare two descriptions the way a reader would.
 *
 * Case, surrounding whitespace and punctuation are formatting, not meaning, so
 * a difference in them is noise. A check that reports noise gets switched off,
 * which costs more than the differences it would have caught.
 */
export function normaliseDescription(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The catalogue this directory should have, derived from the documents in it.
 *
 * `fallbacks` carries descriptions already written in the existing catalogue,
 * used only where the document itself has none. Regenerating must never delete
 * prose: a documentation tool that silently drops a sentence someone wrote is
 * worse than one that reports nothing at all.
 */
export function renderIndex(directory: BundleDirectory, fallbacks: Map<string, string> = new Map()): string {
  const heading = directory.dir === '' ? 'index' : `${directory.dir}: index`
  const lines = [`# ${heading}`, '']

  if (directory.hasLog) {
    lines.push('What changed in any of these is in [`log.md`](log.md).', '')
  }

  lines.push('## Documents', '')
  for (const concept of [...directory.concepts].sort((a, b) => a.id.localeCompare(b.id))) {
    const name = conceptName(concept)
    const description = describe(concept)
    const text = description.kind === 'present' ? description.text : (fallbacks.get(name) ?? '')
    lines.push(`- [\`${name}\`](${name})${text ? ` - ${text}.` : ''}`)
  }
  lines.push('')
  return lines.join('\n')
}

export interface IndexOptions {
  /** Rewrite catalogues in place instead of reporting on them. */
  write?: boolean
  /** Compare descriptions byte for byte instead of ignoring formatting. */
  strict?: boolean
}

export interface IndexResult {
  findings: Finding[]
  checked: number
  written: string[]
}

/**
 * Compare every `index.md` against the documents beside it.
 *
 * A directory with no `index.md` and no concepts is not a finding: an empty
 * directory has nothing to catalogue.
 */
export function checkIndexes(bundle: Bundle, options: IndexOptions = {}): IndexResult {
  const findings: Finding[] = []
  const written: string[] = []
  let checked = 0

  for (const { id, reason } of bundle.unreadable) {
    findings.push({ code: 'unreadable', severity: 'unreadable', id, message: reason })
  }

  for (const directory of bundle.directories) {
    if (directory.concepts.length === 0) continue
    checked += 1

    const indexId = directory.dir === '' ? 'index.md' : `${directory.dir}/index.md`
    const indexPath = join(bundle.root, indexId)

    for (const concept of directory.concepts) {
      const description = describe(concept)
      if (description.kind === 'invalid') {
        findings.push({
          code: 'invalid-description',
          severity: 'unreadable',
          id: concept.id,
          message: `description must be a string, found ${description.found}`,
        })
      }
    }

    if (!directory.hasIndex) {
      if (options.write) {
        writeFileSync(indexPath, renderIndex(directory), 'utf8')
        written.push(indexId)
      } else {
        findings.push({
          code: 'no-index',
          severity: 'missing',
          id: indexId,
          message: `no catalogue for ${directory.concepts.length} document(s) in this directory`,
          detail: 'run with --write to generate it',
        })
      }
      continue
    }

    const actual = readFileSync(indexPath, 'utf8')
    const listed = parseCatalogue(actual)
    const listedTargets = new Set(listed.map((entry) => entry.target))
    const present = new Map(directory.concepts.map((concept) => [conceptName(concept), concept]))

    for (const concept of directory.concepts) {
      const name = conceptName(concept)
      if (!listedTargets.has(name)) {
        findings.push({
          code: 'unlisted-document',
          severity: 'missing',
          id: indexId,
          message: `${name} exists but is not in the catalogue`,
        })
      }
    }

    for (const entry of listed) {
      if (!present.has(entry.target)) {
        findings.push({
          code: 'dangling-entry',
          severity: 'gone',
          id: indexId,
          message: `catalogue lists ${entry.target}, which is not here`,
        })
        continue
      }
      const concept = present.get(entry.target)!
      const description = describe(concept)

      if (description.kind === 'absent' && entry.description) {
        // The catalogue is ahead of the document. The fix is not to edit the
        // catalogue but to promote the sentence into the front matter, where
        // every other consumer can read it.
        findings.push({
          code: 'undescribed-document',
          severity: 'missing',
          id: indexId,
          message: `the catalogue describes ${entry.target} but the document has no description`,
          detail: `move it into the front matter: description: "${entry.description}"`,
        })
        continue
      }

      if (description.kind !== 'present' || !entry.description) continue

      const differs = options.strict
        ? entry.description !== description.text
        : normaliseDescription(entry.description) !== normaliseDescription(description.text)
      if (differs) {
        findings.push({
          code: 'description-drift',
          severity: 'stale',
          id: indexId,
          message: `catalogue describes ${entry.target} differently from the document`,
          detail: `document says: ${description.text}`,
        })
      }
    }

    if (options.write) {
      // Descriptions already in the catalogue survive regeneration wherever the
      // document does not supply one of its own.
      const fallbacks = new Map(
        listed.filter((entry) => entry.description).map((entry) => [entry.target, entry.description]),
      )
      const expected = renderIndex(directory, fallbacks)
      if (actual !== expected) {
        writeFileSync(indexPath, expected, 'utf8')
        written.push(indexId)
      }
    }
  }

  return { findings: options.write ? [] : findings, checked, written }
}
