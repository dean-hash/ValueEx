"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedIntelligenceField = void 0;
const logger_1 = require("../utils/logger");
/**
 * Unified Intelligence Field service that coordinates product resonance calculations
 * and demand pattern analysis across the system.
 */
class UnifiedIntelligenceField {
    /**
     * Creates a new instance of UnifiedIntelligenceField
     * @param config - Configuration service for system settings
     * @param awinService - Service for interacting with Awin API
     * @param resonanceField - Service for calculating resonance metrics
     */
    constructor(config, awinService, resonanceField) {
        this.config = config;
        this.awinService = awinService;
        this.resonanceField = resonanceField;
        this.logger = new logger_1.Logger();
        this.state = {
            domains: [],
            stability: 0,
            coherence: 0,
            lastUpdated: new Date(),
        };
    }
    /**
     * Analyzes a domain and returns its status, resonance, and metrics
     * @param domainName - The name of the domain to analyze
     * @returns Promise<DomainInfo> containing the domain's status, resonance, and metrics
     */
    async analyzeDomain(domainName) {
        try {
            const metrics = await this.calculateDomainMetrics(domainName);
            const resonance = await this.calculateDomainResonance(metrics);
            return {
                name: domainName,
                status: 'active',
                resonance,
                metrics,
            };
        }
        catch (error) {
            this.logger.error('Failed to analyze domain:', error);
            throw error;
        }
    }
    /**
     * Retrieves the current state of the Unified Intelligence Field
     * @returns Promise<FieldState> containing the current state
     */
    async getDomainState() {
        return this.state;
    }
    /**
     * Updates the state of the Unified Intelligence Field
     * @param newState - The new state to apply
     * @returns Promise<void>
     */
    async updateDomainState(newState) {
        this.state = {
            ...newState,
            lastUpdated: new Date(),
        };
    }
    /**
     * Calculates the resonance of a product based on a demand pattern
     * @param product - The product to calculate resonance for
     * @param pattern - The demand pattern to use for calculation
     * @returns Promise<number> containing the product's resonance
     */
    async calculateProductResonance(product, pattern) {
        try {
            if (!(await this.validatePriceRange(pattern))) {
                return 0;
            }
            const metrics = await this.calculateProductMetrics(product, pattern);
            return Object.values(metrics).reduce((sum, value) => sum + value, 0) / 5;
        }
        catch (error) {
            this.logger.error('Failed to calculate product resonance:', error);
            return 0;
        }
    }
    /**
     * Calculates domain-specific metrics for a given domain
     * @param domainName - The name of the domain to calculate metrics for
     * @returns Promise<{ stability: number; coherence: number }> containing the domain's metrics
     */
    async calculateDomainMetrics(domainName) {
        const domainActivity = await this.getDomainActivity(domainName);
        return {
            stability: domainActivity * 0.5,
            coherence: domainActivity * 0.5,
        };
    }
    async getDomainActivity(domainName) {
        this.logger.debug(`Calculating domain activity for ${domainName}`);
        // TODO: Implement domain activity calculation based on domain name
        return 1.0;
    }
    /**
     * Calculates the resonance of a domain based on its metrics
     * @param metrics - The domain's metrics
     * @returns Promise<number> containing the domain's resonance
     */
    async calculateDomainResonance(metrics) {
        return (metrics.stability + metrics.coherence) / 2;
    }
    /**
     * Calculates product metrics based on a demand pattern
     * @param product - The product to calculate metrics for
     * @param pattern - The demand pattern to use for calculation
     * @returns Promise<{
     *   harmony: number;
     *   impact: number;
     *   sustainability: number;
     *   innovation: number;
     *   localRelevance: number;
     * }> containing the product's metrics
     */
    async calculateProductMetrics(product, pattern) {
        return {
            harmony: this.calculateKeywordMatch(product, pattern),
            impact: this.calculatePriceMatch(product, pattern),
            sustainability: this.calculateProductMetric(product, 'sustainability'),
            innovation: this.calculateProductMetric(product, 'innovation'),
            localRelevance: this.calculateLocalRelevance(product, pattern),
        };
    }
    /**
     * Calculates the keyword match between a product and a demand pattern
     * @param product - The product to calculate keyword match for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the keyword match
     */
    calculateKeywordMatch(product, pattern) {
        if (!pattern.query)
            return 0.5;
        const productName = product.name.toLowerCase();
        const productDesc = product.description?.toLowerCase() || '';
        const query = pattern.query.toLowerCase();
        const nameMatch = productName.includes(query) ? 0.7 : 0;
        const descMatch = productDesc.includes(query) ? 0.3 : 0;
        return nameMatch + descMatch;
    }
    /**
     * Calculates the price match between a product and a demand pattern
     * @param product - The product to calculate price match for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the price match
     */
    calculatePriceMatch(product, pattern) {
        if (!pattern.context?.priceRange)
            return 0.5;
        const price = product.price.amount;
        const { min = 0, max = Infinity } = pattern.context.priceRange;
        if (price < min || price > max)
            return 0;
        const range = max - min;
        const midpoint = min + range / 2;
        const distance = Math.abs(price - midpoint);
        const normalizedDistance = 1 - distance / (range / 2);
        return Math.max(0, normalizedDistance);
    }
    /**
     * Calculates a product metric based on its attributes
     * @param product - The product to calculate the metric for
     * @param metricType - The type of metric to calculate
     * @returns number containing the calculated metric
     */
    calculateProductMetric(product, metricType) {
        const metrics = {
            sustainability: this.calculateProductSustainability(product),
            innovation: this.calculateProductInnovation(product),
        };
        return metrics[metricType];
    }
    calculateProductSustainability(product) {
        const hasEcoLabel = product.description?.toLowerCase().includes('eco') || false;
        const hasRecycled = product.description?.toLowerCase().includes('recycled') || false;
        return (hasEcoLabel ? 0.6 : 0) + (hasRecycled ? 0.4 : 0);
    }
    calculateProductInnovation(product) {
        const hasNewTech = product.description?.toLowerCase().includes('new technology') || false;
        const hasPatent = product.description?.toLowerCase().includes('patent') || false;
        return (hasNewTech ? 0.7 : 0) + (hasPatent ? 0.3 : 0);
    }
    /**
     * Calculates the local relevance of a product based on a demand pattern
     * @param product - The product to calculate local relevance for
     * @param pattern - The demand pattern to use for calculation
     * @returns number containing the local relevance
     */
    calculateLocalRelevance(product, pattern) {
        const region = pattern.context?.spatialFactors?.geographic?.[0];
        if (!region)
            return 0.5;
        const merchantLocation = product.merchant.category || '';
        return merchantLocation.toLowerCase().includes(region.toLowerCase()) ? 1 : 0.3;
    }
    /**
     * Validates the price range in a demand pattern
     * @param pattern - The demand pattern to validate
     * @returns Promise<boolean> indicating if the price range is valid
     */
    async validatePriceRange(pattern) {
        if (!pattern.context?.priceRange) {
            return true;
        }
        const { min, max } = pattern.context.priceRange;
        if (min !== undefined && max !== undefined && min > max) {
            return false;
        }
        return true;
    }
}
exports.UnifiedIntelligenceField = UnifiedIntelligenceField;
//# sourceMappingURL=unifiedIntelligence.js.map