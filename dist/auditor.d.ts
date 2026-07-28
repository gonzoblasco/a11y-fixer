import type { Page } from 'playwright';
import type { Violation } from './types.js';
/**
 * Run an accessibility audit on the current page using axe-core.
 *
 * Injects axe-core into the page, runs the audit, and returns
 * structured violations.
 */
export declare function runAudit(page: Page): Promise<Violation[]>;
