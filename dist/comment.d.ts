import type { Config } from './config.schema.js';
import type { EvolutionResult, ProcessedResult } from './types.js';
/**
 * Generate a structured PR comment following the DESIGN.md format.
 *
 * Sections:
 * 1. Badge (passing / warning / failing / skipped / error)
 * 2. Summary (one line)
 * 3. Violations list (each with impact, rule, element, how to fix)
 * 4. Evolution section (new, fixed, persistent, trend)
 * 5. Configuration footer
 */
export declare function generateComment(result: ProcessedResult, evolution: EvolutionResult, config: Config): string;
