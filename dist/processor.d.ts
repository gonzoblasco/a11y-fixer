import type { Config } from './config.schema.js';
import type { ProcessedResult, Violation } from './types.js';
/**
 * Process raw axe-core violations into a structured, grouped result.
 *
 * - Groups violations by WCAG rule
 * - Sorts by impact (critical → minor)
 * - Attaches suggested fixes from templates
 * - Filters out ignored rules and selectors
 */
export declare function processViolations(raw: Violation[], config?: Config): ProcessedResult;
/**
 * Get a suggested fix template for a known violation rule.
 * Falls back to a generic message for unknown rules.
 */
export declare function getSuggestedFix(ruleId: string): string;
