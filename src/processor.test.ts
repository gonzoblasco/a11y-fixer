import { describe, it, expect } from 'vitest';
import { processViolations, getSuggestedFix } from './processor.js';
import type { Violation } from './types.js';

function makeViolation(overrides: Partial<Violation> & { id: string }): Violation {
  return {
    impact: 'moderate',
    description: 'Test violation description',
    help: 'Help text for the violation',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/test',
    nodes: [
      {
        selector: '#test-element',
        html: '<div id="test-element">content</div>',
        failureSummary: 'Fix the issue',
      },
    ],
    ...overrides,
  };
}

describe('processViolations', () => {
  it('returns empty result for empty input', () => {
    const result = processViolations([]);
    expect(result.violations).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('processes a single violation correctly', () => {
    const violations = [makeViolation({ id: 'color-contrast', impact: 'critical' })];
    const result = processViolations(violations);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('color-contrast');
    expect(result.violations[0].impact).toBe('critical');
    expect(result.violations[0].elements).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('groups multiple nodes of the same rule', () => {
    const violations = [
      makeViolation({
        id: 'color-contrast',
        nodes: [{ selector: '.el1', html: '<span class="el1">a</span>', failureSummary: 'fix' }],
      }),
      makeViolation({
        id: 'color-contrast',
        nodes: [{ selector: '.el2', html: '<span class="el2">b</span>', failureSummary: 'fix' }],
      }),
    ];
    const result = processViolations(violations);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].elements).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });

  it('sorts violations by impact (critical first)', () => {
    const violations = [
      makeViolation({ id: 'minor-issue', impact: 'minor' }),
      makeViolation({ id: 'critical-issue', impact: 'critical' }),
      makeViolation({ id: 'serious-issue', impact: 'serious' }),
    ];
    const result = processViolations(violations);
    expect(result.violations.map((v) => v.impact)).toEqual([
      'critical',
      'serious',
      'minor',
    ]);
  });

  it('handles multiple different violation types', () => {
    const violations = [
      makeViolation({ id: 'color-contrast', impact: 'critical' }),
      makeViolation({ id: 'image-alt', impact: 'serious' }),
      makeViolation({ id: 'label', impact: 'moderate' }),
    ];
    const result = processViolations(violations);
    expect(result.violations).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it('attaches a suggested fix for known violations', () => {
    const violations = [makeViolation({ id: 'color-contrast' })];
    const result = processViolations(violations);
    expect(result.violations[0].description).toContain('How to fix it');
    expect(result.violations[0].description).toContain('4.5:1');
  });

  it('attaches generic fallback for unknown violations', () => {
    const violations = [makeViolation({ id: 'unknown-rule-123' })];
    const result = processViolations(violations);
    expect(result.violations[0].description).toContain('How to fix it');
    expect(result.violations[0].description).toContain('WCAG documentation');
  });

  it('preserves element details in processed output', () => {
    const violations = [
      makeViolation({
        id: 'color-contrast',
        nodes: [
          {
            selector: '.btn-primary',
            html: '<button class="btn-primary">Submit</button>',
            failureSummary: 'Element has insufficient color contrast',
          },
        ],
      }),
    ];
    const result = processViolations(violations);
    const element = result.violations[0].elements[0];
    expect(element.selector).toBe('.btn-primary');
    expect(element.html).toContain('btn-primary');
    expect(element.failureSummary).toContain('insufficient color contrast');
  });
});

describe('getSuggestedFix', () => {
  it('returns a fix for color-contrast', () => {
    const fix = getSuggestedFix('color-contrast');
    expect(fix).toContain('4.5:1');
    expect(fix).toContain('```css');
  });

  it('returns a fix for image-alt', () => {
    const fix = getSuggestedFix('image-alt');
    expect(fix).toContain('alt');
    expect(fix).toContain('```html');
  });

  it('returns a fix for aria-valid-attr', () => {
    const fix = getSuggestedFix('aria-valid-attr');
    expect(fix).toContain('aria-labelledby');
  });

  it('returns a fix for label', () => {
    const fix = getSuggestedFix('label');
    expect(fix).toContain('<label');
  });

  it('returns a fix for heading-order', () => {
    const fix = getSuggestedFix('heading-order');
    expect(fix).toContain('<h1>');
  });

  it('returns a fix for landmark-one-main', () => {
    const fix = getSuggestedFix('landmark-one-main');
    expect(fix).toContain('<main>');
  });

  it('returns a fix for link-name', () => {
    const fix = getSuggestedFix('link-name');
    expect(fix).toContain('aria-label');
  });

  it('returns a fix for button-name', () => {
    const fix = getSuggestedFix('button-name');
    expect(fix).toContain('aria-label');
  });

  it('returns generic fallback for unknown rules', () => {
    const fix = getSuggestedFix('some-unknown-rule');
    expect(fix).toContain('WCAG documentation');
  });
});
