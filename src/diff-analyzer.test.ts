import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { getChangedFiles } from './diff-analyzer.js';

// Get the current repo's HEAD SHA for testing
const HEAD_SHA = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
// Get the initial commit SHA
const FIRST_SHA = execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf-8' }).trim();

describe('getChangedFiles', () => {
  it('returns an array of changed files between two SHAs', () => {
    const files = getChangedFiles(FIRST_SHA, HEAD_SHA);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => typeof f === 'string' && f.length > 0)).toBe(true);
  });

  it('returns empty array when comparing HEAD to itself', () => {
    const files = getChangedFiles(HEAD_SHA, HEAD_SHA);
    expect(files).toEqual([]);
  });

  it('returns empty array for invalid SHAs', () => {
    const files = getChangedFiles('nonexistent-sha', HEAD_SHA);
    expect(files).toEqual([]);
  });

  it('returns file paths without leading ./', () => {
    const files = getChangedFiles(FIRST_SHA, HEAD_SHA);
    for (const file of files) {
      expect(file).not.toMatch(/^\.\//);
    }
  });
});
