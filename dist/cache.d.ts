import type { ProcessedResult } from './types.js';
/**
 * Save audit results as a baseline for future comparison.
 *
 * Results are stored as JSON files keyed by commit SHA.
 * In GitHub Actions, this would use artifacts; locally it uses the filesystem.
 */
export declare function saveBaseline(result: ProcessedResult, commitSha: string): void;
/**
 * Load a baseline for a given commit SHA.
 * Returns null if no baseline exists.
 */
export declare function loadBaseline(commitSha: string): ProcessedResult | null;
/**
 * Get the latest baseline commit SHA by listing cache files.
 * Returns null if no baselines exist.
 */
export declare function getLatestBaselineSha(): string | null;
/**
 * Clear all cached baselines.
 */
export declare function clearCache(): void;
//# sourceMappingURL=cache.d.ts.map