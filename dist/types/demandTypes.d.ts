export interface PricePoint {
  value: number;
  currency: string;
  context: string;
  confidence: number;
  sensitivity: number;
  elasticity: number;
  fairValue: number;
}
export interface MarketTrends {
  trend: string;
  strength: number;
  direction: 'up' | 'down' | 'stable';
}
export interface UserPreferences {
  preference: string;
  weight: number;
}
export interface PriceRange {
  min: number;
  max: number;
  currency?: string;
}
export interface CompetitiveAnalysis {
  competitors: string[];
  marketShare: number;
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
  category?: string;
  context?: {
    market?: string;
    category?: string;
    keywords?: string[];
    intent?: string;
    priceRange?: PriceRange;
    spatialFactors?: {
      geographic?: string[];
      temporal?: string[];
    };
    marketTrends?: MarketTrends[];
    userPreferences?: UserPreferences[];
    competitiveAnalysis?: CompetitiveAnalysis;
  };
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
