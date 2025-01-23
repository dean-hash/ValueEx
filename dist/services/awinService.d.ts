import { ConfigService } from '../config/configService';
import { AwinCache } from '../cache/awinCache';
import { RetryStrategy } from '../utils/retryStrategy';
import { CacheAnalytics } from '../analytics/cacheAnalytics';
import { DemandPattern } from '../types/demandTypes';
import { Product } from '../types/productTypes';
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
export declare class AwinService {
    private readonly config;
    private readonly cache;
    private readonly retryStrategy;
    private readonly analytics;
    private readonly baseUrl;
    private readonly logger;
    private readonly US_REGION;
    private heartbeatInterval;
    /**
     * Creates a new instance of AwinService
     * @param config - Configuration service for API credentials and settings
     * @param cache - Cache service for storing product data
     * @param retryStrategy - Strategy for handling API request retries
     * @param analytics - Analytics service for monitoring cache performance
     */
    constructor(config: ConfigService, cache: AwinCache, retryStrategy: RetryStrategy, analytics: CacheAnalytics);
    /**
     * Starts the heartbeat interval for checking Awin API health
     */
    private startHeartbeat;
    /**
     * Checks the health of the Awin API
     */
    private checkApiHealth;
    /**
     * Returns the headers for Awin API requests, including API key and content type
     * @returns Record of headers for API requests
     */
    private getHeaders;
    /**
     * Searches for products based on the provided demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns Promise of an array of products matching the search criteria
     */
    searchProducts(pattern: DemandPattern): Promise<Product[]>;
    /**
     * Generates a cache key for a given demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns A unique cache key string incorporating query and price range
     */
    private generateCacheKey;
    /**
     * Builds search parameters for the Awin API based on demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns Record of search parameters for the API request
     */
    private buildSearchParams;
    /**
     * Transforms Awin product response data into the internal product format
     * @param products - Array of Awin product response data
     * @returns Array of products in the internal format
     */
    private transformProducts;
    /**
     * Get US merchant recommendations for a domain
     */
    getMerchantRecommendations(domain: string): Promise<MerchantMatch[]>;
    private filterAndRankMerchants;
    private calculateRelevance;
    private getTopProducts;
}
export {};
