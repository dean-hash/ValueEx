import { Observable } from 'rxjs';
import { DemandSignal } from '../types/demand';
interface EnhancedDemandSignal extends DemandSignal {
  sentiment: {
    score: number;
    magnitude: number;
  };
  topics: string[];
  cluster?: string;
}
interface ContextualSignal extends EnhancedDemandSignal {
  relatedSignals: Array<{
    signal: EnhancedDemandSignal;
    relationship: number;
  }>;
  contextualConfidence: number;
}
export declare class DemandSignalEnhancer {
  private static instance;
  private tokenizer;
  private tfidf;
  private recentSignals;
  private readonly CONTEXT_WINDOW_SIZE;
  private constructor();
  static getInstance(): DemandSignalEnhancer;
  private initializeTopicModels;
  enhanceSignal(signal: DemandSignal): Observable<ContextualSignal>;
  private addSentiment;
  private addTopics;
  private calculateConfidenceBoost;
  private findRelatedSignals;
  private calculateRelationship;
  private calculateContextualConfidence;
  private updateContextWindow;
  private calculateTopicOverlap;
  private calculateTimeProximity;
  clusterSignals(signals: EnhancedDemandSignal[]): Promise<EnhancedDemandSignal[]>;
  private kMeansClustering;
}
export {};
