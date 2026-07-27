import { describe, it, expect } from 'vitest';
import { evaluateThresholds } from './thresholds.js';
import type { ProcessedResult, ProcessedViolation, EvolutionResult } from './types.js';
import type { Config } from './config.schema.js';

const defaultConfig: Config = {
  level: 'AA',
  max_impact: 'serious',
  max_new_violations: 5,
  routes: { core: ['/'] },
  ai: { enabled: false },
};

function makeViolation(rule: string, selectors: string[], impact: string = 'serious'): ProcessedViolation {
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

function makeEvolution(overrides: Partial<EvolutionResult> = {}): EvolutionResult {
  return {
    newViolations: [],
    fixedViolations: [],
    persistentViolations: [],
    trend: 'neutral',
    ...overrides,
  };
}

describe('evaluateThresholds', () => {
  it('returns passing when no violations', () => {
    const result = makeResult([]);
    const evolution = makeEvolution();
    const t = evaluateThresholds(result, evolution, defaultConfig);
    expect(t.status).toBe('passing');
  });

  it('returns warning when violations under threshold', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, defaultConfig);
    expect(t.status).toBe('warning');
    expect(t.reason).toContain('1 new violations');
  });

  it('returns failing when violations over threshold', () => {
    const violations = [makeViolation('color-contrast', ['.a', '.b', '.c', '.d', '.e', '.f'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, defaultConfig);
    expect(t.status).toBe('failing');
    expect(t.reason).toContain('6 new violations');
  });

  it('returns warning when exactly at threshold', () => {
    const violations = [makeViolation('color-contrast', ['.a', '.b', '.c', '.d', '.e'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, defaultConfig);
    expect(t.status).toBe('warning');
    expect(t.reason).toContain('5 new violations');
  });

  it('returns failing when max_new_violations is 0 and any new violation exists', () => {
    const config: Config = { ...defaultConfig, max_new_violations: 0 };
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, config);
    expect(t.status).toBe('failing');
  });

  it('filters violations below max_impact', () => {
    const config: Config = { ...defaultConfig, max_impact: 'critical' };
    const violations = [
      makeViolation('color-contrast', ['.btn'], 'serious'),
      makeViolation('image-alt', ['.img'], 'moderate'),
    ];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, config);
    // Only critical violations count, but we have none → passing
    expect(t.status).toBe('passing');
  });

  it('respects max_impact = minor (all violations count)', () => {
    const config: Config = { ...defaultConfig, max_impact: 'minor' };
    const violations = [
      makeViolation('color-contrast', ['.btn'], 'minor'),
      makeViolation('image-alt', ['.img'], 'minor'),
    ];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const t = evaluateThresholds(result, evolution, config);
    expect(t.status).toBe('warning');
  });

  it('returns passing when only persistent violations exist (no new)', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: [],
      persistentViolations: violations,
    });
    const t = evaluateThresholds(result, evolution, defaultConfig);
    expect(t.status).toBe('passing');
  });
});
