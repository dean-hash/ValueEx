import { EventEmitter } from 'events';
import { DemandSignalAdapter } from '../analysis/adapters/demandSignalAdapter';
import { InfluenceAnalyzer } from '../analysis/influenceAnalyzer';

interface TrustMetrics {
  relationshipScore: number;
  positiveImpact: number;
  consistencyScore: number;
  growthRate: number;
  lastUpdate: Date;
}

interface TrustThreshold {
  level: number;
  minimumScore: number;
  incomeMultiplier: number;
  requirements: string[];
}

export class TrustBasedScaling extends EventEmitter {
  private static instance: TrustBasedScaling;
  private trustScores: Map<string, TrustMetrics> = new Map();
  private thresholds: TrustThreshold[];
  private demandSignals: DemandSignalAdapter;
  private influenceAnalyzer: InfluenceAnalyzer;

  private constructor() {
    super();
    this.demandSignals = DemandSignalAdapter.getInstance();
    this.influenceAnalyzer = InfluenceAnalyzer.getInstance();
    this.initializeThresholds();
    this.setupEventListeners();
  }

  static getInstance(): TrustBasedScaling {
    if (!TrustBasedScaling.instance) {
      TrustBasedScaling.instance = new TrustBasedScaling();
    }
    return TrustBasedScaling.instance;
  }

  private initializeThresholds() {
    this.thresholds = [
      {
        level: 1,
        minimumScore: 0,
        incomeMultiplier: 1,
        requirements: ['Initial interaction', 'Basic profile completion'],
      },
      {
        level: 2,
        minimumScore: 50,
        incomeMultiplier: 1.5,
        requirements: ['Consistent positive interactions', 'Demonstrated understanding'],
      },
      {
        level: 3,
        minimumScore: 75,
        incomeMultiplier: 2,
        requirements: ['High engagement quality', 'Positive impact evidence'],
      },
      {
        level: 4,
        minimumScore: 90,
        incomeMultiplier: 3,
        requirements: ['Exceptional trust level', 'Sustained positive impact'],
      },
    ];
  }

  private setupEventListeners() {
    // Listen for relevant events that affect trust scores
    this.demandSignals.on('signalProcessed', (signal) => {
      this.updateTrustScore(signal.userId);
    });
  }

  async updateTrustScore(userId: string): Promise<void> {
    const currentMetrics = this.trustScores.get(userId) || this.initializeMetrics();
    const influence = await this.influenceAnalyzer.analyzeUserInfluence(userId);

    const newMetrics = {
      relationshipScore: this.calculateRelationshipScore(currentMetrics, influence),
      positiveImpact: this.calculatePositiveImpact(influence),
      consistencyScore: this.calculateConsistencyScore(currentMetrics, influence),
      growthRate: this.calculateGrowthRate(currentMetrics),
      lastUpdate: new Date(),
    };

    this.trustScores.set(userId, newMetrics);
    this.emit('trustScoreUpdated', { userId, metrics: newMetrics });
  }

  private initializeMetrics(): TrustMetrics {
    return {
      relationshipScore: 0,
      positiveImpact: 0,
      consistencyScore: 0,
      growthRate: 0,
      lastUpdate: new Date(),
    };
  }

  private calculateRelationshipScore(current: TrustMetrics, influence: any): number {
    return Math.min(
      100,
      current.relationshipScore +
        influence.interactionQuality * 0.3 +
        influence.responseRate * 0.2 +
        influence.authenticContent * 0.5
    );
  }

  private calculatePositiveImpact(influence: any): number {
    return Math.min(100, influence.communityBenefit * 0.4 + influence.impactEvidence * 0.6);
  }

  private calculateConsistencyScore(current: TrustMetrics, influence: any): number {
    return Math.min(
      100,
      current.consistencyScore + influence.credibility * 0.4 + influence.transparentDisclosure * 0.6
    );
  }

  private calculateGrowthRate(current: TrustMetrics): number {
    const timeDiff = Date.now() - current.lastUpdate.getTime();
    const daysSinceUpdate = timeDiff / (1000 * 60 * 60 * 24);
    return Math.min(100, current.growthRate + daysSinceUpdate * 0.1);
  }

  getIncomeMultiplier(userId: string): number {
    const metrics = this.trustScores.get(userId);
    if (!metrics) return 1;

    const totalScore =
      metrics.relationshipScore * 0.3 +
      metrics.positiveImpact * 0.3 +
      metrics.consistencyScore * 0.2 +
      metrics.growthRate * 0.2;

    const threshold = this.thresholds
      .slice()
      .reverse()
      .find((t) => totalScore >= t.minimumScore);

    return threshold ? threshold.incomeMultiplier : 1;
  }

  getTrustLevel(userId: string): { level: number; requirements: string[] } {
    const metrics = this.trustScores.get(userId);
    if (!metrics) return { level: 1, requirements: this.thresholds[0].requirements };

    const totalScore =
      metrics.relationshipScore * 0.3 +
      metrics.positiveImpact * 0.3 +
      metrics.consistencyScore * 0.2 +
      metrics.growthRate * 0.2;

    const threshold = this.thresholds
      .slice()
      .reverse()
      .find((t) => totalScore >= t.minimumScore);

    return {
      level: threshold ? threshold.level : 1,
      requirements: this.getNextLevelRequirements(totalScore),
    };
  }

  private getNextLevelRequirements(currentScore: number): string[] {
    const nextThreshold = this.thresholds.find((t) => t.minimumScore > currentScore);
    return nextThreshold ? nextThreshold.requirements : [];
  }
}
