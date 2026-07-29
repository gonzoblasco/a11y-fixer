/**
 * Fixer module for a11y-fixer.
 *
 * Generates concrete, actionable fix suggestions for accessibility violations.
 * For fixable violations, produces a code patch (diff) that can be applied
 * directly. For non-fixable violations, provides a human-readable explanation.
 *
 * Fixability levels:
 * - **auto**: can be fixed automatically (safe, deterministic)
 * - **suggest**: can be suggested as a PR change (needs human review)
 * - **explain**: cannot be fixed automatically, only explained
 */

import type { ProcessedViolation, ViolationNode } from '../types.js';

export type Fixability = 'auto' | 'suggest' | 'explain';

export interface FixSuggestion {
  /** The violation rule this fix addresses */
  rule: string;
  /** How fixable this violation is */
  fixability: Fixability;
  /** Human-readable explanation of the fix */
  description: string;
  /** Code patch (unified diff format) for auto-fixable violations */
  patch?: string;
  /** The original HTML that needs to be replaced */
  originalHtml?: string;
  /** The replacement HTML */
  replacementHtml?: string;
  /** The file path where the fix should be applied (if known) */
  filePath?: string;
  /** The line number where the fix should be applied (if known) */
  lineNumber?: number;
}

/**
 * Generate fix suggestions for a processed violation.
 *
 * Returns one suggestion per affected element, since each element
 * may need a different fix.
 */
export function generateFixes(violation: ProcessedViolation): FixSuggestion[] {
  return violation.elements.map((element) => generateFixForElement(violation.rule, element));
}

/**
 * Generate a fix suggestion for a single element given a violation rule.
 */
function generateFixForElement(rule: string, element: ViolationNode): FixSuggestion {
  switch (rule) {
    case 'aria-valid-attr':
      return fixAriaValidAttr(element);
    case 'landmark-one-main':
      return fixLandmarkOneMain(element);
    case 'image-alt':
      return fixImageAlt(element);
    case 'label':
      return fixLabel(element);
    case 'link-name':
      return fixLinkName(element);
    case 'button-name':
      return fixButtonName(element);
    case 'heading-order':
      return fixHeadingOrder(element);
    case 'color-contrast':
      return fixColorContrast(element);
    default:
      return {
        rule,
        fixability: 'explain',
        description: `Review the WCAG documentation for rule "${rule}". No automated fix is available for this type of violation.`,
        originalHtml: element.html,
      };
  }
}

// ─── Fix generators ─────────────────────────────────────────────────────────

/**
 * Fix: `aria-labeledby` → `aria-labelledby` (common typo).
 * Auto-fixable: deterministic, safe.
 */
function fixAriaValidAttr(element: ViolationNode): FixSuggestion {
  const replacements: Record<string, string> = {
    'aria-labeledby': 'aria-labelledby',
    'aria-hiddenn': 'aria-hidden',
    'aria-expandedd': 'aria-expanded',
    'aria-currentt': 'aria-current',
    'aria-describedbyy': 'aria-describedby',
    'aria-controlss': 'aria-controls',
    'aria-owns': 'aria-owns',
    'aria-flowtoo': 'aria-flowto',
    'aria-activedescendannt': 'aria-activedescendant',
    'aria-atomicc': 'aria-atomic',
    'aria-busyy': 'aria-busy',
    'aria-checkedd': 'aria-checked',
    'aria-disabledd': 'aria-disabled',
    'aria-dropeffectt': 'aria-dropeffect',
    'aria-grabbedd': 'aria-grabbed',
    'aria-haspopupp': 'aria-haspopup',
    'aria-invalid': 'aria-invalid',
    'aria-live': 'aria-live',
    'aria-multiline': 'aria-multiline',
    'aria-multiselectable': 'aria-multiselectable',
    'aria-orientation': 'aria-orientation',
    'aria-pressedd': 'aria-pressed',
    'aria-readonlyy': 'aria-readonly',
    'aria-relevantt': 'aria-relevant',
    'aria-requiredd': 'aria-required',
    'aria-selectedd': 'aria-selected',
    'aria-sortt': 'aria-sort',
    'aria-valuemaxx': 'aria-valuemax',
    'aria-valueminn': 'aria-valuemin',
    'aria-valuenoww': 'aria-valuenow',
    'aria-valuetexxt': 'aria-valuetext',
  };

  let fixedHtml = element.html;
  let found = false;

  for (const [wrong, correct] of Object.entries(replacements)) {
    if (fixedHtml.includes(wrong)) {
      fixedHtml = fixedHtml.replaceAll(wrong, correct);
      found = true;
    }
  }

  if (!found) {
    return {
      rule: 'aria-valid-attr',
      fixability: 'explain',
      description:
        'The element has an invalid ARIA attribute. Check the ARIA specification for the correct attribute name.',
      originalHtml: element.html,
    };
  }

  return {
    rule: 'aria-valid-attr',
    fixability: 'auto',
    description: 'Fixed invalid ARIA attribute spelling.',
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: wrap content in `<main>` element.
 * Auto-fixable: deterministic, safe (wraps body content).
 */
function fixLandmarkOneMain(element: ViolationNode): FixSuggestion {
  const bodyMatch = element.html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    return {
      rule: 'landmark-one-main',
      fixability: 'suggest',
      description: 'Wrap the primary content of the page in a `<main>` element.',
      originalHtml: element.html,
      replacementHtml: element.html
        .replace(/(<body[^>]*>)/i, '$1\n  <main>')
        .replace(/(<\/body>)/i, '  </main>\n$1'),
    };
  }

  const bodyContent = bodyMatch[1].trim();
  const fixedHtml = element.html.replace(bodyContent, `  <main>\n    ${bodyContent}\n  </main>`);

  return {
    rule: 'landmark-one-main',
    fixability: 'auto',
    description: 'Wrapped page content in a `<main>` landmark element.',
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: add `alt=""` to images missing alt text.
 * Suggest: we can add empty alt (safe for decorative), but can't know
 * the correct description.
 */
function fixImageAlt(element: ViolationNode): FixSuggestion {
  const imgMatch = element.html.match(/<img\s[^>]*>/i);
  if (!imgMatch) {
    return {
      rule: 'image-alt',
      fixability: 'explain',
      description:
        'Add an `alt` attribute describing the image content. For decorative images, use `alt=""`.',
      originalHtml: element.html,
    };
  }

  const imgTag = imgMatch[0];
  if (imgTag.includes('alt=')) {
    return {
      rule: 'image-alt',
      fixability: 'explain',
      description: 'The image has an alt attribute but it may be empty or insufficient.',
      originalHtml: element.html,
    };
  }

  // Add empty alt as a safe default
  const fixedTag = imgTag.replace(/\/?>$/, ' alt=""$&');
  const fixedHtml = element.html.replace(imgTag, fixedTag);

  return {
    rule: 'image-alt',
    fixability: 'suggest',
    description:
      'Added empty `alt=""` attribute. Replace with a descriptive alt text for informative images.',
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: associate a label with an input.
 * Suggest: we can add a generic label, but the correct label text
 * depends on context.
 */
function fixLabel(element: ViolationNode): FixSuggestion {
  const inputMatch = element.html.match(/<input\s[^>]*>/i);
  if (!inputMatch) {
    return {
      rule: 'label',
      fixability: 'explain',
      description:
        'Associate a `<label>` element with this input using the `for` attribute or by wrapping.',
      originalHtml: element.html,
    };
  }

  const inputTag = inputMatch[0];
  const idMatch = inputTag.match(/id=["']([^"']+)["']/);
  const placeholderMatch = inputTag.match(/placeholder=["']([^"']+)["']/);

  if (idMatch) {
    const inputId = idMatch[1];
    const labelText = placeholderMatch?.[1] || 'Input';
    const label = `<label for="${inputId}">${labelText}</label>`;
    const fixedHtml = `${label}\n${element.html}`;

    return {
      rule: 'label',
      fixability: 'suggest',
      description: `Added a <label> element associated with the input. Review the label text "${labelText}" for accuracy.`,
      originalHtml: element.html,
      replacementHtml: fixedHtml,
      patch: generatePatch(element.html, fixedHtml),
    };
  }

  // No id: wrap the input in a label
  const labelText = placeholderMatch?.[1] || 'Input';
  const fixedHtml = `<label>\n  ${labelText}\n  ${element.html}\n</label>`;

  return {
    rule: 'label',
    fixability: 'suggest',
    description: `Wrapped the input in a <label> element. Review the label text "${labelText}" for accuracy.`,
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: add aria-label to links without text.
 * Suggest: we can add a generic label, but the correct text depends on context.
 */
function fixLinkName(element: ViolationNode): FixSuggestion {
  const linkMatch = element.html.match(/<a\s[^>]*>/i);
  if (!linkMatch) {
    return {
      rule: 'link-name',
      fixability: 'explain',
      description:
        'Add accessible text to this link using text content, `aria-label`, or `aria-labelledby`.',
      originalHtml: element.html,
    };
  }

  const linkTag = linkMatch[0];
  if (linkTag.includes('aria-label=')) {
    return {
      rule: 'link-name',
      fixability: 'explain',
      description: 'The link has an aria-label but it may be empty or insufficient.',
      originalHtml: element.html,
    };
  }

  const hrefMatch = linkTag.match(/href=["']([^"']+)["']/);
  const hint = hrefMatch ? hrefMatch[1].replace(/^https?:\/\//, '').replace(/\/$/, '') : 'link';
  const fixedTag = linkTag.replace(/\/?>$/, ` aria-label="${hint}"$&`);
  const fixedHtml = element.html.replace(linkTag, fixedTag);

  return {
    rule: 'link-name',
    fixability: 'suggest',
    description: `Added aria-label="${hint}" to the link. Review for accuracy.`,
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: add aria-label to buttons without text.
 * Suggest: same as link-name.
 */
function fixButtonName(element: ViolationNode): FixSuggestion {
  const buttonMatch = element.html.match(/<button\s[^>]*>/i);
  if (!buttonMatch) {
    return {
      rule: 'button-name',
      fixability: 'explain',
      description:
        'Add accessible text to this button using text content, `aria-label`, or `aria-labelledby`.',
      originalHtml: element.html,
    };
  }

  const buttonTag = buttonMatch[0];
  if (buttonTag.includes('aria-label=')) {
    return {
      rule: 'button-name',
      fixability: 'explain',
      description: 'The button has an aria-label but it may be empty or insufficient.',
      originalHtml: element.html,
    };
  }

  const classMatch = buttonTag.match(/class=["']([^"']+)["']/);
  const hint = classMatch ? (classMatch[1].split(/\s+/).pop() ?? 'button') : 'button';
  const fixedTag = buttonTag.replace(/\/?>$/, ` aria-label="${hint}"$&`);
  const fixedHtml = element.html.replace(buttonTag, fixedTag);

  return {
    rule: 'button-name',
    fixability: 'suggest',
    description: `Added aria-label="${hint}" to the button. Review for accuracy.`,
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: adjust heading level to follow hierarchy.
 * Suggest: we can suggest the correct level, but the right one depends
 * on the document structure.
 */
function fixHeadingOrder(element: ViolationNode): FixSuggestion {
  const headingMatch = element.html.match(/<h([1-6])[^>]*>/i);
  if (!headingMatch) {
    return {
      rule: 'heading-order',
      fixability: 'explain',
      description: 'Headings must follow a sequential hierarchy without skipping levels.',
      originalHtml: element.html,
    };
  }

  const currentLevel = Number.parseInt(headingMatch[1], 10);
  const suggestedLevel = Math.max(1, currentLevel - 1);

  const fixedHtml = element.html
    .replace(new RegExp(`<h${currentLevel}([^>]*)>`, 'i'), `<h${suggestedLevel}$1>`)
    .replace(new RegExp(`</h${currentLevel}>`, 'i'), `</h${suggestedLevel}>`);

  return {
    rule: 'heading-order',
    fixability: 'suggest',
    description: `Adjusted heading from <h${currentLevel}> to <h${suggestedLevel}> to follow sequential hierarchy.`,
    originalHtml: element.html,
    replacementHtml: fixedHtml,
    patch: generatePatch(element.html, fixedHtml),
  };
}

/**
 * Fix: color contrast.
 * Explain only — we can't know the correct colors without design context.
 */
function fixColorContrast(element: ViolationNode): FixSuggestion {
  return {
    rule: 'color-contrast',
    fixability: 'explain',
    description:
      'Text needs a contrast ratio of at least 4.5:1 against the background (3:1 for large text). Use a contrast checker tool to find compliant color combinations.',
    originalHtml: element.html,
  };
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Generate a simple unified diff patch between original and replacement HTML.
 * Used for GitHub PR suggestions.
 */
function generatePatch(original: string, replacement: string): string {
  const originalLines = original.split('\n');
  const replacementLines = replacement.split('\n');

  const lines: string[] = [];
  lines.push('--- a/original');
  lines.push('+++ b/fixed');
  lines.push(`@@ -1,${originalLines.length} +1,${replacementLines.length} @@`);

  for (const line of originalLines) {
    lines.push(`-${line}`);
  }
  for (const line of replacementLines) {
    lines.push(`+${line}`);
  }

  return lines.join('\n');
}
