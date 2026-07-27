# a11y-fixer — MVP Tracker

> **Status:** Phase 0.4 (Planning)
> **Date:** 2026-07-27
> **Target:** Phase 1 — Core Engine (MVP)
> **Based on:** ROADMAP.md

---

## How to use this tracker

- Each task is a single, completable unit of work (2-15 minutes)
- Tasks are ordered by dependency — do them in order
- Mark `[x]` when done, `[/]` when in progress
- When an epic is complete, commit with a message referencing the epic

---

## Epic 1.1 — Config & Bootstrap

**Goal:** Project initialized, compiles, lints, and can load `.a11y-fixer.yml`.

### 1.1.1 — Initialize project scaffold

- [ ] Create `package.json` with dependencies:
  - `@actions/core`, `@actions/github`, `@octokit/rest`
  - `axe-core`, `playwright`
  - `zod` (config validation)
  - `typescript`, `@types/node`, `vitest`, `biome`
- [ ] Create `tsconfig.json` (strict, ESM, Node.js 20 target)
- [ ] Create `biome.json` (defaults, no ESLint/Prettier)
- [ ] Create `vitest.config.ts`
- [ ] Create `.gitignore` (node_modules, dist, .next, playwright cache)
- [ ] Run `npm install` and verify it compiles
- [ ] Run `npx biome check` — zero errors

**Verification:** `npm run build` exits 0, `npx biome check` exits 0

### 1.1.2 — Create action.yml

- [ ] Create `action.yml` with:
  - `name: a11y-fixer`
  - `description: Accessibility audit bot for PRs`
  - `author: gonzoblasco`
  - `inputs`: `github_token`, `config_path` (optional, default `.a11y-fixer.yml`)
  - `runs.using: node20`
  - `runs.main: dist/action.js`

**Verification:** `action.yml` is valid YAML, matches GitHub Action spec

### 1.1.3 — Implement config.ts + config.schema.ts

- [ ] Create `src/config.schema.ts` with Zod schema for `.a11y-fixer.yml`:
  - `level`: enum `A | AA | AAA`, default `AA`
  - `max_impact`: enum `minor | moderate | serious | critical`, default `serious`
  - `max_new_violations`: number, default `5`
  - `routes.core`: array of strings, default `["/"]`
  - `routes.authenticated`: optional array of `{path, auth: {type, value}}`
  - `ai.enabled`: boolean, default `false`
  - `ai.provider`: optional enum `openai | anthropic`
  - `ai.model`: optional string
  - `ignore.rules`: optional array of strings
  - `ignore.selectors`: optional array of strings
- [ ] Create `src/config.ts`:
  - `loadConfig(configPath: string): Config`
  - Reads YAML file, parses with Zod, returns typed config
  - Falls back to defaults for missing fields
  - Throws descriptive error on invalid config

### 1.1.4 — Config validation tests

- [ ] Test: valid minimal config (only required fields)
- [ ] Test: valid full config (all fields)
- [ ] Test: invalid level value → error
- [ ] Test: invalid impact value → error
- [ ] Test: missing file → fallback to defaults
- [ ] Test: empty file → fallback to defaults

**Verification:** `npx vitest run src/config.test.ts` — all pass

---

## Epic 1.2 — Diff Analyzer & Route Resolver

**Goal:** Given a git diff, determine which routes to scan.

### 1.2.1 — Implement diff-analyzer.ts

- [ ] Create `src/diff-analyzer.ts`:
  - `getChangedFiles(baseSha: string, headSha: string): string[]`
  - Runs `git diff --name-only` between two SHAs
  - Returns list of changed file paths
- [ ] Handle: empty diff, binary files, deleted files

### 1.2.2 — Implement route-resolver.ts

- [ ] Create `src/route-resolver.ts`:
  - `resolveRoutes(config: Config, changedFiles: string[]): string[]`
  - Always includes `config.routes.core`
  - Detects routes from changed files (Next.js App Router: `page.tsx`, `route.tsx`)
  - Deduplicates
  - Returns sorted unique routes

### 1.2.3 — Next.js App Router detection

- [ ] Map file paths to URL routes:
  - `src/app/page.tsx` → `/`
  - `src/app/dashboard/page.tsx` → `/dashboard`
  - `src/app/projects/[id]/page.tsx` → `/projects/:id` (skip dynamic params)
  - `src/app/api/...` → skip (API routes, not pages)
- [ ] Handle: group routes, layout files (skip), loading files (skip)

### 1.2.4 — Route resolution tests

- [ ] Test: core routes only (no changed files)
- [ ] Test: core + detected routes (with dedup)
- [ ] Test: no page files changed → only core routes
- [ ] Test: dynamic route detected → included
- [ ] Test: API route changed → excluded
- [ ] Test: empty changed files → core routes only

**Verification:** `npx vitest run src/route-resolver.test.ts` — all pass

---

## Epic 1.3 — Browser & Auditor

**Goal:** Launch Playwright, navigate to routes, run axe-core, collect violations.

### 1.3.1 — Implement browser.ts

- [ ] Create `src/browser.ts`:
  - `createBrowser(): Promise<Browser>` — launch Chromium headless
  - `createPage(browser: Browser): Promise<Page>` — new page with sensible defaults
  - `navigateToRoute(page: Page, url: string): Promise<void>` — navigate, wait for load
  - `closeBrowser(browser: Browser): Promise<void>` — cleanup
- [ ] Configure: `headless: true`, viewport 1280x720, no sandbox for CI
- [ ] Error handling: timeout, navigation failure, browser crash

### 1.3.2 — Implement auditor.ts

- [ ] Create `src/auditor.ts`:
  - `runAudit(page: Page): Promise<Violation[]>`
  - Inject axe-core source into page
  - Run `axe.run()` with configured level/impact
  - Return structured violations
- [ ] Each violation includes: `id`, `impact`, `description`, `help`, `helpUrl`, `nodes[]` with `selector`, `html`, `failureSummary`

### 1.3.3 — Authenticated route handling

- [ ] Before navigating to authenticated routes:
  - If `auth.type === 'cookie'`: set cookie on page context
  - If `auth.type === 'header'`: set extra HTTP headers
  - If `auth.type === 'token'`: set Authorization header
- [ ] Verify page loaded (not redirected to login)

### 1.3.4 — Timeout + error handling

- [ ] Configurable timeout per route (default: 30s)
- [ ] On timeout: log warning, skip route, continue
- [ ] On navigation error: log error, skip route, continue
- [ ] On axe-core error: log error, skip route, continue
- [ ] Never crash the whole audit for one bad route

### 1.3.5 — Audit tests with HTML fixtures

- [ ] Create `tests/fixtures/` with HTML files:
  - `good.html` — no violations
  - `bad-contrast.html` — color contrast violation
  - `missing-alt.html` — missing alt text
  - `multiple-violations.html` — 3+ violations of different types
- [ ] Test: good page → 0 violations
- [ ] Test: bad contrast → 1+ violations of type `color-contrast`
- [ ] Test: missing alt → 1+ violations of type `image-alt`
- [ ] Test: multiple violations → correct count and types

**Verification:** `npx vitest run src/auditor.test.ts` — all pass

---

## Epic 1.4 — Result Processor

**Goal:** Raw axe-core violations → structured, grouped, with suggested fixes.

### 1.4.1 — Implement processor.ts

- [ ] Create `src/processor.ts`:
  - `processViolations(raw: Violation[]): ProcessedResult`
  - Group violations by WCAG rule
  - Sort by impact (critical → minor)
  - Structure: `{ rule, impact, description, elements: [{ selector, html, failureSummary }] }`

### 1.4.2 — Template-based suggested fixes

- [ ] Create fix templates for common violations:
  - `color-contrast`: suggest minimum 4.5:1 ratio, provide example
  - `image-alt`: suggest adding `alt` attribute
  - `aria-valid-attr`: suggest correct attribute name
  - `label`: suggest associating label with input
  - `heading-order`: suggest correct heading hierarchy
  - `landmark-one-main`: suggest wrapping in `<main>`
  - `link-name`: suggest adding accessible name
  - `button-name`: suggest adding accessible name
- [ ] Unknown violations: generic "check the WCAG documentation" fallback

### 1.4.3 — Processing tests with real axe-core data

- [ ] Test: single violation → correct structure
- [ ] Test: multiple violations → grouped by rule
- [ ] Test: violations sorted by impact
- [ ] Test: known violation → has suggested fix
- [ ] Test: unknown violation → has generic fallback
- [ ] Test: empty violations → empty result

**Verification:** `npx vitest run src/processor.test.ts` — all pass

---

## Epic 1.5 — PR Comment & Check

**Goal:** Post structured comment on PR, set check status, compare with baseline.

### 1.5.1 — Implement github.ts

- [ ] Create `src/github.ts`:
  - `postComment(comment: string): Promise<void>` — post PR comment via gh CLI
  - `setCheckStatus(state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error'): Promise<void>` — set check
  - `getBaseSha(): string` — get base branch SHA from event payload
  - `getHeadSha(): string` — get head branch SHA
- [ ] Use `@actions/github` context for event data
- [ ] Fallback: use `gh` CLI if `@actions/github` context unavailable

### 1.5.2 — Implement comment.ts

- [ ] Create `src/comment.ts`:
  - `generateComment(result: ProcessedResult, evolution: EvolutionResult, config: Config): string`
  - Follow DESIGN.md format:
    - Badge (✅ / ⚠️ / ❌)
    - Summary (one line)
    - Violations list (each with impact, rule, element, how to fix)
    - Evolution section (new, fixed, persistent, trend)
    - Configuration footer
- [ ] Handle: no violations, all violations, mixed results

### 1.5.3 — Implement comparator.ts

- [ ] Create `src/comparator.ts`:
  - `compare(current: ProcessedResult, baseline: ProcessedResult | null): EvolutionResult`
  - `EvolutionResult`: `{ new: Violation[], fixed: Violation[], persistent: Violation[], trend: 'improves' | 'worsens' | 'neutral' | 'first' }`
  - Compare by violation `id` + `selector` (same violation = same rule on same element)
  - Trend: new < fixed → improves, new > fixed → worsens, new === fixed → neutral, no baseline → first

### 1.5.4 — Implement cache.ts

- [ ] Create `src/cache.ts`:
  - `saveBaseline(result: ProcessedResult): Promise<void>` — upload artifact
  - `loadBaseline(): Promise<ProcessedResult | null>` — download artifact
  - Cache key: `a11y-baseline-{commitSha}`
  - Use `@actions/artifact` package
  - If artifact not found → return null (first run)

### 1.5.5 — Comment and comparison tests

- [ ] Test: generate comment with violations → matches DESIGN.md format
- [ ] Test: generate comment with no violations → clean PR format
- [ ] Test: generate comment with error → error format
- [ ] Test: compare with baseline → correct new/fixed/persistent
- [ ] Test: compare without baseline → first audit format
- [ ] Test: trend calculation (improves, worsens, neutral)

**Verification:** `npx vitest run src/comment.test.ts src/comparator.test.ts` — all pass

---

## Epic 1.6 — Integration Test (end-to-end)

**Goal:** Full pipeline works against a real test repo.

### 1.6.1 — Create test workflow

- [ ] Create `.github/workflows/test-audit.yml`:
  - Trigger: `pull_request` on test repo
  - Steps: checkout, setup Node, install deps, run a11y-fixer
- [ ] Create test repo `a11y-fixer-test` with:
  - Next.js app with known violations (missing alt, low contrast, etc.)
  - `.a11y-fixer.yml` with basic config

### 1.6.2 — Run against test repo

- [ ] Open PR with violations → verify comment is posted
- [ ] Open PR with fixes → verify evolution shows improvements
- [ ] Open PR with no changes → verify clean PR format
- [ ] Open docs-only PR → verify skipped format

### 1.6.3 — Verify all outputs

- [ ] Comment format matches DESIGN.md spec
- [ ] Check status is correct (passing / warning / failing)
- [ ] Evolution data is accurate
- [ ] Suggested fixes are actionable
- [ ] No false crashes on any scenario

**Verification:** All 4 PR scenarios produce correct comments and check statuses

---

## Progress summary

| Epic | Tasks | Done |
|---|---|---|
| 1.1 Config & Bootstrap | 4 tasks, 11 subtasks | 0/11 |
| 1.2 Diff Analyzer & Route Resolver | 4 tasks, 14 subtasks | 0/14 |
| 1.3 Browser & Auditor | 5 tasks, 18 subtasks | 0/18 |
| 1.4 Result Processor | 3 tasks, 10 subtasks | 0/10 |
| 1.5 PR Comment & Check | 5 tasks, 15 subtasks | 0/15 |
| 1.6 Integration Test | 3 tasks, 9 subtasks | 0/9 |
| **Total** | **24 tasks** | **0/77** |
