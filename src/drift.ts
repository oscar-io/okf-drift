/**
 * `okf-drift check` — the code oracle.
 *
 * The reason this tool exists rather than being another validator: a document
 * is rarely wrong because it is malformed, it is wrong because the thing it
 * describes moved. Git already knows when that happened, so finding out needs
 * no bookkeeping from anybody.
 *
 * What happens when git cannot answer is a decision in its own right; see
 * docs/design/drift-oracles.md.
 */
import { existsSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import type { Bundle, Concept } from './bundle.js'
import { isInstant, lastVerifiedAt, resourceSources, trustDefects } from './frontmatter.js'
import { commitsSince, isTracked, lastChanged, repoRoot } from './git.js'
import type { Finding } from './report.js'

export interface DriftOptions {
  /** Clock injection, so a test does not depend on today. */
  now?: Date
}

export interface DriftResult {
  findings: Finding[]
  /** Documents that declared at least one source. */
  checked: number
  /** Sources compared against git history. */
  verified: number
  /** Sources nothing could speak for, with the reason. */
  skipped: { reason: string; count: number }[]
  /** The repository history was read from, or `null` when there is none. */
  repo: string | null
}

const day = 24 * 60 * 60 * 1000

function iso(at: Date): string {
  return at.toISOString().slice(0, 10)
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / day)
}

/** A source's `resource`, as an absolute path, or `null` when it names no file. */
function resolveResource(bundle: Bundle, concept: Concept, resource: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(resource)) return null // a URL, or a scope descriptor

  // A leading slash is rooted at the repository when there is one, because that
  // is what documents here mean by /src/index-cmd.ts. Falling back to the
  // bundle keeps a bundle-only checkout working.
  if (resource.startsWith('/')) {
    const root = repoRoot(bundle.root) ?? bundle.root
    return join(root, resource.slice(1))
  }
  if (isAbsolute(resource)) return resource
  return resolve(bundle.root, concept.dir, resource)
}

/**
 * Compare every document against the code it cites.
 *
 * The reference point is the later of `last_modified` and the newest
 * `verified.at`: a document reviewed after the code changed is not stale, and
 * reporting it as such is the kind of noise that gets a check switched off.
 */
export function checkDrift(bundle: Bundle, options: DriftOptions = {}): DriftResult {
  const now = options.now ?? new Date()
  const repo = repoRoot(bundle.root)
  const findings: Finding[] = []
  const skipped = new Map<string, number>()
  let checked = 0
  let verified = 0

  const skip = (reason: string): void => {
    skipped.set(reason, (skipped.get(reason) ?? 0) + 1)
  }

  for (const concept of bundle.concepts) {
    for (const defect of trustDefects(concept.meta)) {
      findings.push({
        code: 'malformed-trust',
        severity: 'unreadable',
        id: concept.id,
        message: `${defect.field} ${defect.reason}`,
        detail: 'the document claims something the tool cannot read, so it counts for nothing',
      })
    }

    const staleAfter = concept.meta.stale_after
    if (isInstant(staleAfter) && new Date(staleAfter) <= now) {
      findings.push({
        code: 'expired',
        severity: 'expired',
        id: concept.id,
        message: `stale_after was ${iso(new Date(staleAfter))}, ${daysBetween(new Date(staleAfter), now)} days ago`,
      })
    }

    const sources = resourceSources(concept.meta)
    if (sources.length === 0) continue
    checked += 1

    const reviewedAt = lastVerifiedAt(concept.meta)

    for (const source of sources) {
      const path = resolveResource(bundle, concept, source.resource as string)
      if (path === null) {
        skip('not a file')
        continue
      }

      if (!existsSync(path)) {
        findings.push({
          code: 'missing-source',
          severity: 'gone',
          id: concept.id,
          message: `${source.resource} no longer exists`,
          detail: source.title ? `cited as: ${source.title}` : undefined,
        })
        continue
      }

      if (repo === null) {
        skip('no git repository')
        continue
      }
      if (!isTracked(repo, path)) {
        skip('not tracked by git')
        continue
      }

      const changedAt = lastChanged(repo, path)
      if (changedAt === null) {
        skip('no history')
        continue
      }

      // Whichever claim is newer is the fair one to hold the document to.
      const declared = isInstant(source.last_modified) ? new Date(source.last_modified) : null
      const since =
        declared && reviewedAt ? (declared > reviewedAt ? declared : reviewedAt) : (declared ?? reviewedAt)

      if (since === null) {
        skip('no last_modified or verified')
        continue
      }
      verified += 1

      const commits = commitsSince(repo, path, since)
      if (commits === 0) continue

      const basis = reviewedAt && (!declared || reviewedAt >= declared) ? 'reviewed' : 'recorded'
      findings.push({
        code: basis === 'reviewed' ? 'unverified-since-change' : 'stale-source',
        severity: 'stale',
        id: concept.id,
        message: `${source.resource} changed ${iso(changedAt)}, ${commits} commit${commits === 1 ? '' : 's'} after this document ${basis === 'reviewed' ? 'was last reviewed' : 'recorded it'}`,
        detail: `${basis} ${iso(since)}, source changed ${iso(changedAt)}`,
      })
    }
  }

  return {
    findings,
    checked,
    verified,
    skipped: [...skipped].map(([reason, count]) => ({ reason, count })),
    repo,
  }
}
