export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheAnalytics {
  private static instance: CacheAnalytics;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.reset();
  }

  public static getInstance(): CacheAnalytics {
    if (!CacheAnalytics.instance) {
      CacheAnalytics.instance = new CacheAnalytics();
    }
    return CacheAnalytics.instance;
  }

  public recordHit(): void {
    this.hits++;
  }

  public recordMiss(): void {
    this.misses++;
  }

  public getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  public reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
