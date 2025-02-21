import { logger } from '../../utils/logger';
import { AwinClient, Transaction } from './awinClient';
import { RedisConfig } from '../cache/redisConfig';
import Redis from 'ioredis';

export interface RevenueMetrics {
  revenue: number;
  newTransactions: number;
  clicks: number;
  conversionRate: number;
  lastUpdated: string;
}

export class RevenueTracker {
  private redis: Redis;
  private readonly METRICS_KEY = 'revenue:metrics';
  private readonly LINKS_KEY = 'revenue:links';
  private readonly TRANSACTIONS_KEY = 'revenue:transactions';

  constructor() {
    this.redis = RedisConfig.getInstance();
  }

  async init(): Promise<void> {
    await RedisConfig.initialize();
    this.redis = RedisConfig.getInstance();

    // Initialize metrics if they don't exist
    const metrics = await this.redis.get(this.METRICS_KEY);
    if (!metrics) {
      await this.redis.set(
        this.METRICS_KEY,
        JSON.stringify({
          revenue: 0,
          newTransactions: 0,
          clicks: 0,
          conversionRate: 0,
          lastUpdated: new Date().toISOString(),
        })
      );
    }
  }

  async trackTransaction(transaction: Transaction): Promise<void> {
    try {
      const existingTransactions = await this.redis.get(this.TRANSACTIONS_KEY);
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];

      // Check if transaction already tracked
      if (!transactions.find((t: Transaction) => t.id === transaction.id)) {
        transactions.push(transaction);
        await this.redis.set(this.TRANSACTIONS_KEY, JSON.stringify(transactions));

        // Update metrics
        const metrics = await this.getMetrics();
        metrics.revenue += transaction.amount;
        metrics.newTransactions += 1;
        metrics.lastUpdated = new Date().toISOString();

        await this.redis.set(this.METRICS_KEY, JSON.stringify(metrics));
        logger.info(`Tracked new transaction: ${transaction.id}`);
      }
    } catch (error) {
      logger.error('Failed to track transaction:', error);
    }
  }

  async trackLink(program: string, link: string): Promise<void> {
    try {
      const existingLinks = await this.redis.get(this.LINKS_KEY);
      const links = existingLinks ? JSON.parse(existingLinks) : {};

      if (!links[program]) {
        links[program] = [];
      }

      if (!links[program].includes(link)) {
        links[program].push(link);
        await this.redis.set(this.LINKS_KEY, JSON.stringify(links));
        logger.info(`Tracked new ${program} link: ${link}`);
      }
    } catch (error) {
      logger.error('Failed to track link:', error);
    }
  }

  async getMetrics(): Promise<RevenueMetrics> {
    try {
      const metricsStr = await this.redis.get(this.METRICS_KEY);
      return metricsStr
        ? JSON.parse(metricsStr)
        : {
            revenue: 0,
            newTransactions: 0,
            clicks: 0,
            conversionRate: 0,
            lastUpdated: new Date().toISOString(),
          };
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      throw error;
    }
  }

  async getLinks(program: string): Promise<string[]> {
    try {
      const linksStr = await this.redis.get(this.LINKS_KEY);
      const links = linksStr ? JSON.parse(linksStr) : {};
      return links[program] || [];
    } catch (error) {
      logger.error('Failed to get links:', error);
      throw error;
    }
  }
}
