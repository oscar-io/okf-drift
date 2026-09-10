import { describe, expect, it } from 'vitest'
import { formatReport } from '../src/report.js'
import type { Finding } from '../src/report.js'

const finding = (id: string): Finding => ({ code: 'x', severity: 'stale', id, message: 'm' })

describe('formatReport', () => {
  it('agrees in number with one affected document', () => {
    expect(formatReport([finding('a.md')], 1, 'catalogue')).toContain('1 of 1 catalogue needs review.')
  })

  it('agrees in number with several', () => {
    expect(formatReport([finding('a.md'), finding('b.md')], 3, 'catalogue')).toContain(
      '2 of 3 catalogues need review.',
    )
  })

  it('counts a document once even when it has several findings', () => {
    expect(formatReport([finding('a.md'), finding('a.md')], 2, 'document')).toContain('1 of 2 documents needs review.')
  })

  it('says so plainly when nothing has drifted', () => {
    expect(formatReport([], 4, 'document')).toContain('4 documents checked, nothing has drifted.')
  })
})
