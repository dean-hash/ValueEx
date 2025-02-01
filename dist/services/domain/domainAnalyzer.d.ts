interface DomainAnalysis {
  domain: string;
  seoValue: number;
  marketDemand: number;
  affiliateFit: number;
  keywords: string[];
  tld: string;
  length: number;
}
export declare class DomainAnalyzer {
  private static instance;
  private cachedAnalyses;
  constructor();
  static getInstance(): DomainAnalyzer;
  analyzeDomain(domain: string): Promise<DomainAnalysis>;
  private calculateSEOValue;
  private calculateMarketDemand;
  private calculateAffiliateFit;
  private extractKeywords;
  private calculateMemorabilityScore;
}
export {};
