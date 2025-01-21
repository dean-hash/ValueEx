import { describe, test, expect } from '@jest/globals';
import { AwinService } from '../../services/awinService';
import { IntelligenceEnhancer } from '../../services/intelligenceEnhancer';
import { configService } from '../../config/configService';
import { ResonanceFieldService } from '../../services/resonanceField';
import { Logger } from '../../logger/logger';
import { DemandPattern } from '../../types/demandTypes';

describe('Product Recommendation Pipeline Integration', () => {
  let awinService: AwinService;
  let intelligenceEnhancer: IntelligenceEnhancer;
  let resonanceField: ResonanceFieldService;
  let logger: Logger;
  let testPattern: DemandPattern;

  beforeAll(() => {
    resonanceField = new ResonanceFieldService();
    logger = Logger.getInstance();
    awinService = new AwinService(configService, resonanceField, logger);
    intelligenceEnhancer = IntelligenceEnhancer.getInstance();
  });

  beforeEach(() => {
    testPattern = {
      id: 'test-pattern',
      signals: [],
      confidence: 0.8,
      coherence: 0.7,
      temporalFactors: {
        trend: 0.8,
        seasonality: 0.5,
        volatility: 0.3,
      },
      spatialFactors: {
        geographic: ['US', 'UK'],
        demographic: ['18-35'],
        psychographic: ['tech-savvy'],
      },
      context: {
        market: 'test-market',
        category: 'test-category',
        priceRange: { min: 0, max: 100 },
        intent: 'purchase',
        topics: ['test'],
        keywords: ['test'],
        sentiment: 0.8,
        urgency: 0.7,
        matches: [],
        marketTrends: ['trend1'],
        userPreferences: ['pref1'],
        competitiveAnalysis: {
          competitors: [],
          marketShare: 0,
        },
      },
    };
  });

  describe('End-to-end recommendation flow', () => {
    it('should find and enhance products based on demand pattern', async () => {
      // Step 1: Get products from Awin (mock) service
      const products = await awinService.searchProducts(testPattern);
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);

      // Step 2: Enhance product understanding
      const enhancedProducts = await Promise.all(
        products.map(async (product) => {
          const insights = await intelligenceEnhancer.enhanceProductUnderstanding(product);
          return {
            ...product,
            insights,
          };
        })
      );

      expect(enhancedProducts).toBeDefined();
      expect(enhancedProducts.length).toBe(products.length);
      enhancedProducts.forEach((product) => {
        expect(product.insights).toBeDefined();
        expect(product.insights.category).toBeDefined();
        expect(product.insights.features).toBeDefined();
      });

      // Step 3: Calculate resonance for each product
      const resonanceScores = await Promise.all(
        enhancedProducts.map(async (product) => {
          const score = await intelligenceEnhancer.calculateContextualResonance(
            product,
            testPattern
          );
          return {
            productId: product.id,
            score,
          };
        })
      );

      expect(resonanceScores).toBeDefined();
      resonanceScores.forEach((score) => {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(1);
      });

      // Step 4: Verify pattern enhancement
      const enhancedPattern = await intelligenceEnhancer.enhanceDemandPattern(testPattern);
      expect(enhancedPattern).toBeDefined();
      expect(enhancedPattern.context.marketTrends.length).toBeGreaterThanOrEqual(
        testPattern.context.marketTrends.length
      );
    }, 30000); // Allow 30 seconds for the full pipeline

    it('should handle empty product results gracefully', async () => {
      const emptyPattern: DemandPattern = {
        ...testPattern,
        category: 'NonexistentCategory',
        context: {
          ...testPattern.context,
          marketTrends: ['nonexistent'],
        },
      };

      const products = await awinService.searchProducts(emptyPattern);
      expect(products).toBeDefined();
      expect(products).toHaveLength(0);

      const enhancedPattern = await intelligenceEnhancer.enhanceDemandPattern(emptyPattern);
      expect(enhancedPattern).toBeDefined();
      expect(enhancedPattern.context.marketTrends).toBeDefined();
    });

    it('should maintain data consistency across the pipeline', async () => {
      const products = await awinService.searchProducts(testPattern);
      const firstProduct = products[0];

      if (firstProduct) {
        // Test data consistency through enhancement
        const insights = await intelligenceEnhancer.enhanceProductUnderstanding(firstProduct);
        expect(insights.category).toBeDefined();
        expect(typeof insights.category).toBe('string');

        // Test resonance calculation consistency
        const resonance = await intelligenceEnhancer.calculateContextualResonance(
          firstProduct,
          testPattern
        );
        expect(typeof resonance).toBe('number');
        expect(resonance).toBeGreaterThanOrEqual(0);
        expect(resonance).toBeLessThanOrEqual(1);
      }
    });

    it('should enhance demand patterns', async () => {
      const enhancer = new IntelligenceEnhancer();
      const enhancedPattern = await enhancer.enhanceDemandContext(testPattern);
      expect(enhancedPattern).toBeDefined();
      expect(enhancedPattern.context.marketTrends.length).toBeGreaterThanOrEqual(
        testPattern.context.marketTrends.length
      );
    });
  });
});
