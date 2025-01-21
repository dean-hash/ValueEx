import { MarketplaceConnector } from '../../../services/connectors/implementations/marketplaceConnector';
import { MarketData, ProductData, PriceData } from '../../../types/marketTypes';

describe('MarketplaceConnector', () => {
  let connector: MarketplaceConnector;

  beforeEach(() => {
    connector = new MarketplaceConnector({
      amazonEndpoint: 'http://localhost:3000/amazon',
      ebayEndpoint: 'http://localhost:3000/ebay',
    });
  });

  describe('fetchMarketData', () => {
    it('should fetch market data successfully', async () => {
      const mockMarketData: MarketData = {
        category: 'electronics',
        totalProducts: 100,
        averagePrice: 299.99,
        metadata: {
          trendingProducts: [
            {
              id: '123',
              name: 'Test Product',
              price: 199.99,
              salesRank: 1,
            },
          ],
          timestamp: new Date().toISOString(),
          status: 'success',
        },
      };

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMarketData),
        })
      );

      const result = await connector.fetchMarketData('electronics');
      expect(result).toEqual(mockMarketData);
    });
  });

  describe('fetchProductData', () => {
    it('should fetch product data successfully', async () => {
      const mockProductData: ProductData = {
        id: '123',
        name: 'Test Product',
        price: 199.99,
        metadata: {
          description: 'A test product',
          salesRank: 1,
          reviewCount: 10,
          averageRating: 4.5,
          timestamp: new Date().toISOString(),
          status: 'success',
        },
      };

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProductData),
        })
      );

      const result = await connector.fetchProductData('123');
      expect(result).toEqual(mockProductData);
    });
  });

  describe('fetchPriceHistory', () => {
    it('should fetch price history successfully', async () => {
      const mockPriceHistory: PriceData[] = [
        {
          timestamp: new Date().toISOString(),
          price: 199.99,
          metadata: {
            available: true,
            productId: '123',
          },
        },
      ];

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPriceHistory),
        })
      );

      const result = await connector.fetchPriceHistory('123');
      expect(result).toEqual(mockPriceHistory);
    });
  });

  describe('getAmazonCategoryData', () => {
    it('should return formatted data points', async () => {
      const mockMarketData: MarketData = {
        category: 'electronics',
        totalProducts: 100,
        averagePrice: 299.99,
        metadata: {
          trendingProducts: [
            {
              id: '123',
              name: 'Test Product',
              price: 199.99,
              salesRank: 1,
            },
          ],
          timestamp: new Date().toISOString(),
          status: 'success',
        },
      };

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMarketData),
        })
      );

      const result = await connector.getAmazonCategoryData('electronics');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        metadata: {
          category: 'electronics',
          totalProducts: 100,
          averagePrice: 299.99,
        },
        source: 'amazon',
        type: 'category_demand',
      });
      expect(result[0].value).toBeDefined();
      expect(result[0].confidence).toBeDefined();
      expect(result[0].timestamp).toBeDefined();
    });
  });

  describe('getEbayListings', () => {
    it('should return formatted data points', async () => {
      const mockListings = [
        {
          id: '123',
          title: 'Test Product',
          price: 199.99,
        },
      ];

      global.fetch = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockListings),
        })
      );

      const result = await connector.getEbayListings('electronics');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        metadata: {
          itemCount: 1,
          averagePrice: 199.99,
          category: 'electronics',
        },
        source: 'ebay',
        type: 'category_demand',
      });
      expect(result[0].value).toBeDefined();
      expect(result[0].confidence).toBeDefined();
      expect(result[0].timestamp).toBeDefined();
    });
  });
});
