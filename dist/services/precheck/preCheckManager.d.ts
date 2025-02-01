export interface PreCheckRequirements {
  platform: 'amazon' | 'ebay';
  domain: string;
  contentUrls: string[];
  trafficMetrics?: {
    dailyVisitors?: number;
    monthlyPageviews?: number;
  };
}
export interface PreCheckResult {
  isReady: boolean;
  score: number;
  requirements: {
    [key: string]: {
      passed: boolean;
      score: number;
      recommendation?: string;
    };
  };
  recommendations: string[];
}
export declare class PreCheckManager {
  private static instance;
  private demandScraper;
  private engagementAnalyzer;
  private metricsCollector;
  private platformRequirements;
  private constructor();
  static getInstance(): PreCheckManager;
  validateApplication(requirements: PreCheckRequirements): Promise<PreCheckResult>;
  private validateDomain;
  private validateContent;
  private validateTraffic;
}
