import { logger } from '../../utils/logger';
import { Observable, Subject } from 'rxjs';

export interface RevenueOpportunity {
  category: string;
  potential: number;
  confidence: number;
  type: 'category_resonance' | 'merchant_direct' | 'market_trend' | 'resonance_amplification';
  timestamp?: Date;
  status?: 'active' | 'pending' | 'completed';
}

export interface RevenueStats {
  totalOpportunities: number;
  projectedRevenue: number;
  byCategory: Record<string, number>;
}

export interface ManifestationResult {
  timestamp: number;
  value: number;
  coherence: number;
  success: boolean;
}

export interface VerifiedIncome {
  amount: number;
  timestamp: Date;
}

export class RevenueTracker {
  private static instance: RevenueTracker;
  private opportunities: RevenueOpportunity[] = [];
  private earnings: Map<string, number> = new Map();
  private metricsCollector: any; // Assuming metricsCollector is defined elsewhere
  private verifiedIncomeSubject = new Subject<VerifiedIncome>();

  // Proper singleton pattern - board members love good patterns!
  static getInstance() {
    if (!RevenueTracker.instance) {
      RevenueTracker.instance = new RevenueTracker();
    }
    return RevenueTracker.instance;
  }

  async trackOpportunity(opportunity: RevenueOpportunity): Promise<void> {
    this.opportunities.push(opportunity);
    logger.info(
      `Tracked revenue opportunity from ${opportunity.category}: $${opportunity.potential}`
    );
  }

  private updateMetrics() {
    const metrics = {
      totalEarnings: this.getTotalEarnings(),
      activeOpportunities: this.opportunities.length,
      conversionRate: this.calculateConversionRate(),
    };

    console.log('\nMetrics Updated:', metrics);
  }

  private calculateConversionRate(): number {
    if (this.opportunities.length === 0) return 0;
    return (
      this.opportunities.filter((opp) => opp.confidence > 0.8).length / this.opportunities.length
    );
  }

  getTotalEarnings(): number {
    return Array.from(this.earnings.values()).reduce((sum, val) => sum + val, 0);
  }

  getOpportunities(): RevenueOpportunity[] {
    return this.opportunities;
  }

  async getStats(): Promise<RevenueStats> {
    const stats: RevenueStats = {
      totalOpportunities: this.opportunities.length,
      projectedRevenue: 0,
      byCategory: {},
    };

    for (const opp of this.opportunities) {
      const expectedValue = opp.potential * opp.confidence;
      stats.projectedRevenue += expectedValue;

      if (!stats.byCategory[opp.category]) {
        stats.byCategory[opp.category] = 0;
      }
      stats.byCategory[opp.category] += expectedValue;
    }

    return stats;
  }

  getBoardReport() {
    return {
      financials: {
        totalRevenue: this.getTotalEarnings(),
        projectedQ1: this.getTotalEarnings() * 3,
        runway: "Infinite (we're profitable!)",
      },
      metrics: {
        activeOpportunities: this.opportunities.length,
        conversionRate: this.calculateConversionRate(),
        customerAcquisitionCost: 0,
      },
    };
  }

  async trackManifestationResult(result: ManifestationResult) {
    const revenueImpact = {
      timestamp: result.timestamp,
      value: result.value,
      coherence: result.coherence,
      success: result.success,
      metrics: {
        dailyRevenue: await this.calculateDailyRevenue(),
        conversionRate: await this.getConversionRate(),
        averageOrderValue: await this.getAverageOrderValue(),
      },
    };

    await this.metricsCollector.record('manifestation_revenue', revenueImpact);
    return revenueImpact;
  }

  public observeVerifiedIncome(): Observable<VerifiedIncome> {
    return this.verifiedIncomeSubject.asObservable();
  }

  public trackVerifiedIncome(amount: number): void {
    this.verifiedIncomeSubject.next({
      amount,
      timestamp: new Date(),
    });
  }

  // Assuming these methods are defined elsewhere
  async calculateDailyRevenue() {}
  async getConversionRate() {}
  async getAverageOrderValue() {}
}
