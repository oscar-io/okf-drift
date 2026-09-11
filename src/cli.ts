#!/usr/bin/env node
/**
 * okf-drift — tells you when a knowledge bundle has stopped being true.
 *
 * Hand-rolled argument parsing, because the surface is two commands and three
 * flags. A dependency that formats help text is not worth a supply chain.
 */
import { readBundle } from './bundle.js'
import { checkDrift } from './drift.js'
import { checkIndexes } from './index-cmd.js'
import { formatFinding, formatReport } from './report.js'

const USAGE = `okf-drift — tell when an OKF bundle has stopped being true

Usage
  okf-drift [check] [bundle]      report documents that no longer match the code
  okf-drift index [bundle]        report catalogues that no longer match their documents
  okf-drift index --write [dir]   rewrite those catalogues in place

Options
  --write        with 'index', fix instead of report
  --check        explicit form of the default reporting behaviour
  --strict       compare descriptions exactly, not just by meaning
  --require-git  fail if drift cannot be checked, instead of saying so
  -h, --help     this text
  -v, --version  print the version

Exits 0 when nothing has drifted, 1 when something has, 2 on bad usage.
`

interface Args {
  command: 'check' | 'index'
  bundle: string
  write: boolean
  strict: boolean
  requireGit: boolean
  help: boolean
  version: boolean
}

export function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: 'check',
    bundle: 'docs',
    write: false,
    strict: false,
    requireGit: false,
    help: false,
    version: false,
  }
  const positional: string[] = []

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') args.help = true
    else if (arg === '-v' || arg === '--version') args.version = true
    else if (arg === '--write') args.write = true
    else if (arg === '--check') args.write = false
    else if (arg === '--strict') args.strict = true
    else if (arg === '--require-git') args.requireGit = true
    else if (arg.startsWith('-')) throw new Error(`unknown option: ${arg}`)
    else positional.push(arg)
  }

  if (positional[0] === 'index' || positional[0] === 'check') {
    args.command = positional[0]
    positional.shift()
  }
  if (positional.length > 1) throw new Error('expected at most one bundle path')
  if (positional[0]) args.bundle = positional[0]
  return args
}

export function main(argv: string[]): number {
  let args: Args
  try {
    args = parseArgs(argv)
  } catch (error) {
    process.stderr.write(`okf-drift: ${(error as Error).message}\n\n${USAGE}`)
    return 2
  }

  if (args.help) {
    process.stdout.write(USAGE)
    return 0
  }
  if (args.version) {
    process.stdout.write('0.1.0\n')
    return 0
  }

  let bundle
  try {
    bundle = readBundle(args.bundle)
  } catch {
    process.stderr.write(`okf-drift: cannot read a bundle at ${args.bundle}\n`)
    return 2
  }

  if (bundle.concepts.length === 0) {
    process.stderr.write(`okf-drift: no documents with front matter under ${args.bundle}\n`)
    return 2
  }

  if (args.command === 'index') {
    const result = checkIndexes(bundle, { write: args.write, strict: args.strict })
    if (args.write) {
      for (const id of result.written) process.stdout.write(`  wrote  ${id}\n`)
      for (const finding of result.refused) process.stdout.write(`${formatFinding(finding)}\n`)
      if (result.written.length === 0 && result.refused.length === 0) {
        process.stdout.write('  every catalogue was already current.\n')
      }
      return result.refused.length > 0 ? 1 : 0
    }
    process.stdout.write(`${formatReport(result.findings, result.checked, 'catalogue')}\n`)
    return result.findings.length > 0 ? 1 : 0
  }

  const result = checkDrift(bundle)

  if (args.requireGit && result.repo === null) {
    process.stderr.write(`okf-drift: ${args.bundle} is not in a git repository, and --require-git was given\n`)
    return 2
  }

  process.stdout.write(`${formatReport(result.findings, result.checked, 'document')}\n`)

  // What could not be checked is part of the report, never a silent pass: a
  // green exit that verified nothing is the most expensive answer a checker
  // can give. See docs/design/drift-oracles.md.
  if (result.repo === null) {
    process.stdout.write(`\n  ${args.bundle} is not in a git repository, so drift against code was not checked.\n`)
  }
  for (const { reason, count } of result.skipped) {
    process.stdout.write(`  ${count} source${count === 1 ? '' : 's'} skipped: ${reason}.\n`)
  }
  if (result.verified > 0) {
    process.stdout.write(`  ${result.verified} source${result.verified === 1 ? '' : 's'} compared against git history.\n`)
  }

  return result.findings.length > 0 ? 1 : 0
}

process.exitCode = main(process.argv.slice(2))
