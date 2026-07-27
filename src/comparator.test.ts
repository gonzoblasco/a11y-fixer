import { describe, it, expect } from 'vitest';
import { compare } from './comparator.js';
import type { ProcessedResult, ProcessedViolation } from './types.js';

function makeViolation(rule: string, selectors: string[], impact: string = 'moderate'): ProcessedViolation {
  return {
    rule,
    impact: impact as ProcessedViolation['impact'],
    description: `Description for ${rule}`,
    help: `Help for ${rule}`,
    helpUrl: `https://example.com/${rule}`,
    elements: selectors.map((sel) => ({
      selector: sel,
      html: `<div class="${sel.replace('.', '')}">content</div>`,
      failureSummary: `Fix ${rule} on ${sel}`,
    })),
  };
}

function makeResult(violations: ProcessedViolation[]): ProcessedResult {
  return {
    violations,
    totalCount: violations.reduce((sum, v) => sum + v.elements.length, 0),
  };
}

describe('compare', () => {
  it('returns first audit when no baseline', () => {
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, null);
    expect(result.trend).toBe('first');
    expect(result.newViolations).toHaveLength(1);
    expect(result.fixedViolations).toHaveLength(0);
    expect(result.persistentViolations).toHaveLength(0);
  });

  it('detects new violations', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const current = makeResult([
      makeViolation('color-contrast', ['.btn']),
      makeViolation('image-alt', ['.img']),
    ]);
    const result = compare(current, baseline);
    expect(result.newViolations).toHaveLength(1);
    expect(result.newViolations[0].rule).toBe('image-alt');
    expect(result.persistentViolations).toHaveLength(1);
    expect(result.fixedViolations).toHaveLength(0);
  });

  it('detects fixed violations', () => {
    const baseline = makeResult([
      makeViolation('color-contrast', ['.btn']),
      makeViolation('image-alt', ['.img']),
    ]);
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, baseline);
    expect(result.fixedViolations).toHaveLength(1);
    expect(result.fixedViolations[0].rule).toBe('image-alt');
    expect(result.persistentViolations).toHaveLength(1);
    expect(result.newViolations).toHaveLength(0);
  });

  it('detects persistent violations', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, baseline);
    expect(result.persistentViolations).toHaveLength(1);
    expect(result.newViolations).toHaveLength(0);
    expect(result.fixedViolations).toHaveLength(0);
  });

  it('calculates improves trend', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn', '.link'])]);
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, baseline);
    expect(result.trend).toBe('improves');
  });

  it('calculates worsens trend', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const current = makeResult([
      makeViolation('color-contrast', ['.btn']),
      makeViolation('image-alt', ['.img']),
    ]);
    const result = compare(current, baseline);
    expect(result.trend).toBe('worsens');
  });

  it('calculates neutral trend', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, baseline);
    expect(result.trend).toBe('neutral');
  });

  it('matches violations by rule + selector', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn', '.link'])]);
    const current = makeResult([makeViolation('color-contrast', ['.btn', '.card'])]);
    const result = compare(current, baseline);
    // .btn is persistent, .link is fixed, .card is new
    expect(result.persistentViolations[0].elements.map((e) => e.selector)).toEqual(['.btn']);
    expect(result.fixedViolations[0].elements.map((e) => e.selector)).toEqual(['.link']);
    expect(result.newViolations[0].elements.map((e) => e.selector)).toEqual(['.card']);
  });

  it('handles empty current result', () => {
    const baseline = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const current = makeResult([]);
    const result = compare(current, baseline);
    expect(result.fixedViolations).toHaveLength(1);
    expect(result.newViolations).toHaveLength(0);
    expect(result.persistentViolations).toHaveLength(0);
    expect(result.trend).toBe('improves');
  });

  it('handles empty baseline', () => {
    const baseline = makeResult([]);
    const current = makeResult([makeViolation('color-contrast', ['.btn'])]);
    const result = compare(current, baseline);
    expect(result.newViolations).toHaveLength(1);
    expect(result.fixedViolations).toHaveLength(0);
    expect(result.persistentViolations).toHaveLength(0);
    expect(result.trend).toBe('worsens');
  });
});
