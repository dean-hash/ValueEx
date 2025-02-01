export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}
export declare class CacheAnalytics {
  private static instance;
  private hits;
  private misses;
  private constructor();
  static getInstance(): CacheAnalytics;
  recordHit(): void;
  recordMiss(): void;
  getStats(): CacheStats;
  reset(): void;
}
