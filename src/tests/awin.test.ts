import { AwinService } from '../services/awinService';
import { Logger } from '../utils/logger';
import { DemandPattern } from '../types/demandTypes';
import { ConfigService } from '../config/configService';
import { AwinCache } from '../cache/awinCache';
import { RetryStrategy } from '../utils/retryStrategy';
import { CacheAnalytics } from '../analytics/cacheAnalytics';

describe('AwinService', () => {
  let awinService: AwinService;
  let mockConfig: jest.Mocked<ConfigService>;
  let mockCache: jest.Mocked<AwinCache>;
  let mockRetry: jest.Mocked<RetryStrategy>;
  let mockAnalytics: jest.Mocked<CacheAnalytics>;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as jest.Mocked<ConfigService>;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<AwinCache>;

    mockRetry = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RetryStrategy>;

    mockAnalytics = {
      recordHit: jest.fn(),
      recordMiss: jest.fn(),
      getStats: jest.fn(),
    } as unknown as jest.Mocked<CacheAnalytics>;

    awinService = new AwinService(mockConfig, mockCache, mockRetry, mockAnalytics);
  });

  describe('searchProducts', () => {
    it('should return products matching the search pattern', async () => {
      const searchPattern: DemandPattern = {
        query: 'test',
        category: 'Electronics',
        context: {
          market: 'UK',
          keywords: ['gadget', 'tech'],
          priceRange: { min: 0, max: 100 },
        },
      };

      const mockProduct = {
        id: '1',
        name: 'Test Product',
        description: 'A test product',
        price: {
          amount: 50,
          currency: 'GBP',
        },
        merchant: {
          id: 'merchant1',
          name: 'Test Merchant',
          category: 'Electronics',
        },
        url: 'https://test.com/product',
        imageUrl: 'https://test.com/image.jpg',
        specifications: [],
        resonanceScore: 0.8,
        resonanceMetrics: {
          harmony: 0.8,
          impact: 0.7,
          sustainability: 0.9,
          innovation: 0.6,
          localRelevance: 0.7,
        },
      };

      mockCache.get.mockResolvedValue(null);
      mockRetry.execute.mockResolvedValue([mockProduct]);

      const products = await awinService.searchProducts(searchPattern);
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual(mockProduct);
    });
  });

  describe('connect to Awin API', () => {
    it('should connect to Awin API', async () => {
      try {
        const pattern: DemandPattern = {
          query: 'test',
          context: {
            priceRange: {
              min: 0,
              max: 100,
            },
          },
        };
        const products = await awinService.searchProducts(pattern);
        expect(products).toBeDefined();
        console.log('Successfully connected to Awin');
        console.log(`Found ${products.length} products`);
      } catch (error) {
        console.error('Failed to connect to Awin:', error);
        throw error;
      }
    });
  });
});
