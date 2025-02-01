import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
export interface DemandContext {
  keywords: string[];
  relatedCategories?: string[];
  sentiment: number;
  urgency: number;
  matches?: Array<{
    id: string;
    name: string;
    quality: number;
    features?: string[];
    opportunities?: string[];
    recommendations?: string[];
  }>;
  error?: string;
}
export interface DemandRequirements {
  features: string[];
  constraints: {
    budget?: number;
    timeline?: string;
    location?: string;
  };
}
export interface DemandSignal {
  id: string;
  source: string;
  timestamp: number;
  type: 'explicit' | 'implicit' | 'inferred';
  confidence: number;
  context: DemandContext;
  requirements?: DemandRequirements;
  category?: string;
}
export interface IntelligenceProvider {
  name: string;
  type: 'processing' | 'enrichment' | 'validation';
  confidence: number;
  processSignal(signal: DemandSignal): Promise<DemandSignal>;
}
export interface DemandSource {
  name: string;
  type: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getSignals(): Observable<DemandSignal>;
}
export interface SignalProcessor {
  process(signal: DemandSignal): Promise<DemandSignal>;
  addProvider(provider: IntelligenceProvider): void;
  removeProvider(providerName: string): void;
}
export declare class DemandSignalAdapter extends EventEmitter {
  private static instance;
  private marketTrends;
  private recentSignals;
  private predictions;
  private intelligenceProviders;
  private constructor();
  static getInstance(): DemandSignalAdapter;
  private setupPredictionCycle;
  addSignal(signal: DemandSignal): Promise<void>;
  private calculateSignalConfidence;
  private updatePredictions;
  private generatePrediction;
  private calculateSeasonalImpact;
  registerIntelligenceProvider(provider: IntelligenceProvider): void;
  private enrichSignal;
  getPrediction(source: string, timestamp: number): any | null;
  getAllPredictions(): any[];
}
