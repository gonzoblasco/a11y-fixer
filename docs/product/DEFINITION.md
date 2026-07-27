# a11y-fixer — Definition

> **Status:** Phase 0.1 (Definition)
> **Date:** 2026-07-27
> **Based on:** BRIEF.md

---

## Value proposition in one sentence

> A GitHub Action that audits accessibility on every PR, explains which WCAG rule each violation breaks, and guides the dev to fix it — without leaving the workflow.

## Target audience (personas)

### Pablo — Frontend dev at a startup
- 28, React/TypeScript, 4 years of experience
- Knows accessibility is important but never had formal training
- Uses Lighthouse occasionally but can't interpret the reports
- **Pain:** "I know my code should be accessible but I don't know where to start"
- **Value:** The bot tells him exactly which line has the problem and how to fix it

### Martina — OSS maintainer
- 35, maintains 3 open source libraries with ~5k stars each
- Wants her project to be accessible but doesn't have time for manual audits
- **Pain:** "I can't manually review every PR for accessibility"
- **Value:** An automatic standard that maintains quality without manual effort

### Lucas — Accessibility Engineer
- 42, works at a consultancy, does WCAG audits
- Looks for tools that automate the repetitive so he can focus on the complex
- **Pain:** "I waste hours reviewing things a machine could detect"
- **Value:** The bot filters the obvious and leaves only the cases that require human judgment

## Core features (MVP)

### F1 — Automatic PR audit
- Triggers on `pull_request` and `pull_request_target` events
- Runs axe-core against pages affected by the diff
- Identifies which new/modified elements have violations
- Maps each violation to its WCAG rule (level A, AA, AAA)

### F2 — Structured PR comment
- Summary: "X new violations, Y existing, Z fixed"
- Issue list with:
  - Affected element (CSS selector)
  - WCAG rule violated
  - Impact (critical, serious, moderate, minor)
  - How to fix it (explanatory text + code example)
- Status badge: ✅ passing / ⚠️ warning / ❌ failing

### F3 — Evolution vs base branch
- Compares audit results against the base branch (main)
- Shows: new violations, fixed violations, persistent violations
- Trend: "this PR improves/worsens/neutralizes accessibility"

### F4 — Configurable threshold
- The maintainer defines in a config file (`.a11y-fixer.yml`):
  - Minimum WCAG level (A, AA, AAA)
  - Maximum allowed impact (critical, serious, moderate, minor)
  - Maximum number of new violations allowed
- If the threshold is exceeded, the check fails and blocks the merge

### F5 — AI explanations (BYOK)
- Optional mode: the dev configures their own API key (OpenAI, Anthropic, etc.)
- AI generates more detailed explanations and contextualized code examples
- Without AI: template-based explanations + axe-core documentation
- With AI: explanations adapted to the project's stack (React, Vue, etc.)

## Post-MVP features

- **Suggest changes:** bot proposes the fix directly as a PR suggestion
- **Historical dashboard:** accessibility evolution chart over time
- **CLI standalone:** to run locally before pushing
- **Mobile support:** React Native component auditing
- **Design system integration:** detect component patterns and suggest accessible props

## Success metrics

| Metric | Goal | How to measure |
|---|---|---|
| Adoption | 100 repos using the action in 6 months | GitHub Marketplace installs |
| PRs analyzed | 500 PRs/month at 6 months | GitHub API |
| Resolution rate | 40% of commented issues are resolved before merge | PR tracking |
| Accuracy | < 5% false positives reported as issues | User feedback |
| Audit time | < 2 minutes for medium projects | GitHub Action runtime |

## Constraints

- **Open source, MIT license** — no SaaS, no mandatory telemetry
- **AI is BYOK** — the project doesn't run its own API costs
- **No database** — all configuration lives in the repo (`.a11y-fixer.yml`)
- **No web dashboard** — feedback lives in GitHub PRs
- **TypeScript** — Gonzo's stack
- **Minimal dependencies** — fast to install in CI

## Assumed stack

| Layer | Technology | Justification |
|---|---|---|
| Runtime | Node.js 20+ | Standard for GitHub Actions |
| Audit engine | axe-core | Industry standard, maintained by Deque |
| Action framework | @actions/core | Official GitHub Actions SDK |
| Language | TypeScript 5.x | Gonzo's stack |
| Testing | Vitest | Fast, native ESM |
| Linting | Biome | Replaces ESLint + Prettier |
| AI (optional) | OpenAI / Anthropic API | BYOK, user brings their own key |

## Open questions (resolved in Phase 0.2)

- [x] How to determine which pages/routes to scan given a diff? (only changed pages vs all)
- [x] How to handle SPAs that require navigation to reach certain pages?
- [x] Does the "evolution" analysis require caching results between runs? (GitHub Actions artifacts)
- [x] Monorepo support? (each package can have its own config)
- [x] `.a11y-fixer.yml` format? (we need a schema)
