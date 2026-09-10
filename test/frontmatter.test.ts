import { describe, expect, it } from 'vitest'
import {
  FrontMatterError,
  isActor,
  isInstant,
  lastVerifiedAt,
  resourceSources,
  splitFrontMatter,
  trustTier,
} from '../src/frontmatter.js'

describe('splitFrontMatter', () => {
  it('reads a mapping and returns the body after it', () => {
    const { meta, body } = splitFrontMatter('---\ntype: Design Decision\n---\nBody text.\n')
    expect(meta).toEqual({ type: 'Design Decision' })
    expect(body.trim()).toBe('Body text.')
  })

  it('treats a document without front matter as bodyless metadata, not an error', () => {
    // index.md and log.md carry no front matter by design.
    const { meta, body } = splitFrontMatter('# index\n\n- a\n')
    expect(meta).toBeNull()
    expect(body).toContain('# index')
  })

  it('rejects front matter that is opened and never closed', () => {
    expect(() => splitFrontMatter('---\ntype: X\nstill going\n')).toThrow(FrontMatterError)
  })

  it('rejects a front matter block that is not a mapping', () => {
    expect(() => splitFrontMatter('---\n- one\n- two\n---\n')).toThrow(FrontMatterError)
  })

  it('tolerates a byte order mark before the delimiter', () => {
    const { meta } = splitFrontMatter('\uFEFF---\ntype: X\n---\n')
    expect(meta).toEqual({ type: 'X' })
  })
})

describe('isActor', () => {
  it.each(['opus/5', 'claude-code/opus-5', 'human:oscar', 'process:doc-link-check'])('accepts %s', (value) => {
    expect(isActor(value)).toBe(true)
  })

  it.each(['opus', 'reviewed by the team', 'human:', 'a/b/c', ''])('rejects %s', (value) => {
    expect(isActor(value)).toBe(false)
  })
})

describe('isInstant', () => {
  it('accepts an offset and accepts Z', () => {
    expect(isInstant('2026-09-08T14:00:00Z')).toBe(true)
    expect(isInstant('2026-09-08T14:00:00+02:00')).toBe(true)
  })

  it('rejects a bare date and a naive datetime', () => {
    // The distinction that matters: a date is not an instant.
    expect(isInstant('2026-09-08')).toBe(false)
    expect(isInstant('2026-09-08T14:00:00')).toBe(false)
  })
})

describe('trustTier', () => {
  it('reads absence as unverified', () => {
    expect(trustTier({})).toBe('unverified')
    expect(trustTier({ verified: [] })).toBe('unverified')
  })

  it('separates machine confirmation from human review', () => {
    expect(trustTier({ verified: [{ by: 'process:link-check' }] })).toBe('machine-confirmed')
    expect(trustTier({ verified: [{ by: 'process:link-check' }, { by: 'human:oscar' }] })).toBe('human-reviewed')
  })

  it('ignores an entry whose actor is prose', () => {
    expect(trustTier({ verified: [{ by: 'the team' }] })).toBe('unverified')
  })
})

describe('lastVerifiedAt', () => {
  it('picks the newest usable instant', () => {
    const at = lastVerifiedAt({
      verified: [
        { by: 'process:a', at: '2026-08-01T00:00:00Z' },
        { by: 'human:oscar', at: '2026-09-01T00:00:00Z' },
        { by: 'process:b', at: 'last tuesday' },
      ],
    })
    expect(at?.toISOString()).toBe('2026-09-01T00:00:00.000Z')
  })

  it('is null when nothing carries an instant', () => {
    expect(lastVerifiedAt({ verified: [{ by: 'human:oscar' }] })).toBeNull()
  })
})

describe('resourceSources', () => {
  it('keeps only sources that point at something', () => {
    const sources = resourceSources({
      sources: [{ id: 'a', resource: '/src/cache.ts' }, { id: 'b', title: 'no resource' }],
    })
    expect(sources).toHaveLength(1)
    expect(sources[0]?.resource).toBe('/src/cache.ts')
  })
})
