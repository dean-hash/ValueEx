export interface PriceRange {
  min: number;
  max: number;
  currency?: string;
}

export interface MarketTrends {
  trend: string;
  strength: number;
  timeframe: string;
  source: string;
}

export interface UserPreferences {
  category: string;
  weight: number;
  constraints?: Record<string, unknown>;
}
