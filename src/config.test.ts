import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-fixer-test-'));
}

function writeConfig(dir: string, content: string): string {
  const filePath = path.join(dir, '.a11y-fixer.yml');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns defaults when file does not exist', () => {
    const config = loadConfig(path.join(tempDir, 'nonexistent.yml'));
    expect(config.level).toBe('AA');
    expect(config.max_impact).toBe('serious');
    expect(config.max_new_violations).toBe(5);
    expect(config.routes.core).toEqual(['/']);
    expect(config.ai.enabled).toBe(false);
  });

  it('returns defaults for empty file', () => {
    writeConfig(tempDir, '');
    const config = loadConfig(path.join(tempDir, '.a11y-fixer.yml'));
    expect(config.level).toBe('AA');
    expect(config.routes.core).toEqual(['/']);
  });

  it('parses a valid minimal config', () => {
    writeConfig(tempDir, 'level: AA\nmax_impact: critical\n');
    const config = loadConfig(path.join(tempDir, '.a11y-fixer.yml'));
    expect(config.level).toBe('AA');
    expect(config.max_impact).toBe('critical');
    expect(config.max_new_violations).toBe(5); // default
  });

  it('parses a valid full config', () => {
    writeConfig(
      tempDir,
      `
level: AAA
max_impact: minor
max_new_violations: 10
routes:
  core:
    - /
    - /login
    - /dashboard
  authenticated:
    - path: /admin
      auth:
        type: cookie
        value: session=abc123
ai:
  enabled: true
  provider: openai
  model: gpt-4o-mini
ignore:
  rules:
    - color-contrast
  selectors:
    - .editor-preview
`,
    );
    const config = loadConfig(path.join(tempDir, '.a11y-fixer.yml'));
    expect(config.level).toBe('AAA');
    expect(config.max_impact).toBe('minor');
    expect(config.max_new_violations).toBe(10);
    expect(config.routes.core).toEqual(['/', '/login', '/dashboard']);
    expect(config.routes.authenticated).toHaveLength(1);
    expect(config.routes.authenticated?.[0].path).toBe('/admin');
    expect(config.routes.authenticated?.[0].auth.type).toBe('cookie');
    expect(config.ai.enabled).toBe(true);
    expect(config.ai.provider).toBe('openai');
    expect(config.ignore?.rules).toEqual(['color-contrast']);
    expect(config.ignore?.selectors).toEqual(['.editor-preview']);
  });

  it('throws on invalid level value', () => {
    writeConfig(tempDir, 'level: INVALID');
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow();
  });

  it('throws on invalid impact value', () => {
    writeConfig(tempDir, 'max_impact: ultra');
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow();
  });

  it('throws on negative max_new_violations', () => {
    writeConfig(tempDir, 'max_new_violations: -1');
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow();
  });

  it('throws on invalid YAML', () => {
    writeConfig(tempDir, 'level: [unclosed');
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow('Invalid YAML');
  });

  it('throws on invalid auth type', () => {
    writeConfig(
      tempDir,
      `
routes:
  authenticated:
    - path: /admin
      auth:
        type: magic
        value: x
`,
    );
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow();
  });

  it('throws on invalid ai provider', () => {
    writeConfig(
      tempDir,
      `
ai:
  enabled: true
  provider: google
`,
    );
    expect(() => loadConfig(path.join(tempDir, '.a11y-fixer.yml'))).toThrow();
  });
});
