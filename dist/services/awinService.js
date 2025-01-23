"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
/**
 * Service for interacting with the Awin Affiliate Network API.
 * Handles product search, caching, and data transformation.
 */
class AwinService {
    /**
     * Creates a new instance of AwinService
     * @param config - Configuration service for API credentials and settings
     * @param cache - Cache service for storing product data
     * @param retryStrategy - Strategy for handling API request retries
     * @param analytics - Analytics service for monitoring cache performance
     */
    constructor(config, cache, retryStrategy, analytics) {
        this.config = config;
        this.cache = cache;
        this.retryStrategy = retryStrategy;
        this.analytics = analytics;
        this.baseUrl = 'https://api.awin.com/v2';
        this.US_REGION = '2'; // Awin's region code for US
        this.heartbeatInterval = null;
        this.logger = new logger_1.Logger();
        this.startHeartbeat();
    }
    /**
     * Starts the heartbeat interval for checking Awin API health
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        return setInterval(() => this.checkApiHealth(), 300000);
    }
    /**
     * Checks the health of the Awin API
     */
    async checkApiHealth() {
        try {
            return axios_1.default.get(`${this.baseUrl}/health`, {
                headers: this.getHeaders(),
            });
        }
        catch (error) {
            this.logger.error('Awin API health check failed:', error);
            throw error;
        }
    }
    /**
     * Returns the headers for Awin API requests, including API key and content type
     * @returns Record of headers for API requests
     */
    getHeaders() {
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
    async searchProducts(pattern) {
        const cacheKey = this.generateCacheKey(pattern);
        try {
            const cachedProducts = await this.cache.get(cacheKey);
            if (cachedProducts) {
                this.analytics.recordHit();
                return cachedProducts;
            }
            this.analytics.recordMiss();
            const products = await this.retryStrategy.execute(async () => {
                const response = await axios_1.default.get(`${this.baseUrl}/products`, {
                    headers: this.getHeaders(),
                    params: this.buildSearchParams(pattern),
                });
                return response.data.products ? this.transformProducts(response.data.products) : [];
            });
            await this.cache.set(cacheKey, products);
            return products;
        }
        catch (error) {
            throw new Error(`Failed to search products: ${error.message}`);
        }
    }
    /**
     * Generates a cache key for a given demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns A unique cache key string incorporating query and price range
     */
    generateCacheKey(pattern) {
        return `awin:${pattern.query}:${pattern.context?.priceRange?.min || ''}:${pattern.context?.priceRange?.max || ''}`;
    }
    /**
     * Builds search parameters for the Awin API based on demand pattern
     * @param pattern - The demand pattern containing search criteria
     * @returns Record of search parameters for the API request
     */
    buildSearchParams(pattern) {
        const params = {
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
    transformProducts(products) {
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
    async getMerchantRecommendations(domain) {
        const cacheKey = `merchant:${domain}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const merchants = await this.retryStrategy.execute(async () => {
                const response = await axios_1.default.get(`${this.baseUrl}/publishers/${this.config.get('awin', 'publisherId')}/programmes`, {
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
        }
        catch (error) {
            this.logger.error('Failed to get merchant recommendations:', error);
            throw error;
        }
    }
    async filterAndRankMerchants(merchants, domain) {
        // Filter for active US merchants with good commission rates
        const validMerchants = merchants.filter((m) => m.isActive &&
            m.regions.includes(this.US_REGION) &&
            m.commissionRate >= 5);
        // Rank by commission rate and relevance
        const rankedMerchants = await Promise.all(validMerchants.map(async (m) => {
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
        }));
        return rankedMerchants
            .sort((a, b) => (b.commissionRate * b.relevanceScore) - (a.commissionRate * a.relevanceScore))
            .slice(0, 10); // Top 10 matches
    }
    async calculateRelevance(merchant, domain) {
        // TODO: Implement proper relevance calculation
        // For MVP, return 1 if categories match, 0.5 otherwise
        return 1;
    }
    async getTopProducts(merchantId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/products`, {
                headers: this.getHeaders(),
                params: {
                    merchantId,
                    limit: 5,
                    sort: 'commission_desc',
                },
            });
            return this.transformProducts(response.data.products || []);
        }
        catch (error) {
            this.logger.error(`Failed to get products for merchant ${merchantId}:`, error);
            return [];
        }
    }
}
exports.AwinService = AwinService;
//# sourceMappingURL=awinService.js.map