import type { Config } from './config.schema.js';
import type { EvolutionResult, ProcessedResult, ProcessedViolation } from './types.js';
import { evaluateThresholds } from './thresholds.js';

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

export function generateComment(
  result: ProcessedResult,
  evolution: EvolutionResult,
  config: Config,
): string {
  const sections: string[] = [];

  // 1. Badge
  sections.push(getBadge(result, evolution, config));

  // 2. Summary
  sections.push('');
  sections.push(getSummary(result, evolution));

  // 3. Violations
  if (result.violations.length > 0) {
    sections.push('');
    sections.push('## Violations');
    sections.push('');
    for (const v of result.violations) {
      sections.push(formatViolation(v));
    }
  }

  // 4. Evolution
  sections.push('');
  sections.push('## Evolution');
  sections.push('');
  sections.push(formatEvolution(evolution));

  // 5. Configuration footer
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push(formatConfig(config));

  return sections.join('\n');
}

/**
 * Generate the badge line based on results and thresholds.
 */
function getBadge(result: ProcessedResult, evolution: EvolutionResult, config: Config): string {
  const threshold = evaluateThresholds(result, evolution, config);

  switch (threshold.status) {
    case 'failing':
      return `❌ **Accessibility Check: FAILING** — ${threshold.reason}`;
    case 'warning':
      return `⚠️ **Accessibility Check: WARNING** — ${threshold.reason}`;
    default:
      return '✅ **Accessibility Check: PASSING**';
  }
}

/**
 * Generate the summary line.
 */
function getSummary(result: ProcessedResult, evolution: EvolutionResult): string {
  if (result.totalCount === 0) {
    return 'No new accessibility violations found in this PR.';
  }

  const newCount = evolution.newViolations.length;
  const fixedCount = evolution.fixedViolations.length;
  const persistentCount = evolution.persistentViolations.length;

  const parts: string[] = [];
  if (newCount > 0) parts.push(`${newCount} new`);
  if (fixedCount > 0) parts.push(`${fixedCount} fixed`);
  if (persistentCount > 0) parts.push(`${persistentCount} persistent`);

  return `Found ${result.totalCount} accessibility violation${result.totalCount !== 1 ? 's' : ''} (${parts.join(', ')}).`;
}

/**
 * Format a single violation as a markdown section.
 */
function formatViolation(violation: ProcessedViolation): string {
  const impactPrefix = getImpactPrefix(violation.impact);
  const lines: string[] = [];

  lines.push(
    `**${impactPrefix}** \`${violation.rule}\` — ${violation.description.split('\n\n')[0]}`,
  );

  for (const element of violation.elements) {
    lines.push('');
    lines.push(`- **Element:** \`${element.selector}\``);
    lines.push(`- **HTML:** \`${escapeHtml(element.html)}\``);
    if (element.failureSummary) {
      lines.push(`- **Issue:** ${element.failureSummary}`);
    }
  }

  // Add the suggested fix (second part of description after the double newline)
  const fixPart = violation.description.split('\n\n').slice(1).join('\n\n');
  if (fixPart) {
    lines.push('');
    lines.push(fixPart);
  }

  return lines.join('\n');
}

/**
 * Get the impact prefix with emoji.
 */
function getImpactPrefix(impact: string): string {
  switch (impact) {
    case 'critical':
      return '🔴 CRITICAL';
    case 'serious':
      return '🟠 SERIOUS';
    case 'moderate':
      return '🟡 MODERATE';
    case 'minor':
      return '🔵 MINOR';
    default:
      return impact.toUpperCase();
  }
}

/**
 * Format the evolution section.
 */
function formatEvolution(evolution: EvolutionResult): string {
  const lines: string[] = [];

  lines.push('**Evolution vs main:**');

  if (evolution.trend === 'first') {
    lines.push('');
    lines.push(
      '🆕 This is the first audit on this project. No previous history to compare against. The reported violations are the new baseline.',
    );
    return lines.join('\n');
  }

  lines.push('');
  if (evolution.newViolations.length > 0) {
    lines.push(`- 🆕 **${evolution.newViolations.length} new** — violations introduced in this PR`);
  }
  if (evolution.fixedViolations.length > 0) {
    lines.push(
      `- ✅ **${evolution.fixedViolations.length} fixed** — violations that existed in main and are no longer present`,
    );
  }
  if (evolution.persistentViolations.length > 0) {
    lines.push(
      `- 🔄 **${evolution.persistentViolations.length} persistent** — violations that already existed in main and remain`,
    );
  }

  lines.push('');
  lines.push(`**Trend:** ${getTrendIndicator(evolution.trend)}`);

  return lines.join('\n');
}

/**
 * Get the trend indicator emoji and text.
 */
function getTrendIndicator(trend: string): string {
  switch (trend) {
    case 'improves':
      return '⬆️ This PR improves accessibility';
    case 'worsens':
      return '⬇️ This PR worsens accessibility';
    case 'neutral':
      return '➡️ Accessibility is neutral (same number of violations)';
    default:
      return '📊 First audit — no trend data';
  }
}

/**
 * Format the configuration footer.
 */
function formatConfig(config: Config): string {
  const lines: string[] = [];

  lines.push(
    `**Current config:** WCAG level \`${config.level}\`, max impact \`${config.max_impact}\`, max \`${config.max_new_violations}\` new violations.`,
  );

  if (config.ai?.enabled) {
    lines.push(`AI explanations enabled (${config.ai.provider}).`);
  }

  return lines.join('\n');
}

/**
 * Escape HTML entities for safe display in markdown.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
