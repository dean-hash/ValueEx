import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define configuration schema
const configSchema = z.object({
  // Affiliate Networks
  awin: z.object({
    apiToken: z.string().optional(),
    publisherId: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
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
        apiKey: process.env.AWIN_API_KEY,
        apiSecret: process.env.AWIN_API_SECRET,
      },
      fiverr: {
        apiKey: process.env.FIVERR_API_KEY,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        environment: (process.env.NODE_ENV || 'development') as
          | 'development'
          | 'production'
          | 'test',
      },
      database: {
        url: process.env.DATABASE_URL,
      },
    };

    // Validate configuration
    return configSchema.parse(config);
  }

  public getAwinConfig(): {
    apiToken?: string;
    publisherId?: string;
    apiKey?: string;
    apiSecret?: string;
  } {
    return this.config.awin;
  }

  public getFiverrConfig(): { apiKey?: string } {
    return this.config.fiverr;
  }

  public getOpenAIConfig(): { apiKey: string } {
    return this.config.openai;
  }

  public getDatabaseConfig(): { url?: string } {
    return this.config.database;
  }

  public getOpenAIKey(): string {
    return this.config.openai.apiKey;
  }

  public isAwinConfigured(): boolean {
    return !!(this.config.awin.apiToken && this.config.awin.publisherId);
  }

  public isFiverrConfigured(): boolean {
    return !!this.config.fiverr.apiKey;
  }

  public getAwinApiKey(): string {
    const key = process.env.AWIN_API_KEY;
    if (!key) {
      throw new Error('AWIN_API_KEY environment variable is not set');
    }
    return key;
  }

  public getAwinApiSecret(): string {
    const secret = process.env.AWIN_API_SECRET;
    if (!secret) {
      throw new Error('AWIN_API_SECRET environment variable is not set');
    }
    return secret;
  }

  public getNodeEnv(): string {
    return this.config.server.environment;
  }

  public isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  public isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  public isTest(): boolean {
    return this.getNodeEnv() === 'test';
  }
}

export const configService = ConfigService.getInstance();
