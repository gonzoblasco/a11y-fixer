import { z } from 'zod';
const authTypeSchema = z.enum(['cookie', 'header', 'token']);
const authenticatedRouteSchema = z.object({
    path: z.string().min(1),
    auth: z.object({
        type: authTypeSchema,
        value: z.string(),
    }),
});
const aiConfigSchema = z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['openai', 'anthropic']).optional(),
    model: z.string().optional(),
});
const ignoreConfigSchema = z.object({
    rules: z.array(z.string()).optional(),
    selectors: z.array(z.string()).optional(),
});
export const configSchema = z.object({
    level: z.enum(['A', 'AA', 'AAA']).default('AA'),
    max_impact: z.enum(['minor', 'moderate', 'serious', 'critical']).default('serious'),
    max_new_violations: z.number().int().min(0).default(5),
    routes: z
        .object({
        core: z.array(z.string()).default(['/']),
        authenticated: z.array(authenticatedRouteSchema).optional(),
    })
        .default({ core: ['/'] }),
    ai: aiConfigSchema.default({ enabled: false }),
    ignore: ignoreConfigSchema.optional(),
});
//# sourceMappingURL=config.schema.js.map