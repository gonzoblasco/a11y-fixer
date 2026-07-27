import * as fs from 'node:fs';
import * as path from 'node:path';
// Resolve the project root from the current working directory
const PROJECT_ROOT = process.cwd();
// Cache the axe-core source after first read
let axeSource = null;
/**
 * Get the axe-core JavaScript source to inject into pages.
 * Reads from node_modules and caches the result.
 */
function getAxeSource() {
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
 * Run an accessibility audit on the current page using axe-core.
 *
 * Injects axe-core into the page, runs the audit, and returns
 * structured violations.
 */
export async function runAudit(page) {
    const source = getAxeSource();
    // Inject axe-core into the page
    await page.addScriptTag({ content: source });
    // Run the audit
    const result = await page.evaluate(() => {
        // axe.run returns a Promise<AxeRunResult>
        return window.axe.run();
    });
    // Map to our types
    return result.violations.map(mapViolation);
}
/**
 * Map an axe-core raw violation to our Violation type.
 */
function mapViolation(raw) {
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
function mapNode(raw) {
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
function normalizeImpact(impact) {
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
//# sourceMappingURL=auditor.js.map