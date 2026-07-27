import type { EvolutionResult, ProcessedResult, ProcessedViolation } from './types.js';

/**
 * Compare current audit results against a baseline to determine
 * new, fixed, and persistent violations.
 *
 * Violations are matched by rule ID + element selector.
 * A violation is the "same" if the same rule fires on the same element.
 */

export function compare(
  current: ProcessedResult,
  baseline: ProcessedResult | null,
): EvolutionResult {
  if (!baseline) {
    return {
      newViolations: current.violations,
      fixedViolations: [],
      persistentViolations: [],
      trend: 'first',
    };
  }

  const newViolations: ProcessedViolation[] = [];
  const persistentViolations: ProcessedViolation[] = [];
  const fixedViolations: ProcessedViolation[] = [];

  // Build a set of baseline violation keys for quick lookup
  const baselineKeys = new Set<string>();
  for (const v of baseline.violations) {
    for (const el of v.elements) {
      baselineKeys.add(`${v.rule}::${el.selector}`);
    }
  }

  // Check current violations against baseline
  const currentKeys = new Set<string>();
  for (const v of current.violations) {
    const matchingElements: typeof v.elements = [];
    const newElements: typeof v.elements = [];

    for (const el of v.elements) {
      const key = `${v.rule}::${el.selector}`;
      currentKeys.add(key);

      if (baselineKeys.has(key)) {
        matchingElements.push(el);
      } else {
        newElements.push(el);
      }
    }

    if (matchingElements.length > 0) {
      persistentViolations.push({ ...v, elements: matchingElements });
    }
    if (newElements.length > 0) {
      newViolations.push({ ...v, elements: newElements });
    }
  }

  // Find fixed violations (in baseline but not in current)
  for (const v of baseline.violations) {
    const fixedElements: typeof v.elements = [];
    for (const el of v.elements) {
      const key = `${v.rule}::${el.selector}`;
      if (!currentKeys.has(key)) {
        fixedElements.push(el);
      }
    }
    if (fixedElements.length > 0) {
      fixedViolations.push({ ...v, elements: fixedElements });
    }
  }

  // Determine trend
  const newCount = newViolations.reduce((sum, v) => sum + v.elements.length, 0);
  const fixedCount = fixedViolations.reduce((sum, v) => sum + v.elements.length, 0);

  let trend: EvolutionResult['trend'];
  if (newCount < fixedCount) {
    trend = 'improves';
  } else if (newCount > fixedCount) {
    trend = 'worsens';
  } else {
    trend = 'neutral';
  }

  return { newViolations, fixedViolations, persistentViolations, trend };
}
