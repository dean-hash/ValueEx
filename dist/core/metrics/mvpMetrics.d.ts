import { Observable } from 'rxjs';
/**
 * MVPMetrics tracks and analyzes key performance indicators
 * across ethical, revenue, and efficiency dimensions
 */
export declare class MVPMetrics {
  private static instance;
  private logger;
  private ethicalMetrics;
  private revenueMetrics;
  private efficiencyMetrics;
  private mvpScore;
  constructor();
  static getInstance(): MVPMetrics;
  private initializeMetricsMonitoring;
  /**
   * Update ethical metrics with new data
   */
  updateEthicalMetrics(metrics: Partial<EthicalMetrics>): void;
  /**
   * Update revenue metrics with new data
   */
  updateRevenueMetrics(metrics: Partial<RevenueMetrics>): void;
  /**
   * Update efficiency metrics with new data
   */
  updateEfficiencyMetrics(metrics: Partial<EfficiencyMetrics>): void;
  /**
   * Calculate overall MVP score based on all metrics
   */
  private calculateMVPScore;
  private calculateEthicalScore;
  private calculateRevenueScore;
  private calculateEfficiencyScore;
  private normalizeValue;
  private calculateGrowthRate;
  private handleEthicalViolation;
  private logMetricsUpdate;
  getMVPScore$(): Observable<MVPScore>;
  getEthicalMetrics$(): Observable<EthicalMetrics>;
  getRevenueMetrics$(): Observable<RevenueMetrics>;
  getEfficiencyMetrics$(): Observable<EfficiencyMetrics>;
}
interface EthicalMetrics {
  transparencyScore: number;
  fairnessIndex: number;
  userPrivacyScore: number;
  valueAlignmentScore: number;
  ethicalViolations: number;
  communityBenefit: number;
}
interface RevenueMetrics {
  totalRevenue: number;
  commissionsEarned: number;
  transactionVolume: number;
  averageOrderValue: number;
  conversionRate: number;
  recurringRevenue: number;
  revenueGrowthRate: number;
}
interface EfficiencyMetrics {
  averageMatchTime: number;
  timeToValue: number;
  systemLatency: number;
  resourceUtilization: number;
  matchQuality: number;
  userSatisfaction: number;
}
interface MVPScore {
  ethicalScore: number;
  revenueScore: number;
  efficiencyScore: number;
  overallScore: number;
}
export {};
