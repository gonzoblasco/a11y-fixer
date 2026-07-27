# ADR 001: Playwright as browser engine

**Date:** 2026-07-27
**Context:** We need a headless browser to navigate SPAs, run axe-core, and collect accessibility violations. Options are Puppeteer (Chrome) and Playwright (multi-browser).

**Decision:** Use Playwright.

**Justification:**
- Playwright supports Chromium, Firefox, and WebKit — allows auditing on multiple engines
- More modern and predictable API than Puppeteer
- Pre-installed on GitHub Actions runners (ubuntu-latest)
- Better SPA handling with `waitForNavigation`, `waitForSelector`, etc.
- The community is moving from Puppeteer to Playwright

**Consequences:**
- Additional dependency (~30MB in node_modules)
- Audit tests need a browser installed
- On GitHub Actions CI, no extra installation required

**Status:** Accepted
