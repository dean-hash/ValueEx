// Base Types
export interface PricePoint {
  value: number;
  currency: string;
  context: string;
  confidence: number;
  sensitivity: number; // How price-sensitive is this demand
  elasticity: number; // How demand changes with price
  fairValue: number; // What they consider fair value
}

export interface MarketTrends {
  trend: string;
  impact: number;
  confidence: number;
}

export interface UserPreferences {
  preference: string;
  weight: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CompetitiveAnalysis {
  competitors: string[];
  marketShare: number;
  pricePoints: PriceRange[];
  strengths: string[];
  weaknesses: string[];
}

export interface DemandContext {
  market?: string;
  category?: string;
  priceRange?: PriceRange;
  intent?: string;
  topics?: string[];
  keywords?: string[];
  sentiment?: number;
  urgency?: number;
  matches?: string[];
  marketTrends?: MarketTrends[];
  userPreferences?: UserPreferences[];
  competitiveAnalysis?: CompetitiveAnalysis;
  spatialFactors?: {
    geographic: string[];
    demographic?: string[];
    psychographic?: string[];
  };
  valueFactors?: {
    priceSensitivity: number;
    willingnessToPay: number;
    valuePerception: number;
    budgetConstraints?: number;
  };
}

export interface ResonanceFactors {
  temporal: number;
  content: number;
  interaction: number;
}

export interface DemandPattern {
  query: string;
  strength?: number;
  category?: string;
  keywords?: string[];
  intent?: string;
  priceRange?: PriceRange;
  spatialFactors?: {
    location: string;
    radius: number;
  };
  marketTrends?: MarketTrends[];
  userPreferences?: UserPreferences[];
  competitiveAnalysis?: CompetitiveAnalysis;
}

export interface DemandSignal {
  id: string;
  timestamp: number;
  source: string;
  pattern: DemandPattern;
  context?: {
    market?: string;
    category?: string;
    keywords?: string[];
    intent?: string;
    spatialFactors?: {
      geographic?: string[];
      temporal?: string[];
    };
  };
  resonanceScore?: number;
  resonanceMetrics?: {
    harmony?: number;
    impact?: number;
    sustainability?: number;
    innovation?: number;
    localRelevance?: number;
  };
  strength: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ContextualSignal {
  pattern: DemandPattern;
  confidence: number;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ScrapedDemandSignal extends ContextualSignal {
  rawContent: string;
  processedContent: string;
  extractionMethod: string;
}
