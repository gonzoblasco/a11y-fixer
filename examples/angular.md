# a11y-fixer + Angular

Example workflow for an Angular app.

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

      - name: Build and serve Angular
        run: |
          npm run build
          npx http-server dist/angular-app -p 3000 &
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
    - /settings
```

## Notes

- Angular uses component-based routing, not file-based
- All routes must be defined in `routes.core` (no auto-detection)
- Use `http-server` or `angular-http-server` to serve the built app
- For Angular Universal (SSR), use `npm run build && npm run serve:ssr`
