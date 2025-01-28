import { MarketTrends, PriceRange, UserPreferences } from './market';

export interface DemandSignal {
  market?: string;
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
  competitiveAnalysis?: {
    competitors: string[];
    marketShare: number;
    pricePoints: number[];
  };
}
