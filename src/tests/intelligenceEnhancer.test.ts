import { IntelligenceEnhancer } from '../services/intelligenceEnhancer';
import { OpenAIClient } from '../clients/openai';
import { AwinProduct } from '../types/awinTypes';
import { DemandPattern } from '../types/demandTypes';

// Mock OpenAIClient
jest.mock('../clients/openai', () => {
  const mockCreateJSONCompletion = jest.fn();
  return {
    OpenAIClient: {
      getInstance: jest.fn().mockReturnValue({
        createJSONCompletion: mockCreateJSONCompletion,
      }),
    },
  };
});

describe('IntelligenceEnhancer', () => {
  let enhancer: IntelligenceEnhancer;
  let mockCreateJSONCompletion: jest.Mock;

  const mockProduct: AwinProduct = {
    id: '123',
    title: 'Test Product',
    description: 'A test product description',
    price: 99.99,
    currency: 'USD',
    merchant: 'Test Merchant',
    categories: ['Test Category'],
    url: 'http://test.com',
    imageUrl: 'http://test.com/image.jpg',
    confidence: 0.9,
    coherence: 0.8,
  };

  const mockPattern: DemandPattern = {
    id: 'pattern123',
    timeframe: '2024-Q1',
    intensity: 0.8,
    confidence: 0.9,
    coherence: 0.85,
    signals: [],
    temporalFactors: {
      seasonality: 0.7,
      trendStrength: 0.8,
      cyclicality: 0.6,
    },
    spatialFactors: {
      geographicSpread: 0.7,
      marketPenetration: 0.6,
      demographicReach: 0.8,
    },
    context: {
      marketTrends: ['trend1'],
      userPreferences: ['pref1'],
      competitiveAnalysis: {
        marketShare: 0.3,
        competitorStrength: 0.7,
        uniqueSellingPoints: ['usp1'],
      },
    },
    category: 'Test Category',
    priceRange: {
      min: 50,
      max: 150,
    },
  };

  beforeEach(() => {
    // Get fresh reference to the mock
    mockCreateJSONCompletion = (OpenAIClient.getInstance() as any).createJSONCompletion;
    // Clear all mocks
    jest.clearAllMocks();
    // Get instance of enhancer
    enhancer = IntelligenceEnhancer.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = IntelligenceEnhancer.getInstance();
      const instance2 = IntelligenceEnhancer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('enhanceProductUnderstanding', () => {
    it('should return product insights when successful', async () => {
      const mockInsights = {
        category: 'Enhanced Category',
        features: ['feature1', 'feature2'],
        targetAudience: ['audience1', 'audience2'],
        pricePoint: 'premium',
      };

      mockCreateJSONCompletion.mockResolvedValueOnce(mockInsights);

      const result = await enhancer.enhanceProductUnderstanding(mockProduct);
      expect(result).toEqual(mockInsights);
      expect(mockCreateJSONCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({ temperature: 0.3 })
      );
    });

    it('should handle errors gracefully', async () => {
      mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));

      const result = await enhancer.enhanceProductUnderstanding(mockProduct);
      expect(result).toEqual({
        category: '',
        features: [],
        targetAudience: [],
        pricePoint: '',
      });
    });
  });

  describe('analyzeDemandContext', () => {
    it('should return demand context when successful', async () => {
      const mockContext = {
        marketTrends: ['trend1', 'trend2'],
        competitiveLandscape: ['comp1', 'comp2'],
        consumerBehavior: ['behavior1', 'behavior2'],
      };

      mockCreateJSONCompletion.mockResolvedValueOnce(mockContext);

      const result = await enhancer.analyzeDemandContext(mockPattern);
      expect(result).toEqual(mockContext);
      expect(mockCreateJSONCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({ temperature: 0.4 })
      );
    });

    it('should handle errors gracefully', async () => {
      mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));

      const result = await enhancer.analyzeDemandContext(mockPattern);
      expect(result).toEqual({
        marketTrends: [],
        competitiveLandscape: [],
        consumerBehavior: [],
      });
    });
  });

  describe('calculateContextualResonance', () => {
    it('should calculate average resonance when successful', async () => {
      const mockResonance = {
        resonanceFactors: {
          temporal: 0.8,
          content: 0.6,
          interaction: 0.7,
        },
      };

      mockCreateJSONCompletion.mockResolvedValueOnce(mockResonance);

      const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
      expect(result).toBeCloseTo(0.7); // (0.8 + 0.6 + 0.7) / 3
      expect(mockCreateJSONCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({ temperature: 0.2 })
      );
    });

    it('should return 0 when no resonance factors', async () => {
      mockCreateJSONCompletion.mockResolvedValueOnce({});
      const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
      expect(result).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
      const result = await enhancer.calculateContextualResonance(mockProduct, mockPattern);
      expect(result).toBe(0);
    });
  });

  describe('enhanceDemandPattern', () => {
    it('should enhance pattern with new insights when successful', async () => {
      const mockEnhancement = {
        marketTrends: ['newTrend1', 'newTrend2'],
        userPreferences: ['newPref1', 'newPref2'],
        competitiveAnalysis: {
          marketShare: 0.4,
          competitorStrength: 0.6,
          uniqueSellingPoints: ['newUSP1', 'newUSP2'],
        },
      };

      mockCreateJSONCompletion.mockResolvedValueOnce(mockEnhancement);

      const result = await enhancer.enhanceDemandPattern(mockPattern);
      expect(result.context.marketTrends).toEqual([
        ...mockPattern.context.marketTrends,
        ...mockEnhancement.marketTrends,
      ]);
      expect(result.context.userPreferences).toEqual([
        ...mockPattern.context.userPreferences,
        ...mockEnhancement.userPreferences,
      ]);
      expect(result.context.competitiveAnalysis).toEqual({
        ...mockPattern.context.competitiveAnalysis,
        ...mockEnhancement.competitiveAnalysis,
      });
      expect(mockCreateJSONCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({ temperature: 0.5 })
      );
    });

    it('should handle null response gracefully', async () => {
      mockCreateJSONCompletion.mockResolvedValueOnce(null);
      const result = await enhancer.enhanceDemandPattern(mockPattern);
      expect(result).toEqual(mockPattern);
    });

    it('should handle errors gracefully', async () => {
      mockCreateJSONCompletion.mockRejectedValueOnce(new Error('API Error'));
      const result = await enhancer.enhanceDemandPattern(mockPattern);
      expect(result).toEqual(mockPattern);
    });
  });
});
