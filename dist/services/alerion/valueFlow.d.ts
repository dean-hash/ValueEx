export declare class ValueFlow {
  private static instance;
  private alerion;
  private domains;
  private resonance;
  private matcher;
  private revenue;
  private constructor();
  static getInstance(): ValueFlow;
  private initializeFlow;
  private selectOptimalPlatform;
  private calculateOptimizedValue;
  private predictTimeline;
  private identifyOptimizations;
  getFlowMetrics(): Promise<{
    activePatterns: number;
    totalRevenue: any;
    pendingOpportunities: any;
    activeDomains: any;
  }>;
}
