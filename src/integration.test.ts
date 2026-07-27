import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadConfig } from './config.js';
import { resolveRoutes } from './route-resolver.js';
import { createBrowser, createPage, closeBrowser } from './browser.js';
import { runAudit } from './auditor.js';
import { processViolations } from './processor.js';
import { compare } from './comparator.js';
import { generateComment } from './comment.js';
import { saveBaseline, loadBaseline, clearCache } from './cache.js';
import type { Browser } from 'playwright';
import type { Config } from './config.schema.js';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests', 'fixtures');
const TEST_SHA = 'test-integration-sha';

let browser: Browser;

beforeAll(async () => {
  browser = await createBrowser();
  clearCache();
}, 30_000);

afterAll(async () => {
  await closeBrowser(browser);
  clearCache();
}, 10_000);

describe('Full pipeline integration', () => {
  it('scans a good page and produces a passing comment', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'good.html')}`;

    // 1. Load config
    const config = loadConfig();

    // 2. Resolve routes
    const routes = resolveRoutes(config, ['tests/fixtures/good.html']);

    // 3. Run audit
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);

    // 4. Process results
    const result = processViolations(violations);

    // 5. Compare (no baseline = first audit)
    const evolution = compare(result, null);

    // 6. Generate comment
    const comment = generateComment(result, evolution, config);

    // Verify
    expect(result.totalCount).toBe(0);
    expect(evolution.trend).toBe('first');
    expect(comment).toContain('PASSING');
    expect(comment).toContain('No new accessibility violations');

    await page.close();
  }, 20_000);

  it('scans a bad page and produces a failing comment with violations', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'bad-contrast.html')}`;

    const config = loadConfig();
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    const result = processViolations(violations);
    const evolution = compare(result, null);
    const comment = generateComment(result, evolution, config);

    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.rule === 'color-contrast')).toBe(true);
    expect(comment).toContain('color-contrast');
    expect(comment).toContain('How to fix it');
    expect(comment).toContain('4.5:1');

    await page.close();
  }, 20_000);

  it('scans a page with multiple violations and shows all types', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'multiple-violations.html')}`;

    const config = loadConfig();
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    const result = processViolations(violations);
    const evolution = compare(result, null);
    const comment = generateComment(result, evolution, config);

    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    expect(comment).toContain('## Violations');
    expect(comment).toContain('## Evolution');

    await page.close();
  }, 20_000);

  it('shows evolution when comparing against a baseline', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'multiple-violations.html')}`;

    // First run: create baseline
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations1 = await runAudit(page);
    const result1 = processViolations(violations1);
    saveBaseline(result1, TEST_SHA);

    // Second run: scan a better page
    const goodPath = `file://${path.join(FIXTURES_DIR, 'good.html')}`;
    await page.goto(goodPath, { waitUntil: 'networkidle' });
    const violations2 = await runAudit(page);
    const result2 = processViolations(violations2);

    // Load baseline and compare
    const baseline = loadBaseline(TEST_SHA);
    const evolution = compare(result2, baseline);

    expect(evolution.trend).toBe('improves');
    expect(evolution.fixedViolations.length).toBeGreaterThan(0);
    expect(evolution.newViolations.length).toBe(0);

    await page.close();
  }, 20_000);

  it('handles the full pipeline end-to-end without crashing', async () => {
    const page = await createPage(browser);

    // Test all fixtures in sequence to ensure no crashes
    const fixtures = ['good.html', 'bad-contrast.html', 'missing-alt.html', 'multiple-violations.html'];

    for (const fixture of fixtures) {
      const filePath = `file://${path.join(FIXTURES_DIR, fixture)}`;
      await page.goto(filePath, { waitUntil: 'networkidle' });
      const violations = await runAudit(page);
      const result = processViolations(violations);
      const evolution = compare(result, null);
      const comment = generateComment(result, evolution, loadConfig());

      // Every fixture should produce a valid comment
      expect(comment).toBeTruthy();
      expect(comment.length).toBeGreaterThan(50);
      expect(comment).toContain('Accessibility Check');
    }

    await page.close();
  }, 30_000);

  it('uses custom config for route resolution', () => {
    const config: Config = {
      level: 'AAA',
      max_impact: 'critical',
      max_new_violations: 3,
      routes: { core: ['/', '/admin', '/settings'] },
      ai: { enabled: false },
    };

    const routes = resolveRoutes(config, [
      'src/app/dashboard/page.tsx',
      'src/app/api/health/route.ts',
    ]);

    expect(routes).toContain('/');
    expect(routes).toContain('/admin');
    expect(routes).toContain('/settings');
    expect(routes).toContain('/dashboard');
    expect(routes).not.toContain('/api/health');
  });
});
