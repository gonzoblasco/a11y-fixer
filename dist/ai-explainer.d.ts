import type { Config } from './config.schema.js';
import type { ProcessedViolation } from './types.js';
export interface AiProvider {
    name: string;
    generateExplanation(prompt: string, apiKey: string, model: string): Promise<string>;
}
/**
 * Generate an AI-powered explanation for a violation.
 *
 * Falls back to the template-based fix if:
 * - AI is not enabled in config
 * - No API key is configured
 * - The API call fails
 */
export declare function generateAiExplanation(violation: ProcessedViolation, config: Config): Promise<{
    text: string;
    source: 'ai' | 'template';
}>;
