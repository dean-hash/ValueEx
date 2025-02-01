import { DemandSignal } from '../types';
import { EventEmitter } from 'events';
interface BehaviorData {
  searches: string[];
  viewedItems: string[];
  interactions?: Array<{
    type: string;
    item: string;
    duration: number;
    timestamp: number;
  }>;
  context?: {
    location?: string;
    device?: string;
    timeOfDay?: string;
    previousActions?: string[];
  };
}
export declare class DemandInference extends EventEmitter {
  private readonly confidenceThreshold;
  private readonly minKeywords;
  private readonly maxSignals;
  private readonly tokenizer;
  private readonly tfidf;
  private readonly classifier;
  constructor();
  private initializeClassifier;
  inferFromBehavior(data: BehaviorData): Promise<DemandSignal[]>;
  private analyzeSearchPatterns;
  private analyzeViewingPatterns;
  private analyzeInteractions;
  private extractRelevantKeywords;
  private categorizeKeywords;
  private calculateConfidence;
  private calculateInteractionConfidence;
  private calculateInteractionUrgency;
  private calculateUrgency;
  private analyzeSentiment;
  private createEmptyInference;
  private convertToSignals;
  private calculateTfIdfScore;
  consolidateSignals(signals: DemandSignal[]): Promise<DemandSignal[]>;
  private mergeSignals;
}
export {};
