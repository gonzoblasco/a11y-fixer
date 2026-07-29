# Changelog

## [0.6.0] — 2026-07-28

### Fixed

- **Baseline cache now uses GitHub Actions artifacts** — `cache.ts` uploads/downloads
  baselines as workflow artifacts when running in GHA, with filesystem fallback
  for local development and tests. Evolution comparison now works in production.
- **GitHub API calls use octokit natively** — `github.ts` now uses `@actions/github`
  (octokit) for posting PR comments and setting check statuses, with `gh` CLI
  as fallback. Also reads event payload from file instead of `execSync cat`.
- **Entry point guard** — `action.ts` only invokes `run()` when loaded as the
  entry point, preventing accidental execution on import.

## [0.5.1] — 2026-07-28

### Fixed

- **`gh pr comment` now works inside Docker container** — added `--repo owner/repo` flag so `gh` knows which repository to target, and set `GITHUB_TOKEN` env var in addition to `GH_TOKEN` for broader compatibility.
- **Biome formatting** — fixed code style in `github.ts`.

## [0.5.0] — 2026-07-28

### Added

- **`target_url` input** — allows workflows to specify the base URL of the app to audit (e.g. `http://host.docker.internal:3000` for Docker container access). Defaults to `http://localhost:3000`.

### Fixed

- **`gh` CLI updated to latest version** — switched from Ubuntu apt package (v2.4.0, 2022) to official GitHub CLI repository.
- **`gh` authentication check** — replaced `gh auth status` with `gh --version` + `GH_TOKEN` check, which is more reliable in containerized environments.

## [0.4.1] — 2026-07-28

### Fixed

- **Action now actually executes** — added `run()` invocation at module level. Previous versions defined the function but never called it, masked by ncc bundling.
- **Playwright version pinned** — `playwright@1.61.1` (exact) to match the browsers in the base Docker image `mcr.microsoft.com/playwright:v1.61.1-jammy`.

## [0.4.0] — 2026-07-28

### Changed

- **Replaced ncc with tsc** — Playwright cannot be bundled with ncc (native modules, runtime `package.json` resolution). The Docker action now copies the full repo, runs `npm ci`, and compiles with `tsc`.
- **`dist/` removed from git tracking** — built inside the container.
- **Added `.dockerignore`** — excludes `node_modules/`, `dist/`, `.git/` from Docker build context.

### Infrastructure

- `tsconfig.json`: `module → commonjs`, `moduleResolution → node`
- `package.json`: `build → tsc`, removed `@vercel/ncc`
- `Dockerfile`: `COPY . /action/`, `npm ci`, `npx tsc`, entrypoint `dist/action.js`
