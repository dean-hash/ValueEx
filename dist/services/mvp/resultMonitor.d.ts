interface MatchPerformance {
  demandId: string;
  productId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  conversionRate: number;
  lastClick?: Date;
  lastConversion?: Date;
}
export declare class ResultMonitor {
  private static instance;
  private storage;
  private commissionTracker;
  private clicks;
  private conversions;
  private matchPerformance;
  private constructor();
  static getInstance(): ResultMonitor;
  /**
   * Track a click on an affiliate link
   */
  trackClick(
    affiliateLink: string,
    demandId: string,
    productId: string,
    source: string,
    metadata?: {
      userAgent?: string;
      referrer?: string;
    }
  ): string;
  /**
   * Track a conversion from an affiliate link
   */
  trackConversion(clickId: string, orderValue: number, commission: number): void;
  /**
   * Analyze performance and adjust strategies
   */
  private analyzePerformance;
  /**
   * Get performance metrics for a specific match
   */
  getMatchPerformance(demandId: string, productId: string): MatchPerformance | null;
  /**
   * Get overall performance metrics
   */
  getOverallPerformance(): {
    clicks: number;
    conversions: number;
    revenue: number;
    commissions: number;
    conversionRate: number;
    bestPerformers: MatchPerformance[];
  };
}
export {};
