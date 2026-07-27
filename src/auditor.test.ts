import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import { createBrowser, createPage, closeBrowser } from './browser.js';
import { runAudit } from './auditor.js';
import type { Browser } from 'playwright';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests', 'fixtures');

let browser: Browser;

beforeAll(async () => {
  browser = await createBrowser();
}, 30_000);

afterAll(async () => {
  await closeBrowser(browser);
}, 10_000);

describe('runAudit', () => {
  it('finds 0 violations on a good page', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'good.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    expect(violations).toHaveLength(0);
    await page.close();
  }, 15_000);

  it('finds color-contrast violations on a bad contrast page', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'bad-contrast.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    const contrastViolations = violations.filter((v) => v.id === 'color-contrast');
    expect(contrastViolations.length).toBeGreaterThanOrEqual(1);
    await page.close();
  }, 15_000);

  it('finds image-alt violations on a missing alt page', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'missing-alt.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    const altViolations = violations.filter((v) => v.id === 'image-alt');
    expect(altViolations.length).toBeGreaterThanOrEqual(1);
    await page.close();
  }, 15_000);

  it('finds multiple violation types on a complex page', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'multiple-violations.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    // Should have at least 2 different violation types
    const violationTypes = new Set(violations.map((v) => v.id));
    expect(violationTypes.size).toBeGreaterThanOrEqual(2);
    // Each violation should have the required fields
    for (const v of violations) {
      expect(v.id).toBeTruthy();
      expect(v.impact).toBeTruthy();
      expect(v.description).toBeTruthy();
      expect(v.nodes.length).toBeGreaterThan(0);
      expect(v.nodes[0].selector).toBeTruthy();
    }
    await page.close();
  }, 15_000);

  it('returns violations with correct structure', async () => {
    const page = await createPage(browser);
    const filePath = `file://${path.join(FIXTURES_DIR, 'bad-contrast.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const violations = await runAudit(page);
    for (const v of violations) {
      expect(v).toHaveProperty('id');
      expect(v).toHaveProperty('impact');
      expect(v).toHaveProperty('description');
      expect(v).toHaveProperty('help');
      expect(v).toHaveProperty('helpUrl');
      expect(v).toHaveProperty('nodes');
      expect(Array.isArray(v.nodes)).toBe(true);
      for (const node of v.nodes) {
        expect(node).toHaveProperty('selector');
        expect(node).toHaveProperty('html');
        expect(node).toHaveProperty('failureSummary');
      }
    }
    await page.close();
  }, 15_000);
});
