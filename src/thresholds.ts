import type { Config } from './config.schema.js';
import type { EvolutionResult, ProcessedResult } from './types.js';

export interface ThresholdResult {
  status: 'passing' | 'warning' | 'failing';
  reason?: string;
}

const IMPACT_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

/**
 * Evaluate quality thresholds against audit results.
 *
 * Returns the check status and a human-readable reason.
 */
export function evaluateThresholds(
  result: ProcessedResult,
  evolution: EvolutionResult,
  config: Config,
): ThresholdResult {
  // Filter by max_impact: count only violations at or above the configured impact
  const maxImpactLevel = IMPACT_ORDER[config.max_impact] ?? 1; // default: serious

  const filteredNewViolations = evolution.newViolations.filter((v) => {
    const impactLevel = IMPACT_ORDER[v.impact] ?? 99;
    return impactLevel <= maxImpactLevel;
  });

  const newCount = filteredNewViolations.reduce((sum, v) => sum + v.elements.length, 0);
  const threshold = config.max_new_violations;

  if (newCount === 0) {
    return { status: 'passing' };
  }

  if (newCount > threshold) {
    return {
      status: 'failing',
      reason: `${newCount} new violations (threshold: ${threshold})`,
    };
  }

  return {
    status: 'warning',
    reason: `${newCount} new violations (threshold: ${threshold})`,
  };
}
