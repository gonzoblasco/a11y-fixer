import { execSync } from 'node:child_process';
/**
 * Get the list of files changed between two git SHAs.
 *
 * Runs `git diff --name-only` between base and head, returns
 * the list of changed file paths. Handles edge cases like
 * empty diffs, binary files, and deleted files.
 */
export function getChangedFiles(baseSha, headSha) {
    try {
        const output = execSync(`git diff --name-only ${baseSha} ${headSha}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return output
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }
    catch (error) {
        // git diff returns exit code 1 when there are no differences
        // or when one of the SHAs doesn't exist
        return [];
    }
}
//# sourceMappingURL=diff-analyzer.js.map