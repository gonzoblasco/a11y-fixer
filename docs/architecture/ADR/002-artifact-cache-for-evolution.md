# ADR 002: GitHub Actions artifact cache for evolution

**Date:** 2026-07-27
**Context:** To show accessibility evolution between PRs (new, fixed, persistent violations), we need to compare against a baseline. This baseline must persist between Action runs.

**Options considered:**
1. External database (Supabase, Neon, etc.) — violates the "no DB" constraint
2. GitHub Actions artifact cache — ephemeral but sufficient
3. File in the repo (`.a11y-baseline.json`) — pollutes git history
4. No cache, PR-only report without evolution — loses feature F3

**Decision:** Use GitHub Actions artifacts with `actions/upload-artifact` and `actions/download-artifact`.

**Justification:**
- No external infrastructure required
- Artifacts persist as long as GitHub keeps them (90 days by default)
- Baseline is tied to the main commit, not the PR
- If the artifact is lost, there's simply no evolution comparison — not blocking

**Consequences:**
- First run on a new repo won't have a baseline (reports current violations only)
- If GitHub purges artifacts, evolution history is lost
- Need a cache key system based on the main commit SHA

**Status:** Accepted
