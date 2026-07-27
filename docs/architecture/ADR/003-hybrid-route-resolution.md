# ADR 003: Hybrid route resolution

**Date:** 2026-07-27
**Context:** We need to determine which pages/routes to scan on each PR. Scanning all project routes is slow and unnecessary. Scanning only diff routes can miss critical pages.

**Options considered:**
1. Diff routes only — fast but incomplete
2. All project routes — complete but slow
3. User configures manually — flexible but requires maintenance
4. Hybrid: core routes (configurable) + automatic detection from diff

**Decision:** Hybrid.

**Justification:**
- User defines core routes that are always scanned (home, login, dashboard, etc.)
- Bot detects new or modified routes by analyzing the git diff (`page.tsx`, `route.tsx`, etc.)
- Routes are deduplicated and each is scanned once
- Balance between speed and coverage

**Consequences:**
- The diff analyzer needs to understand the framework structure (Next.js App Router, etc.)
- For unsupported frameworks, the user can define all routes manually in core
- Automatically detected routes may have false positives (files that aren't pages)

**Status:** Accepted
