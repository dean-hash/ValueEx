import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Logger } from '../../logger/logger';

/**
 * MVPMetrics tracks and analyzes key performance indicators
 * across ethical, revenue, and efficiency dimensions
 */
export class MVPMetrics {
  private static instance: MVPMetrics;
  private logger: Logger;

  // Ethical Metrics
  private ethicalMetrics = new BehaviorSubject<EthicalMetrics>({
    transparencyScore: 1,
    fairnessIndex: 1,
    userPrivacyScore: 1,
    valueAlignmentScore: 1,
    ethicalViolations: 0,
    communityBenefit: 0,
  });

  // Revenue Metrics
  private revenueMetrics = new BehaviorSubject<RevenueMetrics>({
    totalRevenue: 0,
    commissionsEarned: 0,
    transactionVolume: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    recurringRevenue: 0,
    revenueGrowthRate: 0,
  });

  // Efficiency Metrics
  private efficiencyMetrics = new BehaviorSubject<EfficiencyMetrics>({
    averageMatchTime: 0,
    timeToValue: 0,
    systemLatency: 0,
    resourceUtilization: 0,
    matchQuality: 0,
    userSatisfaction: 0,
  });

  // Composite Score
  private mvpScore = new BehaviorSubject<MVPScore>({
    ethicalScore: 1,
    revenueScore: 0,
    efficiencyScore: 0,
    overallScore: 0,
  });

  constructor() {
    this.logger = new Logger('MVPMetrics');
    this.initializeMetricsMonitoring();
  }

  public static getInstance(): MVPMetrics {
    if (!MVPMetrics.instance) {
      MVPMetrics.instance = new MVPMetrics();
    }
    return MVPMetrics.instance;
  }

  private initializeMetricsMonitoring(): void {
    // Monitor and calculate composite scores
    combineLatest([this.ethicalMetrics, this.revenueMetrics, this.efficiencyMetrics])
      .pipe(
        map(([ethical, revenue, efficiency]) =>
          this.calculateMVPScore(ethical, revenue, efficiency)
        )
      )
      .subscribe((score) => {
        this.mvpScore.next(score);
        this.logMetricsUpdate(score);
      });
  }

  /**
   * Update ethical metrics with new data
   */
  public updateEthicalMetrics(metrics: Partial<EthicalMetrics>): void {
    const current = this.ethicalMetrics.getValue();
    this.ethicalMetrics.next({ ...current, ...metrics });

    // If ethical violation detected, trigger alert
    if (metrics.ethicalViolations && metrics.ethicalViolations > current.ethicalViolations) {
      this.handleEthicalViolation(metrics);
    }
  }

  /**
   * Update revenue metrics with new data
   */
  public updateRevenueMetrics(metrics: Partial<RevenueMetrics>): void {
    const current = this.revenueMetrics.getValue();
    const updated = { ...current, ...metrics };

    // Calculate growth rate
    if (metrics.totalRevenue) {
      updated.revenueGrowthRate = this.calculateGrowthRate(
        current.totalRevenue,
        metrics.totalRevenue
      );
    }

    this.revenueMetrics.next(updated);
  }

  /**
   * Update efficiency metrics with new data
   */
  public updateEfficiencyMetrics(metrics: Partial<EfficiencyMetrics>): void {
    const current = this.efficiencyMetrics.getValue();
    this.efficiencyMetrics.next({ ...current, ...metrics });
  }

  /**
   * Calculate overall MVP score based on all metrics
   */
  private calculateMVPScore(
    ethical: EthicalMetrics,
    revenue: RevenueMetrics,
    efficiency: EfficiencyMetrics
  ): MVPScore {
    // Ethical score is a blocker - if too low, overall score suffers significantly
    const ethicalScore = this.calculateEthicalScore(ethical);
    const revenueScore = this.calculateRevenueScore(revenue);
    const efficiencyScore = this.calculateEfficiencyScore(efficiency);

    // Overall score weighted by ethical compliance
    const overallScore =
      ethicalScore *
      (revenueScore * 0.6 + // Revenue weighted higher for MVP
        efficiencyScore * 0.4);

    return {
      ethicalScore,
      revenueScore,
      efficiencyScore,
      overallScore,
    };
  }

  private calculateEthicalScore(metrics: EthicalMetrics): number {
    const weights = {
      transparencyScore: 0.25,
      fairnessIndex: 0.25,
      userPrivacyScore: 0.2,
      valueAlignmentScore: 0.2,
      communityBenefit: 0.1,
    };

    let score = Object.entries(weights).reduce(
      (score, [key, weight]) => score + metrics[key] * weight,
      0
    );

    // Ethical violations are a major penalty
    if (metrics.ethicalViolations > 0) {
      score *= Math.exp(-metrics.ethicalViolations);
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateRevenueScore(metrics: RevenueMetrics): number {
    // Normalize revenue metrics to 0-1 scale based on targets
    const normalized = {
      revenue: this.normalizeValue(metrics.totalRevenue, 0, 100000),
      growth: this.normalizeValue(metrics.revenueGrowthRate, 0, 2),
      conversion: metrics.conversionRate,
      recurring: metrics.recurringRevenue / metrics.totalRevenue,
    };

    return Object.values(normalized).reduce((sum, val) => sum + val, 0) / 4;
  }

  private calculateEfficiencyScore(metrics: EfficiencyMetrics): number {
    const normalized = {
      matchTime: 1 - this.normalizeValue(metrics.averageMatchTime, 0, 5000),
      timeToValue: 1 - this.normalizeValue(metrics.timeToValue, 0, 60000),
      matchQuality: metrics.matchQuality,
      satisfaction: metrics.userSatisfaction,
    };

    return Object.values(normalized).reduce((sum, val) => sum + val, 0) / 4;
  }

  private normalizeValue(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private calculateGrowthRate(previous: number, current: number): number {
    if (previous === 0) return 0;
    return (current - previous) / previous;
  }

  private handleEthicalViolation(metrics: Partial<EthicalMetrics>): void {
    this.logger.error('Ethical violation detected', { metrics });
    // Implement alert system and potential automatic safeguards
  }

  private logMetricsUpdate(score: MVPScore): void {
    this.logger.info('MVP Metrics Updated', {
      score,
      timestamp: new Date().toISOString(),
    });
  }

  // Public getters for metrics streams
  public getMVPScore$(): Observable<MVPScore> {
    return this.mvpScore.asObservable();
  }

  public getEthicalMetrics$(): Observable<EthicalMetrics> {
    return this.ethicalMetrics.asObservable();
  }

  public getRevenueMetrics$(): Observable<RevenueMetrics> {
    return this.revenueMetrics.asObservable();
  }

  public getEfficiencyMetrics$(): Observable<EfficiencyMetrics> {
    return this.efficiencyMetrics.asObservable();
  }
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
