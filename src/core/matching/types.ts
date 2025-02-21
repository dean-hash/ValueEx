import { Demand } from '../../types/mvp/demand';
import { Product } from '../../types/mvp/product';

export interface Match {
  demand: Demand;
  product: Product;
  matchScore: number;
  matchReason: string[];
  metadata: {
    categoryMatch: boolean;
    priceMatch: boolean;
    descriptionSimilarity: number;
  };
}

export interface MatchRequest {
  products: Product[];
  demandSignals: Demand[];
  minMatchScore?: number;
  maxResults?: number;
}

export interface MatchingMetrics {
  totalMatches: number;
  averageScore: number;
  processingTime: number;
  workerUtilization: number[];
}
