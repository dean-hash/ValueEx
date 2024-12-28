import { MarketVertical } from '../marketTypes';

export interface MVPProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  vertical: MarketVertical;
  tags: string[];
  resonanceFactors?: {
    demandMatch: number; // How well it matches current demand
    marketFit: number; // How well it fits in the market
    valueAlignment: number; // How well it aligns with value proposition
  };
  source: 'manual' | 'awin'; // Track source for future integration
  status: 'active' | 'inactive' | 'pending';
}

export interface ProductMatchCriteria {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  vertical?: string;
  resonanceThreshold?: number;
}
