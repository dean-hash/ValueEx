import { Product } from '../types/product';
import { DemandPattern } from '../types/demandTypes';
/**
 * Mock product data source for development and testing
 * Simulates product data with resonance patterns
 */
export declare class MockProductDataSource {
  private products;
  getProducts(pattern: DemandPattern): Promise<Product[]>;
}
