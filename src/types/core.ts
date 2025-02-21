import { MarketTrends, UserPreferences } from './marketTypes';

export interface DemandPattern {
  signals: DemandSignal[];
  confidence: number;
  coherence: number;
  temporalFactors: TemporalMetrics;
  spatialFactors: SpatialMetrics;
  category?: string;
  priceRange?: PriceRange;
}

export interface DemandSignal {
  id: string;
  source: string;
  timestamp: number;
  type: 'explicit' | 'implicit' | 'inferred';
  confidence: number;
  context: DemandContext;
}

export interface DemandContext {
  keywords: string[];
  relatedCategories: string[];
  sentiment: number;
  urgency: number;
}

export interface TemporalMetrics {
  momentum: number;
  volume: number;
  growth: number;
  seasonality: number;
}

export interface SpatialMetrics {
  geographic: string[];
  demographic: string[];
  psychographic: string[];
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface AwinProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  merchant: string;
  categories: string[];
  url: string;
  imageUrl: string;
  availability: boolean;
  rating?: number;
  reviews?: number;
}
