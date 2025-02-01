import { EventEmitter } from 'events';
interface IntelligenceSource {
  id: string;
  type: 'internal' | 'external';
  capabilities: string[];
  accessLevel: 'public' | 'private' | 'restricted';
  metadataOnly: boolean;
}
interface InsightChannel {
  sourceId: string;
  targetId: string;
  type: 'demand' | 'supply' | 'trend' | 'anomaly';
  confidence: number;
  metadata: {
    timestamp: string;
    region?: string;
    category?: string;
    restrictions?: string[];
  };
}
export declare class IntelligenceCoordinator extends EventEmitter {
  private static instance;
  private sources;
  private channels;
  private metrics;
  private analyzer;
  private providers;
  private constructor();
  static getInstance(): IntelligenceCoordinator;
  private setupDefaultSources;
  private initializeProviders;
  registerSource(source: IntelligenceSource): void;
  coordinateInsights(targetId: string, type: InsightChannel['type']): Promise<any>;
  private isCapabilityRelevant;
  private fetchInsight;
  private fetchInternalInsight;
  private fetchExternalInsight;
  private fetchMetadataOnly;
  private processInsight;
  private calculateConfidence;
  private getSourceReliability;
  private assessDataQuality;
  private determineRestrictions;
  private mergeInsights;
  private mergeInsightGroup;
  processSignal(signal: any, type: string): Promise<any>;
  private isProviderRelevant;
  optimizeSystem(): Promise<void>;
}
export {};
