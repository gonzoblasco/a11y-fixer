/**
 * a11y-fixer - Accessibility audit bot for GitHub PRs
 *
 * Entry point for the GitHub Action.
 * Loads config, analyzes the diff, runs axe-core via Playwright,
 * generates AI explanations (if enabled), and posts a structured comment.
 */
export declare function run(): Promise<void>;
