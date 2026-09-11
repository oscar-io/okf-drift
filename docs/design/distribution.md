---
# OKF v0.2
type: "Design Decision"
title: "Installed from git, not published to npm"
description: "why the tool is a global command you install from the repository rather than a package in the public registry"
tags: [decision, distribution, npm]
status: "stable"
generated: { by: claude/opus-5, at: 2026-09-10T22:50:00Z }
verified: 
  - { by: "human:oscar-io", at: 2026-09-10T23:54:00Z }
sources:
  - id: manifest
    resource: /package.json
    title: "The bin entry, the files list and the prepare script this decision depends on"
    last_modified: 2026-09-10T22:10:06Z
  - id: language
    resource: /docs/design/language-choice.md
    title: "The decision this one narrows: TypeScript was chosen partly on npm reach"
    last_modified: 2026-09-10T22:37:02Z
---

# Installed from git, not published to npm

## Decision

Do not run `npm publish`. Distribute from the repository:

```bash
npm install -g github:oscar-io/okf-drift
okf-drift index --check docs
```

The tool is a real command on `PATH` after that, usable in any repository regardless of
what language it is written in.

## Why not publish

**A name in the public registry is a permanent, global claim.** npm has one flat
namespace, first come first served, and a published version can never be changed or
practically removed. Taking `okf-drift` worldwide is a larger commitment than a tool
written over one evening has earned.

**An unmaintained published package is a liability**, not a neutral artefact. It gets
depended upon, typosquatted around, and read as a promise of support that nobody made.

**Publishing buys one thing here, and it is small.** The only capability lost is
`npx okf-drift` without a prefix. Everything else — global install, project dependency,
CI — works from a git URL today.

## What this costs

`docs/design/language-choice.md` argued for TypeScript partly on registry reach: being
next to `okf-kit` makes the tool findable by anyone searching the term. Not publishing
forfeits exactly that, and the language decision is weaker for it. The remaining reasons
in that document — trial friction, audience, irrelevant performance — still hold, so the
choice stands, but it stands on less.

Discovery now depends entirely on the article that links here.

## What must keep working

The git-install route is easy to break silently, so it is load bearing:

- **`prepare`, not `prepublishOnly`.** npm runs `prepare` after installing from a git
  source, and `prepublishOnly` only on publish. With the wrong one, a consumer installs a
  package whose `dist/` was never built and whose command is a dangling symlink. The cost
  is that a local `pnpm install` also builds, which is a second or two.
- **`bin` and the shebang.** `"bin": { "okf-drift": "dist/cli.js" }` plus
  `#!/usr/bin/env node` is what creates the command. Without both, there is nothing to
  put on `PATH`.
- **`files: ["dist"]`.** Consumers get the build and nothing else.

## What would reverse this

Someone outside this repository using the tool regularly, or the article generating
enough interest that `npx okf-drift` is the difference between trying it and not. At that
point publish under a scope — `@oscar-io/okf-drift` — rather than claiming a global name.
A scope is owned, so it cannot be taken, and it does not pretend the project is more than
it is.
