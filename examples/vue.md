# a11y-fixer + Vue (Nuxt)

Example workflow for a Vue app built with Nuxt 3.

## .github/workflows/accessibility.yml

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and start Nuxt
        run: |
          npm run build
          node .output/server/index.mjs &
          npx wait-on http://localhost:3000

      - uses: gonzoblasco/a11y-fixer@v0.1.0
        with:
          config: .a11y-fixer.yml
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## .a11y-fixer.yml

```yaml
level: AA
max_impact: serious
max_new_violations: 5
routes:
  core:
    - /
    - /about
```

## Notes

- Nuxt 3 uses file-based routing similar to Next.js
- Pages in `pages/` directory are auto-detected from the PR diff
- For Vite + Vue Router, list routes manually in `routes.core`
