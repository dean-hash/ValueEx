import { createClient } from 'redis';
import type {
  RedisClientType,
  RedisClientOptions,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';

interface CacheConfig {
  redisUrl?: string;
}

interface Transaction {
  id: string;
  amount: number;
  commission: number;
  status: string;
  clickRef: string;
  timestamp: string;
}

interface TransactionBatch {
  transactions: Transaction[];
  lastUpdated: string;
}

export class AwinCache {
  private client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  private readonly prefix = 'awin:';
  private config: CacheConfig;
  private isConnected = false;

  constructor(config: CacheConfig = {}) {
    this.config = config;
    const redisConfig: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> = {
      url: this.config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
    };

    this.client = createClient(redisConfig);

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    // Auto-connect
    this.connect().catch(console.error);
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.client.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.disconnect();
    } catch (err) {
      console.error('Failed to disconnect from Redis:', err);
      throw err;
    }
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const batch = (await this.getTransactionBatch()) || {
      transactions: [],
      lastUpdated: new Date().toISOString(),
    };

    // Add new transaction
    batch.transactions.push(transaction);
    batch.lastUpdated = new Date().toISOString();

    // Store updated batch
    await this.set('transactions', batch);
  }

  async getTransactionBatch(): Promise<TransactionBatch | null> {
    return this.get('transactions');
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const batch = await this.getTransactionBatch();
    if (!batch) return null;

    return batch.transactions.find((t) => t.id === id) || null;
  }

  async getTransactionsByClickRef(clickRef: string): Promise<Transaction[]> {
    const batch = await this.getTransactionBatch();
    if (!batch) return [];

    return batch.transactions.filter((t) => t.clickRef === clickRef);
  }

  private async reconnect(retries = 3, delay = 1000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.connect();
        return;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async set(key: string, value: any): Promise<void> {
    if (!this.isConnected) {
      await this.reconnect();
    }

    try {
      const cacheKey = this.getCacheKey(key);
      await this.client.set(cacheKey, JSON.stringify(value));
    } catch (err) {
      console.error('Failed to set cache value:', err);
      throw err;
    }
  }

  private async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const value = await this.client.get(cacheKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (err) {
      console.error('Failed to get cache value:', err);
      return null;
    }
  }

  private getCacheKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
