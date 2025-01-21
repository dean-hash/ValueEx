import { AwinService } from '../awinService';
import { ConfigService } from '../../config/configService';
import { AwinCache } from '../../cache/awinCache';
import { RetryStrategy } from '../../utils/retryStrategy';
import { CacheAnalytics } from '../../analytics/cacheAnalytics';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AwinService', () => {
  let awinService: AwinService;
  let configService: jest.Mocked<ConfigService>;
  let cache: jest.Mocked<AwinCache>;
  let retryStrategy: jest.Mocked<RetryStrategy>;
  let analytics: jest.Mocked<CacheAnalytics>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    } as any;

    cache = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    retryStrategy = {
      execute: jest.fn((fn) => fn()),
    } as any;

    analytics = {
      recordHit: jest.fn(),
      recordMiss: jest.fn(),
    } as any;

    awinService = new AwinService(configService, cache, retryStrategy, analytics);
  });

  describe('getMerchantRecommendations', () => {
    const mockMerchants = [
      {
        id: '1',
        name: 'US Merchant',
        isActive: true,
        regions: ['2'], // US region
        commissionRate: 8,
        primaryCategory: 'Electronics'
      },
      {
        id: '2',
        name: 'UK Merchant',
        isActive: true,
        regions: ['1'], // UK region
        commissionRate: 10,
        primaryCategory: 'Fashion'
      },
      {
        id: '3',
        name: 'Low Commission US',
        isActive: true,
        regions: ['2'],
        commissionRate: 3,
        primaryCategory: 'Books'
      }
    ];

    it('should filter and rank US merchants correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockMerchants });
      mockedAxios.get.mockResolvedValue({ data: { products: [] } }); // For getTopProducts calls

      const result = await awinService.getMerchantRecommendations('test-domain.com');

      expect(result.length).toBeLessThanOrEqual(10);
      expect(result[0].merchantId).toBe('1'); // Should be the US merchant
      expect(result.some(m => m.merchantId === '2')).toBe(false); // UK merchant should be filtered out
      expect(result.some(m => m.merchantId === '3')).toBe(false); // Low commission merchant should be filtered out
    });

    it('should cache merchant recommendations', async () => {
      const cachedResult = [{ merchantId: '1', name: 'Cached Merchant' }];
      cache.get.mockResolvedValueOnce(cachedResult);

      const result = await awinService.getMerchantRecommendations('test-domain.com');

      expect(result).toBe(cachedResult);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('searchProducts', () => {
    it('should include US region and minimum commission in search params', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { products: [] } });

      await awinService.searchProducts({ query: 'test' });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            region: '2',
            merchantCountry: 'US',
            minCommissionRate: '5'
          })
        })
      );
    });
  });
});
