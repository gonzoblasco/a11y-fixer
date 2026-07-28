import { z } from 'zod';
declare const authTypeSchema: z.ZodEnum<["cookie", "header", "token"]>;
declare const authenticatedRouteSchema: z.ZodObject<{
    path: z.ZodString;
    auth: z.ZodObject<{
        type: z.ZodEnum<["cookie", "header", "token"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "cookie" | "header" | "token";
    }, {
        value: string;
        type: "cookie" | "header" | "token";
    }>;
}, "strip", z.ZodTypeAny, {
    path: string;
    auth: {
        value: string;
        type: "cookie" | "header" | "token";
    };
}, {
    path: string;
    auth: {
        value: string;
        type: "cookie" | "header" | "token";
    };
}>;
declare const aiConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "openrouter"]>>;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    provider?: "openai" | "anthropic" | "openrouter" | undefined;
    model?: string | undefined;
}, {
    enabled?: boolean | undefined;
    provider?: "openai" | "anthropic" | "openrouter" | undefined;
    model?: string | undefined;
}>;
declare const ignoreConfigSchema: z.ZodObject<{
    rules: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    selectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    rules?: string[] | undefined;
    selectors?: string[] | undefined;
}, {
    rules?: string[] | undefined;
    selectors?: string[] | undefined;
}>;
export declare const configSchema: z.ZodObject<{
    level: z.ZodDefault<z.ZodEnum<["A", "AA", "AAA"]>>;
    max_impact: z.ZodDefault<z.ZodEnum<["minor", "moderate", "serious", "critical"]>>;
    max_new_violations: z.ZodDefault<z.ZodNumber>;
    routes: z.ZodDefault<z.ZodObject<{
        core: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        authenticated: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            auth: z.ZodObject<{
                type: z.ZodEnum<["cookie", "header", "token"]>;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value: string;
                type: "cookie" | "header" | "token";
            }, {
                value: string;
                type: "cookie" | "header" | "token";
            }>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }, {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        core: string[];
        authenticated?: {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }[] | undefined;
    }, {
        core?: string[] | undefined;
        authenticated?: {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }[] | undefined;
    }>>;
    ai: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "openrouter"]>>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        provider?: "openai" | "anthropic" | "openrouter" | undefined;
        model?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        provider?: "openai" | "anthropic" | "openrouter" | undefined;
        model?: string | undefined;
    }>>;
    ignore: z.ZodOptional<z.ZodObject<{
        rules: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        selectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        rules?: string[] | undefined;
        selectors?: string[] | undefined;
    }, {
        rules?: string[] | undefined;
        selectors?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    level: "A" | "AA" | "AAA";
    max_impact: "minor" | "moderate" | "serious" | "critical";
    max_new_violations: number;
    routes: {
        core: string[];
        authenticated?: {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }[] | undefined;
    };
    ai: {
        enabled: boolean;
        provider?: "openai" | "anthropic" | "openrouter" | undefined;
        model?: string | undefined;
    };
    ignore?: {
        rules?: string[] | undefined;
        selectors?: string[] | undefined;
    } | undefined;
}, {
    level?: "A" | "AA" | "AAA" | undefined;
    max_impact?: "minor" | "moderate" | "serious" | "critical" | undefined;
    max_new_violations?: number | undefined;
    routes?: {
        core?: string[] | undefined;
        authenticated?: {
            path: string;
            auth: {
                value: string;
                type: "cookie" | "header" | "token";
            };
        }[] | undefined;
    } | undefined;
    ai?: {
        enabled?: boolean | undefined;
        provider?: "openai" | "anthropic" | "openrouter" | undefined;
        model?: string | undefined;
    } | undefined;
    ignore?: {
        rules?: string[] | undefined;
        selectors?: string[] | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof configSchema>;
export type AuthType = z.infer<typeof authTypeSchema>;
export type AuthenticatedRoute = z.infer<typeof authenticatedRouteSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type IgnoreConfig = z.infer<typeof ignoreConfigSchema>;
export {};
