import { MarketVertical } from '../../types/marketTypes';
interface ProductOpportunity {
  category: string;
  vertical: MarketVertical;
  demandStrength: number;
  priceRange?: {
    min: number;
    max: number;
  };
  targetAudience: string[];
  urgency: number;
  requirements: string[];
  searchTerms: string[];
}
export declare class ProductSourcing {
  private static instance;
  private constructor();
  static getInstance(): ProductSourcing;
  /**
   * Analyze current demand patterns to guide product sourcing
   */
  findOpportunities(): Promise<ProductOpportunity[]>;
  /**
   * Generate platform-specific search terms
   */
  private generateSearchTerms;
  /**
   * Generate Awin search queries
   */
  generateAwinQueries(opportunity: ProductOpportunity): Promise<string[]>;
  /**
   * Generate Fiverr search queries
   */
  generateFiverrQueries(opportunity: ProductOpportunity): Promise<string[]>;
  /**
   * Score a potential product against an opportunity
   */
  scoreProduct(
    productName: string,
    productDescription: string,
    price: number,
    opportunity: ProductOpportunity
  ): Promise<number>;
}
export {};
