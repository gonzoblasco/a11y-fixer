import { execSync } from 'node:child_process';
import * as core from '@actions/core';

/**
 * GitHub API wrappers for posting comments and setting check statuses.
 *
 * Uses the `gh` CLI for all operations. Falls back gracefully
 * if `gh` is not available or not authenticated.
 */

let ghAvailable: boolean | null = null;

function checkGh(): boolean {
  if (ghAvailable !== null) return ghAvailable;

  // Set GH_TOKEN and GITHUB_TOKEN from action inputs
  const token = core.getInput('github_token');
  if (token) {
    process.env.GH_TOKEN = token;
    process.env.GITHUB_TOKEN = token;
  }

  // Verify gh binary exists and token is available
  try {
    execSync('gh --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (!process.env.GH_TOKEN) {
      console.warn('GH_TOKEN not set. gh CLI will not be authenticated.');
      ghAvailable = false;
      return ghAvailable;
    }
    ghAvailable = true;
  } catch {
    ghAvailable = false;
  }
  return ghAvailable;
}

/**
 * Post a comment on the current PR.
 * Uses `gh pr comment` with the PR number from the GITHUB_REF environment variable.
 */
export function postComment(comment: string): void {
  if (!checkGh()) {
    console.warn('gh CLI not available. Skipping PR comment.');
    return;
  }

  const prNumber = getPrNumber();
  if (!prNumber) {
    console.warn('Not in a PR context. Skipping PR comment.');
    return;
  }

  const ownerRepo = getOwnerRepo();
  if (!ownerRepo) {
    console.warn('Could not determine owner/repo. Skipping PR comment.');
    return;
  }

  // Write comment to temp file to avoid shell escaping issues
  const tmpFile = `/tmp/a11y-fixer-comment-${Date.now()}.md`;
  execSync(`cat > ${tmpFile}`, { input: comment, encoding: 'utf-8' });

  try {
    execSync(`gh pr comment ${prNumber} --repo ${ownerRepo} --body-file "${tmpFile}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } finally {
    execSync(`rm -f "${tmpFile}"`);
  }
}

/**
 * Set a check status on the current commit.
 * Uses `gh api` to set the check run status.
 */
export function setCheckStatus(
  state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error',
  description: string,
): void {
  if (!checkGh()) {
    console.warn('gh CLI not available. Skipping check status.');
    return;
  }

  const sha = process.env.GITHUB_SHA;
  if (!sha) {
    console.warn('GITHUB_SHA not set. Skipping check status.');
    return;
  }

  const ownerRepo = getOwnerRepo();
  if (!ownerRepo) {
    console.warn('Could not determine owner/repo. Skipping check status.');
    return;
  }

  const title = 'Accessibility Check';

  try {
    execSync(
      `gh api repos/${ownerRepo}/check-runs --field name="${title}" --field head_sha="${sha}" --field status=completed --field conclusion="${state}" --field output:title="${title}" --field output:text="${description}" --field output:summary="${description}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
    );
  } catch (error) {
    console.warn(`Failed to set check status: ${error}`);
  }
}

/**
 * Get the PR number from the GITHUB_REF environment variable.
 * Returns null if not in a PR context.
 */
export function getPrNumber(): number | null {
  const ref = process.env.GITHUB_REF ?? '';
  const match = ref.match(/^refs\/pull\/(\d+)\/merge$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/**
 * Get the owner/repo string from the GITHUB_REPOSITORY environment variable.
 */
export function getOwnerRepo(): string | null {
  return process.env.GITHUB_REPOSITORY ?? null;
}

/**
 * Get the base branch SHA from the GitHub event payload.
 */
export function getBaseSha(): string | null {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return null;
    const event = JSON.parse(execSync(`cat ${eventPath}`, { encoding: 'utf-8' }));
    return event.pull_request?.base?.sha ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the head branch SHA from the GitHub event payload.
 */
export function getHeadSha(): string | null {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return null;
    const event = JSON.parse(execSync(`cat ${eventPath}`, { encoding: 'utf-8' }));
    return event.pull_request?.head?.sha ?? null;
  } catch {
    return null;
  }
}
