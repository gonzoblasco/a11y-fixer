/**
 * a11y-fixer - Accessibility audit bot for GitHub PRs
 *
 * Entry point for the GitHub Action.
 * Loads config, analyzes the diff, runs axe-core via Playwright,
 * generates AI explanations (if enabled), and posts a structured comment.
 */

import * as core from '@actions/core';
import { generateAiExplanation } from './ai-explainer.js';
import { runAudit } from './auditor.js';
import { applyAuth, closeBrowser, createBrowser, createPage, navigateToRoute } from './browser.js';
import { loadBaseline, saveBaseline } from './cache.js';
import { generateComment } from './comment.js';
import { compare } from './comparator.js';
import { loadConfig } from './config.js';
import { getChangedFiles } from './diff-analyzer.js';
import { getBaseSha, getHeadSha, postComment, setCheckStatus } from './github.js';
import { processViolations } from './processor.js';
import { resolveRoutes } from './route-resolver.js';
import { evaluateThresholds } from './thresholds.js';
import type { ProcessedViolation, Violation } from './types.js';

export async function run(): Promise<void> {
  try {
    console.log('a11y-fixer starting...');
    core.info('a11y-fixer starting...');

    // 1. Load configuration
    const configPath = core.getInput('config') || '.a11y-fixer.yml';
    console.log(`Config path: ${configPath}`);
    const config = loadConfig(configPath);
    console.log(`Config loaded: WCAG ${config.level}, max impact ${config.max_impact}`);
    core.info(`Config loaded: WCAG ${config.level}, max impact ${config.max_impact}`);

    // 2. Get SHAs for diff comparison
    const baseSha = getBaseSha();
    const headSha = getHeadSha();
    console.log(
      `baseSha: ${baseSha?.slice(0, 7) ?? 'null'}, headSha: ${headSha?.slice(0, 7) ?? 'null'}`,
    );

    if (!baseSha || !headSha) {
      console.log('Could not determine base/head SHAs. Skipping diff analysis.');
      core.warning('Could not determine base/head SHAs. Skipping diff analysis.');
      return;
    }

    core.info(`Comparing ${baseSha.slice(0, 7)}...${headSha.slice(0, 7)}`);

    // 3. Get changed files from git diff
    const changedFiles = getChangedFiles(baseSha, headSha);
    console.log(`Found ${changedFiles.length} changed files`);
    core.info(`Found ${changedFiles.length} changed files`);

    // 4. Resolve routes to scan
    const routes = resolveRoutes(config, changedFiles);
    console.log(`Routes to scan: ${routes.join(', ')}`);
    core.info(`Routes to scan: ${routes.join(', ')}`);

    if (routes.length === 0) {
      console.log('No routes to scan. Skipping audit.');
      core.info('No routes to scan. Skipping audit.');
      setCheckStatus('success', 'No routes changed in this PR.');
      return;
    }

    // 5. Launch browser
    const browser = await createBrowser();
    const page = await createPage(browser);

    // 6. Resolve target base URL
    const targetUrl = core.getInput('target_url') || 'http://localhost:3000';
    core.info(`Target URL: ${targetUrl}`);

    try {
      // 7. Run audits on each route
      const allViolations: Violation[] = [];

      for (const route of routes) {
        const url = `${targetUrl}${route}`;

        try {
          // Check if this route needs authentication
          const authRoute = config.routes.authenticated?.find((a) => a.path === route);
          if (authRoute) {
            await applyAuth(page, authRoute.auth, url);
          }

          await navigateToRoute(page, url);
          const violations = await runAudit(page);
          allViolations.push(...violations);
          core.info(`  ${route}: ${violations.length} violations`);
        } catch (err) {
          core.warning(
            `  ${route}: audit failed - ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // 7. Process violations
      const result = processViolations(allViolations, config);
      core.info(`Total violations: ${result.totalCount}`);

      // 8. Load baseline and compare
      const baseline = loadBaseline(baseSha);
      const evolution = compare(result, baseline);
      core.info(
        `Evolution: ${evolution.trend} (${evolution.newViolations.length} new, ${evolution.fixedViolations.length} fixed)`,
      );

      // 9. Generate AI explanations if enabled
      if (config.ai?.enabled) {
        core.info('Generating AI explanations...');
        for (const v of result.violations) {
          const aiResult = await generateAiExplanation(v, config);
          if (aiResult.source === 'ai' && aiResult.text) {
            // Replace the template-based fix with the AI explanation
            const parts = v.description.split('\n\n');
            v.description = `${parts[0]}\n\n${aiResult.text}`;
          }
        }
      }

      // 10. Generate and post comment
      const comment = generateComment(result, evolution, config);
      postComment(comment);

      // 11. Set check status based on threshold evaluation
      const threshold = evaluateThresholds(result, evolution, config);

      switch (threshold.status) {
        case 'failing':
          setCheckStatus('failure', threshold.reason ?? 'Accessibility check failed');
          break;
        case 'warning':
          setCheckStatus('neutral', threshold.reason ?? 'Accessibility warnings');
          break;
        default:
          setCheckStatus('success', 'No new accessibility violations');
      }

      // 12. Save baseline for next comparison
      saveBaseline(result, headSha);
      core.info('Baseline saved for future comparison');
    } finally {
      await closeBrowser(browser);
    }

    core.info('a11y-fixer completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
}

// Invoke the action
run();
