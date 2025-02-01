import { EventEmitter } from 'events';
export declare class TrustBasedScaling extends EventEmitter {
  private static instance;
  private trustScores;
  private thresholds;
  private demandSignals;
  private influenceAnalyzer;
  private constructor();
  static getInstance(): TrustBasedScaling;
  private initializeThresholds;
  private setupEventListeners;
  updateTrustScore(userId: string): Promise<void>;
  private initializeMetrics;
  private calculateRelationshipScore;
  private calculatePositiveImpact;
  private calculateConsistencyScore;
  private calculateGrowthRate;
  getIncomeMultiplier(userId: string): number;
  getTrustLevel(userId: string): {
    level: number;
    requirements: string[];
  };
  private getNextLevelRequirements;
}
