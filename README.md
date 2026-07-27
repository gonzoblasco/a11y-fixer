# a11y-fixer

Accessibility audit bot for GitHub PRs. Runs axe-core via Playwright on every pull request, detects new accessibility violations, and posts structured feedback as a PR comment.

Built for teams that want accessibility enforcement without SaaS lock-in. No external API required for core auditing. Optional AI explanations use your own API key.

## Features

- **Automatic route detection** — scans core routes you define + detects Next.js App Router pages changed in the PR.
- **Real browser auditing** — runs axe-core inside Playwright Chromium headless.
- **Authenticated pages** — supports cookies, HTTP headers, or Bearer tokens for protected routes.
- **Baseline comparison** — compares current PR against main to report new, fixed, and persistent violations.
- **Structured PR comments** — clean markdown with impact severity, affected elements, and suggested fixes.
- **Configurable thresholds** — set max impact level, max new violations, WCAG target, and ignored rules.
- **Optional AI explanations** — BYOK for OpenAI, Anthropic, or OpenRouter.
- **No SaaS dependency** — everything runs in your GitHub Actions runners.

## Quick Start

Add the action to your workflow:

```yaml
name: Accessibility Audit

on:
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gonzoblasco/a11y-fixer-v2@v0.1.0
        with:
          config: .a11y-fixer.yml
```

Create `.a11y-fixer.yml` in your repo root:

```yaml
level: AA
max_impact: serious
max_new_violations: 5
routes:
  core:
    - /
    - /login
    - /dashboard
ai:
  enabled: false
```

## How it works

1. Checkout the PR with full history.
2. Resolve the routes to scan from the PR diff.
3. Build and start the target app (you control this step in your workflow).
4. For each route, launch Playwright, inject axe-core, and collect violations.
5. Compare results against the baseline from `main`.
6. Post a structured PR comment with status badge, summary, violations, and evolution.

## Configuration

See [docs/design/DESIGN.md](docs/design/DESIGN.md) for the full configuration spec.

| Option | Type | Default | Description |
|---|---|---|---|
| `level` | string | `AA` | WCAG level target (`A`, `AA`, `AAA`). |
| `max_impact` | string | `serious` | Highest impact treated as failure (`minor`, `moderate`, `serious`, `critical`). |
| `max_new_violations` | number | `5` | Threshold for PR failure. |
| `routes.core` | string[] | `['/']` | Routes always scanned. |
| `routes.authenticated` | object[] | `[]` | Routes requiring auth (cookie, header, token). |
| `ai.enabled` | boolean | `false` | Enable AI explanations. |
| `ai.provider` | string | — | `openai`, `anthropic`, or `openrouter`. |
| `ai.model` | string | — | Model name. |
| `ignore.rules` | string[] | `[]` | axe-core rules to ignore. |

## Outputs

| Output | Description |
|---|---|
| `status` | `passing`, `warning`, or `failing`. |
| `new-violations` | JSON array of new violations introduced by the PR. |
| `total-violations` | Total number of violations found in current PR. |

## Development

```bash
npm install
npx playwright install chromium
npm run build
npm test
```

## Project Structure

- `src/action.ts` — GitHub Action entry point.
- `src/config.ts` / `src/config.schema.ts` — Configuration loading and validation.
- `src/diff-analyzer.ts` / `src/route-resolver.ts` — Git diff → routes to scan.
- `src/browser.ts` / `src/auditor.ts` — Playwright + axe-core runner.
- `src/processor.ts` — Violation structuring and suggested fixes.
- `src/comparator.ts` / `src/cache.ts` — Baseline comparison and persistence.
- `src/comment.ts` / `src/github.ts` — PR comment generation and posting.
- `docs/` — Product brief, architecture, design spec, roadmap, and ADRs.

## Status

MVP (v0.1.0) complete. See [docs/ROADMAP.md](docs/ROADMAP.md) for upcoming phases.

## License

MIT
