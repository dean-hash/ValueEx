import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define configuration schema
const configSchema = z.object({
    // Affiliate Networks
    awin: z.object({
        apiToken: z.string().optional(),
        publisherId: z.string().optional(),
    }),
    fiverr: z.object({
        apiKey: z.string().optional(),
    }),

    // OpenAI
    openai: z.object({
        apiKey: z.string(),
    }),

    // Server
    server: z.object({
        port: z.number().default(3000),
        environment: z.enum(['development', 'production', 'test']).default('development'),
    }),

    // Database
    database: z.object({
        url: z.string().optional(),
    }),
});

type Config = z.infer<typeof configSchema>;

class ConfigService {
    private static instance: ConfigService;
    private config: Config;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private loadConfig(): Config {
        const config = {
            awin: {
                apiToken: process.env.AWIN_API_TOKEN,
                publisherId: process.env.AWIN_PUBLISHER_ID,
            },
            fiverr: {
                apiKey: process.env.FIVERR_API_KEY,
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY || '',
            },
            server: {
                port: parseInt(process.env.PORT || '3000'),
                environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
            },
            database: {
                url: process.env.DATABASE_URL,
            },
        };

        // Validate configuration
        return configSchema.parse(config);
    }

    public getAwinConfig() {
        return this.config.awin;
    }

    public getFiverrConfig() {
        return this.config.fiverr;
    }

    public getOpenAIConfig() {
        return this.config.openai;
    }

    public getDatabaseConfig() {
        return this.config.database;
    }

    public isAwinConfigured(): boolean {
        return !!(this.config.awin.apiToken && this.config.awin.publisherId);
    }

    public isFiverrConfigured(): boolean {
        return !!this.config.fiverr.apiKey;
    }
}

export const configService = ConfigService.getInstance();
