import { AwinProduct } from '../types/awinTypes';
import { DemandPattern } from '../types/demandTypes';

/**
 * Mock product data source for development and testing
 * Simulates Awin API responses while the real API integration is pending
 */
export class MockProductDataSource {
  private static instance: MockProductDataSource;

  // Sample product data representing various categories and price points
  private products: AwinProduct[] = [
    {
      id: 'mock-001',
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      currency: 'USD',
      merchant: 'TechGear Pro',
      categories: ['Electronics', 'Audio', 'Accessories'],
      url: 'https://example.com/headphones',
      imageUrl: 'https://example.com/images/headphones.jpg',
      confidence: 0.95,
      coherence: 0.92,
    },
    {
      id: 'mock-002',
      title: 'Organic Cotton T-Shirt',
      description: 'Sustainable, comfortable cotton t-shirt',
      price: 29.99,
      currency: 'USD',
      merchant: 'EcoFashion',
      categories: ['Clothing', 'Sustainable', 'Basics'],
      url: 'https://example.com/tshirt',
      imageUrl: 'https://example.com/images/tshirt.jpg',
      confidence: 0.88,
      coherence: 0.9,
    },
    {
      id: 'mock-003',
      title: 'Smart Home Security Camera',
      description: 'AI-powered security camera with night vision',
      price: 149.99,
      currency: 'USD',
      merchant: 'SmartHome Solutions',
      categories: ['Electronics', 'Security', 'Smart Home'],
      url: 'https://example.com/camera',
      imageUrl: 'https://example.com/images/camera.jpg',
      confidence: 0.93,
      coherence: 0.89,
    },
  ];

  private constructor() {}

  public static getInstance(): MockProductDataSource {
    if (!MockProductDataSource.instance) {
      MockProductDataSource.instance = new MockProductDataSource();
    }
    return MockProductDataSource.instance;
  }

  /**
   * Simulates product search based on demand pattern
   */
  public async searchProducts(pattern: DemandPattern): Promise<AwinProduct[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return this.products.filter((product) => {
      // Match by category if specified
      if (pattern.category && !product.categories.includes(pattern.category)) {
        return false;
      }

      // Match by price range if specified
      if (pattern.priceRange) {
        const price = product.price;
        if (price < pattern.priceRange.min || price > pattern.priceRange.max) {
          return false;
        }
      }

      // Match by market trends (simulated)
      const hasMatchingTrend = pattern.context.marketTrends.some((trend) =>
        product.description.toLowerCase().includes(trend.toLowerCase())
      );

      return hasMatchingTrend;
    });
  }

  /**
   * Add a mock product for testing
   */
  public addMockProduct(product: AwinProduct): void {
    this.products.push(product);
  }

  /**
   * Clear all mock products
   */
  public clearMockProducts(): void {
    this.products = [];
  }

  /**
   * Get all available mock products
   */
  public getAllProducts(): AwinProduct[] {
    return [...this.products];
  }
}
