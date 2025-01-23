"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingEngine = void 0;
/**
 * MatchingEngine
 *
 * Core engine for matching products/services with demand signals
 */
class MatchingEngine {
    constructor() {
        this.products = new Map();
    }
    /**
     * Find matches for a demand signal
     */
    async findMatches(signal) {
        // For now, return mock matches for testing
        return [
            {
                id: 'match_1',
                name: 'Example Match 1',
                quality: 0.8,
                features: ['feature1', 'feature2'],
                opportunities: ['Potential cost savings', 'Improved efficiency'],
                recommendations: ['Review detailed specifications', 'Schedule demo'],
            },
            {
                id: 'match_2',
                name: 'Example Match 2',
                quality: 0.6,
                features: ['feature2', 'feature3'],
                opportunities: ['Market expansion', 'New capabilities'],
                recommendations: ['Compare pricing', 'Evaluate integration requirements'],
            },
        ];
    }
    /**
     * Register a product/service in the catalog
     */
    async registerProduct(product) {
        this.products.set(product.id, product);
    }
    /**
     * Update product information
     */
    async updateProduct(productId, updates) {
        const existing = this.products.get(productId);
        if (existing) {
            this.products.set(productId, { ...existing, ...updates });
        }
    }
    /**
     * Find candidate matches based on basic criteria
     */
    async findCandidates(signal) {
        return Array.from(this.products.values()).filter((product) => this.isBasicMatch(product, signal));
    }
    /**
     * Score how well products match the demand
     */
    async scoreMatches(products, signal) {
        return products.map((product) => ({
            ...product,
            score: this.calculateMatchScore(product, signal),
        }));
    }
    /**
     * Rank and format matches
     */
    rankMatches(scoredProducts) {
        return scoredProducts
            .filter((p) => p.score > 0.5) // Basic threshold
            .sort((a, b) => b.score - a.score)
            .map((p) => this.formatMatch(p));
    }
    /**
     * Check if product meets basic matching criteria
     */
    isBasicMatch(product, signal) {
        // Category match
        if (signal.category && product.category !== signal.category) {
            return false;
        }
        // Price range check
        if (signal.requirements.constraints.priceRange) {
            const { min, max } = signal.requirements.constraints.priceRange;
            if (product.pricing.amount < min || product.pricing.amount > max) {
                return false;
            }
        }
        // Basic feature check
        const requiredFeatures = signal.requirements.features || [];
        const hasRequiredFeatures = requiredFeatures.every((feature) => product.features.includes(feature));
        return hasRequiredFeatures;
    }
    /**
     * Calculate detailed match score
     */
    calculateMatchScore(product, signal) {
        const scores = [this.scoreFeatures(product, signal), this.scorePricing(product, signal)];
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    /**
     * Score feature match
     */
    scoreFeatures(product, signal) {
        const requiredFeatures = signal.requirements?.features || [];
        if (requiredFeatures.length === 0)
            return 1;
        const matchedFeatures = requiredFeatures.filter((feature) => product.features.includes(feature));
        return matchedFeatures.length / requiredFeatures.length;
    }
    /**
     * Score pricing match
     */
    scorePricing(product, signal) {
        const budget = signal.requirements?.constraints.budget;
        if (!budget)
            return 1;
        const price = product.pricing.amount;
        if (price > budget)
            return 0;
        // Score higher for prices closer to budget
        return 1 - price / budget;
    }
    /**
     * Format product match as recommendation
     */
    formatMatch(scoredProduct) {
        return {
            id: this.generateMatchId(),
            name: scoredProduct.name,
            quality: scoredProduct.score,
            features: scoredProduct.features,
            opportunities: [], // Can be implemented
            recommendations: [], // Can be implemented
        };
    }
    generateMatchId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.MatchingEngine = MatchingEngine;
//# sourceMappingURL=matchingEngine.old.js.map