import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    awin: z.ZodObject<{
        apiToken: z.ZodString;
        publisherId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        apiToken?: string;
        publisherId?: string;
    }, {
        apiToken?: string;
        publisherId?: string;
    }>;
    environment: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
}, "strip", z.ZodTypeAny, {
    awin?: {
        apiToken?: string;
        publisherId?: string;
    };
    environment?: "development" | "production" | "test";
}, {
    awin?: {
        apiToken?: string;
        publisherId?: string;
    };
    environment?: "development" | "production" | "test";
}>;
type Config = z.infer<typeof configSchema>;
declare const config: Config;
export { config };
export type { Config };
