# a11y-fixer — Architecture

> **Status:** Phase 0.2 (Architecture)
> **Date:** 2026-07-27
> **Based on:** BRIEF.md, DEFINITION.md

---

## Final stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Runtime | Node.js | 20+ LTS | Standard for GitHub Actions, native ESM |
| Language | TypeScript | 5.x | Gonzo's stack, strict typing |
| Action SDK | @actions/core | latest | Official GitHub Actions SDK |
| Browser engine | Playwright | latest | SPA navigation, more modern than Puppeteer |
| Audit engine | axe-core | 4.x | Industry standard, maintained by Deque |
| Testing | Vitest | latest | Fast, native ESM, compatible with stack |
| Linting | Biome | latest | Replaces ESLint + Prettier |
| AI (optional) | OpenAI / Anthropic API | — | BYOK, user brings their own key |

## Architectural patterns

- **Pipeline architecture** — each stage is a pure function or an independent step
- **Config as code** — all configuration lives in `.a11y-fixer.yml` in the repo
- **Stateless** — no database. State between runs is cached in GitHub Actions artifacts
- **BYOK AI** — AI integration is an optional plugin, not a requirement

## Components

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Action                         │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Config   │  │  Diff        │  │  Route            │  │
│  │  Loader   │→│  Analyzer    │→│  Resolver         │  │
│  └──────────┘  └──────────────┘  └────────┬─────────┘  │
│                                            │             │
│  ┌─────────────────────────────────────────▼──────────┐  │
│  │              Browser Engine (Playwright)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │  Launch   │  │  Navigate │  │  axe-core Run    │  │
│  │  │  Browser  │→│  to Route │→│  + Collect Results│  │
│  │  └──────────┘  └──────────┘  └────────┬─────────┘  │  │
│  └─────────────────────────────────────────▼──────────┘  │
│                                            │             │
│  ┌─────────────────────────────────────────▼──────────┐  │
│  │              Result Processor                       │  │
│  │  Raw violations → structured by WCAG rule,         │  │
│  │  impact, element selector, suggested fix            │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              Evolution Comparator                    │  │
│  │  Current results vs cached baseline from main       │  │
│  │  → new violations, resolved, persistent              │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              Comment Generator                      │  │
│  │  Markdown comment for the PR with summary,           │  │
│  │  violation list, evolution, suggestions              │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                               │
│  ┌────────────────────────▼───────────────────────────┐  │
│  │              AI Explainer (optional)                │  │
│  │  BYOK: enriches comments with explanations          │  │
│  │  contextualized to the project's stack               │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data flow (full execution)

```
1. PR opened / synchronized
   │
2. GitHub Action triggers (pull_request / pull_request_target)
   │
3. Load .a11y-fixer.yml from base repo
   │   Validate with Zod schema
   │
4. Analyze git diff between HEAD and base
   │   Extract: modified files, affected page routes
   │
5. Resolve routes to scan
   │   Core routes (from config) + detected routes (from diff)
   │   Deduplicate
   │
6. For each route:
   │   a. Launch Playwright browser (headless)
   │   b. Navigate to route
   │   c. Inject axe-core
   │   d. Run audit
   │   e. Collect violations
   │   f. Close page (reuse browser)
   │
7. Process results
   │   Group by: WCAG rule, impact, element
   │   Generate suggested fix (template-based)
   │
8. Load baseline from main artifacts
   │   If none → first run, no comparison
   │
9. Compare: current vs baseline
   │   → violations_new (not in baseline)
   │   → violations_resolved (were in baseline, gone now)
   │   → violations_persistent (in both)
   │
10. Generate PR comment
    │   Summary + violation table + evolution + suggestions
    │
11. (Optional) If API key is configured:
    │   Call OpenAI/Anthropic for detailed explanations
    │
12. Post comment on PR (gh pr comment)
    │
13. Set check status: ✅ / ⚠️ / ❌ based on thresholds
    │
14. Save results as new baseline (artifact)
```

## Configuration schema (`.a11y-fixer.yml`)

```yaml
# a11y-fixer configuration
# Version: 1

# Minimum WCAG level
level: AA # A | AA | AAA

# Maximum impact allowed before failing the check
max_impact: serious # minor | moderate | serious | critical

# Maximum number of new violations allowed
max_new_violations: 5

# Core project routes (always scanned)
routes:
  core:
    - /
    - /login
    - /dashboard
    - /settings

# Routes that require authentication (scanned with session)
routes:
  authenticated:
    - path: /dashboard
      auth:
        type: cookie # cookie | header | token
        value: "" # injected from GitHub Actions secret

# AI configuration (optional, BYOK)
ai:
  enabled: false
  provider: openai # openai | anthropic
  model: gpt-4o-mini
  # API key is passed as a GitHub Actions secret, not in this file

# Rules to ignore (known false positives)
ignore:
  rules:
    - color-contrast # example: intentional design
  selectors:
    - ".editor-preview" # example: third-party generated content
```

## Project structure

```
a11y-fixer/
│
├── action.yml                 # GitHub Action metadata
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── .a11y-fixer.yml            # Example configuration
├── .gitignore
│
├── src/
│   ├── action.ts              # Action entry point
│   ├── config.ts              # Loader + schema for .a11y-fixer.yml
│   ├── config.schema.ts       # Zod config schema
│   ├── diff-analyzer.ts       # Git diff → changed files
│   ├── route-resolver.ts      # Core routes + detected routes
│   ├── browser.ts             # Playwright launcher + manager
│   ├── auditor.ts             # axe-core runner
│   ├── processor.ts           # Raw violations → structured
│   ├── comparator.ts          # Current vs baseline
│   ├── comment.ts             # PR comment generator (markdown)
│   ├── ai-explainer.ts        # BYOK AI integration
│   ├── cache.ts               # Artifact cache (upload/download)
│   ├── github.ts              # GitHub API wrappers (comments, checks)
│   └── types.ts               # Shared types
│
├── tests/
│   ├── config.test.ts
│   ├── diff-analyzer.test.ts
│   ├── route-resolver.test.ts
│   ├── auditor.test.ts
│   ├── processor.test.ts
│   ├── comparator.test.ts
│   ├── comment.test.ts
│   └── ai-explainer.test.ts
│
├── docs/
│   ├── product/
│   │   ├── BRIEF.md
│   │   └── DEFINITION.md
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── ADR/
│   │       ├── 001-playwright-over-puppeteer.md
│   │       ├── 002-artifact-cache-for-evolution.md
│   │       └── 003-hybrid-route-resolution.md
│   └── design/
│       └── DESIGN.md
│
├── CHANGELOG.md
└── README.md
```

## Technical risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| axe-core doesn't detect issues in SPAs without full navigation | Medium | Playwright navigates as a real user, not just static HTML |
| Long execution time (many routes) | High | Parallelize routes with workers, configurable per-route timeout |
| axe-core false positives | Medium | `ignore.rules` and `ignore.selectors` in config |
| Artifact cache lost (GitHub purges them) | Low | If no baseline, report current violations only without evolution |
| AI API rate-limited or expensive | Low | BYOK, user controls their own cost. Fallback to templates |
| Playwright not available on GitHub Actions runner | Low | Pre-installed on ubuntu-latest runners |

## Resolved questions (from Phase 0.1)

- ✅ **Routes to scan:** Hybrid — core routes from config + automatic detection from diff
- ✅ **SPAs:** Playwright navigates as a real user (not just static HTML)
- ✅ **Evolution:** Cache in GitHub Actions artifacts, comparing against last main run
- ✅ **Monorepos:** Each package can have its own `.a11y-fixer.yml`
- ✅ **Config format:** YAML with Zod schema, documented above
