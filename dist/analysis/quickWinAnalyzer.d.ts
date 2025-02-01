interface QuickWinMetrics {
  commissionRate: number;
  approvalSpeed: number;
  integrationComplexity: number;
  trafficRequirement: number;
  validationPeriod: number;
}
export declare class QuickWinAnalyzer {
  private awinAccessToken;
  constructor(awinToken: string);
  findFastestRevenueOpportunities(): Promise<
    Array<{
      merchantId: string;
      name: string;
      metrics: QuickWinMetrics;
      estimatedTimeToRevenue: number;
      recommendedAction: string;
    }>
  >;
  private getAwinMerchants;
  private analyzeMerchant;
  private calculateTimeToRevenue;
  private isQuickWinOpportunity;
  private getRecommendedAction;
  generateQuickStartPlan(): Promise<string>;
}
export {};
