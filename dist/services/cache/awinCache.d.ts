import { Product } from '../../types/productTypes';
import { DemandPattern } from '../../types/demandTypes';
export declare class AwinCache {
  private static instance;
  private cache;
  private readonly TTL;
  private logger;
  private constructor();
  static getInstance(): AwinCache;
  private generateKey;
  private isExpired;
  private isSimilarPattern;
  set(pattern: DemandPattern, products: Product[]): void;
  get(pattern: DemandPattern): Product[] | null;
  clear(): void;
  cleanup(): void;
}
