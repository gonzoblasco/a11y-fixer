# a11y-fixer

[![CI](https://github.com/gonzoblasco/a11y-fixer/actions/workflows/ci.yml/badge.svg)](https://github.com/gonzoblasco/a11y-fixer/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-102%20passing-brightgreen)](https://github.com/gonzoblasco/a11y-fixer)
[![Version](https://img.shields.io/github/v/release/gonzoblasco/a11y-fixer?include_prereleases)](https://github.com/gonzoblasco/a11y-fixer/releases)
[![License](https://img.shields.io/github/license/gonzoblasco/a11y-fixer)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-blue)](package.json)

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

      - name: Install dependencies
        run: npm ci

      - name: Build and start app
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:3000

      - uses: gonzoblasco/a11y-fixer@v0.5.1
        with:
          config: .a11y-fixer.yml
          github_token: ${{ secrets.GITHUB_TOKEN }}
          target_url: http://localhost:3000
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
6. Generate AI explanations (if enabled and API key configured).
7. Post a structured PR comment with status badge, summary, violations, and evolution.
8. Set check status (passing / warning / failing).

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
| `ignore.selectors` | string[] | `[]` | CSS selectors to ignore. |

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `config` | no | `.a11y-fixer.yml` | Path to configuration file. |
| `github_token` | yes | — | GitHub token for posting comments and checks. |
| `target_url` | no | `http://localhost:3000` | Base URL of the app to audit. Use `http://host.docker.internal:3000` for Docker container access. |

## Outputs

| Output | Description |
|---|---|
| `status` | `passing`, `warning`, or `failing`. |
| `new-violations` | JSON array of new violations introduced by the PR. |
| `total-violations` | Total number of violations found in current PR. |

## AI Explanations (BYOK)

Set these environment variables in your workflow:

```yaml
- name: Accessibility Audit
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    # or ANTHROPIC_API_KEY, or OPENROUTER_API_KEY
  uses: gonzoblasco/a11y-fixer@v0.5.1
```

Then enable AI in your config:

```yaml
ai:
  enabled: true
  provider: openai
  model: gpt-4o-mini
```

## Development

```bash
npm install
npx playwright install chromium
npm run build
npm test
```

## Project Structure

- `src/action.ts` — GitHub Action entry point (full pipeline orchestrator).
- `src/config.ts` / `src/config.schema.ts` — Configuration loading and validation.
- `src/diff-analyzer.ts` / `src/route-resolver.ts` — Git diff → routes to scan.
- `src/browser.ts` / `src/auditor.ts` — Playwright + axe-core runner.
- `src/processor.ts` — Violation structuring and suggested fixes.
- `src/thresholds.ts` — Quality threshold evaluation.
- `src/comparator.ts` / `src/cache.ts` — Baseline comparison and persistence.
- `src/comment.ts` / `src/github.ts` — PR comment generation and posting.
- `src/ai-explainer.ts` — AI-powered explanations (BYOK).
- `docs/` — Product brief, architecture, design spec, roadmap, and ADRs.

## Status

| Phase | Status | Tasks |
|---|---|---|
| 1 — Core Engine (MVP) | ✅ Complete | 24/24 |
| 2 — Thresholds & Quality | ✅ Complete | 5/5 |
| 3 — AI Explainer (BYOK) | ✅ Complete | 5/5 |
| 4 — Distribution & Docs | 🔄 In Progress | 0/6 |
| 5 — Post-MVP | ⬜ Planned | — |

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

## License

MIT
