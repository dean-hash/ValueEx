import { Product } from '../../types/productTypes';
import { DemandPattern } from '../../types/demandTypes';
import { Logger } from '../../logger/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  pattern?: DemandPattern;
}

export class AwinCache {
  private static instance: AwinCache;
  private cache: Map<string, CacheEntry<Product[]>>;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private logger: Logger;

  private constructor() {
    this.cache = new Map();
    this.logger = new Logger('AwinCache');
  }

  static getInstance(): AwinCache {
    if (!AwinCache.instance) {
      AwinCache.instance = new AwinCache();
    }
    return AwinCache.instance;
  }

  private generateKey(pattern: DemandPattern): string {
    const keyParts = [pattern.searchTerm, pattern.category, pattern.minPrice, pattern.maxPrice].map(
      (part) => String(part)
    );

    return keyParts.join('::');
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL;
  }

  private isSimilarPattern(cached: DemandPattern, current: DemandPattern): boolean {
    return (
      cached.searchTerm === current.searchTerm &&
      cached.category === current.category &&
      Math.abs(cached.minPrice - current.minPrice) < 10 &&
      Math.abs(cached.maxPrice - current.maxPrice) < 10
    );
  }

  set(pattern: DemandPattern, products: Product[]): void {
    const key = this.generateKey(pattern);
    this.cache.set(key, {
      data: products,
      timestamp: Date.now(),
      pattern,
    });
    this.logger.debug('Cached products for pattern', { key, productCount: products.length });
  }

  get(pattern: DemandPattern): Product[] | null {
    const key = this.generateKey(pattern);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    if (!this.isSimilarPattern(entry.pattern!, pattern)) {
      return null;
    }

    this.logger.debug('Cache hit for pattern', { key });
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry.timestamp)) {
        this.cache.delete(key);
      }
    }
    this.logger.info('Cache cleanup completed');
  }
}
