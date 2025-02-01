import { DemandSignal } from '../analysis/types';
interface Product {
  id: string;
  name: string;
  category: string;
  features: string[];
  specifications: Record<string, any>;
  pricing: {
    amount: number;
    currency: string;
  };
}
export interface Match {
  id: string;
  name: string;
  quality: number;
  features?: string[];
  opportunities?: string[];
  recommendations?: string[];
}
/**
 * MatchingEngine
 *
 * Core engine for matching products/services with demand signals
 */
export declare class MatchingEngine {
  private products;
  /**
   * Find matches for a demand signal
   */
  findMatches(signal: DemandSignal): Promise<Match[]>;
  /**
   * Register a product/service in the catalog
   */
  registerProduct(product: Product): Promise<void>;
  /**
   * Update product information
   */
  updateProduct(productId: string, updates: Partial<Product>): Promise<void>;
  /**
   * Find candidate matches based on basic criteria
   */
  private findCandidates;
  /**
   * Score how well products match the demand
   */
  private scoreMatches;
  /**
   * Rank and format matches
   */
  private rankMatches;
  /**
   * Check if product meets basic matching criteria
   */
  private isBasicMatch;
  /**
   * Calculate detailed match score
   */
  private calculateMatchScore;
  /**
   * Score feature match
   */
  private scoreFeatures;
  /**
   * Score pricing match
   */
  private scorePricing;
  /**
   * Format product match as recommendation
   */
  private formatMatch;
  private generateMatchId;
}
export {};
