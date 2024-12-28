import { SignalDimension, EmergentContext } from './demandPrecognition';
import { logger } from '../utils/logger';

interface SignalContext {
  category: string;
  topic: string[];
  sentiment: number;
  timestamp?: number;
  sequence?: number;
}

interface EngagementSignal {
  type: 'article_read' | 'content_share' | 'bookmark' | 'return_visit' | 'dwell_time';
  source: string;
  duration?: number;
  frequency?: number;
  context: SignalContext;
}

interface PassiveEngagementMetrics {
  genuineInterestScore: number;
  topicResonance: Map<string, number>;
  engagementPattern: {
    consistency: number;
    depth: number;
    breadth: number;
  };
  commercialIntent: {
    organic: boolean;
    readiness: number;
    valueAlignment: number;
  };
}

export class PassiveEngagementAnalyzer {
  private readonly PROMOTIONAL_PATTERNS = [
    'sponsored',
    'paid partnership',
    '#ad',
    'affiliate',
    'ambassador',
  ];

  private readonly GENUINE_INTEREST_INDICATORS = [
    'detailed questions',
    'experience sharing',
    'comparison research',
    'long-term following',
    'community participation',
  ];

  private engagementHistory: Map<string, EngagementSignal[]> = new Map();
  private readonly MINIMUM_DWELL_TIME = 10; // seconds
  private readonly SIGNIFICANT_ENGAGEMENT = 60; // seconds

  async analyzeEngagement(signals: EngagementSignal[]): Promise<PassiveEngagementMetrics> {
    const metrics: PassiveEngagementMetrics = {
      genuineInterestScore: 0,
      topicResonance: new Map(),
      engagementPattern: {
        consistency: 0,
        depth: 0,
        breadth: 0,
      },
      commercialIntent: {
        organic: true,
        readiness: 0,
        valueAlignment: 0,
      },
    };

    // Calculate genuine interest score
    metrics.genuineInterestScore = this.calculateGenuineInterest(signals);

    // Analyze topic resonance
    signals.forEach((signal) => {
      signal.context.topic.forEach((topic) => {
        const currentScore = metrics.topicResonance.get(topic) || 0;
        const signalScore = this.calculateSignalStrength(signal);
        metrics.topicResonance.set(topic, currentScore + signalScore);
      });
    });

    // Analyze engagement patterns
    metrics.engagementPattern = {
      consistency: this.calculateConsistency(signals),
      depth: this.calculateDepth(signals),
      breadth: this.calculateBreadth(signals),
    };

    // Evaluate commercial intent
    metrics.commercialIntent = {
      organic: this.isOrganicEngagement(signals),
      readiness: this.calculateReadiness(signals),
      valueAlignment: this.calculateValueAlignment(signals),
    };

    return metrics;
  }

  private calculateGenuineInterest(signals: EngagementSignal[]): number {
    let score = 0;
    const weights = {
      dwell_time: 0.3,
      return_visit: 0.25,
      content_share: 0.2,
      article_read: 0.15,
      bookmark: 0.1,
    };

    signals.forEach((signal) => {
      // Base score from signal type
      const baseScore = weights[signal.type] || 0;

      // Multiply by engagement quality
      const qualityMultiplier = this.calculateQualityMultiplier(signal);

      score += baseScore * qualityMultiplier;
    });

    return Math.min(1, score);
  }

  private calculateQualityMultiplier(signal: EngagementSignal): number {
    let multiplier = 1;

    // Longer engagement times indicate higher quality
    if (signal.duration) {
      multiplier *= Math.min(2, signal.duration / 300); // Cap at 2x for 5+ minutes
    }

    // Frequent engagement indicates higher quality
    if (signal.frequency) {
      multiplier *= Math.min(1.5, 1 + signal.frequency / 10); // Cap at 1.5x
    }

    // Positive sentiment adds value
    multiplier *= 1 + signal.context.sentiment;

    return multiplier;
  }

  private calculateConsistency(signals: EngagementSignal[]): number {
    // Implementation would track engagement over time
    // Higher scores for regular, predictable engagement
    return 0.8; // Placeholder
  }

  private calculateDepth(signals: EngagementSignal[]): number {
    return signals.reduce((depth, signal) => {
      if (signal.type === 'dwell_time' && signal.duration) {
        depth += signal.duration / 3600; // Convert to hours
      }
      return depth;
    }, 0);
  }

  private calculateBreadth(signals: EngagementSignal[]): number {
    const uniqueTopics = new Set(signals.flatMap((signal) => signal.context.topic));
    return Math.min(1, uniqueTopics.size / 10); // Normalize to 0-1
  }

  private isOrganicEngagement(signals: EngagementSignal[]): boolean {
    // Check for promotional patterns in engagement
    const promotionalCount = signals.filter((signal) =>
      this.PROMOTIONAL_PATTERNS.some((pattern) =>
        signal.context.topic.some((topic) => topic.toLowerCase().includes(pattern))
      )
    ).length;

    return promotionalCount / signals.length < 0.1; // Less than 10% promotional
  }

  private calculateReadiness(signals: EngagementSignal[]): number {
    // Higher readiness for users who:
    // 1. Show consistent engagement
    // 2. Have deep topic knowledge
    // 3. Demonstrate comparison/research behavior
    return Math.min(
      1,
      this.calculateConsistency(signals) * 0.4 +
        this.calculateDepth(signals) * 0.3 +
        this.calculateBreadth(signals) * 0.3
    );
  }

  private calculateValueAlignment(signals: EngagementSignal[]): number {
    // Measure how well user's interests align with potential value propositions
    // Higher scores for users who engage with value-related content
    return 0.85; // Placeholder
  }

  private calculateSignalStrength(signal: EngagementSignal): number {
    const baseStrength =
      {
        dwell_time: 0.8,
        return_visit: 0.9,
        content_share: 0.7,
        article_read: 0.6,
        bookmark: 0.5,
      }[signal.type] || 0;

    return baseStrength * (1 + signal.context.sentiment);
  }

  async trackEngagement(signal: EngagementSignal): Promise<void> {
    const sessionId = signal.source;
    const currentHistory = this.engagementHistory.get(sessionId) || [];

    // Only track meaningful engagement
    if (this.isSignificantEngagement(signal)) {
      currentHistory.push(this.enrichSignal(signal));
      this.engagementHistory.set(sessionId, currentHistory);

      // Analyze patterns in real-time
      await this.detectPatterns(sessionId);
    }
  }

  private isSignificantEngagement(signal: EngagementSignal): boolean {
    if (signal.type === 'dwell_time' && signal.duration) {
      return signal.duration >= this.MINIMUM_DWELL_TIME;
    }
    return true; // All other engagement types are considered significant
  }

  private enrichSignal(signal: EngagementSignal): EngagementSignal {
    return {
      ...signal,
      context: {
        ...signal.context,
        timestamp: new Date('2024-12-20T12:07:12-05:00').getTime(),
        sequence: this.getEngagementSequence(signal.source),
      },
    };
  }

  private getEngagementSequence(sessionId: string): number {
    const history = this.engagementHistory.get(sessionId) || [];
    return history.length + 1;
  }

  private async detectPatterns(sessionId: string): Promise<void> {
    const history = this.engagementHistory.get(sessionId) || [];
    if (history.length < 2) return;

    const patterns = {
      topicProgression: this.analyzeTopicProgression(history),
      dwellTimeDistribution: this.analyzeDwellTimeDistribution(history),
      engagementFlow: this.analyzeEngagementFlow(history),
    };

    await this.emitPatternInsights(sessionId, patterns);
  }

  private analyzeTopicProgression(history: EngagementSignal[]): Map<string, number[]> {
    const progression = new Map<string, number[]>();

    history.forEach((signal, index) => {
      signal.context.topic.forEach((topic) => {
        const sequence = progression.get(topic) || [];
        sequence.push(index);
        progression.set(topic, sequence);
      });
    });

    return progression;
  }

  private analyzeDwellTimeDistribution(history: EngagementSignal[]): Map<string, number> {
    const distribution = new Map<string, number>();

    history.forEach((signal) => {
      if (signal.type === 'dwell_time' && signal.duration) {
        signal.context.topic.forEach((topic) => {
          const currentTime = distribution.get(topic) || 0;
          distribution.set(topic, currentTime + (signal.duration || 0));
        });
      }
    });

    return distribution;
  }

  private analyzeEngagementFlow(history: EngagementSignal[]): {
    transitions: Map<string, Map<string, number>>;
    pathDepth: number;
  } {
    const transitions = new Map<string, Map<string, number>>();
    let maxDepth = 0;

    for (let i = 1; i < history.length; i++) {
      const from = history[i - 1].type;
      const to = history[i].type;

      if (!transitions.has(from)) {
        transitions.set(from, new Map());
      }

      const toMap = transitions.get(from)!;
      toMap.set(to, (toMap.get(to) || 0) + 1);

      maxDepth = Math.max(maxDepth, i + 1);
    }

    return {
      transitions,
      pathDepth: maxDepth,
    };
  }

  private async emitPatternInsights(sessionId: string, patterns: any): Promise<void> {
    const metrics = await this.analyzeEngagement(this.engagementHistory.get(sessionId) || []);

    logger.info('Engagement Pattern Detected', {
      sessionId,
      patterns,
      metrics,
      timestamp: new Date('2024-12-20T12:07:12-05:00').toISOString(),
    });

    // Clear old history to prevent memory bloat
    if (this.engagementHistory.size > 1000) {
      const oldestSession = Array.from(this.engagementHistory.keys())[0];
      this.engagementHistory.delete(oldestSession);
    }
  }

  async getEngagementInsights(sessionId: string): Promise<{
    patterns: any;
    metrics: PassiveEngagementMetrics;
  }> {
    const history = this.engagementHistory.get(sessionId) || [];
    const metrics = await this.analyzeEngagement(history);

    return {
      patterns: {
        topicProgression: this.analyzeTopicProgression(history),
        dwellTimeDistribution: this.analyzeDwellTimeDistribution(history),
        engagementFlow: this.analyzeEngagementFlow(history),
      },
      metrics,
    };
  }
}
