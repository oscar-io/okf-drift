import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readBundle } from '../src/bundle.js'
import {
  checkIndexes,
  describe as describeConcept,
  normaliseDescription,
  parseCatalogue,
  renderIndex,
  replaceSection,
  resolveTarget,
} from '../src/index-cmd.js'

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

describe('resolveTarget', () => {
  it('reads a leading slash as relative to the bundle root, the form the spec recommends', () => {
    expect(resolveTarget('/tables/customers.md', 'tables')).toBe('tables/customers.md')
    expect(resolveTarget('/tables/customers.md', 'anywhere/else')).toBe('tables/customers.md')
  })

  it('reads anything else as relative to the index it appears in', () => {
    expect(resolveTarget('orders.md', 'tables')).toBe('tables/orders.md')
    expect(resolveTarget('./orders.md', 'tables')).toBe('tables/orders.md')
    expect(resolveTarget('../metrics/revenue.md', 'tables')).toBe('metrics/revenue.md')
  })

  it('keeps a trailing slash, which is what marks a directory entry', () => {
    expect(resolveTarget('archive/', 'tables')).toBe('tables/archive/')
    expect(resolveTarget('/tables/archive/', '')).toBe('tables/archive/')
  })

  it('drops a fragment or query, and decodes escapes', () => {
    expect(resolveTarget('orders.md#schema', 'tables')).toBe('tables/orders.md')
    expect(resolveTarget('orders.md?v=2', 'tables')).toBe('tables/orders.md')
    expect(resolveTarget('my%20doc.md', '')).toBe('my doc.md')
  })
})

describe('the specification\u2019s own index example', () => {
  it('passes every link form OKF 6.1 and 8 permit', () => {
    // This exact shape used to produce five findings on a conformant bundle.
    concept('tables/customers.md', 'the customers table')
    concept('tables/orders.md', 'the orders table')
    concept('tables/archive/old.md', 'an archived thing')
    file('tables/archive/index.md', '# archive\n\n## Documents\n\n- [`old.md`](old.md) - an archived thing.\n')
    file(
      'tables/index.md',
      [
        '# Section',
        '',
        '* [Customers](/tables/customers.md) - the customers table',
        '* [Orders](./orders.md) - the orders table',
        '* [Archive](archive/) - older tables',
        '',
      ].join('\n'),
    )

    expect(checkIndexes(readBundle(root)).findings).toEqual([])
  })

  it('still reports a subdirectory entry that does not exist', () => {
    concept('tables/customers.md', 'the customers table')
    file('tables/index.md', '# Section\n\n* [Customers](customers.md) - the customers table\n* [Gone](gone/) - removed\n')

    const finding = checkIndexes(readBundle(root)).findings.find((f) => f.code === 'dangling-entry')
    expect(finding?.message).toContain('not a directory here')
  })

  it('still reports a document link that resolves to nothing', () => {
    concept('tables/customers.md', 'the customers table')
    file('tables/index.md', '# Section\n\n* [Customers](customers.md) - x\n* [Ghost](/tables/ghost.md) - y\n')

    const codes = checkIndexes(readBundle(root)).findings.map((f) => f.code)
    expect(codes).toContain('dangling-entry')
  })
})

describe('replaceSection', () => {
  const entries = ['- [`a.md`](a.md) - first.']

  it('replaces only the body of the named heading', () => {
    const before = ['# index', '', 'Prose above.', '', '## Documents', '', '- [`old.md`](old.md)', '', '## Other', '', 'Prose below.'].join('\n')
    const edit = replaceSection(before, 'Documents', entries)
    expect(edit.kind).toBe('replaced')
    const after = edit.kind === 'replaced' ? edit.text : ''
    expect(after).toContain('Prose above.')
    expect(after).toContain('## Other')
    expect(after).toContain('Prose below.')
    expect(after).toContain('- [`a.md`](a.md) - first.')
    expect(after).not.toContain('old.md')
  })

  it('refuses when the heading is absent, rather than writing a whole file', () => {
    const edit = replaceSection('# ticket registry\n\nHand-written rules.\n', 'Documents', entries)
    expect(edit).toEqual({ kind: 'refused', reason: 'no "Documents" heading to regenerate' })
  })

  it('refuses a section written as a table, which it would reshape', () => {
    const before = '# index\n\n## Documents\n\n| Doc | Note |\n|---|---|\n| [`a.md`](a.md) | x |\n'
    const edit = replaceSection(before, 'Documents', entries)
    expect(edit.kind).toBe('refused')
    expect(edit.kind === 'refused' && edit.reason).toContain('table')
  })

  it('leaves a table in a different section alone', () => {
    const before = '# index\n\n## Documents\n\n- [`old.md`](old.md)\n\n## Conventions\n\n| Rule | Why |\n|---|---|\n| a | b |\n'
    const edit = replaceSection(before, 'Documents', entries)
    expect(edit.kind).toBe('replaced')
    expect(edit.kind === 'replaced' && edit.text).toContain('| a | b |')
  })

  it('stops at a heading of the same or higher level', () => {
    const before = '# index\n\n## Documents\n\n- old\n\n### A subheading inside\n\nkept?\n\n## Next\n\nafter.'
    const edit = replaceSection(before, 'Documents', entries)
    // A deeper heading is inside the section, so it is part of the body.
    expect(edit.kind === 'replaced' && edit.text).toContain('## Next')
    expect(edit.kind === 'replaced' && edit.text).not.toContain('A subheading inside')
  })

  it('reports no change when the section already matches', () => {
    const before = '# index\n\n## Documents\n\n- [`a.md`](a.md) - first.\n'
    expect(replaceSection(before, 'Documents', entries).kind).toBe('unchanged')
  })

  it('matches a heading at any level, per the spec', () => {
    const before = '# Documents\n\n- old\n'
    expect(replaceSection(before, 'Documents', entries).kind).toBe('replaced')
  })
})

describe('--write refuses rather than destroys', () => {
  it('leaves a hand-written registry untouched and says why', () => {
    // The regression that matters most: this file was destroyed once.
    concept('product/DRIFT-0001.md', 'a ticket')
    const registry = '# ticket registry\n\nHow to mint an id, and why not GitHub issues.\n\n| Id | Title |\n|---|---|\n| [`DRIFT-0001.md`](DRIFT-0001.md) | A ticket |\n'
    file('product/index.md', registry)

    const result = checkIndexes(readBundle(root), { write: true })

    expect(readFileSync(join(root, 'product/index.md'), 'utf8')).toBe(registry)
    expect(result.written).toEqual([])
    expect(result.refused[0]?.code).toBe('write-refused')
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
