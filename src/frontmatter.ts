/**
 * Parsing and light validation of OKF v0.2 front matter.
 *
 * This module deliberately stops short of being a validator: `okf-kit` already
 * checks that a bundle is well formed. What is needed here is enough structure
 * to answer "has this document stopped being true", which means `description`,
 * `sources`, `verified` and the two timestamp-ish fields.
 */
import { parse as parseYaml } from 'yaml'

/** An actor is `tool/version`, `human:<id>` or `process:<id>` (spec §7). */
const ACTOR = /^(?:human:[^\s:/]+|process:[^\s:/]+|[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)$/

/** An instant is RFC 3339 with an explicit offset. A bare date is not one. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

const DELIMITER = /^---\s*$/

export interface Actor {
  by: string
  at?: string
}

export interface Source {
  id?: string
  resource?: string
  title?: string
  author?: string
  last_modified?: string
}

export interface FrontMatter {
  type?: string
  title?: string
  description?: string
  tags?: string[]
  status?: string
  stale_after?: string
  generated?: Actor
  /** A list of events, or a bare mapping meaning a list of one (spec §5.2). */
  verified?: Actor[] | Actor
  sources?: Source[]
  [key: string]: unknown
}

export interface ParsedDocument {
  /** Front matter, or `null` when the document has no block at all. */
  meta: FrontMatter | null
  /** Everything after the closing delimiter. */
  body: string
}

export class FrontMatterError extends Error {}

/**
 * Split a document into front matter and body.
 *
 * A document with no leading `---` is not an error: `index.md` and `log.md`
 * carry no front matter by design, and the spec requires consumers to tolerate
 * plain markdown rather than reject it.
 */
export function splitFrontMatter(text: string): ParsedDocument {
  const withoutBom = text.replace(/^\uFEFF/, '')
  const lines = withoutBom.split(/\r?\n/)

  if (lines.length === 0 || !DELIMITER.test(lines[0] ?? '')) {
    return { meta: null, body: withoutBom }
  }

  const closing = lines.findIndex((line, i) => i > 0 && DELIMITER.test(line))
  if (closing === -1) {
    throw new FrontMatterError('front matter is opened but never closed')
  }

  const raw = lines.slice(1, closing).join('\n')
  const body = lines.slice(closing + 1).join('\n')

  let meta: unknown
  try {
    meta = parseYaml(raw)
  } catch (cause) {
    throw new FrontMatterError(`front matter is not valid YAML: ${(cause as Error).message}`)
  }

  if (meta === null || meta === undefined) return { meta: {}, body }
  if (typeof meta !== 'object' || Array.isArray(meta)) {
    throw new FrontMatterError('front matter must be a mapping')
  }
  return { meta: meta as FrontMatter, body }
}

export function isActor(value: unknown): value is string {
  return typeof value === 'string' && ACTOR.test(value)
}

export function isInstant(value: unknown): value is string {
  return typeof value === 'string' && INSTANT.test(value)
}

/**
 * The trust tier a consumer can read straight off `verified`.
 *
 * Absence is a statement, not a gap: no key at all means nobody has confirmed
 * this, which is different from, and more honest than, an empty list.
 */
export function trustTier(meta: FrontMatter): 'unverified' | 'machine-confirmed' | 'human-reviewed' {
  const events = verificationEvents(meta)
  if (events.length === 0) return 'unverified'
  return events.some((event) => event.by.startsWith('human:')) ? 'human-reviewed' : 'machine-confirmed'
}

/**
 * `verified` entries that are shaped like an actor, ignoring malformed ones.
 *
 * A bare mapping is one event, not a mistake: spec §5.2 permits a single
 * verifier to be written without the list dash, and §11 makes treating it as a
 * one-element list a MUST for consumers.
 */
export function verificationEvents(meta: FrontMatter): Actor[] {
  const verified = meta.verified
  if (verified === undefined || verified === null) return []
  const events = Array.isArray(verified) ? verified : [verified]
  return events.filter(
    (event): event is Actor => typeof event === 'object' && event !== null && isActor((event as Actor).by),
  )
}

/** A trust field the code could not read, and the reason nobody was told. */
export interface TrustDefect {
  /** `verified`, `verified[1]`, `generated`, `sources[0].last_modified`. */
  field: string
  reason: string
}

function actorDefects(field: string, value: unknown): TrustDefect[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [{ field, reason: 'must be a mapping with a `by` actor' }]
  }
  const event = value as Actor
  const defects: TrustDefect[] = []
  if (event.by === undefined) {
    defects.push({ field, reason: 'has no `by` actor' })
  } else if (!isActor(event.by)) {
    defects.push({
      field: `${field}.by`,
      reason: `"${String(event.by)}" is not an actor: use human:<handle>, process:<name> or tool/version, with no spaces`,
    })
  }
  if (event.at !== undefined && !isInstant(event.at)) {
    defects.push({ field: `${field}.at`, reason: `"${String(event.at)}" is not an RFC 3339 instant with an offset` })
  }
  return defects
}

/**
 * Trust claims that a reader would believe and the code cannot.
 *
 * The failure this exists to prevent: front matter that says a human verified
 * a document, parsed into nothing, reported as unverified, and nobody told.
 * A malformed claim is worse than an absent one, because absence is honest.
 */
export function trustDefects(meta: FrontMatter): TrustDefect[] {
  const defects: TrustDefect[] = []

  if (meta.generated !== undefined && meta.generated !== null) {
    defects.push(...actorDefects('generated', meta.generated))
  }

  const verified = meta.verified
  if (verified !== undefined && verified !== null) {
    const events = Array.isArray(verified) ? verified : [verified]
    if (events.length === 0) {
      defects.push({ field: 'verified', reason: 'is an empty list; omit the key instead' })
    }
    events.forEach((event, i) => {
      defects.push(...actorDefects(Array.isArray(verified) ? `verified[${i}]` : 'verified', event))
    })
  }

  for (const [i, source] of (Array.isArray(meta.sources) ? meta.sources : []).entries()) {
    if (typeof source !== 'object' || source === null) continue
    const at = (source as Source).last_modified
    if (at !== undefined && !isInstant(at)) {
      defects.push({
        field: `sources[${i}].last_modified`,
        reason: `"${String(at)}" is not an RFC 3339 instant with an offset`,
      })
    }
  }

  return defects
}

/** The most recent `verified.at`, or `null` when nothing carries a usable instant. */
export function lastVerifiedAt(meta: FrontMatter): Date | null {
  const instants = verificationEvents(meta)
    .map((event) => event.at)
    .filter(isInstant)
    .map((at) => new Date(at))
  if (instants.length === 0) return null
  return new Date(Math.max(...instants.map((date) => date.getTime())))
}

/** `sources` entries that point at something, which is all a drift check can use. */
export function resourceSources(meta: FrontMatter): Source[] {
  const sources = meta.sources
  if (!Array.isArray(sources)) return []
  return sources.filter(
    (source): source is Source =>
      typeof source === 'object' && source !== null && typeof (source as Source).resource === 'string',
  )
}
