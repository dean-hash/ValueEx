interface AwinProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  merchantId: string;
  ean: string;
  imageUrl: string;
  deepLink: string;
  commissionAmount: number;
  commissionRate: number;
}
interface AwinConfig {
  apiKey: string;
  publisherId: string;
}
export declare class AffiliateNetwork {
  private static instance;
  private config;
  private constructor();
  static getInstance(): AffiliateNetwork;
  /**
   * Initialize with API credentials
   */
  initialize(config: AwinConfig): void;
  /**
   * Search for products
   */
  searchProducts(query: string): Promise<AwinProduct[]>;
  /**
   * Generate affiliate link
   */
  generateAffiliateLink(productId: string, campaignId?: string): Promise<string>;
  /**
   * Track commission
   */
  trackCommission(transactionId: string, amount: number): Promise<void>;
  /**
   * Get product details
   */
  getProductDetails(productId: string): Promise<AwinProduct | null>;
}
export {};
