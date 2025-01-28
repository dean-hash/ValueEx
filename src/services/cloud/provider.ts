import { logger } from '../../utils/logger';
import { Redis } from 'ioredis';
import { AutoScaler } from './autoscaler';

interface ScalingConfig {
  metric: string;
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export class CloudProvider {
  private static instance: CloudProvider;
  private redis: Redis;
  private autoScaler: AutoScaler;
  
  private constructor() {
    // Initialize Redis for distributed caching
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    this.autoScaler = new AutoScaler();

    // Handle Redis errors
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  static getInstance(): CloudProvider {
    if (!CloudProvider.instance) {
      CloudProvider.instance = new CloudProvider();
    }
    return CloudProvider.instance;
  }

  enableAutoScaling(config: ScalingConfig): void {
    this.autoScaler.configure(config);
    this.autoScaler.start();
    
    logger.info(`Auto-scaling enabled for metric: ${config.metric}`);
  }

  get cache() {
    return {
      async get(key: string): Promise<any> {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      },

      async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
        const serialized = JSON.stringify(value);
        
        if (options.ttl) {
          await this.redis.setex(key, options.ttl, serialized);
        } else {
          await this.redis.set(key, serialized);
        }

        // Tag the key if tags are provided
        if (options.tags) {
          await Promise.all(
            options.tags.map(tag => 
              this.redis.sadd(`tag:${tag}`, key)
            )
          );
        }
      },

      async invalidateByTag(tag: string): Promise<void> {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
        }
      }
    };
  }

  async scaleOut(): Promise<void> {
    await this.autoScaler.scaleOut();
  }

  async scaleIn(): Promise<void> {
    await this.autoScaler.scaleIn();
  }

  async getMetrics(): Promise<any> {
    return this.autoScaler.getMetrics();
  }
}
