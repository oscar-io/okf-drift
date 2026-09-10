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
import { formatReport } from './report.js'

const USAGE = `okf-drift — tell when an OKF bundle has stopped being true

Usage
  okf-drift [check] [bundle]      report documents that no longer match the code
  okf-drift index [bundle]        report catalogues that no longer match their documents
  okf-drift index --write [dir]   rewrite those catalogues in place

Options
  --write        with 'index', fix instead of report
  --check        explicit form of the default reporting behaviour
  --strict       compare descriptions exactly, not just by meaning
  -h, --help     this text
  -v, --version  print the version

Exits 0 when nothing has drifted, 1 when something has, 2 on bad usage.
`

interface Args {
  command: 'check' | 'index'
  bundle: string
  write: boolean
  strict: boolean
  help: boolean
  version: boolean
}

export function parseArgs(argv: string[]): Args {
  const args: Args = { command: 'check', bundle: 'docs', write: false, strict: false, help: false, version: false }
  const positional: string[] = []

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') args.help = true
    else if (arg === '-v' || arg === '--version') args.version = true
    else if (arg === '--write') args.write = true
    else if (arg === '--check') args.write = false
    else if (arg === '--strict') args.strict = true
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
      if (result.written.length === 0) process.stdout.write('  every catalogue was already current.\n')
      return 0
    }
    process.stdout.write(`${formatReport(result.findings, result.checked, 'catalogue')}\n`)
    return result.findings.length > 0 ? 1 : 0
  }

  try {
    const result = checkDrift(bundle)
    process.stdout.write(`${formatReport(result.findings, result.checked, 'document')}\n`)
    return result.findings.length > 0 ? 1 : 0
  } catch (error) {
    process.stderr.write(`okf-drift: ${(error as Error).message}\n`)
    return 2
  }
}

process.exitCode = main(process.argv.slice(2))
