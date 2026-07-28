import type { Config } from './config.schema.js';
import type { EvolutionResult, ProcessedResult } from './types.js';
export interface ThresholdResult {
    status: 'passing' | 'warning' | 'failing';
    reason?: string;
}
/**
 * Evaluate quality thresholds against audit results.
 *
 * Returns the check status and a human-readable reason.
 */
export declare function evaluateThresholds(result: ProcessedResult, evolution: EvolutionResult, config: Config): ThresholdResult;
