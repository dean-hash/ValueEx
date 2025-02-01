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
export declare class PassiveEngagementAnalyzer {
  private readonly PROMOTIONAL_PATTERNS;
  private readonly GENUINE_INTEREST_INDICATORS;
  private engagementHistory;
  private readonly MINIMUM_DWELL_TIME;
  private readonly SIGNIFICANT_ENGAGEMENT;
  analyzeEngagement(signals: EngagementSignal[]): Promise<PassiveEngagementMetrics>;
  private calculateGenuineInterest;
  private calculateQualityMultiplier;
  private calculateConsistency;
  private calculateDepth;
  private calculateBreadth;
  private isOrganicEngagement;
  private calculateReadiness;
  private calculateValueAlignment;
  private calculateSignalStrength;
  trackEngagement(signal: EngagementSignal): Promise<void>;
  private isSignificantEngagement;
  private enrichSignal;
  private getEngagementSequence;
  private detectPatterns;
  private analyzeTopicProgression;
  private analyzeDwellTimeDistribution;
  private analyzeEngagementFlow;
  private emitPatternInsights;
  getEngagementInsights(sessionId: string): Promise<{
    patterns: any;
    metrics: PassiveEngagementMetrics;
  }>;
}
export {};
