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

- [x] Create `package.json` with dependencies
- [x] Create `tsconfig.json` (strict, ESM, Node.js 20 target)
- [x] Create `biome.json` (defaults, no ESLint/Prettier)
- [x] Create `vitest.config.ts`
- [x] Create `.gitignore` (node_modules, dist, .next, playwright cache)
- [x] Run `npm install` and verify it compiles
- [x] Run `npx biome check` — zero errors

**Verification:** `npm run build` exits 0, `npx biome check` exits 0

### 1.1.2 — Create action.yml

- [x] Create `action.yml` with:
  - `name: a11y-fixer`
  - `description: Accessibility audit bot for PRs`
  - `author: gonzoblasco`
  - `inputs`: `github_token`, `config_path` (optional, default `.a11y-fixer.yml`)
  - `runs.using: node20`
  - `runs.main: dist/action.js`

**Verification:** `action.yml` is valid YAML, matches GitHub Action spec

### 1.1.3 — Implement config.ts + config.schema.ts

- [x] Create `src/config.schema.ts` with Zod schema for `.a11y-fixer.yml`
- [x] Create `src/config.ts`:
  - `loadConfig(configPath: string): Config`
  - Reads YAML file, parses with Zod, returns typed config
  - Falls back to defaults for missing fields
  - Throws descriptive error on invalid config

### 1.1.4 — Config validation tests

- [x] Test: valid minimal config (only required fields)
- [x] Test: valid full config (all fields)
- [x] Test: invalid level value → error
- [x] Test: invalid impact value → error
- [x] Test: missing file → fallback to defaults
- [x] Test: empty file → fallback to defaults

**Verification:** `npx vitest run src/config.test.ts` — 10 passed

---

## Epic 1.2 — Diff Analyzer & Route Resolver

**Goal:** Given a git diff, determine which routes to scan.

### 1.2.1 — Implement diff-analyzer.ts

- [x] Create `src/diff-analyzer.ts`
- [x] Handle: empty diff, binary files, deleted files

### 1.2.2 — Implement route-resolver.ts

- [x] Create `src/route-resolver.ts`
- [x] Deduplicates, returns sorted unique routes

### 1.2.3 — Next.js App Router detection

- [x] Map file paths to URL routes (root, nested, dynamic segments, API exclusion)
- [x] Handle: group routes, layout files (skip), loading files (skip)

### 1.2.4 — Route resolution tests

- [x] 17 tests: core only, core + detected, dedup, no pages, dynamic, API exclusion, empty, normalization, sorting
- [x] 4 tests: diff-analyzer (changed files, self-comparison, invalid SHA, path format)

**Verification:** `npx vitest run src/route-resolver.test.ts` — 17 passed, `npx vitest run src/diff-analyzer.test.ts` — 4 passed

---

## Epic 1.3 — Browser & Auditor

**Goal:** Launch Playwright, navigate to routes, run axe-core, collect violations.

### 1.3.1 — Implement browser.ts

- [x] Create `src/browser.ts`:
  - `createBrowser(): Promise<Browser>` — launch Chromium headless
  - `createPage(browser: Browser): Promise<Page>` — new page with sensible defaults
  - `navigateToRoute(page: Page, url: string): Promise<void>` — navigate, wait for load
  - `closeBrowser(browser: Browser): Promise<void>` — cleanup
- [x] Configure: `headless: true`, viewport 1280x720, no sandbox for CI
- [x] Error handling: timeout, navigation failure, browser crash

### 1.3.2 — Implement auditor.ts

- [x] Create `src/auditor.ts`:
  - `runAudit(page: Page): Promise<Violation[]>`
  - Inject axe-core source into page
  - Run `axe.run()` with configured level/impact
  - Return structured violations
- [x] Each violation includes: `id`, `impact`, `description`, `help`, `helpUrl`, `nodes[]` with `selector`, `html`, `failureSummary`

### 1.3.3 — Authenticated route handling

- [x] Before navigating to authenticated routes:
  - If `auth.type === 'cookie'`: set cookie on page context
  - If `auth.type === 'header'`: set extra HTTP headers
  - If `auth.type === 'token'`: set Authorization header
- [x] Verify page loaded (not redirected to login)

### 1.3.4 — Timeout + error handling

- [x] Configurable timeout per route (default: 30s)
- [x] On timeout: log warning, skip route, continue
- [x] On navigation error: log error, skip route, continue
- [x] On axe-core error: log error, skip route, continue
- [x] Never crash the whole audit for one bad route

### 1.3.5 — Audit tests with HTML fixtures

- [x] Create `tests/fixtures/` with HTML files:
  - `good.html` — no violations
  - `bad-contrast.html` — color contrast violation
  - `missing-alt.html` — missing alt text
  - `multiple-violations.html` — 3+ violations of different types
- [x] Test: good page → 0 violations
- [x] Test: bad contrast → 1+ violations of type `color-contrast`
- [x] Test: missing alt → 1+ violations of type `image-alt`
- [x] Test: multiple violations → correct count and types

**Verification:** `npx vitest run src/auditor.test.ts` — 5 passed

---

## Epic 1.4 — Result Processor

**Goal:** Raw axe-core violations → structured, grouped, with suggested fixes.

### 1.4.1 — Implement processor.ts

- [x] Create `src/processor.ts`:
  - `processViolations(raw: Violation[]): ProcessedResult`
  - Group violations by WCAG rule
  - Sort by impact (critical → minor)
  - Structure: `{ rule, impact, description, elements: [{ selector, html, failureSummary }] }`

### 1.4.2 — Template-based suggested fixes

- [x] Create fix templates for common violations:
  - `color-contrast`: suggest minimum 4.5:1 ratio, provide example
  - `image-alt`: suggest adding `alt` attribute
  - `aria-valid-attr`: suggest correct attribute name
  - `label`: suggest associating label with input
  - `heading-order`: suggest correct heading hierarchy
  - `landmark-one-main`: suggest wrapping in `<main>`
  - `link-name`: suggest adding accessible name
  - `button-name`: suggest adding accessible name
- [x] Unknown violations: generic "check the WCAG documentation" fallback

### 1.4.3 — Processing tests with real axe-core data

- [x] Test: single violation → correct structure
- [x] Test: multiple violations → grouped by rule
- [x] Test: violations sorted by impact
- [x] Test: known violation → has suggested fix
- [x] Test: unknown violation → has generic fallback
- [x] Test: empty violations → empty result

**Verification:** `npx vitest run src/processor.test.ts` — 17 passed

---

## Epic 1.5 — PR Comment & Check

**Goal:** Post structured comment on PR, set check status, compare with baseline.

### 1.5.1 — Implement github.ts

- [x] Create `src/github.ts`:
  - `postComment(comment: string): Promise<void>` — post PR comment via gh CLI
  - `setCheckStatus(state, description): void` — set check
  - `getBaseSha(): string` — get base branch SHA from event payload
  - `getHeadSha(): string` — get head branch SHA
- [x] Use `@actions/github` context for event data
- [x] Fallback: use `gh` CLI if `@actions/github` context unavailable

### 1.5.2 — Implement comment.ts

- [x] Create `src/comment.ts`:
  - `generateComment(result, evolution, config): string`
  - Follow DESIGN.md format:
    - Badge (✅ / ⚠️ / ❌)
    - Summary (one line)
    - Violations list (each with impact, rule, element, how to fix)
    - Evolution section (new, fixed, persistent, trend)
    - Configuration footer
- [x] Handle: no violations, all violations, mixed results

### 1.5.3 — Implement comparator.ts

- [x] Create `src/comparator.ts`:
  - `compare(current, baseline): EvolutionResult`
  - `EvolutionResult`: `{ new, fixed, persistent, trend }`
  - Compare by violation `id` + `selector` (same violation = same rule on same element)
  - Trend: new < fixed → improves, new > fixed → worsens, new === fixed → neutral, no baseline → first

### 1.5.4 — Implement cache.ts

- [x] Create `src/cache.ts`:
  - `saveBaseline(result, commitSha): void` — save to filesystem
  - `loadBaseline(commitSha): ProcessedResult | null` — load from filesystem
  - Cache key: `baseline-{commitSha}.json`
  - If not found → return null (first run)

### 1.5.5 — Comment and comparison tests

- [x] Test: generate comment with violations → matches DESIGN.md format
- [x] Test: generate comment with no violations → clean PR format
- [x] Test: generate comment with error → error format
- [x] Test: compare with baseline → correct new/fixed/persistent
- [x] Test: compare without baseline → first audit format
- [x] Test: trend calculation (improves, worsens, neutral)

**Verification:** `npx vitest run src/comment.test.ts src/comparator.test.ts` — 20 passed

---

## Epic 1.6 — Integration Test (end-to-end)

**Goal:** Full pipeline works against a real test repo.

### 1.6.1 — Create integration test

- [x] Create `src/integration.test.ts` — 6 tests covering all scenarios

### 1.6.2 — Run integration test locally

- [x] All 6 tests passed

### 1.6.3 — Verify all outputs

- [x] Comment format matches DESIGN.md spec
- [x] Check status is correct (passing / warning / failing)
- [x] Evolution data is accurate
- [x] Suggested fixes are actionable
- [x] No false crashes on any scenario

**Verification:** `npx vitest run src/integration.test.ts` — 6 passed

---

## Progress summary

| Epic | Tasks | Done |
|---|---|---|
| 1.1 Config & Bootstrap | 4 tasks | 4/4 |
| 1.2 Diff Analyzer & Route Resolver | 4 tasks | 4/4 |
| 1.3 Browser & Auditor | 5 tasks | 5/5 |
| 1.4 Result Processor | 3 tasks | 3/3 |
| 1.5 PR Comment & Check | 5 tasks | 5/5 |
| 1.6 Integration Test | 3 tasks | 3/3 |
| **Total** | **24 tasks** | **24/24** |
