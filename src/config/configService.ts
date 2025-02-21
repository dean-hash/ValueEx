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
  godaddy: z.object({
    apiKey: z.string(),
    apiSecret: z.string(),
  }),

  // OpenAI
  openai: z.object({
    apiKey: z.string(),
    model: z.string().default('gpt-4-turbo-preview'),
    organization: z.string().optional(),
    maxTokens: z.number().default(2000),
  }),

  // Runner Configuration
  runner: z.object({
    matchIntervalMs: z.number().default(5 * 60 * 1000),
    analyticsIntervalMs: z.number().default(60 * 60 * 1000),
    maxConcurrentMatches: z.number().default(5),
    minConfidenceThreshold: z.number().default(0.7),
    enableHealthChecks: z.boolean().default(true),
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

  // Email Configuration
  email: z.object({
    aoa: z.object({
      host: z.string().default('outlook.office365.com'),
      port: z.string().default('993'),
      tls: z.string().default('true'),
      user: z.string(),
      password: z.string(),
      forwardTo: z.string().optional(),
    }),
    collab: z.object({
      host: z.string().default('outlook.office365.com'),
      port: z.string().default('993'),
      tls: z.string().default('true'),
      user: z.string(),
      password: z.string(),
    }),
  }),

  // Stripe Configuration
  stripe: z.object({
    secretKey: z.string(),
    webhookSecret: z.string().optional(),
    priceId: z.string().optional(),
  }),
});

type Config = z.infer<typeof configSchema>;

const ConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ORG_ID: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AOA_EMAIL_HOST: z.string().default('outlook.office365.com'),
  AOA_EMAIL_PORT: z.string().default('993'),
  AOA_EMAIL_TLS: z.string().default('true'),
  AOA_EMAIL_USER: z.string(),
  AOA_EMAIL_PASSWORD: z.string(),
  AOA_EMAIL_FORWARD_TO: z.string().optional(),
  COLLAB_EMAIL_HOST: z.string().default('outlook.office365.com'),
  COLLAB_EMAIL_PORT: z.string().default('993'),
  COLLAB_EMAIL_TLS: z.string().default('true'),
  COLLAB_EMAIL_USER: z.string(),
  COLLAB_EMAIL_PASSWORD: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
});

type ConfigServiceConfig = z.infer<typeof ConfigSchema>;

export class ConfigService {
  private static instance: ConfigService;
  private config: Config;
  private configServiceConfig: ConfigServiceConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.configServiceConfig = this.loadConfigServiceConfig();
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
      godaddy: {
        apiKey: process.env.GODADDY_API_KEY || '',
        apiSecret: process.env.GODADDY_API_SECRET || '',
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        organization: process.env.OPENAI_ORGANIZATION,
        maxTokens: process.env.OPENAI_MAX_TOKENS
          ? parseInt(process.env.OPENAI_MAX_TOKENS, 10)
          : 2000,
      },
      runner: {
        matchIntervalMs: process.env.MATCH_INTERVAL_MS
          ? parseInt(process.env.MATCH_INTERVAL_MS, 10)
          : 5 * 60 * 1000,
        analyticsIntervalMs: process.env.ANALYTICS_INTERVAL_MS
          ? parseInt(process.env.ANALYTICS_INTERVAL_MS, 10)
          : 60 * 60 * 1000,
        maxConcurrentMatches: process.env.MAX_CONCURRENT_MATCHES
          ? parseInt(process.env.MAX_CONCURRENT_MATCHES, 10)
          : 5,
        minConfidenceThreshold: process.env.MIN_CONFIDENCE_THRESHOLD
          ? parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD)
          : 0.7,
        enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true',
      },
      server: {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
        environment: (process.env.NODE_ENV || 'development') as
          | 'development'
          | 'production'
          | 'test',
      },
      database: {
        url: process.env.DATABASE_URL,
      },
      email: {
        aoa: {
          host: process.env.AOA_EMAIL_HOST,
          port: process.env.AOA_EMAIL_PORT,
          tls: process.env.AOA_EMAIL_TLS,
          user: process.env.AOA_EMAIL_USER,
          password: process.env.AOA_EMAIL_PASSWORD,
          forwardTo: process.env.AOA_EMAIL_FORWARD_TO,
        },
        collab: {
          host: process.env.COLLAB_EMAIL_HOST,
          port: process.env.COLLAB_EMAIL_PORT,
          tls: process.env.COLLAB_EMAIL_TLS,
          user: process.env.COLLAB_EMAIL_USER,
          password: process.env.COLLAB_EMAIL_PASSWORD,
        },
      },
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        priceId: process.env.STRIPE_PRICE_ID,
      },
    };

    try {
      return configSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:', error.errors);
      }
      throw error;
    }
  }

  private loadConfigServiceConfig(): ConfigServiceConfig {
    try {
      return ConfigSchema.parse({
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
        REDIS_URL: process.env.REDIS_URL,
        NODE_ENV: process.env.NODE_ENV,
        AOA_EMAIL_HOST: process.env.AOA_EMAIL_HOST,
        AOA_EMAIL_PORT: process.env.AOA_EMAIL_PORT,
        AOA_EMAIL_TLS: process.env.AOA_EMAIL_TLS,
        AOA_EMAIL_USER: process.env.AOA_EMAIL_USER,
        AOA_EMAIL_PASSWORD: process.env.AOA_EMAIL_PASSWORD,
        AOA_EMAIL_FORWARD_TO: process.env.AOA_EMAIL_FORWARD_TO,
        COLLAB_EMAIL_HOST: process.env.COLLAB_EMAIL_HOST,
        COLLAB_EMAIL_PORT: process.env.COLLAB_EMAIL_PORT,
        COLLAB_EMAIL_TLS: process.env.COLLAB_EMAIL_TLS,
        COLLAB_EMAIL_USER: process.env.COLLAB_EMAIL_USER,
        COLLAB_EMAIL_PASSWORD: process.env.COLLAB_EMAIL_PASSWORD,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingFields = error.errors
          .filter((err) => err.code === 'invalid_type' && err.received === 'undefined')
          .map((err) => err.path.join('.'));

        throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
      }
      throw error;
    }
  }

  public get<K extends keyof Config>(key: K): Config[K];
  public get<K extends keyof Config, SK extends keyof Config[K]>(key: K, subKey: SK): Config[K][SK];
  public get(key: string, subKey?: string): unknown {
    if (subKey) {
      return this.config[key as keyof Config]?.[subKey as keyof Config[keyof Config]];
    }
    return this.config[key as keyof Config];
  }

  public getAll(): Config {
    return { ...this.config };
  }

  public getOpenAIKey(): string {
    const openaiConfig = this.get('openai');
    if (!openaiConfig?.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    return openaiConfig.apiKey;
  }

  public getConfigServiceConfig<K extends keyof ConfigServiceConfig>(
    key: K
  ): ConfigServiceConfig[K] {
    return this.configServiceConfig[key];
  }

  public getConfigServiceConfigAll(): ConfigServiceConfig {
    return this.configServiceConfig;
  }

  public isDevelopment(): boolean {
    return this.configServiceConfig.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.configServiceConfig.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.configServiceConfig.NODE_ENV === 'test';
  }
}

export const configService = ConfigService.getInstance();
