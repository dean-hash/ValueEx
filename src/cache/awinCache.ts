import { Product } from '../types/productTypes';

export class AwinCache {
  private static instance: AwinCache;
  private cache: Map<string, Product[]>;
  private ttl: number;

  private constructor(ttl: number = 3600000) {
    // 1 hour default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  public static getInstance(ttl?: number): AwinCache {
    if (!AwinCache.instance) {
      AwinCache.instance = new AwinCache(ttl);
    }
    return AwinCache.instance;
  }

  public async get(key: string): Promise<Product[] | null> {
    const entry = this.cache.get(key);
    return entry || null;
  }

  public async set(key: string, value: Product[]): Promise<void> {
    this.cache.set(key, value);
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);
  }

  public async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }
}
