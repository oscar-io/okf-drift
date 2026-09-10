/**
 * Findings and how they are printed.
 *
 * One shape is shared by every check, so that `index` and `drift` report the
 * same way and a consumer can filter on a stable `code` rather than on prose.
 */

export type Severity = 'stale' | 'missing' | 'gone' | 'expired' | 'unreadable'

export interface Finding {
  /** Stable identifier, safe to filter on. */
  code: string
  severity: Severity
  /** The document the finding is about, relative to the bundle root. */
  id: string
  message: string
  /** Optional second line, for the evidence behind the finding. */
  detail?: string
}

const LABEL: Record<Severity, string> = {
  stale: 'STALE',
  missing: 'MISSING',
  gone: 'GONE',
  expired: 'EXPIRED',
  unreadable: 'UNREADABLE',
}

export function formatFinding(finding: Finding): string {
  const head = `  ${LABEL[finding.severity].padEnd(10)} ${finding.id}`
  const lines = [head, `             ${finding.message}`]
  if (finding.detail) lines.push(`             ${finding.detail}`)
  return lines.join('\n')
}

export function formatReport(findings: Finding[], checked: number, noun: string): string {
  if (findings.length === 0) {
    return `\n${checked} ${noun}${checked === 1 ? '' : 's'} checked, nothing has drifted.`
  }
  const body = findings.map(formatFinding).join('\n\n')
  const affected = new Set(findings.map((finding) => finding.id)).size
  const verb = affected === 1 ? 'needs' : 'need'
  return `${body}\n\n${affected} of ${checked} ${noun}${checked === 1 ? '' : 's'} ${verb} review.`
}
