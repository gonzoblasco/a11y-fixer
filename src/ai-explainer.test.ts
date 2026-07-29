import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAiExplanation } from './ai-explainer.js';
import type { Config } from './config.schema.js';
import type { ProcessedViolation } from './types.js';

const defaultConfig: Config = {
  level: 'AA',
  max_impact: 'serious',
  max_new_violations: 5,
  routes: { core: ['/'] },
  ai: { enabled: false },
};

const aiConfig: Config = {
  ...defaultConfig,
  ai: { enabled: true, provider: 'openai', model: 'gpt-4o-mini' },
};

function makeViolation(overrides: Partial<ProcessedViolation> = {}): ProcessedViolation {
  return {
    rule: 'color-contrast',
    impact: 'serious',
    description:
      'Ensures text has sufficient color contrast against its background.\n\n**How to fix it:**\nAdjust colors.',
    help: 'Help text',
    helpUrl: 'https://example.com',
    elements: [
      {
        selector: '.btn-primary',
        html: '<button class="btn-primary">Submit</button>',
        failureSummary: 'Element has insufficient color contrast of 2.3:1',
      },
    ],
    ...overrides,
  };
}

describe('generateAiExplanation', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns template source when AI is disabled', async () => {
    const result = await generateAiExplanation(makeViolation(), defaultConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('returns template source when no API key is set', async () => {
    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('returns AI explanation when API key is set and call succeeds', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');

    // Mock fetch for OpenAI
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'This is an AI-generated explanation for the color contrast issue.',
            },
          },
        ],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('ai');
    expect(result.text).toContain('AI-generated explanation');
  });

  it('falls back to template when API call fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('falls back to template when API returns non-ok status', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as Response);

    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('falls back to template when API returns empty content', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '' } }],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('works with Anthropic provider', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');

    const anthropicConfig: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'Anthropic explanation for the violation.' }],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), anthropicConfig);
    expect(result.source).toBe('ai');
    expect(result.text).toContain('Anthropic explanation');
  });

  it('works with OpenRouter provider', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-test');

    const openrouterConfig: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'openrouter', model: 'openai/gpt-4o-mini' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'OpenRouter explanation.' } }],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), openrouterConfig);
    expect(result.source).toBe('ai');
    expect(result.text).toContain('OpenRouter explanation');
  });

  it('works with Ollama provider (no API key needed)', async () => {
    const ollamaConfig: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'ollama', model: 'deepseek-v4-flash:cloud' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Ollama explanation for the violation.' } }],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), ollamaConfig);
    expect(result.source).toBe('ai');
    expect(result.text).toContain('Ollama explanation');
  });

  it('falls back to template when Ollama returns non-ok status', async () => {
    const ollamaConfig: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'ollama', model: 'deepseek-v4-flash:cloud' },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const result = await generateAiExplanation(makeViolation(), ollamaConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('falls back to template for unknown provider', async () => {
    vi.stubEnv('MADEUP_API_KEY', 'sk-test');

    const badConfig: Config = {
      ...defaultConfig,
      ai: { enabled: true, provider: 'openai', model: 'test' },
    };

    // No env var set for openai -> falls back to template
    const result = await generateAiExplanation(makeViolation(), badConfig);
    expect(result.source).toBe('template');
    expect(result.text).toBe('');
  });

  it('uses AI_API_KEY as fallback env var', async () => {
    vi.stubEnv('AI_API_KEY', 'sk-fallback-key');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Fallback key explanation.' } }],
      }),
    } as Response);

    const result = await generateAiExplanation(makeViolation(), aiConfig);
    expect(result.source).toBe('ai');
    expect(result.text).toContain('Fallback key');
  });
});
