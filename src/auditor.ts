import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from 'playwright';
import type { Violation, ViolationNode } from './types.js';

// Resolve the project root from the current working directory
const PROJECT_ROOT = process.cwd();

// Cache the axe-core source after first read
let axeSource: string | null = null;

/**
 * Get the axe-core JavaScript source to inject into pages.
 * Reads from node_modules and caches the result.
 */
function getAxeSource(): string {
  if (axeSource) {
    return axeSource;
  }

  const axePath = path.resolve(PROJECT_ROOT, 'node_modules', 'axe-core', 'axe.min.js');

  if (!fs.existsSync(axePath)) {
    throw new Error(`axe-core not found at ${axePath}. Run 'npm install' to install dependencies.`);
  }

  axeSource = fs.readFileSync(axePath, 'utf-8');
  return axeSource;
}

/**
 * Axe-core raw result node structure.
 */
interface AxeNode {
  target: string[];
  html: string;
  failureSummary?: string;
}

/**
 * Axe-core raw result structure.
 */
interface AxeResult {
  id: string;
  impact?: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

/**
 * Axe-core raw run result.
 */
interface AxeRunResult {
  violations: AxeResult[];
  passes: AxeResult[];
  incomplete: AxeResult[];
  inapplicable: AxeResult[];
}

/**
 * Run an accessibility audit on the current page using axe-core.
 *
 * Injects axe-core into the page, runs the audit, and returns
 * structured violations.
 */
export async function runAudit(page: Page): Promise<Violation[]> {
  const source = getAxeSource();

  // Inject axe-core into the page
  await page.addScriptTag({ content: source });

  // Run the audit
  const result = await page.evaluate<AxeRunResult>(() => {
    // axe.run returns a Promise<AxeRunResult>
    return (window as unknown as { axe: { run: () => Promise<AxeRunResult> } }).axe.run();
  });

  // Map to our types
  return result.violations.map(mapViolation);
}

/**
 * Map an axe-core raw violation to our Violation type.
 */
function mapViolation(raw: AxeResult): Violation {
  const impact = normalizeImpact(raw.impact);

  return {
    id: raw.id,
    impact,
    description: raw.description,
    help: raw.help,
    helpUrl: raw.helpUrl,
    nodes: raw.nodes.map(mapNode),
  };
}

/**
 * Map an axe-core raw node to our ViolationNode type.
 */
function mapNode(raw: AxeNode): ViolationNode {
  return {
    selector: (raw.target ?? []).join(' '),
    html: raw.html,
    failureSummary: raw.failureSummary ?? '',
  };
}

/**
 * Normalize axe-core impact string to our type.
 * Falls back to 'moderate' if unknown.
 */
function normalizeImpact(impact?: string): Violation['impact'] {
  switch (impact) {
    case 'critical':
    case 'serious':
    case 'moderate':
    case 'minor':
      return impact;
    default:
      return 'moderate';
  }
}
