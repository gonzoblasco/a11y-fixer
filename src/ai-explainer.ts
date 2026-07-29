import type { Config } from './config.schema.js';
import type { ProcessedViolation } from './types.js';

export interface AiProvider {
  name: string;
  generateExplanation(prompt: string, apiKey: string, model: string): Promise<string>;
}

const OPENAI_PROVIDER: AiProvider = {
  name: 'openai',
  async generateExplanation(prompt: string, apiKey: string, model: string) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '';
  },
};

const ANTHROPIC_PROVIDER: AiProvider = {
  name: 'anthropic',
  async generateExplanation(prompt: string, apiKey: string, model: string) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { content: { text: string }[] };
    return data.content?.[0]?.text ?? '';
  },
};

const OPENROUTER_PROVIDER: AiProvider = {
  name: 'openrouter',
  async generateExplanation(prompt: string, apiKey: string, model: string) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/gonzoblasco/a11y-fixer',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '';
  },
};

const OLLAMA_PROVIDER: AiProvider = {
  name: 'ollama',
  async generateExplanation(_prompt: string, _apiKey: string, model: string) {
    const res = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'deepseek-v4-flash:cloud',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: _prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '';
  },
};

const PROVIDERS: Record<string, AiProvider> = {
  openai: OPENAI_PROVIDER,
  anthropic: ANTHROPIC_PROVIDER,
  openrouter: OPENROUTER_PROVIDER,
  ollama: OLLAMA_PROVIDER,
};

const SYSTEM_PROMPT = `You are an accessibility (a11y) expert. Your role is to help developers understand and fix WCAG violations.

Given a violation description, the affected HTML element, and the failure summary, provide:
1. A clear explanation of why this is a problem (in 2-3 sentences)
2. A specific code example showing how to fix it

Be concise, specific, and actionable. Focus on the exact element provided.`;

/**
 * Build a prompt for the AI from a violation.
 */
function buildPrompt(violation: ProcessedViolation): string {
  const elements = violation.elements
    .map((el) => `- Selector: ${el.selector}\n  HTML: ${el.html}\n  Issue: ${el.failureSummary}`)
    .join('\n');

  return [
    `## Violation: ${violation.rule}`,
    `Impact: ${violation.impact}`,
    `Description: ${violation.description.split('\n\n')[0]}`,
    '',
    '### Affected elements',
    elements,
    '',
    'Provide an explanation and a code fix for this accessibility violation.',
  ].join('\n');
}

/**
 * Get the API key for a given provider from environment variables.
 */
function getApiKey(provider: string): string | undefined {
  const envVar = `${provider.toUpperCase()}_API_KEY`;
  return process.env[envVar] || process.env.AI_API_KEY;
}

/**
 * Generate an AI-powered explanation for a violation.
 *
 * Falls back to the template-based fix if:
 * - AI is not enabled in config
 * - No API key is configured
 * - The API call fails
 */
export async function generateAiExplanation(
  violation: ProcessedViolation,
  config: Config,
): Promise<{ text: string; source: 'ai' | 'template' }> {
  if (!config.ai?.enabled) {
    return { text: '', source: 'template' };
  }

  const provider = config.ai.provider ?? 'openai';
  const apiKey = getApiKey(provider);

  // Ollama runs locally and doesn't need an API key
  if (!apiKey && provider !== 'ollama') {
    return { text: '', source: 'template' };
  }

  const impl = PROVIDERS[provider];
  if (!impl) {
    return { text: '', source: 'template' };
  }

  try {
    const prompt = buildPrompt(violation);
    const model = config.ai.model ?? '';
    const explanation = await impl.generateExplanation(prompt, apiKey, model);
    if (!explanation.trim()) {
      return { text: '', source: 'template' };
    }
    return { text: explanation, source: 'ai' };
  } catch {
    return { text: '', source: 'template' };
  }
}
