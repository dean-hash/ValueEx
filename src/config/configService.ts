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

export class ConfigService {
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
      godaddy: {
        apiKey: process.env.GODADDY_API_KEY || '',
        apiSecret: process.env.GODADDY_API_SECRET || '',
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
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
}

export const configService = ConfigService.getInstance();
