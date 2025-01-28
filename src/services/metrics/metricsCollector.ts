import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface Stats {
  totalMatches: number;
  averageMatchScore: number;
  totalProducts: number;
  topCategories: { category: string; count: number }[];
  lastUpdated: string;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public async trackEvent(name: string, data: Record<string, any>): Promise<void> {
    try {
      const metric: Metric = {
        name,
        value: 1,
        timestamp: Date.now(),
        tags: data,
      };

      await this.redis.lpush(`metrics:${name}`, JSON.stringify(metric));
      logger.debug('Event tracked:', { name, data });
    } catch (error) {
      logger.error('Error tracking event:', error);
    }
  }

  public async getMetrics(): Promise<Stats> {
    try {
      const [matches, products, categories] = await Promise.all([
        this.getMetric('matches'),
        this.getMetric('products'),
        this.getTopCategories(),
      ]);

      return {
        totalMatches: matches.length,
        averageMatchScore: this.calculateAverageScore(matches),
        totalProducts: products.length,
        topCategories: categories,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting metrics:', error);
      return {
        totalMatches: 0,
        averageMatchScore: 0,
        totalProducts: 0,
        topCategories: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private async getMetric(name: string): Promise<Metric[]> {
    try {
      const data = await this.redis.lrange(`metrics:${name}`, 0, -1);
      return data.map((item) => JSON.parse(item));
    } catch (error) {
      logger.error(`Error getting metric ${name}:`, error);
      return [];
    }
  }

  private calculateAverageScore(matches: Metric[]): number {
    if (!matches.length) return 0;
    const sum = matches.reduce((acc, match) => acc + (match.tags?.score || 0), 0);
    return sum / matches.length;
  }

  private async getTopCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const categories = await this.redis.hgetall('metrics:categories');
      return Object.entries(categories)
        .map(([category, count]) => ({
          category,
          count: parseInt(count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      logger.error('Error getting top categories:', error);
      return [];
    }
  }
}
