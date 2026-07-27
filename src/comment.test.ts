import { describe, it, expect } from 'vitest';
import { generateComment } from './comment.js';
import type { ProcessedResult, ProcessedViolation, EvolutionResult } from './types.js';
import type { Config } from './config.schema.js';

const defaultConfig: Config = {
  level: 'AA',
  max_impact: 'serious',
  max_new_violations: 5,
  routes: { core: ['/'] },
  ai: { enabled: false },
};

function makeViolation(rule: string, selectors: string[], impact: string = 'moderate'): ProcessedViolation {
  return {
    rule,
    impact: impact as ProcessedViolation['impact'],
    description: `Description for ${rule}\n\n**How to fix it:**\nFix the ${rule} issue.`,
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

describe('generateComment', () => {
  it('generates passing comment for clean PR', () => {
    const result = makeResult([]);
    const evolution = makeEvolution({ trend: 'neutral' });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('PASSING');
    expect(comment).toContain('No new accessibility violations');
  });

  it('generates failing comment when threshold exceeded', () => {
    const violations = [makeViolation('color-contrast', ['.btn', '.link', '.card', '.header', '.footer', '.nav'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: violations,
      trend: 'worsens',
    });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('FAILING');
    expect(comment).toContain('6 new violations (threshold: 5)');
  });

  it('generates warning comment when violations within threshold', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: violations,
      trend: 'worsens',
    });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('WARNING');
    expect(comment).toContain('1 new violations (threshold: 5)');
  });

  it('includes violation details in comment', () => {
    const violations = [makeViolation('color-contrast', ['.btn'], 'critical')];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('CRITICAL');
    expect(comment).toContain('color-contrast');
    expect(comment).toContain('.btn');
    expect(comment).toContain('How to fix it');
  });

  it('includes evolution section', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: violations,
      trend: 'worsens',
    });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('Evolution');
    expect(comment).toContain('1 new');
    expect(comment).toContain('worsens');
  });

  it('includes first audit message', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: violations,
      trend: 'first',
    });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('first audit');
    expect(comment).toContain('new baseline');
  });

  it('includes configuration footer', () => {
    const result = makeResult([]);
    const evolution = makeEvolution();
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('WCAG level');
    expect(comment).toContain('AA');
    expect(comment).toContain('max impact');
    expect(comment).toContain('serious');
  });

  it('includes AI config in footer when enabled', () => {
    const config: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'openai', model: 'gpt-4o-mini' },
    };
    const result = makeResult([]);
    const evolution = makeEvolution();
    const comment = generateComment(result, evolution, config);
    expect(comment).toContain('AI explanations enabled');
    expect(comment).toContain('openai');
  });

  it('handles multiple violation types', () => {
    const violations = [
      makeViolation('color-contrast', ['.btn'], 'critical'),
      makeViolation('image-alt', ['.img'], 'serious'),
    ];
    const result = makeResult(violations);
    const evolution = makeEvolution({ newViolations: violations });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('CRITICAL');
    expect(comment).toContain('SERIOUS');
    expect(comment).toContain('color-contrast');
    expect(comment).toContain('image-alt');
  });

  it('includes fixed and persistent counts in summary', () => {
    const violations = [makeViolation('color-contrast', ['.btn'])];
    const result = makeResult(violations);
    const evolution = makeEvolution({
      newViolations: violations,
      fixedViolations: [makeViolation('image-alt', ['.img'])],
      persistentViolations: [makeViolation('label', ['.input'])],
    });
    const comment = generateComment(result, evolution, defaultConfig);
    expect(comment).toContain('1 new');
    expect(comment).toContain('1 fixed');
    expect(comment).toContain('1 persistent');
  });
});
