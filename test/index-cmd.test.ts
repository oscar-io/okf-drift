import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readBundle } from '../src/bundle.js'
import { checkIndexes, describe as describeConcept, normaliseDescription, parseCatalogue, renderIndex } from '../src/index-cmd.js'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'okf-drift-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function concept(path: string, description: string): void {
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, `---\ntype: Design Decision\ntitle: T\ndescription: ${description}\n---\nBody.\n`)
}

function file(path: string, text: string): void {
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, text)
}

/** A concept whose front matter has no `description` at all. */
function undescribed(path: string): void {
  const full = join(root, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, `---\ntype: Design Decision\ntitle: T\n---\nBody.\n`)
}

function indexWith(dir: string, ...entries: string[]): void {
  file(`${dir}/index.md`, `# ${dir}: index\n\n## Documents\n\n${entries.join('\n')}\n`)
}

describe('parseCatalogue', () => {
  it('reads entries and drops navigation and external links', () => {
    const entries = parseCatalogue(
      [
        '# design: index',
        'What changed is in [`log.md`](log.md).',
        '',
        '- [`caching.md`](caching.md) - why prices are cached per-tenant.',
        '- [`auth.md`](auth.md) — how identity is carried',
        '- [the spec](https://example.com/spec)',
      ].join('\n'),
    )
    expect(entries).toEqual([
      { target: 'caching.md', description: 'why prices are cached per-tenant' },
      { target: 'auth.md', description: 'how identity is carried' },
    ])
  })
})

describe('checkIndexes', () => {
  it('passes when the catalogue matches the documents', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    file('design/index.md', '# design: index\n\n## Documents\n\n- [`caching.md`](caching.md) - why prices are cached per-tenant.\n')

    const result = checkIndexes(readBundle(root))
    expect(result.findings).toEqual([])
    expect(result.checked).toBe(1)
  })

  it('accepts a catalogue written as a table', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    file(
      'design/index.md',
      '# design: index\n\n| Id | Title |\n|---|---|\n| [`caching.md`](caching.md) | Caching |\n',
    )

    expect(checkIndexes(readBundle(root)).findings).toEqual([])
  })

  it('reports a document that exists but is not catalogued', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    concept('design/auth.md', 'how identity is carried')
    file('design/index.md', '# design: index\n\n## Documents\n\n- [`caching.md`](caching.md) - why prices are cached per-tenant.\n')

    const codes = checkIndexes(readBundle(root)).findings.map((f) => f.code)
    expect(codes).toContain('unlisted-document')
  })

  it('reports an entry whose document is gone', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    file('design/index.md', '# design: index\n\n## Documents\n\n- [`caching.md`](caching.md) - why prices are cached per-tenant.\n- [`removed.md`](removed.md) - was here once.\n')

    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'dangling-entry')
    expect(finding?.severity).toBe('gone')
  })

  it('reports a description that has drifted from the document', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    file('design/index.md', '# design: index\n\n## Documents\n\n- [`caching.md`](caching.md) - an old summary.\n')

    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'description-drift')
    expect(finding?.detail).toContain('why prices are cached per-tenant')
  })

  it('reports a directory with documents and no catalogue at all', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'no-index')
    expect(finding?.severity).toBe('missing')
  })

  it('writes a catalogue that then passes its own check', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    concept('design/auth.md', 'how identity is carried')

    checkIndexes(readBundle(root), { write: true })
    const written = readFileSync(join(root, 'design/index.md'), 'utf8')
    expect(written).toContain('- [`auth.md`](auth.md) - how identity is carried.')

    expect(checkIndexes(readBundle(root)).findings).toEqual([])
  })

  it('does not treat a file without front matter as a document', () => {
    file('design/NOTES.md', 'Just a scratch file.\n')
    concept('design/caching.md', 'why prices are cached per-tenant')
    checkIndexes(readBundle(root), { write: true })
    expect(readFileSync(join(root, 'design/index.md'), 'utf8')).not.toContain('NOTES.md')
  })

  it('reports a document whose front matter cannot be parsed', () => {
    file('design/broken.md', '---\ntype: [unclosed\n---\nBody.\n')
    concept('design/caching.md', 'why prices are cached per-tenant')
    const codes = checkIndexes(readBundle(root)).findings.map((f) => f.code)
    expect(codes).toContain('unreadable')
  })
})

describe('parseCatalogue, table form', () => {
  it('reads a registry table that has no description column', () => {
    // `| Id | Title | Implementation |` describes nothing: a title is not a
    // description, and comparing them would report drift between two fields
    // that were never meant to agree.
    const entries = parseCatalogue(
      [
        '| Id | Title | Implementation |',
        '|---|---|---|',
        '| [`DRIFT-0001`](DRIFT-0001.md) | Report a malformed verified block | proposed |',
        '| [`DRIFT-0002`](DRIFT-0002.md) | The git oracle | partial |',
      ].join('\n'),
    )
    expect(entries).toEqual([
      { target: 'DRIFT-0001.md', description: '' },
      { target: 'DRIFT-0002.md', description: '' },
    ])
  })

  it('uses the description column when the table has one', () => {
    const entries = parseCatalogue(
      [
        '| Document | Description | Status |',
        '|---|---|---|',
        '| [`caching.md`](caching.md) | why prices are cached per-tenant. | stable |',
      ].join('\n'),
    )
    expect(entries).toEqual([{ target: 'caching.md', description: 'why prices are cached per-tenant' }])
  })

  it('reads lists and tables in the same document', () => {
    const entries = parseCatalogue(
      ['- [`a.md`](a.md) - first.', '', '| Id | Title |', '|---|---|', '| [`b.md`](b.md) | second |'].join('\n'),
    )
    expect(entries.map((e) => e.target)).toEqual(['a.md', 'b.md'])
  })

  it('ignores navigation and external links in a table', () => {
    const entries = parseCatalogue(
      ['| Link | Note |', '|---|---|', '| [`log.md`](log.md) | history |', '| [spec](https://example.com) | ext |'].join(
        '\n',
      ),
    )
    expect(entries).toEqual([])
  })
})

describe('description comparison', () => {
  it('ignores case, punctuation and whitespace by default', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    indexWith('design', '- [`caching.md`](caching.md) - Why prices are  cached per tenant.')

    expect(checkIndexes(readBundle(root)).findings).toEqual([])
  })

  it('reports those same differences under --strict', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    indexWith('design', '- [`caching.md`](caching.md) - Why prices are  cached per tenant.')

    const codes = checkIndexes(readBundle(root), { strict: true }).findings.map((f) => f.code)
    expect(codes).toContain('description-drift')
  })

  it('still reports a description that means something else', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    indexWith('design', '- [`caching.md`](caching.md) - how the retry queue works.')

    const codes = checkIndexes(readBundle(root)).findings.map((f) => f.code)
    expect(codes).toContain('description-drift')
  })

  it('normalises to the same string for formatting-only differences', () => {
    expect(normaliseDescription('Why prices are  cached per-tenant.')).toBe(
      normaliseDescription('why prices are cached per tenant'),
    )
  })
})

describe('a document with no description', () => {
  it('reports that the catalogue knows something the document does not', () => {
    undescribed('design/caching.md')
    indexWith('design', '- [`caching.md`](caching.md) - why prices are cached per-tenant.')

    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'undescribed-document')
    expect(finding?.severity).toBe('missing')
    expect(finding?.detail).toContain('description: "why prices are cached per-tenant"')
  })

  it('does not also report it as drift', () => {
    undescribed('design/caching.md')
    indexWith('design', '- [`caching.md`](caching.md) - why prices are cached per-tenant.')

    const codes = checkIndexes(readBundle(root)).findings.map((f) => f.code)
    expect(codes).not.toContain('description-drift')
  })

  it('passes when the catalogue does not describe it either', () => {
    undescribed('design/caching.md')
    indexWith('design', '- [`caching.md`](caching.md)')

    expect(checkIndexes(readBundle(root)).findings).toEqual([])
  })

  it('KEEPS a hand-written catalogue description when regenerating', () => {
    // The regression that matters: --write must never delete prose.
    undescribed('design/caching.md')
    concept('design/auth.md', 'how identity is carried')
    indexWith('design', '- [`caching.md`](caching.md) - why prices are cached per-tenant.')

    checkIndexes(readBundle(root), { write: true })

    const written = readFileSync(join(root, 'design/index.md'), 'utf8')
    expect(written).toContain('- [`caching.md`](caching.md) - why prices are cached per-tenant.')
    expect(written).toContain('- [`auth.md`](auth.md) - how identity is carried.')
  })

  it('prefers the document over the catalogue when both have one', () => {
    concept('design/caching.md', 'the current truth')
    indexWith('design', '- [`caching.md`](caching.md) - a stale copy.')

    checkIndexes(readBundle(root), { write: true })

    const written = readFileSync(join(root, 'design/index.md'), 'utf8')
    expect(written).toContain('the current truth')
    expect(written).not.toContain('a stale copy')
  })
})

describe('describe', () => {
  it('separates absent, empty, present and invalid', () => {
    const of = (meta: Record<string, unknown>) =>
      describeConcept({ path: '', id: 'x.md', dir: '', meta, body: '' }).kind
    expect(of({})).toBe('absent')
    expect(of({ description: '   ' })).toBe('absent')
    expect(of({ description: 'text' })).toBe('present')
    expect(of({ description: ['a', 'b'] })).toBe('invalid')
  })

  it('reports a non-string description rather than coercing it away', () => {
    file('design/broken.md', '---\ntype: X\ndescription:\n  - one\n  - two\n---\nBody.\n')
    indexWith('design', '- [`broken.md`](broken.md)')

    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'invalid-description')
    expect(finding?.message).toContain('a list')
  })
})

describe('renderIndex', () => {
  it('mentions the log only when the directory has one', () => {
    concept('design/caching.md', 'why prices are cached per-tenant')
    file('design/log.md', '# design: update log\n')
    const bundle = readBundle(root)
    const directory = bundle.directories.find((d) => d.dir === 'design')!
    expect(renderIndex(directory)).toContain('[`log.md`](log.md)')
  })
})
