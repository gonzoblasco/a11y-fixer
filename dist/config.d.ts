import { type Config } from './config.schema.js';
/**
 * Load and validate the a11y-fixer configuration.
 *
 * Reads a YAML file from the given path (or the default `.a11y-fixer.yml`),
 * parses it, validates with Zod, and returns a typed Config object.
 *
 * If the file doesn't exist, returns defaults.
 * If the file is invalid, throws a descriptive error.
 */
export declare function loadConfig(configPath?: string): Config;
//# sourceMappingURL=config.d.ts.map