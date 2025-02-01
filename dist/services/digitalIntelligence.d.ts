import { MarketVertical } from '../types/marketTypes';
interface AccuracyMetrics {
  confidence: number;
  signalStrength: number;
  dataPoints: number;
}
interface NeedSignal {
  type: 'market' | 'demand' | 'urgency';
  strength: number;
  source: string;
  timestamp: Date;
  metadata: {
    intent?: string;
    urgencyLevel?: number;
    pricePoint?: number;
    drivers?: string[];
    barriers?: string[];
    demandType?: string;
    targetDemographic?: string[];
    competitiveIntensity?: number;
    timeframe?: string;
    vertical?: MarketVertical;
  };
}
interface DemandSignal {
  id: string;
  query: string;
  source: string;
  insights: {
    keywords?: string[];
    context?: string;
    urgency: number;
    intent?: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };
}
interface MVPProduct {
  id: string;
  name: string;
  description: string;
  features?: string[];
  price: number;
  merchantRating?: number;
}
export declare class DigitalIntelligence {
  private readonly model;
  private readonly confidenceThreshold;
  constructor();
  analyzeNeed(
    category: string,
    verticalId?: string
  ): Promise<{
    isGenuineNeed: boolean;
    accuracy: AccuracyMetrics;
    signals: NeedSignal[];
    recommendedActions: string[];
    vertical?: MarketVertical;
  }>;
  validateDemandAuthenticity(signal: DemandSignal): Promise<boolean>;
  findMatchingProducts(signal: DemandSignal): Promise<MVPProduct[]>;
  private analyzeSignalContext;
  private buildAuthenticityPrompt;
  private parseAuthenticityAnalysis;
  private extractScore;
  private searchProductDatabase;
  private rankByValueAlignment;
  private calculateValueAlignment;
  private analyzeNeedAlignment;
  private analyzePriceAlignment;
  private analyzeMerchantTrust;
  private identifyVertical;
  private transformInsightsToSignals;
  private calculateAccuracy;
  private validateNeed;
  private getRecommendedActions;
}
export declare const digitalIntelligence: DigitalIntelligence;
export {};
