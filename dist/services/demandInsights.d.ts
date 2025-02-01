import { Observable } from 'rxjs';
interface DemandSignal {
  source: 'email' | 'search' | 'social' | 'direct';
  intent: string;
  context: {
    urgency: number;
    specificity: number;
    valueConstraints?: {
      budget?: number;
      timeframe?: string;
    };
  };
  timestamp: Date;
  confidence: number;
  sentiment?: {
    score: number;
  };
  topics?: string[];
  cluster?: string;
}
interface ContextualSignal extends DemandSignal {
  contextualConfidence: number;
  relatedSignals: Array<{
    signal: DemandSignal;
    relationship: number;
  }>;
}
export declare class DemandInsights {
  private emailSignals;
  private publicSignals;
  private directSignals;
  private allSignals;
  private patterns;
  private enhancer;
  private metrics;
  constructor();
  private updatePatterns;
  getEmergingPatterns(): Observable<
    Array<{
      topic: string;
      signals: ContextualSignal[];
      averageConfidence: number;
      relationshipStrength: number;
    }>
  >;
  private calculatePatternStrength;
  processEmailInsight(intent: string, context: any, preservePrivacy?: boolean): Promise<void>;
  private sanitizeIntent;
  private sanitizeContext;
  private recursiveSanitize;
  private calculateUrgency;
  private calculateSpecificity;
  private extractValueConstraints;
}
export {};
