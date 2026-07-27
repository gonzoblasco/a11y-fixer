# a11y-fixer — Brief

> **Status:** Phase 0.1 (Brainstorming)
> **Date:** 2026-07-27

---

## The problem

Web accessibility in open source projects is systematically neglected. Not because devs don't want to do it right, but because:

- Detecting accessibility issues requires external tools (Lighthouse, axe DevTools, WAVE) that live outside the natural development flow
- Knowing *how* to fix an issue requires WCAG expertise that not every dev has
- There's no early feedback in the PR cycle — when the code is being reviewed and is "hot"
- Existing tools are designed for accessibility auditors, not for devs in their daily workflow
- There's no way to track the *evolution* of a project's accessibility over time

## The vision

A **GitHub Action / bot** that hooks into PRs, runs automated accessibility audits, and comments with:

- **What** violations it found (and which WCAG rule they break)
- **How** to fix them (with concrete code examples)
- **Evolution** vs the base branch: "this PR improves/worsens accessibility"
- **Goal**: help the PR pass a quality accessibility threshold

## For whom

- **Open source devs** who want their projects to be accessible but don't have a11y expertise
- **Maintainers** who want to set an accessibility standard across their repos
- **Organizations** using GitHub that need WCAG compliance without relying on manual audits

## What it is NOT

- Not a dashboard / SaaS / web platform
- Not a CLI to run locally (though it could have one as an extra)
- Not a replacement for expert human audit
- Not a tool that claims to "fix everything automagically"

## Differentiation

| Tool | Approach | a11y-fixer |
|---|---|---|
| Lighthouse | Static report | Feedback in PRs |
| axe DevTools | Manual audit | Automated in CI |
| Pa11y CI | Error threshold | Explanation + how to fix |
| AccessLint | PR comments | Evolution + code examples |
| Deque Axe | SaaS enterprise | Open source + BYOK |

## Assumed stack

- GitHub Actions + GitHub Apps (to hook into PRs)
- axe-core as audit engine (industry standard)
- TypeScript (Gonzo's stack)
- Open source, MIT license
- Optional AI with BYOK (to explain how to fix issues)

## Open questions

- Web only, or React Native / mobile too?
- How deep should the "evolution" analysis be? (diff of violations between branches)
- Should it have a "suggest changes" mode that proposes the fix directly in the PR?
- CLI standalone or just GitHub Action?
