import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { AwinService } from '../../services/awinService';
import { DemandPattern } from '../../types/demandTypes';
import { ConfigService } from '../../config/configService';
import { ResonanceFieldService } from '../../services/resonanceField';

describe('Awin Integration Tests', () => {
  let awinService: AwinService;
  let configService: ConfigService;
  let resonanceField: ResonanceFieldService;

  beforeAll(async () => {
    configService = ConfigService.getInstance();
    resonanceField = ResonanceFieldService.getInstance();
    const apiKey = configService.get('AWIN_API_KEY');
    const publisherId = configService.get('AWIN_PUBLISHER_ID');

    if (!apiKey || !publisherId) {
      throw new Error('Awin credentials not configured');
    }

    awinService = new AwinService(apiKey, publisherId, { timeout: 10000 });

    // Wait for initial connection check
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  describe('Connection Management', () => {
    it('should maintain a healthy connection', async () => {
      const status = awinService.getStatus();
      expect(status.isAvailable).toBe(true);
      expect(status.latency).toBeDefined();
      expect(status.latency).toBeLessThan(5000); // 5s max latency
    });

    it('should handle connection interruptions gracefully', async () => {
      // Simulate network issue by using invalid credentials temporarily
      const badService = new AwinService('invalid-key', 'invalid-id');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const status = badService.getStatus();
      expect(status.isAvailable).toBe(false);
      expect(status.error).toBeDefined();
    });
  });

  describe('Product Search', () => {
    it('should search products with valid pattern', async () => {
      const pattern: DemandPattern = {
        id: 'test-search',
        searchTerm: 'laptop',
        category: 'electronics',
        minPrice: 500,
        maxPrice: 2000,
        signals: [],
        confidence: 0.8,
        coherence: 0.7,
        resonance: 0.9,
        timestamp: new Date().toISOString(),
        resonanceFactors: {
          sustainability: 0.8,
          innovationLevel: 0.7,
          localImpact: 0.6,
        },
      };

      const products = await awinService.searchProducts(pattern);
      expect(products.length).toBeGreaterThan(0);

      const firstProduct = products[0];
      expect(firstProduct.resonanceScore).toBeGreaterThan(0);
      expect(firstProduct.resonanceScore).toBeLessThanOrEqual(1);
      expect(firstProduct.resonanceMetrics).toBeDefined();
    });

    it('should handle empty search results gracefully', async () => {
      const pattern: DemandPattern = {
        id: 'test-no-results',
        searchTerm: 'xyznonexistentproduct123',
        category: 'general',
        minPrice: 0,
        maxPrice: 1000000,
        signals: [],
        confidence: 0.5,
        coherence: 0.5,
        resonance: 0.5,
        timestamp: new Date().toISOString(),
      };

      const products = await awinService.searchProducts(pattern);
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limits', async () => {
      const promises = Array(20)
        .fill(null)
        .map(() =>
          awinService.searchProducts({
            id: 'rate-limit-test',
            searchTerm: 'test',
            category: 'general',
            minPrice: 0,
            maxPrice: 100,
            signals: [],
            confidence: 0.5,
            coherence: 0.5,
            resonance: 0.5,
            timestamp: new Date().toISOString(),
          })
        );

      try {
        await Promise.all(promises);
      } catch (error) {
        expect(error.message).toContain('rate limit');
      }
    });
  });

  afterAll(async () => {
    // Clean up
  });
});
