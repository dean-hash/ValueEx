import axios from 'axios';
import { ConfigService } from '../config/configService';
import { AwinCache } from '../cache/awinCache';
import { RetryStrategy } from '../utils/retryStrategy';
import { CacheAnalytics } from '../analytics/cacheAnalytics';
import { DemandPattern } from '../types/demandTypes';
import { Product, ProductSpecification } from '../types/productTypes';
import { Logger } from '../utils/logger';

/**
 * Interface representing the structure of Awin product response data
 */
interface AwinProductResponse {
  products?: Array<{
    productId: string;
    productName: string;
    description?: string;
    price: {
      amount: number;
      currency: string;
    };
    merchant: {
      id: string;
      name: string;
      category?: string;
    };
    aw_deep_link: string;
    aw_image_url?: string;
    specifications?: ProductSpecification[];
  }>;
}

interface MerchantMatch {
  merchantId: string;
  name: string;
  category: string;
  commissionRate: number;
  relevanceScore: number;
  recommendedProducts: Product[];
}

/**
 * Service for interacting with the Awin Affiliate Network API.
 * Handles product search, caching, and data transformation.
 */
export class AwinService {
  private readonly baseUrl = 'https://api.awin.com/v2';
  private readonly logger: Logger;
  private readonly US_REGION = '2'; // Awin's region code for US
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new instance of AwinService
   * @param config - Configuration service for API credentials and settings
   * @param cache - Cache service for storing product data
   * @param retryStrategy - Strategy for handling API request retries
   * @param analytics - Analytics service for monitoring cache performance
   */
  constructor(
    private readonly config: ConfigService,
    private readonly cache: AwinCache,
    private readonly retryStrategy: RetryStrategy,
    private readonly analytics: CacheAnalytics
  ) {
    this.logger = new Logger();
    this.startHeartbeat();
  }

  /**
   * Starts the heartbeat interval for checking Awin API health
   */
  private startHeartbeat(): NodeJS.Timeout {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    return setInterval(() => this.checkApiHealth(), 300000);
  }

  /**
   * Checks the health of the Awin API
   */
  private async checkApiHealth(): Promise<void> {
    try {
      return axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      this.logger.error('Awin API health check failed:', error);
      throw error;
    }
  }

  /**
   * Returns the headers for Awin API requests, including API key and content type
   * @returns Record of headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const apiKey = this.config.get('awin', 'apiKey');
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Searches for products based on the provided demand pattern
   * @param pattern - The demand pattern containing search criteria
   * @returns Promise of an array of products matching the search criteria
   */
  public async searchProducts(pattern: DemandPattern): Promise<Product[]> {
    const cacheKey = this.generateCacheKey(pattern);

    try {
      const cachedProducts = await this.cache.get(cacheKey);
      if (cachedProducts) {
        this.analytics.recordHit();
        return cachedProducts;
      }

      this.analytics.recordMiss();
      const products = await this.retryStrategy.execute(async () => {
        const response = await axios.get<AwinProductResponse>(`${this.baseUrl}/products`, {
          headers: this.getHeaders(),
          params: this.buildSearchParams(pattern),
        });

        return response.data.products ? this.transformProducts(response.data.products) : [];
      });

      await this.cache.set(cacheKey, products);
      return products;
    } catch (error) {
      throw new Error(`Failed to search products: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a cache key for a given demand pattern
   * @param pattern - The demand pattern containing search criteria
   * @returns A unique cache key string incorporating query and price range
   */
  private generateCacheKey(pattern: DemandPattern): string {
    return `awin:${pattern.query}:${
      pattern.context?.priceRange?.min || ''
    }:${pattern.context?.priceRange?.max || ''}`;
  }

  /**
   * Builds search parameters for the Awin API based on demand pattern
   * @param pattern - The demand pattern containing search criteria
   * @returns Record of search parameters for the API request
   */
  private buildSearchParams(pattern: DemandPattern): Record<string, string> {
    const params: Record<string, string> = {
      keyword: pattern.query,
      region: this.US_REGION,
      merchantCountry: 'US',
      minMerchantRating: '4',
      minCommissionRate: '5',
    };

    if (pattern.context?.priceRange) {
      if (pattern.context.priceRange.min !== undefined) {
        params.minPrice = pattern.context.priceRange.min.toString();
      }
      if (pattern.context.priceRange.max !== undefined) {
        params.maxPrice = pattern.context.priceRange.max.toString();
      }
    }

    return params;
  }

  /**
   * Transforms Awin product response data into the internal product format
   * @param products - Array of Awin product response data
   * @returns Array of products in the internal format
   */
  private transformProducts(products: NonNullable<AwinProductResponse['products']>): Product[] {
    return products.map((p) => ({
      id: p.productId,
      name: p.productName,
      description: p.description,
      price: p.price,
      merchant: p.merchant,
      url: p.aw_deep_link,
      imageUrl: p.aw_image_url,
      specifications: p.specifications || [],
      resonanceScore: 0,
      resonanceMetrics: {
        harmony: 0,
        impact: 0,
        sustainability: 0,
        innovation: 0,
        localRelevance: 0,
      },
    }));
  }

  /**
   * Get US merchant recommendations for a domain
   */
  public async getMerchantRecommendations(domain: string): Promise<MerchantMatch[]> {
    const cacheKey = `merchant:${domain}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const merchants = await this.retryStrategy.execute(async () => {
        const response = await axios.get(`${this.baseUrl}/publishers/${this.config.get('awin', 'publisherId')}/programmes`, {
          headers: this.getHeaders(),
          params: {
            relationship: 'joined',
            region: this.US_REGION,
          },
        });

        return this.filterAndRankMerchants(response.data, domain);
      });

      await this.cache.set(cacheKey, merchants, 3600); // Cache for 1 hour
      return merchants;
    } catch (error) {
      this.logger.error('Failed to get merchant recommendations:', error);
      throw error;
    }
  }

  private async filterAndRankMerchants(merchants: any[], domain: string): Promise<MerchantMatch[]> {
    // Filter for active US merchants with good commission rates
    const validMerchants = merchants.filter((m) =>
      m.isActive &&
      m.regions.includes(this.US_REGION) &&
      m.commissionRate >= 5
    );

    // Rank by commission rate and relevance
    const rankedMerchants = await Promise.all(
      validMerchants.map(async (m) => {
        const relevanceScore = await this.calculateRelevance(m, domain);
        const recommendedProducts = await this.getTopProducts(m.id);

        return {
          merchantId: m.id,
          name: m.name,
          category: m.primaryCategory,
          commissionRate: m.commissionRate,
          relevanceScore,
          recommendedProducts,
        };
      })
    );

    return rankedMerchants
      .sort((a, b) =>
        (b.commissionRate * b.relevanceScore) - (a.commissionRate * a.relevanceScore)
      )
      .slice(0, 10); // Top 10 matches
  }

  private async calculateRelevance(merchant: any, domain: string): Promise<number> {
    // TODO: Implement proper relevance calculation
    // For MVP, return 1 if categories match, 0.5 otherwise
    return 1;
  }

  private async getTopProducts(merchantId: string): Promise<Product[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/products`, {
        headers: this.getHeaders(),
        params: {
          merchantId,
          limit: 5,
          sort: 'commission_desc',
        },
      });

      return this.transformProducts(response.data.products || []);
    } catch (error) {
      this.logger.error(`Failed to get products for merchant ${merchantId}:`, error);
      return [];
    }
  }
}
