import type { EvolutionResult, ProcessedResult } from './types.js';
/**
 * Compare current audit results against a baseline to determine
 * new, fixed, and persistent violations.
 *
 * Violations are matched by rule ID + element selector.
 * A violation is the "same" if the same rule fires on the same element.
 */
export declare function compare(current: ProcessedResult, baseline: ProcessedResult | null): EvolutionResult;
//# sourceMappingURL=comparator.d.ts.map