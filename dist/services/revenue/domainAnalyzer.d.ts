import { DomainInfo } from '../domain/types';
export interface DomainAnalysis {
  domain: string;
  quickFlipValue: number;
  affiliateValue: number;
  recommendations: string[];
  aiInsights: {
    marketTrends: string;
    valueOptimization: string;
    suggestedPrice?: number;
  };
  metrics: {
    seoValue: number;
    brandValue: number;
    marketDemand: number;
    conversionPotential: number;
  };
}
export declare class DomainAnalyzer {
  private static instance;
  private gemini;
  private constructor();
  static getInstance(): DomainAnalyzer;
  analyzeDomain(domain: DomainInfo): Promise<DomainAnalysis>;
  private extractNiche;
  private extractPriceFromAIInsights;
  private calculateAIValueMultiplier;
  private calculateSEOValue;
  private calculateBrandValue;
  private calculateMarketDemand;
  private calculateConversionPotential;
  private calculateQuickFlipValue;
  private calculateAffiliateValue;
  private generateRecommendations;
}
