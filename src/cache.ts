import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ProcessedResult } from './types.js';

const CACHE_DIR = path.resolve(process.cwd(), '.a11y-cache');

/**
 * Save audit results as a baseline for future comparison.
 *
 * Results are stored as JSON files keyed by commit SHA.
 * In GitHub Actions, this would use artifacts; locally it uses the filesystem.
 */
export function saveBaseline(result: ProcessedResult, commitSha: string): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const filePath = path.join(CACHE_DIR, `baseline-${commitSha}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
}

/**
 * Load a baseline for a given commit SHA.
 * Returns null if no baseline exists.
 */
export function loadBaseline(commitSha: string): ProcessedResult | null {
  const filePath = path.join(CACHE_DIR, `baseline-${commitSha}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ProcessedResult;
  } catch {
    return null;
  }
}

/**
 * Get the latest baseline commit SHA by listing cache files.
 * Returns null if no baselines exist.
 */
export function getLatestBaselineSha(): string | null {
  if (!fs.existsSync(CACHE_DIR)) {
    return null;
  }

  const files = fs.readdirSync(CACHE_DIR)
    .filter((f) => f.startsWith('baseline-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  return files[0].replace('baseline-', '').replace('.json', '');
}

/**
 * Clear all cached baselines.
 */
export function clearCache(): void {
  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}
