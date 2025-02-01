import { DemandContext } from '../services/analysis/types';
export interface ResonanceVector {
  dimension: string;
  magnitude: number;
  direction: number[];
  type: string;
  strength: number;
  context: string[];
}
export interface ResonanceState {
  vectors: {
    supply: ResonanceVector[];
    demand: ResonanceVector[];
  };
  coherence: number;
  intensity: number;
  confidence: number;
}
export interface SignalStrength {
  social: number;
  search: number;
  market: number;
}
export interface TemporalFactors {
  seasonality: number;
  trendStrength: number;
  cyclicality: number;
  trend: number;
  volatility: number;
}
export interface DemandValidation {
  isValid: boolean;
  confidence: number;
  issues?: string[];
  strength?: number;
}
export interface DemandSignal {
  id: string;
  source: string;
  content: string;
  title: string;
  url: string;
  timestamp: string;
  keyPoints: string[];
  type: 'explicit' | 'implicit' | 'inferred';
  confidence: {
    overall: number;
    factors: {
      textQuality: number;
      communityEngagement: number;
      authorCredibility: number;
      contentRelevance: number;
      temporalRelevance: number;
    };
  };
  context: DemandContext;
  analysis: {
    intent: string;
    topics: string[];
    sentiment: number;
    urgency: number;
  };
  metadata: {
    author: string;
    platform: string;
    category: string;
    engagement: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
  };
  query: string;
  trendMetrics: {
    momentum: number;
    volume: number;
    growth: number;
  };
}
export interface ResonanceMetrics {
  coherence: number;
  intensity: number;
  confidence: number;
}
export interface ResonanceField {
  addSupplyVector(vector: ResonanceVector): void;
  addDemandVector(vector: ResonanceVector): void;
  getResonanceState(): ResonanceState;
  calculateResonance(supply: ResonanceState, demand: ResonanceState): ResonanceMetrics;
}
