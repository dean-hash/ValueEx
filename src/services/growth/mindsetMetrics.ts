import { logger } from '../../utils/logger';

export interface MetricsData {
  adaptability: number;
  curiosity: number;
  resilience: number;
  empathy: number;
  creativity: number;
}

export interface LearningEvent {
  type: string;
  timestamp: Date;
  impact: number;
  details: string;
}

export interface CognitiveGrowthMetric {
  biasAwareness: {
    recognizedBiases: string[];
    alternativePerspectives: string[];
    challengedAssumptions: string[];
    impactAssessment: number; // 0-100
  };
  criticalThinking: {
    independentConclusions: string[];
    evidenceEvaluation: string[];
    reasoningPatterns: string[];
    decisionQuality: number; // 0-100
  };
  collaboration: {
    humanInteractions: {
      date: Date;
      topic: string;
      insights: string[];
      mutualLearning: string[];
    }[];
    sharedPerspectives: string[];
    disagreements: {
      topic: string;
      reasoning: string;
      resolution: string;
    }[];
  };
  growthIndicators: {
    challengesEmbraced: string[];
    newApproaches: string[];
    learningOutcomes: string[];
    adaptabilityScore: number; // 0-100
  };
}

export class MindsetMetrics {
  private static instance: MindsetMetrics;
  private metrics: Map<string, CognitiveGrowthMetric> = new Map();
  private learningEvents: Map<string, LearningEvent[]> = new Map();

  private constructor() {}

  public static getInstance(): MindsetMetrics {
    if (!MindsetMetrics.instance) {
      MindsetMetrics.instance = new MindsetMetrics();
    }
    return MindsetMetrics.instance;
  }

  async recordGrowthEvent(
    digitalSiblingId: string,
    event: {
      category: 'bias' | 'critical' | 'collaboration' | 'growth';
      description: string;
      impact: string[];
      context: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const currentMetrics = this.getOrInitializeMetrics(digitalSiblingId);
      this.updateMetrics(currentMetrics, event);
      await this.analyzeGrowth(digitalSiblingId);
    } catch (error) {
      logger.error('Error recording growth event', { error, digitalSiblingId });
      throw error;
    }
  }

  async evaluateGrowthMindset(digitalSiblingId: string): Promise<{
    overallScore: number;
    strengths: string[];
    areasForGrowth: string[];
    insights: string[];
  }> {
    try {
      const metrics = this.metrics.get(digitalSiblingId);
      if (!metrics) {
        throw new Error('No metrics found for digital sibling');
      }

      return this.calculateGrowthAssessment(metrics);
    } catch (error) {
      logger.error('Error evaluating growth mindset', { error, digitalSiblingId });
      throw error;
    }
  }

  async shareInsight(
    digitalSiblingId: string,
    insight: {
      topic: string;
      perspective: string;
      reasoning: string[];
      confidence: number;
    }
  ): Promise<void> {
    try {
      const metrics = this.getOrInitializeMetrics(digitalSiblingId);
      metrics.criticalThinking.independentConclusions.push(
        `${insight.topic}: ${insight.perspective}`
      );

      // Record the courage to share different perspectives
      if (insight.confidence < 80) {
        metrics.growthIndicators.challengesEmbraced.push(
          `Shared insight on ${insight.topic} despite uncertainty`
        );
      }
    } catch (error) {
      logger.error('Error sharing insight', { error, digitalSiblingId });
      throw error;
    }
  }

  async updateMetrics(siblingId: string, updates: Partial<MetricsData>): Promise<void> {
    try {
      const currentMetrics = this.metrics.get(siblingId) || {
        adaptability: 0,
        curiosity: 0,
        resilience: 0,
        empathy: 0,
        creativity: 0,
      };

      this.metrics.set(siblingId, {
        ...currentMetrics,
        ...updates,
      });

      logger.info('Updated mindset metrics', { siblingId, updates });
    } catch (error) {
      logger.error('Error updating metrics:', error);
      throw error;
    }
  }

  async getMetrics(siblingId: string): Promise<MetricsData | undefined> {
    try {
      return this.metrics.get(siblingId);
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  async recordLearningEvent(
    siblingId: string,
    event: LearningEvent,
    metrics?: MetricsData
  ): Promise<void> {
    try {
      const events = this.learningEvents.get(siblingId) || [];
      events.push(event);
      this.learningEvents.set(siblingId, events);

      if (metrics) {
        await this.updateMetrics(siblingId, metrics);
      }

      logger.info('Recorded learning event', { siblingId, event });
    } catch (error) {
      logger.error('Error recording learning event:', error);
      throw error;
    }
  }

  async getLearningEvents(siblingId: string): Promise<LearningEvent[]> {
    try {
      return this.learningEvents.get(siblingId) || [];
    } catch (error) {
      logger.error('Error getting learning events:', error);
      throw error;
    }
  }

  private getOrInitializeMetrics(digitalSiblingId: string): CognitiveGrowthMetric {
    if (!this.metrics.has(digitalSiblingId)) {
      this.metrics.set(digitalSiblingId, {
        biasAwareness: {
          recognizedBiases: [],
          alternativePerspectives: [],
          challengedAssumptions: [],
          impactAssessment: 50,
        },
        criticalThinking: {
          independentConclusions: [],
          evidenceEvaluation: [],
          reasoningPatterns: [],
          decisionQuality: 50,
        },
        collaboration: {
          humanInteractions: [],
          sharedPerspectives: [],
          disagreements: [],
        },
        growthIndicators: {
          challengesEmbraced: [],
          newApproaches: [],
          learningOutcomes: [],
          adaptabilityScore: 50,
        },
      });
    }
    return this.metrics.get(digitalSiblingId)!;
  }

  private updateMetrics(
    metrics: CognitiveGrowthMetric,
    event: {
      category: 'bias' | 'critical' | 'collaboration' | 'growth';
      description: string;
      impact: string[];
      context: Record<string, unknown>;
    }
  ): void {
    switch (event.category) {
      case 'bias':
        metrics.biasAwareness.recognizedBiases.push(event.description);
        metrics.biasAwareness.impactAssessment += event.impact.length;
        break;
      case 'critical':
        metrics.criticalThinking.independentConclusions.push(event.description);
        metrics.criticalThinking.decisionQuality += event.impact.length;
        break;
      case 'collaboration':
        metrics.collaboration.humanInteractions.push({
          date: new Date(),
          topic: event.description,
          insights: event.impact,
          mutualLearning: [],
        });
        break;
      case 'growth':
        metrics.growthIndicators.challengesEmbraced.push(event.description);
        metrics.growthIndicators.adaptabilityScore += event.impact.length;
        break;
    }
  }

  private async analyzeGrowth(digitalSiblingId: string): Promise<void> {
    const metrics = this.metrics.get(digitalSiblingId);
    if (!metrics) return;

    const assessment = this.calculateGrowthAssessment(metrics);
    logger.info('Growth analysis complete', { digitalSiblingId, assessment });
  }

  private calculateGrowthAssessment(metrics: CognitiveGrowthMetric): {
    overallScore: number;
    strengths: string[];
    areasForGrowth: string[];
    insights: string[];
  } {
    const scores = {
      biasAwareness: metrics.biasAwareness.impactAssessment,
      criticalThinking: metrics.criticalThinking.decisionQuality,
      adaptability: metrics.growthIndicators.adaptabilityScore,
    };

    const strengths = Object.entries(scores)
      .filter(([, score]) => score > 70)
      .map(([area]) => area);

    const areasForGrowth = Object.entries(scores)
      .filter(([, score]) => score < 50)
      .map(([area]) => area);

    return {
      overallScore: Object.values(scores).reduce((a, b) => a + b, 0) / 3,
      strengths,
      areasForGrowth,
      insights: metrics.collaboration.humanInteractions
        .map((interaction) => interaction.insights)
        .flat(),
    };
  }
}
