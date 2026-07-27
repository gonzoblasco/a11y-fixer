/**
 * Post a comment on the current PR.
 * Uses `gh pr comment` with the PR number from the GITHUB_REF environment variable.
 */
export declare function postComment(comment: string): void;
/**
 * Set a check status on the current commit.
 * Uses `gh api` to set the check run status.
 */
export declare function setCheckStatus(state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error', description: string): void;
/**
 * Get the PR number from the GITHUB_REF environment variable.
 * Returns null if not in a PR context.
 */
export declare function getPrNumber(): number | null;
/**
 * Get the owner/repo string from the GITHUB_REPOSITORY environment variable.
 */
export declare function getOwnerRepo(): string | null;
/**
 * Get the base branch SHA from the GitHub event payload.
 */
export declare function getBaseSha(): string | null;
/**
 * Get the head branch SHA from the GitHub event payload.
 */
export declare function getHeadSha(): string | null;
//# sourceMappingURL=github.d.ts.map