import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { configSchema } from './config.schema.js';
const DEFAULT_CONFIG_PATH = '.a11y-fixer.yml';
/**
 * Load and validate the a11y-fixer configuration.
 *
 * Reads a YAML file from the given path (or the default `.a11y-fixer.yml`),
 * parses it, validates with Zod, and returns a typed Config object.
 *
 * If the file doesn't exist, returns defaults.
 * If the file is invalid, throws a descriptive error.
 */
export function loadConfig(configPath) {
    const resolvedPath = path.resolve(configPath ?? DEFAULT_CONFIG_PATH);
    let raw = {};
    if (fs.existsSync(resolvedPath)) {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        if (content.trim()) {
            try {
                raw = parseYaml(content);
            }
            catch (err) {
                throw new Error(`Invalid YAML in ${resolvedPath}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    const result = configSchema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
            .join('\n');
        throw new Error(`Invalid configuration in ${resolvedPath}:\n${issues}`);
    }
    return result.data;
}
//# sourceMappingURL=config.js.map