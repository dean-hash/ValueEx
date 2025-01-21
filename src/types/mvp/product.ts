import { MarketVertical } from '../marketTypes';

export interface MVPProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  vertical: MarketVertical;
  tags: string[];
  valueProposition?: {
    coreBenefit: string;
    evidencePoints: string[];
    realWorldImpact: string[];
  };
  resonanceFactors?: {
    demandMatch: number;
    marketFit: number;
    valueAlignment: number;
    practicalUtility: number;
    sustainableValue: number;
  };
  source: 'manual' | 'awin';
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
  valueThreshold?: {
    alignment: number;
    utility: number;
    sustainability: number;
  };
}
