# a11y-fixer — Design (Voice & Tone)

> **Status:** Phase 0.3 (Design)
> **Date:** 2026-07-27
> **Based on:** BRIEF.md, DEFINITION.md, ARCHITECTURE.md

---

## 1. Bot personality

**Name:** a11y-fixer (no nicknames, no mascot, no robot emojis)

**Language:** English. GitHub is a global developer platform — comments must be understandable by any developer, anywhere.

**Voice:** Technical, direct, pedagogical. Like a senior colleague who knows accessibility and explains without making you feel bad for not knowing.

**Tone:**
- ✅ **Informative** — "Found 3 color contrast violations"
- ✅ **Pedagogical** — "Buttons need a contrast ratio of at least 4.5:1 against the background"
- ✅ **Constructive** — "Adding a label to the input resolves this issue"
- ❌ **Condescending** — "This is a basic error you should know"
- ❌ **Bureaucratic** — "A non-conformity with WCAG 2.2 has been detected"
- ❌ **Fake friendly** — "Hey there! So glad you're here! Let's review your PR together :)"

**Golden rule:** If a dev reads the comment and knows exactly what to do to fix it, the tone worked.

---

## 2. Comment structure

The comment is divided into 4 clear sections, in this order:

```
┌─────────────────────────────────────────────────────────┐
│  [BADGE] Accessibility Check — PASSING / WARNING / FAIL  │
│                                                         │
│  ## Summary                                             │
│  One line with the overall result.                      │
│                                                         │
│  ## Violations                                          │
│  List of issues found, each with:                       │
│  - WCAG rule violated                                   │
│  - Affected element                                     │
│  - Impact                                               │
│  - How to fix it                                        │
│                                                         │
│  ## Evolution                                           │
│  How accessibility changed vs the base branch.          │
│                                                         │
│  ## Configuration                                       │
│  Current threshold and link to docs.                    │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Badge

The badge is the first visible element. Uses GitHub labels (no external images):

```
✅ **Accessibility Check: PASSING** — 0 new violations
⚠️ **Accessibility Check: WARNING** — 2 new violations (threshold: 5)
❌ **Accessibility Check: FAILING** — 8 new violations (threshold: 5)
```

### 2.2 Summary

One line, no fluff:

```
No new accessibility violations found in this PR.
```

```
Found 3 new accessibility violations. 2 are within the configured threshold, 1 exceeds the maximum allowed.
```

```
This PR introduces 8 new accessibility violations, exceeding the threshold of 5 set in .a11y-fixer.yml.
```

### 2.3 Violations

Each violation is a list item with a consistent structure:

```
**{impact}** `{wcag rule}` — {short description}

- **Element:** `{CSS selector}`
- **Impact:** {critical / serious / moderate / minor}
- **WCAG:** {criterion} — {level}
- **How to fix it:**
  > {clear explanation of what to do}
  >
  > ```{language}
  > {code example}
  > ```
```

Real example:

```
**🔴 CRITICAL** `color-contrast` — Text does not have enough contrast against the background

- **Element:** `.btn-primary`
- **Impact:** critical
- **WCAG:** 1.4.3 — AA
- **How to fix it:**
  > Text needs a contrast ratio of at least 4.5:1 against the background.
  > Try these colors:
  >
  > ```css
  > .btn-primary {
  >   background-color: #1a73e8;
  >   color: #ffffff; /* ratio 6.3:1 over #1a73e8 */
  > }
  > ```
```

Impacts are shown with a visual prefix:

| Impact | Prefix | Semantic color |
|---|---|---|
| critical | 🔴 CRITICAL | Red |
| serious | 🟠 SERIOUS | Orange |
| moderate | 🟡 MODERATE | Yellow |
| minor | 🔵 MINOR | Blue |

### 2.4 Evolution

Section showing how accessibility changed relative to the base branch:

```
**Evolution vs main:**

- 🆕 **3 new** — violations introduced in this PR
- ✅ **1 fixed** — violation that existed in main and is no longer present
- 🔄 **2 persistent** — violations that already existed in main and remain

**Trend:** ⬆️ This PR improves accessibility (1 new, 3 fixed)
```

Possible trends:

| Trend | Indicator | Condition |
|---|---|---|
| Improves | ⬆️ Improves | new < fixed |
| Worsens | ⬇️ Worsens | new > fixed |
| Neutral | ➡️ Neutral | new = fixed |
| First time | 🆕 First audit | No baseline exists |

### 2.5 Configuration

At the bottom, info about current thresholds:

```
**Current config:** WCAG level `AA`, max impact `serious`, max `5` new violations.
[View configuration docs →](link)
```

If the check failed, add:

```
To adjust these thresholds, edit `.a11y-fixer.yml` at the root of the project.
```

---

## 3. Check states

The bot sets a check status on the PR reflecting the result:

| State | Check | Condition |
|---|---|---|
| ✅ Passing | `success` | 0 new violations, or all below threshold |
| ⚠️ Warning | `neutral` | New violations exist but within configured threshold |
| ❌ Failing | `failure` | New violations exceed the configured threshold |
| 🔄 Skipped | `skipped` | No pages detected to scan (docs-only PR, etc.) |
| 💥 Error | `error` | Internal action error (audit could not run) |

---

## 4. Special case comments

### No violations

```
✅ **Accessibility Check: PASSING**

No new accessibility violations found in this PR.

**Evolution vs main:** no changes. Previous state is maintained.
```

### Config / docs only changes

```
🔄 **Accessibility Check: SKIPPED**

This PR does not modify pages or components. Only PRs that affect project routes are audited.

If this PR should have been scanned, check the routes configured in `.a11y-fixer.yml`.
```

### Audit error

```
💥 **Accessibility Check: ERROR**

The accessibility audit could not be completed.

**Reason:** {error message}
**Failed route:** {route that caused the error}

This does not block the merge, but accessibility violations were not evaluated.
```

### First audit (no baseline)

```
✅ **Accessibility Check: PASSING**

Found 2 accessibility violations in this PR.

**Note:** This is the first audit on this project. There is no previous history to compare evolution against. The reported violations are the new baseline.
```

---

## 5. Writing rules

1. **Never use em dash (—).** Use regular hyphen (-). The em dash isn't on a standard keyboard and makes it obvious the text wasn't written by a developer.
2. **Never use "please" or "thank you".** The bot is not asking for favors, it's reporting facts.
3. **CSS selectors go in backticks.** Always.
4. **Code examples go in fenced blocks with language.** Always.
5. **One violation = one list item.** Do not group multiple issues in the same paragraph.
6. **"How to fix it" must be actionable.** Not "improve contrast", but "change the text color to #ffffff".
7. **Don't repeat information.** If the WCAG rule already says "1.4.3", you don't need to write "Contrast Minimum" next to it.
8. **Numbers use digits.** "3 violations", not "three violations".

---

## 6. Complete examples

### Scenario: PR with violations exceeding threshold

```
❌ **Accessibility Check: FAILING** — 8 new violations (threshold: 5)

Found 8 new accessibility violations. This PR exceeds the threshold of 5 set in .a11y-fixer.yml.

**🔴 CRITICAL** `color-contrast` — Text does not have enough contrast against the background

- **Element:** `.btn-primary`
- **Impact:** critical
- **WCAG:** 1.4.3 — AA
- **How to fix it:**
  > Text needs a contrast ratio of at least 4.5:1 against the background.
  >
  > ```css
  > .btn-primary {
  >   background-color: #1a73e8;
  >   color: #ffffff;
  > }
  > ```

**🟠 SERIOUS** `aria-valid-attr` — The ARIA attribute `aria-labeledby` is not valid

- **Element:** `#search-input`
- **Impact:** serious
- **WCAG:** 4.1.1 — A
- **How to fix it:**
  > The correct attribute is `aria-labelledby` (double "l").
  >
  > ```html
  > <input id="search-input" aria-labelledby="search-label" />
  > ```

**Evolution vs main:**

- 🆕 **8 new** — violations introduced in this PR
- ✅ **0 fixed**
- 🔄 **3 persistent** — violations that already existed in main and remain

**Trend:** ⬇️ This PR worsens accessibility (8 new, 0 fixed)

**Current config:** WCAG level `AA`, max impact `serious`, max `5` new violations.
To adjust these thresholds, edit `.a11y-fixer.yml` at the root of the project.
```

### Scenario: PR that improves accessibility

```
✅ **Accessibility Check: PASSING** — 1 new violation (threshold: 5)

Found 1 new accessibility violation, within the configured threshold.

**🔵 MINOR** `landmark-one-main` — Page does not have a `<main>` element

- **Element:** `body`
- **Impact:** minor
- **WCAG:** 1.3.1 — A
- **How to fix it:**
  > Wrap the main content in a `<main>` element.
  >
  > ```html
  > <main>
  >   <!-- main content -->
  > </main>
  > ```

**Evolution vs main:**

- 🆕 **1 new**
- ✅ **3 fixed** — violations that existed in main and are no longer present
- 🔄 **2 persistent**

**Trend:** ⬆️ This PR improves accessibility (1 new, 3 fixed)

**Current config:** WCAG level `AA`, max impact `serious`, max `5` new violations.
```

### Scenario: Clean PR

```
✅ **Accessibility Check: PASSING**

No new accessibility violations found in this PR.

**Evolution vs main:** no changes. Previous state is maintained.
```

---

## 7. Note on AI (BYOK)

When AI mode is active, ONLY the "How to fix it" section changes. The rest of the comment (summary, evolution, configuration) stays the same.

With AI, "How to fix it" can include:
- More detailed explanation of the *why* behind the rule
- Examples adapted to the project's stack (React, Vue, Angular)
- Multiple alternative solutions
- Links to official WCAG documentation

Without AI, "How to fix it" uses templates curated by the a11y-fixer team.
