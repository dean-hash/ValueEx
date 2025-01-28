import { AwinService } from '../services/awinService';
import { ConfigService } from '../config/configService';
import { AwinCache } from '../cache/awinCache';
import { RetryStrategy } from '../utils/retryStrategy';
import { CacheAnalytics } from '../analytics/cacheAnalytics';
import { DemandPattern } from '../types/demandTypes';

describe('AwinService Integration', () => {
  let awinService: AwinService;
  let config: ConfigService;
  let cache: AwinCache;
  let retryStrategy: RetryStrategy;
  let analytics: CacheAnalytics;

  beforeEach(() => {
    config = ConfigService.getInstance();
    cache = AwinCache.getInstance();
    retryStrategy = new RetryStrategy();
    analytics = CacheAnalytics.getInstance();
    awinService = new AwinService(config, cache, retryStrategy, analytics);
  });

  describe('API Health', () => {
    it('should check API health successfully', async () => {
      const isHealthy = await awinService.checkApiHealth();
      expect(isHealthy).toBe(true);
    });

    it('should handle API health check failures gracefully', async () => {
      // Temporarily invalidate API key
      const originalConfig = config.get('awin');
      config.get('awin').apiKey = 'invalid-key';

      const isHealthy = await awinService.checkApiHealth();
      expect(isHealthy).toBe(false);

      // Restore config
      config.get('awin').apiKey = originalConfig.apiKey;
    });
  });

  describe('Product Search', () => {
    it('should search products with valid pattern', async () => {
      const pattern: DemandPattern = {
        query: 'laptop',
        context: {
          priceRange: { min: 500, max: 1500 },
          market: 'electronics',
          category: 'computers',
        },
      };

      const products = await awinService.searchProducts(pattern);
      expect(Array.isArray(products)).toBe(true);

      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product.price).toBeGreaterThanOrEqual(500);
        expect(product.price).toBeLessThanOrEqual(1500);
      }
    });

    it('should handle empty search results', async () => {
      const pattern: DemandPattern = {
        query: 'xyznonexistentproduct123',
        context: {
          market: 'none',
          category: 'none',
        },
      };

      const products = await awinService.searchProducts(pattern);
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });

    it('should use cache for repeated searches', async () => {
      const pattern: DemandPattern = {
        query: 'monitor',
        context: {
          priceRange: { min: 100, max: 1000 },
          market: 'electronics',
        },
      };

      // First search should miss cache
      const spy = jest.spyOn(analytics, 'recordMiss');
      await awinService.searchProducts(pattern);
      expect(spy).toHaveBeenCalled();

      // Second search should hit cache
      const hitSpy = jest.spyOn(analytics, 'recordHit');
      await awinService.searchProducts(pattern);
      expect(hitSpy).toHaveBeenCalled();
    });
  });
});
