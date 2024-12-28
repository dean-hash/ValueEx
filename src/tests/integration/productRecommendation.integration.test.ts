import { AwinService } from '../../services/awinService';
import { IntelligenceEnhancer } from '../../services/intelligenceEnhancer';
import { configService } from '../../config/configService';
import { ResonanceFieldService } from '../../services/resonanceField';
import { Logger } from '../../logger/logger';
import { DemandPattern } from '../../types/demandTypes';
import { AwinProduct } from '../../types/awinTypes';

describe('Product Recommendation Pipeline Integration', () => {
  let awinService: AwinService;
  let intelligenceEnhancer: IntelligenceEnhancer;
  let resonanceField: ResonanceFieldService;
  let logger: Logger;

  beforeAll(() => {
    resonanceField = new ResonanceFieldService();
    logger = Logger.getInstance();
    awinService = new AwinService(configService, resonanceField, logger);
    intelligenceEnhancer = IntelligenceEnhancer.getInstance();
  });

  const testPattern: DemandPattern = {
    id: 'test-pattern-001',
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
      marketTrends: ['sustainable', 'eco-friendly'],
      userPreferences: ['organic'],
      competitiveAnalysis: {
        marketShare: 0.3,
        competitorStrength: 0.7,
        uniqueSellingPoints: ['green'],
      },
    },
    category: 'Sustainable',
    priceRange: {
      min: 20,
      max: 100,
    },
  };

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
  });
});
