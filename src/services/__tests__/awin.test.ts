import { ConfigService } from '../../config/configService';
import { AwinService } from '../awinService';
import { AwinCache } from '../../cache/awinCache';
import { RetryStrategy } from '../../utils/retryStrategy';
import { CacheAnalytics } from '../../analytics/cacheAnalytics';
import { DemandPattern } from '../../types/demandTypes';
import { Product } from '../../types/productTypes';

jest.mock('../../config/configService');
jest.mock('../../cache/awinCache');
jest.mock('../../utils/retryStrategy');
jest.mock('../../analytics/cacheAnalytics');

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
    const mockDemandPattern: DemandPattern = {
      query: 'test product',
      category: 'Electronics',
      context: {
        market: 'US',
        category: 'Electronics',
        keywords: ['test', 'product'],
        intent: 'purchase',
        priceRange: {
          min: 0,
          max: 1000,
          currency: 'USD',
        },
      },
    };

    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Test Product 1',
        description: 'A test product',
        price: { amount: 100, currency: 'USD' },
        merchant: {
          id: '1',
          name: 'Test Merchant',
          category: 'Electronics',
        },
        url: 'https://test.com/1',
        imageUrl: 'https://test.com/1.jpg',
        specifications: [],
      },
    ];

    it('should return cached products if available', async () => {
      mockCache.get.mockResolvedValue(mockProducts);

      const result = await awinService.searchProducts(mockDemandPattern);

      expect(result).toEqual(mockProducts);
      expect(mockCache.get).toHaveBeenCalledWith(expect.any(String));
      expect(mockAnalytics.recordHit).toHaveBeenCalled();
    });

    it('should fetch and cache products if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRetry.execute.mockResolvedValue(mockProducts);

      const result = await awinService.searchProducts(mockDemandPattern);

      expect(result).toEqual(mockProducts);
      expect(mockCache.get).toHaveBeenCalledWith(expect.any(String));
      expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), mockProducts);
      expect(mockAnalytics.recordMiss).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRetry.execute.mockRejectedValue(new Error('API Error'));

      await expect(awinService.searchProducts(mockDemandPattern)).rejects.toThrow(
        'Failed to search products: API Error'
      );
    });
  });
});
