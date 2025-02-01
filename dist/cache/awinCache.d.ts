import { Product } from '../types/productTypes';
export declare class AwinCache {
  private static instance;
  private cache;
  private ttl;
  private constructor();
  static getInstance(ttl?: number): AwinCache;
  get(key: string): Promise<Product[] | null>;
  set(key: string, value: Product[]): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
