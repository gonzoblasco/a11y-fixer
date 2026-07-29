/**
 * Cache module for a11y-fixer baselines.
 *
 * Two modes:
 * - **GitHub Actions**: uses @actions/artifact to upload/download baselines
 *   as workflow artifacts. The baseline is stored with a fixed name
 *   (`a11y-baseline`) and keyed by the base commit SHA.
 * - **Local/Test**: uses the filesystem (`.a11y-cache/` directory).
 *
 * The module auto-detects which mode to use based on the GITHUB_ACTIONS
 * environment variable.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { DefaultArtifactClient } from '@actions/artifact';
import type { ProcessedResult } from './types.js';

const CACHE_DIR = path.resolve(process.cwd(), '.a11y-cache');
const BASELINE_ARTIFACT_NAME = 'a11y-baseline';

/**
 * Check if we're running inside a GitHub Actions workflow.
 */
function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Save audit results as a baseline for future comparison.
 *
 * In GitHub Actions: uploads the baseline as a workflow artifact.
 * Locally: saves to `.a11y-cache/baseline-{commitSha}.json`.
 */
export async function saveBaseline(
  result: ProcessedResult,
  commitSha: string,
): Promise<void> {
  if (isGitHubActions()) {
    await saveBaselineToArtifact(result, commitSha);
  } else {
    saveBaselineToDisk(result, commitSha);
  }
}

/**
 * Load a baseline for a given commit SHA.
 *
 * In GitHub Actions: downloads the latest baseline artifact from the
 * current workflow run (or a previous run on the same branch).
 * Locally: reads from `.a11y-cache/baseline-{commitSha}.json`.
 *
 * Returns null if no baseline exists.
 */
export async function loadBaseline(commitSha: string): Promise<ProcessedResult | null> {
  if (isGitHubActions()) {
    return loadBaselineFromArtifact(commitSha);
  }
  return loadBaselineFromDisk(commitSha);
}

// ─── Filesystem (local/test) ───────────────────────────────────────────────

function saveBaselineToDisk(result: ProcessedResult, commitSha: string): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const filePath = path.join(CACHE_DIR, `baseline-${commitSha}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
}

function loadBaselineFromDisk(commitSha: string): ProcessedResult | null {
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

// ─── GitHub Actions Artifacts ──────────────────────────────────────────────

/**
 * Save baseline as a GitHub Actions artifact.
 *
 * Writes the baseline to a temp file, then uploads it with a name
 * that includes the commit SHA so multiple baselines can coexist.
 */
async function saveBaselineToArtifact(
  result: ProcessedResult,
  commitSha: string,
): Promise<void> {
  const artifact = new DefaultArtifactClient();

  // Write to a temp file
  const tmpDir = path.resolve(process.cwd(), '.a11y-cache-tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpFile = path.join(tmpDir, `baseline-${commitSha}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(result, null, 2), 'utf-8');

  try {
    // Upload with a unique name per commit SHA
    const artifactName = `${BASELINE_ARTIFACT_NAME}-${commitSha}`;
    await artifact.uploadArtifact(artifactName, [tmpFile], tmpDir);
    console.log(`Baseline uploaded as artifact "${artifactName}"`);
  } finally {
    // Clean up temp file
    fs.rmSync(tmpFile, { force: true });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Load the latest baseline artifact for the given base commit SHA.
 *
 * Strategy:
 * 1. Try to find an artifact with the exact commit SHA name
 *    (`a11y-baseline-{sha}`) in the current workflow run.
 * 2. If not found, try to find the latest `a11y-baseline-*` artifact
 *    from the current workflow run.
 * 3. If still not found, return null (first run or no baseline).
 */
async function loadBaselineFromArtifact(
  commitSha: string,
): Promise<ProcessedResult | null> {
  const artifact = new DefaultArtifactClient();

  // Try exact match first
  const exactName = `${BASELINE_ARTIFACT_NAME}-${commitSha}`;
  try {
    const found = await artifact.getArtifact(exactName);
    if (found?.artifact?.id) {
      return downloadAndParseArtifact(artifact, found.artifact.id);
    }
  } catch {
    // Artifact not found, try listing
  }

  // List artifacts and find the latest baseline
  try {
    const list = await artifact.listArtifacts();
    const baselines = (list.artifacts ?? [])
      .filter((a) => a.name.startsWith(BASELINE_ARTIFACT_NAME))
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return bTime - aTime; // newest first
      });

    if (baselines.length > 0) {
      return downloadAndParseArtifact(artifact, baselines[0].id);
    }
  } catch {
    // List failed, return null
  }

  return null;
}

/**
 * Download an artifact by ID and parse its contents as a ProcessedResult.
 */
async function downloadAndParseArtifact(
  artifact: DefaultArtifactClient,
  artifactId: number,
): Promise<ProcessedResult | null> {
  const downloadDir = path.resolve(process.cwd(), '.a11y-cache-download');

  try {
    const response = await artifact.downloadArtifact(artifactId, {
      path: downloadDir,
    });

    if (!response.downloadPath) {
      return null;
    }

    // Read the downloaded file(s)
    const files = fs.readdirSync(response.downloadPath);
    const baselineFile = files.find((f) => f.startsWith('baseline-') && f.endsWith('.json'));

    if (!baselineFile) {
      return null;
    }

    const content = fs.readFileSync(path.join(response.downloadPath, baselineFile), 'utf-8');
    return JSON.parse(content) as ProcessedResult;
  } catch {
    return null;
  } finally {
    // Clean up download directory
    if (fs.existsSync(downloadDir)) {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }
  }
}

// ─── Utility functions (local only) ─────────────────────────────────────────

/**
 * Get the latest baseline commit SHA by listing cache files.
 * Only works in local mode. Returns null in GitHub Actions.
 */
export function getLatestBaselineSha(): string | null {
  if (isGitHubActions()) {
    return null;
  }

  if (!fs.existsSync(CACHE_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(CACHE_DIR)
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
 * In GitHub Actions: no-op (artifacts are managed by the platform).
 * Locally: removes the `.a11y-cache/` directory.
 */
export function clearCache(): void {
  if (isGitHubActions()) {
    return;
  }

  if (fs.existsSync(CACHE_DIR)) {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}
