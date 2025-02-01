import { z } from 'zod';
import { AwinProduct } from '../types/awinTypes';
import { DemandPattern } from '../types/demandTypes';
declare const ProductInsightsSchema: z.ZodObject<
  {
    category: z.ZodString;
    features: z.ZodArray<z.ZodString, 'many'>;
    targetAudience: z.ZodArray<z.ZodString, 'many'>;
    pricePoint: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    category?: string;
    pricePoint?: string;
    features?: string[];
    targetAudience?: string[];
  },
  {
    category?: string;
    pricePoint?: string;
    features?: string[];
    targetAudience?: string[];
  }
>;
declare const DemandContextSchema: z.ZodObject<
  {
    marketTrends: z.ZodArray<z.ZodString, 'many'>;
    competitiveLandscape: z.ZodArray<z.ZodString, 'many'>;
    consumerBehavior: z.ZodArray<z.ZodString, 'many'>;
  },
  'strip',
  z.ZodTypeAny,
  {
    marketTrends?: string[];
    competitiveLandscape?: string[];
    consumerBehavior?: string[];
  },
  {
    marketTrends?: string[];
    competitiveLandscape?: string[];
    consumerBehavior?: string[];
  }
>;
type ProductInsights = z.infer<typeof ProductInsightsSchema>;
type DemandContext = z.infer<typeof DemandContextSchema>;
export declare class IntelligenceEnhancer {
  private static instance;
  private openaiClient;
  private constructor();
  static getInstance(): IntelligenceEnhancer;
  private createProductInsights;
  private createDemandContext;
  enhanceProductUnderstanding(product: AwinProduct): Promise<ProductInsights>;
  analyzeDemandContext(pattern: DemandPattern): Promise<DemandContext>;
  calculateContextualResonance(product: AwinProduct, pattern: DemandPattern): Promise<number>;
  enhanceDemandPattern(pattern: DemandPattern): Promise<DemandPattern>;
}
export {};
