import { logger } from '../../utils/logger';

interface OpportunityAnalysis {
  type: string;
  data: any;
}

export class QuickWinAnalyzer {
  private static instance: QuickWinAnalyzer;

  private constructor() {}

  static getInstance(): QuickWinAnalyzer {
    if (!QuickWinAnalyzer.instance) {
      QuickWinAnalyzer.instance = new QuickWinAnalyzer();
    }
    return QuickWinAnalyzer.instance;
  }

  async analyzeOpportunity(analysis: OpportunityAnalysis): Promise<number> {
    try {
      const scores = await Promise.all([
        this.calculateRevenueScore(analysis),
        this.calculateEffortScore(analysis),
        this.calculateUrgencyScore(analysis),
      ]);

      // Weight and combine scores
      const weights = [0.4, 0.3, 0.3]; // Revenue, Effort, Urgency
      const weightedScore = scores.reduce((acc, score, i) => acc + score * weights[i], 0);

      logger.info('Quick win analysis complete', {
        analysis,
        scores,
        weightedScore,
      });

      return weightedScore;
    } catch (error) {
      logger.error('Error analyzing quick win opportunity:', error);
      return 0;
    }
  }

  private async calculateRevenueScore(analysis: OpportunityAnalysis): Promise<number> {
    if (analysis.type === 'affiliate') {
      const { expectedCommission } = analysis.data;
      // Score based on expected commission
      if (expectedCommission >= 150) return 1;
      if (expectedCommission >= 100) return 0.8;
      if (expectedCommission >= 50) return 0.6;
      if (expectedCommission >= 30) return 0.4;
      return 0.2;
    }

    return 0.5; // Default score for unknown types
  }

  private async calculateEffortScore(analysis: OpportunityAnalysis): Promise<number> {
    if (analysis.type === 'affiliate') {
      // Affiliate opportunities are generally low effort
      return 0.8;
    }

    return 0.5; // Default score for unknown types
  }

  private async calculateUrgencyScore(analysis: OpportunityAnalysis): Promise<number> {
    if (analysis.type === 'affiliate') {
      // Check if it's a time-sensitive offer
      const { timestamp } = analysis.data;
      const age = Date.now() - new Date(timestamp).getTime();
      const hoursSinceCreation = age / (1000 * 60 * 60);

      // Newer opportunities are more urgent
      if (hoursSinceCreation <= 1) return 1;
      if (hoursSinceCreation <= 4) return 0.8;
      if (hoursSinceCreation <= 12) return 0.6;
      if (hoursSinceCreation <= 24) return 0.4;
      return 0.2;
    }

    return 0.5; // Default score for unknown types
  }
}
