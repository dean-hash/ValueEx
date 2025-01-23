"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueCreationService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Service for measuring and optimizing real-time value creation across all participants
 * Integrates directly with Dynamics 365 and Business Central for accurate metrics
 */
class ValueCreationService {
    constructor(resonanceField, awinService, dynamicsService, bcService) {
        this.resonanceField = resonanceField;
        this.awinService = awinService;
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.logger = new logger_1.Logger();
        this.dynamicsService = dynamicsService;
        this.bcService = bcService;
        this.cache = new Map();
    }
    /**
     * Calculate value creation for all parties in a potential match
     */
    async measureValueCreation(product, pattern) {
        const cacheKey = this.getCacheKey(product, pattern);
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
            return cached.data;
        }
        try {
            const metrics = await this.resonanceField.measureValueCreation(product, pattern);
            // Enrich with real-time metrics
            const [efficiencyMetrics, affiliateMetrics] = await Promise.all([
                this.bcService.getEfficiencyMetrics(),
                this.awinService.getAffiliateMetrics()
            ]);
            metrics.realTimeMetrics = {
                revenue: affiliateMetrics.revenue,
                costs: efficiencyMetrics.costPerLead * affiliateMetrics.conversions,
                profitMargin: (affiliateMetrics.revenue - affiliateMetrics.commission) / affiliateMetrics.revenue,
                customerEngagement: affiliateMetrics.conversions / affiliateMetrics.clicks
            };
            this.cache.set(cacheKey, { data: metrics, timestamp: new Date() });
            return metrics;
        }
        catch (error) {
            this.logger.error('Error measuring value creation:', error);
            throw error;
        }
    }
    /**
     * Calculate the value match between consumer intent and product
     */
    async calculateIntentMatchValue(product, pattern, signals) {
        try {
            const consumerValue = await this.resonanceField.calculateConsumerValue(product, pattern, signals);
            const merchantValue = await this.resonanceField.calculateMerchantValue(product, signals);
            // Weighted average of consumer and merchant value
            return (consumerValue * 0.6 + merchantValue * 0.4);
        }
        catch (error) {
            this.logger.error('Error calculating intent match value:', error);
            throw error;
        }
    }
    getCacheKey(product, pattern) {
        return `${product.id}-${pattern.id}`;
    }
    isCacheValid(timestamp) {
        return Date.now() - timestamp.getTime() < this.CACHE_TTL;
    }
}
exports.ValueCreationService = ValueCreationService;
//# sourceMappingURL=revenueMetricsService.js.map