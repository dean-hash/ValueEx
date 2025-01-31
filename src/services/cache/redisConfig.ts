import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export class RedisConfig {
  private static instance: Redis;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const connectionString = process.env.REDIS_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('REDIS_CONNECTION_STRING environment variable is required');
    }

    try {
      this.instance = new Redis(connectionString, {
        tls: {
          rejectUnauthorized: false,
        },
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.instance.on('connect', () => {
        logger.info('Connected to Redis');
        this.isInitialized = true;
      });

      this.instance.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isInitialized = false;
      });

      // Test connection
      await this.instance.ping();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  static getInstance(): Redis {
    if (!this.instance) {
      throw new Error('Redis not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.isInitialized = false;
    }
  }
}
