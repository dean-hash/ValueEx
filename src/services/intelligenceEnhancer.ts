import { OpenAIClient } from '../clients/openai';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AwinProduct } from '../types/awinTypes';
import { DemandPattern } from '../types/demandTypes';

const ProductInsightsSchema = z.object({
  category: z.string(),
  features: z.array(z.string()),
  targetAudience: z.array(z.string()),
  pricePoint: z.string(),
});

const DemandContextSchema = z.object({
  marketTrends: z.array(z.string()),
  competitiveLandscape: z.array(z.string()),
  consumerBehavior: z.array(z.string()),
});

const ResonanceFactorsSchema = z.object({
  temporal: z.number(),
  content: z.number(),
  interaction: z.number(),
});

const GPTResponseSchema = z.object({
  resonanceFactors: ResonanceFactorsSchema.optional(),
  keywords: z.array(z.string()).optional(),
});

type ProductInsights = z.infer<typeof ProductInsightsSchema>;
type DemandContext = z.infer<typeof DemandContextSchema>;
type GPTResponse = z.infer<typeof GPTResponseSchema>;

export class IntelligenceEnhancer {
  private static instance: IntelligenceEnhancer;
  private openaiClient: OpenAIClient;

  private constructor() {
    this.openaiClient = OpenAIClient.getInstance();
  }

  public static getInstance(): IntelligenceEnhancer {
    if (!IntelligenceEnhancer.instance) {
      IntelligenceEnhancer.instance = new IntelligenceEnhancer();
    }
    return IntelligenceEnhancer.instance;
  }

  private createProductInsights(data: ProductInsights | undefined): ProductInsights {
    return (
      data || {
        category: '',
        features: [],
        targetAudience: [],
        pricePoint: '',
      }
    );
  }

  private createDemandContext(data: DemandContext | undefined): DemandContext {
    return (
      data || {
        marketTrends: [],
        competitiveLandscape: [],
        consumerBehavior: [],
      }
    );
  }

  async enhanceProductUnderstanding(product: AwinProduct): Promise<ProductInsights> {
    try {
      const response = await this.openaiClient.createJSONCompletion<ProductInsights>(
        [
          {
            role: 'system',
            content:
              'You are a product analyst. Analyze the product and provide insights in JSON format.',
          },
          {
            role: 'user',
            content: `Analyze this product: ${JSON.stringify(product)}`,
          },
        ],
        {
          temperature: 0.3, // Lower temperature for more consistent analysis
        }
      );

      return this.createProductInsights(response || undefined);
    } catch (error) {
      logger.error('Error enhancing product understanding:', error as Error);
      return this.createProductInsights(undefined);
    }
  }

  async analyzeDemandContext(pattern: DemandPattern): Promise<DemandContext> {
    try {
      const response = await this.openaiClient.createJSONCompletion<DemandContext>(
        [
          {
            role: 'system',
            content:
              'You are a market analyst. Analyze the demand pattern and provide context in JSON format.',
          },
          {
            role: 'user',
            content: `Analyze this demand pattern: ${JSON.stringify(pattern)}`,
          },
        ],
        {
          temperature: 0.4, // Balanced between creativity and consistency
        }
      );

      return this.createDemandContext(response || undefined);
    } catch (error) {
      logger.error('Error analyzing demand context:', error as Error);
      return this.createDemandContext(undefined);
    }
  }

  async calculateContextualResonance(
    product: AwinProduct,
    pattern: DemandPattern
  ): Promise<number> {
    try {
      const response = await this.openaiClient.createJSONCompletion<{
        resonanceFactors: {
          temporal: number;
          content: number;
          interaction: number;
        };
      }>(
        [
          {
            role: 'system',
            content:
              'You are a resonance analyst. Calculate the contextual resonance between product and demand pattern.',
          },
          {
            role: 'user',
            content: `Calculate resonance between:\nProduct: ${JSON.stringify(product)}\nPattern: ${JSON.stringify(pattern)}`,
          },
        ],
        {
          temperature: 0.2, // Lower temperature for more consistent scoring
        }
      );

      if (response?.resonanceFactors) {
        const { temporal, content, interaction } = response.resonanceFactors;
        return (temporal + content + interaction) / 3;
      }

      return 0;
    } catch (error) {
      logger.error('Error calculating contextual resonance:', error as Error);
      return 0;
    }
  }

  async enhanceDemandPattern(pattern: DemandPattern): Promise<DemandPattern> {
    try {
      const response = await this.openaiClient.createJSONCompletion<{
        marketTrends: string[];
        userPreferences: string[];
        competitiveAnalysis: {
          marketShare: number;
          competitorStrength: number;
          uniqueSellingPoints: string[];
        };
      }>(
        [
          {
            role: 'system',
            content:
              'You are a demand pattern analyst. Enhance the given pattern with additional context and insights.',
          },
          {
            role: 'user',
            content: `Enhance this pattern: ${JSON.stringify(pattern)}`,
          },
        ],
        {
          temperature: 0.5, // Balance between consistency and creativity
        }
      );

      if (!response) {
        return pattern;
      }

      return {
        ...pattern,
        context: {
          marketTrends: [...pattern.context.marketTrends, ...response.marketTrends],
          userPreferences: [...pattern.context.userPreferences, ...response.userPreferences],
          competitiveAnalysis: {
            ...pattern.context.competitiveAnalysis,
            ...response.competitiveAnalysis,
          },
        },
      };
    } catch (error) {
      logger.error('Error enhancing demand pattern:', error as Error);
      return pattern;
    }
  }
}
