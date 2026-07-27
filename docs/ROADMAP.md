# a11y-fixer — Roadmap

> **Status:** Phase 3 (In Progress)
> **Date:** 2026-07-27
> **Target version:** 1.0.0

---

## 🟢 Phase 1: Core Engine (MVP)

**Goal:** The bot can scan a PR, detect accessibility violations, and comment on the PR with results.

### Epic 1.1 — Config & Bootstrap
- [ ] **1.1.1** Initialize Node.js + TypeScript + Biome + Vitest project
- [ ] **1.1.2** Create `action.yml` with GitHub Action metadata
- [ ] **1.1.3** Implement `config.ts`: loader + Zod schema for `.a11y-fixer.yml`
- [ ] **1.1.4** Config validation tests (valid, invalid, defaults)

### Epic 1.2 — Diff Analyzer & Route Resolver
- [ ] **1.2.1** Implement `diff-analyzer.ts`: extract modified files from git diff
- [ ] **1.2.2** Implement `route-resolver.ts`: combine core routes + detected routes from diff
- [ ] **1.2.3** Initial Next.js App Router support (detect `page.tsx` in diff)
- [ ] **1.2.4** Route resolution tests (various diff scenarios)

### Epic 1.3 — Browser & Auditor
- [ ] **1.3.1** Implement `browser.ts`: Playwright launcher with page pool
- [ ] **1.3.2** Implement `auditor.ts`: inject axe-core, run audit, collect results
- [ ] **1.3.3** Authenticated route handling (inject cookie/header from secrets)
- [ ] **1.3.4** Configurable per-route timeout + error handling
- [ ] **1.3.5** Audit tests with HTML fixtures

### Epic 1.4 — Result Processor
- [ ] **1.4.1** Implement `processor.ts`: raw violations → structured by WCAG rule, impact, selector
- [ ] **1.4.2** Generate template-based suggested fixes for common violations
- [ ] **1.4.3** Processing tests with real axe-core data

### Epic 1.5 — PR Comment & Check
- [ ] **1.5.1** Implement `github.ts`: wrappers for gh CLI (comment, set check status)
- [ ] **1.5.2** Implement `comment.ts`: structured markdown generator
- [ ] **1.5.3** Implement `comparator.ts`: current vs baseline (new, fixed, persistent violations)
- [ ] **1.5.4** Implement `cache.ts`: upload/download GitHub Actions artifacts
- [ ] **1.5.5** Comment and comparison tests

### Epic 1.6 — Integration Test (end-to-end)
- [ ] **1.6.1** Create test GitHub Actions workflow
- [ ] **1.6.2** Test against a test repo with known violations
- [ ] **1.6.3** Verify PR comment, check status, evolution

---

## ⚪ Phase 2: Thresholds & Quality

**Goal:** The maintainer can define quality thresholds and the bot blocks PRs that don't meet them.

### Epic 2.1 — Threshold Engine
- [ ] **2.1.1** Implement threshold evaluation (WCAG level, impact, count)
- [ ] **2.1.2** Dynamic check status: ✅ passing / ⚠️ warning / ❌ failing
- [ ] **2.1.3** Threshold tests with edge cases

### Epic 2.2 — Ignore Rules
- [ ] **2.2.1** Implement `ignore.rules` and `ignore.selectors` in config
- [ ] **2.2.2** False positive filtering tests

---

## ⚪ Phase 3: AI Explainer (BYOK)

**Goal:** Optional AI mode that generates detailed explanations and contextualized code examples.

### Epic 3.1 — AI Integration
- [ ] **3.1.1** Implement `ai-explainer.ts`: provider abstraction (OpenAI, Anthropic)
- [ ] **3.1.2** Prompt engineering for accessibility explanations
- [ ] **3.1.3** Fallback to templates if no API key or call fails
- [ ] **3.1.4** Tests with API mocks

---

## ⚪ Phase 4: Distribution & Docs

**Goal:** Publish on GitHub Marketplace, complete documentation, examples.

### Epic 4.1 — GitHub Marketplace
- [ ] **4.1.1** Create README.md with badges, examples, configuration
- [ ] **4.1.2** Publish action on GitHub Marketplace
- [ ] **4.1.3** Create `.a11y-fixer.yml` quickstart template

### Epic 4.2 — Documentation
- [ ] **4.2.1** Documentation for all configuration options
- [ ] **4.2.2** Contribution guide
- [ ] **4.2.3** Examples for popular frameworks (Next.js, React, Vue, Angular)

---

## ⚪ Phase 5: Post-MVP

**Goal:** Additional features that expand the scope.

- [ ] **5.1** Suggest changes: propose fix as PR suggestion
- [ ] **5.2** CLI standalone to run locally
- [ ] **5.3** Historical dashboard (GitHub Pages with artifacts)
- [ ] **5.4** React Native support (mobile)
- [ ] **5.5** Design system integration (detect component patterns)
- [ ] **5.6** More framework support in route resolver

---

## Milestones

| Milestone | Estimated date | Deliverable |
|---|---|---|
| Functional MVP | — | Action that scans and comments on PRs |
| Thresholds | — | Configurable thresholds, check status |
| AI Explainer | — | AI explanations (BYOK) |
| v1.0.0 | — | Published on GitHub Marketplace |
