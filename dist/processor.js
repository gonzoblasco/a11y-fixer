const IMPACT_ORDER = {
    critical: 0,
    serious: 1,
    moderate: 2,
    minor: 3,
};
/**
 * Process raw axe-core violations into a structured, grouped result.
 *
 * - Groups violations by WCAG rule
 * - Sorts by impact (critical → minor)
 * - Attaches suggested fixes from templates
 */
export function processViolations(raw) {
    const grouped = new Map();
    for (const violation of raw) {
        const key = violation.id;
        if (!grouped.has(key)) {
            grouped.set(key, {
                rule: violation.id,
                impact: violation.impact,
                description: violation.description,
                help: violation.help,
                helpUrl: violation.helpUrl,
                elements: [],
            });
        }
        const entry = grouped.get(key);
        if (!entry)
            continue;
        for (const node of violation.nodes) {
            entry.elements.push(node);
        }
    }
    const violations = Array.from(grouped.values()).sort((a, b) => (IMPACT_ORDER[a.impact] ?? 99) - (IMPACT_ORDER[b.impact] ?? 99));
    // Attach suggested fixes
    for (const v of violations) {
        v.description = `${v.description}\n\n${getSuggestedFix(v.rule)}`;
    }
    const totalCount = violations.reduce((sum, v) => sum + v.elements.length, 0);
    return { violations, totalCount };
}
/**
 * Get a suggested fix template for a known violation rule.
 * Falls back to a generic message for unknown rules.
 */
export function getSuggestedFix(ruleId) {
    const fixes = {
        'color-contrast': [
            '**How to fix it:**',
            'Text needs a contrast ratio of at least 4.5:1 against the background (3:1 for large text).',
            'Use a contrast checker tool to find compliant color combinations.',
            '',
            '```css',
            '/* Example: ensure sufficient contrast */',
            '.my-element {',
            '  color: #1a1a1a;      /* dark text */',
            '  background: #ffffff;  /* light background */',
            '}',
            '```',
        ].join('\n'),
        'image-alt': [
            '**How to fix it:**',
            'Add an `alt` attribute to the `<img>` element describing the image content.',
            'For decorative images, use `alt=""` (empty alt) so screen readers ignore them.',
            '',
            '```html',
            '<!-- Informative image -->',
            '<img src="chart.png" alt="Bar chart showing Q3 revenue growth of 15%">',
            '',
            '<!-- Decorative image -->',
            '<img src="divider.png" alt="">',
            '```',
        ].join('\n'),
        'aria-valid-attr': [
            '**How to fix it:**',
            'Use only valid ARIA attributes. Check the ARIA specification for the correct attribute name.',
            'Common typos: `aria-labeledby` should be `aria-labelledby`, `aria-hidden` is correct.',
            '',
            '```html',
            '<!-- Correct -->',
            '<input aria-labelledby="label-id">',
            '```',
        ].join('\n'),
        label: [
            '**How to fix it:**',
            'Associate a `<label>` element with the input using the `for` attribute,',
            'or wrap the input inside the label element.',
            '',
            '```html',
            '<!-- Option 1: for attribute -->',
            '<label for="email">Email address</label>',
            '<input id="email" type="email">',
            '',
            '<!-- Option 2: wrap -->',
            '<label>',
            '  Email address',
            '  <input type="email">',
            '</label>',
            '```',
        ].join('\n'),
        'heading-order': [
            '**How to fix it:**',
            'Headings must follow a sequential hierarchy without skipping levels.',
            'Start with `<h1>` for the page title, then `<h2>` for sections, `<h3>` for subsections, etc.',
            '',
            '```html',
            '<h1>Page Title</h1>',
            '  <h2>Section</h2>',
            '    <h3>Subsection</h3>',
            '```',
        ].join('\n'),
        'landmark-one-main': [
            '**How to fix it:**',
            'Wrap the primary content of the page in a `<main>` element.',
            'There should be only one `<main>` element per page.',
            '',
            '```html',
            '<body>',
            '  <header>Site header</header>',
            '  <main>',
            '    <h1>Page content</h1>',
            '    <p>Main content goes here.</p>',
            '  </main>',
            '  <footer>Site footer</footer>',
            '</body>',
            '```',
        ].join('\n'),
        'link-name': [
            '**How to fix it:**',
            'Links must have accessible text. Add text content, an `aria-label`,',
            'or `aria-labelledby` to describe the link destination.',
            '',
            '```html',
            '<!-- Visible text -->',
            '<a href="/docs">Read documentation</a>',
            '',
            '<!-- Icon-only link with aria-label -->',
            '<a href="/settings" aria-label="Settings">',
            '  <svg><!-- icon --></svg>',
            '</a>',
            '```',
        ].join('\n'),
        'button-name': [
            '**How to fix it:**',
            'Buttons must have accessible text. Add text content, an `aria-label`,',
            'or `aria-labelledby` to describe the button action.',
            '',
            '```html',
            '<!-- With text -->',
            '<button>Submit</button>',
            '',
            '<!-- Icon-only button with aria-label -->',
            '<button aria-label="Close dialog">',
            '  <svg><!-- icon --></svg>',
            '</button>',
            '```',
        ].join('\n'),
    };
    return (fixes[ruleId] ??
        [
            '**How to fix it:**',
            `Review the WCAG documentation for rule "${ruleId}" at the link above.`,
            'Consider using a tool like axe DevTools to get specific guidance for this issue.',
        ].join('\n'));
}
//# sourceMappingURL=processor.js.map