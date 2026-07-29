import { describe, expect, it } from 'vitest';
import { generateFixes } from './fixer.js';
import type { ProcessedViolation } from '../types.js';

function makeViolation(
  rule: string,
  html: string,
  impact: 'critical' | 'serious' | 'moderate' | 'minor' = 'serious',
): ProcessedViolation {
  return {
    rule,
    impact,
    description: `Violation: ${rule}`,
    help: `Help for ${rule}`,
    helpUrl: `https://example.com/${rule}`,
    elements: [{ selector: '.test', html, failureSummary: 'Test failure' }],
  };
}

describe('generateFixes', () => {
  describe('aria-valid-attr', () => {
    it('fixes aria-labeledby to aria-labelledby', () => {
      const violation = makeViolation(
        'aria-valid-attr',
        '<input aria-labeledby="label-id">',
      );
      const fixes = generateFixes(violation);
      expect(fixes).toHaveLength(1);
      expect(fixes[0].fixability).toBe('auto');
      expect(fixes[0].replacementHtml).toBe('<input aria-labelledby="label-id">');
      expect(fixes[0].patch).toBeDefined();
    });

    it('returns explain for unknown invalid attributes', () => {
      const violation = makeViolation(
        'aria-valid-attr',
        '<div aria-madeup="value">',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('explain');
    });
  });

  describe('landmark-one-main', () => {
    it('wraps body content in <main>', () => {
      const violation = makeViolation(
        'landmark-one-main',
        '<body><h1>Title</h1><p>Content</p></body>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('auto');
      expect(fixes[0].replacementHtml).toContain('<main>');
      expect(fixes[0].replacementHtml).toContain('</main>');
    });
  });

  describe('image-alt', () => {
    it('adds empty alt to img without alt', () => {
      const violation = makeViolation(
        'image-alt',
        '<img src="photo.jpg">',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toContain('alt=""');
    });

    it('returns explain for img with existing alt', () => {
      const violation = makeViolation(
        'image-alt',
        '<img src="photo.jpg" alt="">',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('explain');
    });
  });

  describe('label', () => {
    it('adds label for input with id', () => {
      const violation = makeViolation(
        'label',
        '<input id="email" type="text">',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toContain('<label for="email">');
    });

    it('wraps input without id in label', () => {
      const violation = makeViolation(
        'label',
        '<input type="text" placeholder="Search">',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toContain('<label>');
    });
  });

  describe('link-name', () => {
    it('adds aria-label to link', () => {
      const violation = makeViolation(
        'link-name',
        '<a href="/settings"><svg><!-- icon --></svg></a>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toContain('aria-label=');
    });
  });

  describe('button-name', () => {
    it('adds aria-label to button', () => {
      const violation = makeViolation(
        'button-name',
        '<button class="close"><svg><!-- icon --></svg></button>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toContain('aria-label=');
    });
  });

  describe('heading-order', () => {
    it('adjusts heading level down', () => {
      const violation = makeViolation(
        'heading-order',
        '<h3>Subsection</h3>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('suggest');
      expect(fixes[0].replacementHtml).toBe('<h2>Subsection</h2>');
    });
  });

  describe('color-contrast', () => {
    it('returns explain only', () => {
      const violation = makeViolation(
        'color-contrast',
        '<p style="color: #ddd;">Low contrast text</p>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('explain');
    });
  });

  describe('unknown rule', () => {
    it('returns explain for unknown rules', () => {
      const violation = makeViolation(
        'some-unknown-rule',
        '<div>Content</div>',
      );
      const fixes = generateFixes(violation);
      expect(fixes[0].fixability).toBe('explain');
    });
  });

  describe('multiple elements', () => {
    it('generates one fix per element', () => {
      const violation: ProcessedViolation = {
        rule: 'aria-valid-attr',
        impact: 'serious',
        description: 'Invalid ARIA attr',
        help: 'Help',
        helpUrl: 'https://example.com',
        elements: [
          { selector: '.el1', html: '<input aria-labeledby="id1">', failureSummary: '' },
          { selector: '.el2', html: '<input aria-labeledby="id2">', failureSummary: '' },
        ],
      };
      const fixes = generateFixes(violation);
      expect(fixes).toHaveLength(2);
      expect(fixes[0].replacementHtml).toContain('aria-labelledby');
      expect(fixes[1].replacementHtml).toContain('aria-labelledby');
    });
  });
});
