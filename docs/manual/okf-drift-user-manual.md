---
# OKF v0.2
type: "Manual"
title: "okf-drift User Manual: What is possible today"
description: "an operational guide to the commands, exports, and limitations currently implemented in okf-drift"
tags: [ documentation, manual, cli, api ]
status: "normative/current"
generated: { by: tool/okf-drift, at: 2026-09-11T17:30:00Z }
verified: { by: human:oscar-io, at: 2026-09-11T18:45:00Z }
sources:
  - id: status-doc
    resource: /docs/status.md
    title: "Lists 'Built and true today' and command table"
    author: human:oscar-io
---

# okf-drift User Manual

This document describes the capabilities of `okf-drift`.

## Installation & Prerequisites

`okf-drift` is installed as a git dependency: `npm install okf-drift`

## 1. Command Line Interface (CLI)

The CLI is designed for CI/CD pipelines or manual verification.

### A. Check a Bundle (`check`)
```bash
npx okf-drift check <bundle-path>
```

### B. Update Catalogues (`index`)
```bash
npx okf-drift index --write docs
```
