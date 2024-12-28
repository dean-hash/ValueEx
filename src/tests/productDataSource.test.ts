import { MockProductDataSource } from '../mocks/productDataSource';
import { DemandPattern } from '../types/demandTypes';

describe('Product Data Source Tests', () => {
  let productDataSource: MockProductDataSource;

  beforeEach(() => {
    productDataSource = new MockProductDataSource();
  });

  it('should find products matching demand pattern', async () => {
    const demandPattern: DemandPattern = {
      strength: 0.8,
      confidence: 0.75,
      source: 'market_analysis',
      status: 'active',
      signals: [
        {
          source: 'reddit',
          strength: 0.8,
          confidence: 0.75,
          status: 'active',
          content: 'High demand for gaming accessories',
          timestamp: new Date().toISOString(),
        }
      ],
      timestamp: new Date().toISOString(),
    };

    const products = await productDataSource.findMatchingProducts(demandPattern);
    
    expect(Array.isArray(products)).toBe(true);
    products.forEach(product => {
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('source');
      expect(product).toHaveProperty('status');
    });
  });

  it('should handle empty demand pattern gracefully', async () => {
    const emptyPattern: DemandPattern = {
      strength: 0,
      confidence: 0,
      source: 'manual',
      status: 'inactive',
      signals: [],
      timestamp: new Date().toISOString(),
    };

    const products = await productDataSource.findMatchingProducts(emptyPattern);
    expect(Array.isArray(products)).toBe(true);
    expect(products).toHaveLength(0);
  });
});
