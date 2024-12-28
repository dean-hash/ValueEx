import { MarketVertical } from '../marketTypes';

export interface DemandSignal {
  id: string;
  query: string;
  timestamp: Date;
  source: 'direct' | 'inferred'; // direct = user input, inferred = from analysis
  vertical: MarketVertical;
  strength: number; // 0-1
  insights: {
    marketSize?: number;
    priceRange?: {
      min: number;
      max: number;
    };
    urgency: number; // 0-1
    confidence: number; // 0-1
    searchVolume?: number;
    demographics?: string[];
    keywords: string[];
  };
  status: 'active' | 'fulfilled' | 'expired';
  fulfillmentData?: {
    productId?: string;
    fulfillmentDate?: Date;
    successMetrics?: {
      conversionRate?: number;
      customerSatisfaction?: number;
      repeatPurchaseRate?: number;
    };
  };
}
