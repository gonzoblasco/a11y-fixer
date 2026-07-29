/**
 * a11y-fixer CLI — Run accessibility audits and fixes from the command line.
 *
 * Usage:
 *   a11y-fixer audit [--url <base-url>] [--config <path>] [--output <json|markdown>]
 *   a11y-fixer fix [--url <base-url>] [--config <path>] [--dry-run]
 *   a11y-fixer suggest [--url <base-url>] [--config <path>] [--output <json|markdown>]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { runAudit } from '../auditor.js';
import { applyAuth, closeBrowser, createBrowser, createPage, navigateToRoute } from '../browser.js';
import { loadConfig } from '../config.js';
import { processViolations } from '../processor.js';
import { generateComment } from '../comment.js';
import { compare } from '../comparator.js';
import { loadBaseline, saveBaseline } from '../cache.js';
import { generateFixes } from '../core/fixer.js';
import type { Config } from '../config.schema.js';
import type { Violation } from '../types.js';

interface CliOptions {
  command: string;
  url?: string;
  config?: string;
  output?: 'json' | 'markdown';
  dryRun?: boolean;
  routes?: string[];
}

function printHelp(): void {
  console.log(`
a11y-fixer — Accessibility audit tool

Usage:
  a11y-fixer audit [options]     Run accessibility audit
  a11y-fixer fix [options]       Run audit and show suggested fixes
  a11y-fixer suggest [options]    Run audit and show fix suggestions (alias for fix)

Options:
  --url <url>           Base URL of the app to audit (default: http://localhost:3000)
  --config <path>       Path to config file (default: .a11y-fixer.yml)
  --output <format>     Output format: json | markdown (default: markdown)
  --dry-run             Show fixes without applying them
  --routes <routes>     Comma-separated list of routes to scan (overrides config)
  --help                Show this help
  `);
}

function parseArgs(): CliOptions & { command: string } {
  const args = process.argv.slice(2);
  const options: CliOptions & { command: string } = {
    command: 'audit',
    url: 'http://localhost:3000',
    output: 'markdown',
    dryRun: true,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case 'audit':
      case 'fix':
      case 'suggest':
        options.command = args[i];
        break;
      case '--url':
        options.url = args[++i];
        break;
      case '--config':
        options.config = args[++i];
        break;
      case '--output':
        options.output = args[++i] as 'json' | 'markdown';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--routes':
        options.routes = args[++i]?.split(',').map((r) => r.trim());
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

async function runAuditCli(options: CliOptions): Promise<void> {
  const config = loadConfig(options.config);
  const targetUrl = options.url ?? 'http://localhost:3000';

  // Resolve routes
  const routes = options.routes ?? config.routes.core;

  if (routes.length === 0) {
    console.log('No routes to scan.');
    return;
  }

  console.log(`Scanning ${routes.length} route(s): ${routes.join(', ')}`);
  console.log(`Target: ${targetUrl}`);
  console.log('');

  // Launch browser
  const browser = await createBrowser();
  const page = await createPage(browser);

  try {
    const allViolations: Violation[] = [];

    for (const route of routes) {
      const url = `${targetUrl}${route}`;

      try {
        const authRoute = config.routes.authenticated?.find((a) => a.path === route);
        if (authRoute) {
          await applyAuth(page, authRoute.auth, url);
        }

        await navigateToRoute(page, url);
        const violations = await runAudit(page);
        allViolations.push(...violations);
        console.log(`  ${route}: ${violations.length} violation(s)`);
      } catch (err) {
        console.error(`  ${route}: ERROR - ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Process results
    const result = processViolations(allViolations, config);

    // Generate output
    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const evolution = compare(result, null);
      const comment = generateComment(result, evolution, config);
      console.log(comment);
    }

    // If fix or suggest command, show fix suggestions
    if (options.command === 'fix' || options.command === 'suggest') {
      console.log('\n## Suggested Fixes\n');
      for (const violation of result.violations) {
        const fixes = generateFixes(violation);
        for (const fix of fixes) {
          const badge = fix.fixability === 'auto' ? '✅ AUTO' : fix.fixability === 'suggest' ? '💡 SUGGEST' : '📝 EXPLAIN';
          console.log(`### ${badge}: ${fix.rule}`);
          console.log(`  ${fix.description}`);
          if (fix.replacementHtml) {
            console.log(`  Original: ${fix.originalHtml}`);
            console.log(`  Fixed:    ${fix.replacementHtml}`);
          }
          if (fix.patch && !options.dryRun) {
            console.log(`  Patch:\n${fix.patch}`);
          }
          console.log('');
        }
      }
    }
  } finally {
    await closeBrowser(browser);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  try {
    await runAuditCli(options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
