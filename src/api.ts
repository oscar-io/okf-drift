/** Programmatic entry point, for callers that want the findings rather than a report. */
export { readBundle, RESERVED } from './bundle.js'
export type { Bundle, BundleDirectory, Concept } from './bundle.js'
export { checkIndexes, describe, normaliseDescription, parseCatalogue, renderIndex } from './index-cmd.js'
export type { CatalogueEntry, Description, IndexOptions, IndexResult } from './index-cmd.js'
export { checkDrift } from './drift.js'
export type { DriftOptions, DriftResult } from './drift.js'
export {
  FrontMatterError,
  isActor,
  isInstant,
  lastVerifiedAt,
  resourceSources,
  splitFrontMatter,
  trustTier,
  verificationEvents,
} from './frontmatter.js'
export type { Actor, FrontMatter, ParsedDocument, Source } from './frontmatter.js'
export { formatFinding, formatReport } from './report.js'
export type { Finding, Severity } from './report.js'
