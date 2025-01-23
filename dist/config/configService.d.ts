import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    awin: z.ZodObject<{
        apiToken: z.ZodOptional<z.ZodString>;
        publisherId: z.ZodOptional<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        apiSecret: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        apiToken?: string;
        publisherId?: string;
        apiKey?: string;
        apiSecret?: string;
    }, {
        apiToken?: string;
        publisherId?: string;
        apiKey?: string;
        apiSecret?: string;
    }>;
    fiverr: z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        apiKey?: string;
    }, {
        apiKey?: string;
    }>;
    godaddy: z.ZodObject<{
        apiKey: z.ZodString;
        apiSecret: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        apiKey?: string;
        apiSecret?: string;
    }, {
        apiKey?: string;
        apiSecret?: string;
    }>;
    openai: z.ZodObject<{
        apiKey: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        apiKey?: string;
    }, {
        apiKey?: string;
    }>;
    server: z.ZodObject<{
        port: z.ZodDefault<z.ZodNumber>;
        environment: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    }, "strip", z.ZodTypeAny, {
        port?: number;
        environment?: "development" | "production" | "test";
    }, {
        port?: number;
        environment?: "development" | "production" | "test";
    }>;
    database: z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url?: string;
    }, {
        url?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    awin?: {
        apiToken?: string;
        publisherId?: string;
        apiKey?: string;
        apiSecret?: string;
    };
    fiverr?: {
        apiKey?: string;
    };
    godaddy?: {
        apiKey?: string;
        apiSecret?: string;
    };
    openai?: {
        apiKey?: string;
    };
    server?: {
        port?: number;
        environment?: "development" | "production" | "test";
    };
    database?: {
        url?: string;
    };
}, {
    awin?: {
        apiToken?: string;
        publisherId?: string;
        apiKey?: string;
        apiSecret?: string;
    };
    fiverr?: {
        apiKey?: string;
    };
    godaddy?: {
        apiKey?: string;
        apiSecret?: string;
    };
    openai?: {
        apiKey?: string;
    };
    server?: {
        port?: number;
        environment?: "development" | "production" | "test";
    };
    database?: {
        url?: string;
    };
}>;
type Config = z.infer<typeof configSchema>;
export declare class ConfigService {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigService;
    private loadConfig;
    get<K extends keyof Config>(key: K): Config[K];
    get<K extends keyof Config, SK extends keyof Config[K]>(key: K, subKey: SK): Config[K][SK];
    getAll(): Config;
}
export declare const configService: ConfigService;
export {};
