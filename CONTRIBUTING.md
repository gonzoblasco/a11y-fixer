# Contributing to a11y-fixer

Thanks for your interest! This project is open source and contributions are welcome.

## Setup

```bash
# Clone the repo
git clone https://github.com/gonzoblasco/a11y-fixer.git
cd a11y-fixer

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Build
npm run build

# Run tests
npm test
```

## Development workflow

Before every commit:

```bash
# 1. Run tests
npx vitest run

# 2. Auto-fix lint and format
npx biome check --write .

# 3. Verify lint is clean
npx biome check .

# 4. Run tests again (Biome may have changed files)
npx vitest run

# 5. Stage and commit
git add -A
git commit -m "type: description"
git push
```

## Project structure

```
src/
  action.ts          — GitHub Action entry point (pipeline orchestrator)
  config.ts          — Config loader
  config.schema.ts   — Zod schema for .a11y-fixer.yml
  diff-analyzer.ts   — Git diff → changed files
  route-resolver.ts  — Changed files → routes to scan
  browser.ts         — Playwright launcher
  auditor.ts         — axe-core runner
  processor.ts       — Violation processing + suggested fixes
  thresholds.ts      — Quality threshold evaluation
  comparator.ts      — Baseline comparison (new/fixed/persistent)
  cache.ts           — Baseline persistence
  comment.ts         — PR comment generator
  github.ts          — GitHub API wrappers (gh CLI)
  ai-explainer.ts    — AI-powered explanations (BYOK)
  types.ts           — Shared types
tests/
  fixtures/          — HTML test pages
docs/
  product/           — BRIEF.md, DEFINITION.md
  architecture/      — ARCHITECTURE.md, ADRs
  design/            — DESIGN.md
```

## Code style

- TypeScript strict mode
- Biome for linting and formatting (no ESLint/Prettier)
- Vitest for testing
- ESM modules (import/export)
- Single quotes, semicolons always, 100 char line width

## Testing

```bash
# Run all tests
npx vitest run

# Run a specific test file
npx vitest run src/thresholds.test.ts

# Run tests in watch mode during development
npx vitest
```

## Pull requests

1. Create a branch from `main`
2. Make your changes
3. Add or update tests
4. Run the full test suite
5. Submit the PR

## License

MIT
