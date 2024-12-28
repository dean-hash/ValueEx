export interface ResonanceVector {
  direction: number[];
  magnitude: number;
  type: string;
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
  trend?: number;
  volatility?: number;
}

export interface DemandSignal {
  type: string;
  strength: number;
  context?: {
    source: string;
    timestamp: string;
    reliability: number;
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
