import { IntelligenceEnhancer } from '../intelligenceEnhancer';
import { AwinProduct } from '../../types/product';
import { DemandPattern } from '../../types/demand';
import { configService } from '../../config/configService';

jest.mock('../../config/configService');
jest.mock('openai');

describe('IntelligenceEnhancer', () => {
  let enhancer: IntelligenceEnhancer;

  const mockProduct: AwinProduct = {
    id: '123',
    name: 'Test Product',
    title: 'Test Product Title',
    description: 'A test product description',
    price: 99.99,
    currency: 'USD',
    merchant: 'Test Merchant',
    category: 'Test Category',
    categories: ['Test Category'],
    url: 'https://test.com/product',
    imageUrl: 'https://test.com/image.jpg',
  };

  const mockPattern: DemandPattern = {
    id: 'pattern123',
    timeframe: '2024-Q1',
    intensity: 0.8,
    confidence: 0.8,
    coherence: 0.75,
    keywords: ['test', 'product'],
    signals: {
      social: 0.7,
      search: 0.8,
      market: 0.6,
    },
    temporalFactors: {
      seasonality: 0.6,
      trend: 0.7,
      volatility: 0.4,
    },
    spatialFactors: {
      geographic: 0.5,
      demographic: 0.6,
      psychographic: 0.7,
    },
    context: {
      marketTrends: ['trend1', 'trend2'],
      competitiveLandscape: ['competitor1', 'competitor2'],
      consumerBehavior: ['behavior1', 'behavior2'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getOpenAIKey as jest.Mock).mockReturnValue('test-api-key');
    enhancer = new IntelligenceEnhancer();
  });

  describe('enhanceProductUnderstanding', () => {
    it('should return product insights', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: 'Enhanced Category',
                features: ['feature1', 'feature2'],
                targetAudience: ['audience1', 'audience2'],
                pricePoint: 'premium',
              }),
            },
          },
        ],
      };

      (enhancer as any).openai.chat.completions.create.mockResolvedValue(mockResponse);

      const insights = await enhancer.enhanceProductUnderstanding(mockProduct);

      expect(insights).toEqual({
        category: 'Enhanced Category',
        features: ['feature1', 'feature2'],
        targetAudience: ['audience1', 'audience2'],
        pricePoint: 'premium',
      });
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      };

      (enhancer as any).openai.chat.completions.create.mockResolvedValue(mockResponse);

      const insights = await enhancer.enhanceProductUnderstanding(mockProduct);

      expect(insights).toEqual({
        category: '',
        features: [],
        targetAudience: [],
        pricePoint: '',
      });
    });
  });

  describe('analyzeDemandContext', () => {
    it('should return demand context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                marketTrends: ['trend1', 'trend2'],
                competitiveLandscape: ['comp1', 'comp2'],
                consumerBehavior: ['behavior1', 'behavior2'],
              }),
            },
          },
        ],
      };

      (enhancer as any).openai.chat.completions.create.mockResolvedValue(mockResponse);

      const context = await enhancer.analyzeDemandContext(mockPattern);

      expect(context).toEqual({
        marketTrends: ['trend1', 'trend2'],
        competitiveLandscape: ['comp1', 'comp2'],
        consumerBehavior: ['behavior1', 'behavior2'],
      });
    });
  });

  describe('calculateContextualResonance', () => {
    it('should calculate resonance score', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                resonanceFactors: {
                  temporal: 0.8,
                  content: 0.7,
                  interaction: 0.9,
                },
                keywords: ['relevant', 'matching'],
              }),
            },
          },
        ],
      };

      (enhancer as any).openai.chat.completions.create.mockResolvedValue(mockResponse);

      const resonance = await enhancer.calculateContextualResonance(mockProduct, mockPattern);

      expect(resonance).toBeCloseTo(0.8);
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      };

      (enhancer as any).openai.chat.completions.create.mockResolvedValue(mockResponse);

      const resonance = await enhancer.calculateContextualResonance(mockProduct, mockPattern);

      expect(resonance).toBe(0);
    });
  });
});
