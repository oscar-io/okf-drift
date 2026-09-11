import { describe, expect, it } from 'vitest'
import {
  FrontMatterError,
  isActor,
  isInstant,
  lastVerifiedAt,
  resourceSources,
  splitFrontMatter,
  trustDefects,
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

describe('trustDefects', () => {
  it('is silent on front matter it can read, in either verified form', () => {
    expect(trustDefects({ verified: { by: 'human:oscar-io', at: '2026-09-11T00:00:00Z' } })).toEqual([])
    expect(trustDefects({ verified: [{ by: 'process:link-check', at: '2026-09-11T00:00:00Z' }] })).toEqual([])
    expect(trustDefects({})).toEqual([])
  })

  it('catches a display name, which is the mistake that silently unverifies a document', () => {
    const [defect] = trustDefects({ verified: [{ by: 'human:Oscar Reyes', at: '2026-09-11T00:00:00Z' }] })
    expect(defect?.field).toBe('verified[0].by')
    expect(defect?.reason).toContain('no spaces')
  })

  it('catches an instant that is not one', () => {
    expect(trustDefects({ verified: { by: 'human:ok', at: 'last tuesday' } })[0]?.field).toBe('verified.at')
    // A bare date is not an instant: no time, no offset.
    expect(trustDefects({ verified: { by: 'human:ok', at: '2026-09-11' } })).toHaveLength(1)
  })

  it('catches an entry with no actor at all', () => {
    expect(trustDefects({ verified: { at: '2026-09-11T00:00:00Z' } })[0]?.reason).toContain('no `by`')
  })

  it('checks generated and sources[].last_modified by the same rules', () => {
    expect(trustDefects({ generated: { by: 'written by an agent' } })[0]?.field).toBe('generated.by')
    expect(trustDefects({ sources: [{ resource: '/a.ts', last_modified: '2026-09-11' }] })[0]?.field).toBe(
      'sources[0].last_modified',
    )
  })

  it('reports an empty list, which claims nothing but looks like something', () => {
    expect(trustDefects({ verified: [] })[0]?.reason).toContain('omit the key')
  })
})
