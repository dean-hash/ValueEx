import { MarketVertical } from '../marketTypes';

export interface DemandSignal {
  id: string;
  query: string;
  source: string;
  strength: number;
  vertical: MarketVertical;
  insights: DemandInsights;
  context: DemandContext;
}

export interface DemandInsights {
  keywords: string[];
  context: string;
  urgency: number;
  intent: string;
  confidence: number;

  valueEvidence: {
    authenticityMarkers: string[];
    realWorldImpact: string[];
    practicalUtility: string[];
  };

  demographics: string[];
  priceRange: {
    min: number;
    max: number;
  };

  demandPatterns: {
    frequency: number;
    consistency: number;
    evidence: string[];
  };
}

export interface DemandContext {
  authenticityScore: number;
  manipulationIndicators: string[];
  realWorldContext: string[];
  confidence: number;
  valueValidation: {
    evidenceStrength: number;
    practicalApplication: string[];
    sustainableValue: boolean;
  };
}

export interface MatchScore {
  score: number;
  factors: {
    marketFit: number;
    priceAlignment: number;
    demographicMatch: number;
    urgencyFactor: number;
    verticalAlignment: number;
    valueCreation: number;
  };
}

export interface DemandValidation {
  isValid: boolean;
  confidence: number;
  issues?: string[];
  strength?: number;
}
