/**
 * Get the list of files changed between two git SHAs.
 *
 * Runs `git diff --name-only` between base and head, returns
 * the list of changed file paths. Handles edge cases like
 * empty diffs, binary files, and deleted files.
 */
export declare function getChangedFiles(baseSha: string, headSha: string): string[];
