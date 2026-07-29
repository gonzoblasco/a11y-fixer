/**
 * GitHub API wrappers for posting comments and setting check statuses.
 *
 * Two modes:
 * - **Primary**: uses @actions/github (octokit) for all GitHub API calls.
 * - **Fallback**: uses `gh` CLI via execSync if octokit is unavailable.
 *
 * The module auto-detects which mode to use based on the GITHUB_ACTIONS
 * environment variable and the availability of the GitHub context.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as core from '@actions/core';
import * as github from '@actions/github';

// ─── Octokit mode ──────────────────────────────────────────────────────────

/**
 * Get an authenticated octokit client from the GitHub Actions context.
 * Returns null if the context is not available.
 */
function getOctokit() {
  try {
    const token = core.getInput('github_token');
    if (!token) return null;
    return github.getOctokit(token);
  } catch {
    return null;
  }
}

/**
 * Get the owner and repo from the GitHub context.
 */
function getOwnerRepoFromContext(): { owner: string; repo: string } | null {
  try {
    const { owner, repo } = github.context.repo;
    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * Post a comment on the current PR using octokit.
 */
function postCommentWithOctokit(comment: string): boolean {
  const octokit = getOctokit();
  if (!octokit) return false;

  const repo = getOwnerRepoFromContext();
  if (!repo) return false;

  const prNumber = getPrNumber();
  if (!prNumber) return false;

  try {
    octokit.rest.issues.createComment({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: prNumber,
      body: comment,
    });
    return true;
  } catch (error) {
    core.warning(`Failed to post comment via octokit: ${error}`);
    return false;
  }
}

/**
 * Set a check status on the current commit using octokit.
 */
function setCheckStatusWithOctokit(
  state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error',
  description: string,
): boolean {
  const octokit = getOctokit();
  if (!octokit) return false;

  const repo = getOwnerRepoFromContext();
  if (!repo) return false;

  const sha = process.env.GITHUB_SHA;
  if (!sha) return false;

  const title = 'Accessibility Check';

  // Map our states to GitHub Check Run conclusions
  // 'error' is not a valid conclusion; map to 'failure'
  const conclusion = state === 'error' ? 'failure' : state;

  try {
    octokit.rest.checks.create({
      owner: repo.owner,
      repo: repo.repo,
      name: title,
      head_sha: sha,
      status: 'completed',
      conclusion,
      output: {
        title,
        summary: description,
        text: description,
      },
    });
    return true;
  } catch (error) {
    core.warning(`Failed to set check status via octokit: ${error}`);
    return false;
  }
}

// ─── gh CLI fallback ───────────────────────────────────────────────────────

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
 * Post a comment on the current PR using gh CLI.
 */
function postCommentWithGhCli(comment: string): boolean {
  if (!checkGh()) return false;

  const prNumber = getPrNumber();
  if (!prNumber) return false;

  const ownerRepo = getOwnerRepo();
  if (!ownerRepo) return false;

  // Write comment to temp file to avoid shell escaping issues
  const tmpFile = `/tmp/a11y-fixer-comment-${Date.now()}.md`;

  try {
    execSync(`cat > ${tmpFile}`, { input: comment, encoding: 'utf-8' });
    execSync(`gh pr comment ${prNumber} --repo ${ownerRepo} --body-file "${tmpFile}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return true;
  } catch (error) {
    core.warning(`Failed to post comment via gh CLI: ${error}`);
    return false;
  } finally {
    try {
      execSync(`rm -f "${tmpFile}"`);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Set a check status on the current commit using gh CLI.
 */
function setCheckStatusWithGhCli(
  state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error',
  description: string,
): boolean {
  if (!checkGh()) return false;

  const sha = process.env.GITHUB_SHA;
  if (!sha) return false;

  const ownerRepo = getOwnerRepo();
  if (!ownerRepo) return false;

  const title = 'Accessibility Check';

  try {
    execSync(
      `gh api repos/${ownerRepo}/check-runs --field name="${title}" --field head_sha="${sha}" --field status=completed --field conclusion="${state}" --field output:title="${title}" --field output:text="${description}" --field output:summary="${description}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
    );
    return true;
  } catch (error) {
    core.warning(`Failed to set check status via gh CLI: ${error}`);
    return false;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Post a comment on the current PR.
 *
 * Tries octokit first, falls back to gh CLI.
 * Silently skips if neither is available.
 */
export function postComment(comment: string): void {
  if (postCommentWithOctokit(comment)) return;
  if (postCommentWithGhCli(comment)) return;
  console.warn('No GitHub API available. Skipping PR comment.');
}

/**
 * Set a check status on the current commit.
 *
 * Tries octokit first, falls back to gh CLI.
 * Silently skips if neither is available.
 */
export function setCheckStatus(
  state: 'success' | 'neutral' | 'failure' | 'skipped' | 'error',
  description: string,
): void {
  if (setCheckStatusWithOctokit(state, description)) return;
  if (setCheckStatusWithGhCli(state, description)) return;
  console.warn('No GitHub API available. Skipping check status.');
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
 *
 * Reads the event payload from the GITHUB_EVENT_PATH file directly
 * (no execSync needed).
 */
export function getBaseSha(): string | null {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return null;
    const content = fs.readFileSync(eventPath, 'utf-8');
    const event = JSON.parse(content);
    return event.pull_request?.base?.sha ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the head branch SHA from the GitHub event payload.
 *
 * Reads the event payload from the GITHUB_EVENT_PATH file directly
 * (no execSync needed).
 */
export function getHeadSha(): string | null {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return null;
    const content = fs.readFileSync(eventPath, 'utf-8');
    const event = JSON.parse(content);
    return event.pull_request?.head?.sha ?? null;
  } catch {
    return null;
  }
}
