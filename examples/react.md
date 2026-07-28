# a11y-fixer + React (Vite)

Example workflow for a React app built with Vite.

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

      - name: Build and preview
        run: |
          npm run build
          npx vite preview --port 3000 &
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
    - /contact
```

## Notes

- For SPAs without SSR, define all routes in `routes.core`
- Route auto-detection works best with frameworks that have file-based routing
- For React Router apps, list the routes manually in `routes.core`
