interface DomainMetrics {
  domain: string;
  seoValue: number;
  marketDemand: number;
  affiliatePotential: number;
  estimatedValue: number;
  recommendedStrategy: string;
  niche: string;
}
export declare class PortfolioAnalyzer {
  private static instance;
  private field;
  private analyzer;
  private constructor();
  static getInstance(): PortfolioAnalyzer;
  analyzeDomainMetrics(domain: string): Promise<DomainMetrics>;
  private determineStrategy;
  private determineNiche;
  private calculateDomainValue;
  getAffiliateRecommendations(domain: string): Promise<any[]>;
}
export {};
