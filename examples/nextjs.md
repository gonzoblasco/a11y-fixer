# a11y-fixer + Next.js

Example workflow for a Next.js App Router project.

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

      - name: Build Next.js app
        run: npm run build

      - name: Start Next.js and wait for it
        run: |
          npm run start &
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
    - /login
    - /dashboard
  authenticated:
    - path: /admin
      auth:
        type: cookie
        value: session=${{ secrets.SESSION_COOKIE }}
```

## Notes

- Next.js App Router pages are auto-detected from the PR diff
- Dynamic routes like `/blog/[slug]` are detected as `/blog/:slug`
- API routes (`/api/*`) are excluded from scanning
- The `wait-on` package ensures the server is ready before the audit starts
