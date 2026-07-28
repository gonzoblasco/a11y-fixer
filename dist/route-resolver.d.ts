import type { Config } from './config.schema.js';
/**
 * Resolve the list of routes to scan for a given PR.
 *
 * Combines core routes (always scanned) with routes detected
 * from the list of changed files. Deduplicates and returns
 * a sorted list of unique routes.
 */
export declare function resolveRoutes(config: Config, changedFiles: string[]): string[];
/**
 * Detect a URL route from a file path, supporting Next.js App Router.
 *
 * Returns the detected route or null if the file is not a page/route.
 */
export declare function detectRouteFromFile(filePath: string): string | null;
