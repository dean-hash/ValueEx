"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSourcing = void 0;
const digitalIntelligence_1 = require("../digitalIntelligence");
const logger_1 = require("../../utils/logger");
class ProductSourcing {
    constructor() { }
    static getInstance() {
        if (!ProductSourcing.instance) {
            ProductSourcing.instance = new ProductSourcing();
        }
        return ProductSourcing.instance;
    }
    /**
     * Analyze current demand patterns to guide product sourcing
     */
    async findOpportunities() {
        try {
            // Start with high-potential categories
            const categories = [
                'home office equipment',
                'fitness gear',
                'learning resources',
                'productivity tools',
                'wellness products',
            ];
            const opportunities = [];
            for (const category of categories) {
                const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(category);
                if (analysis.accuracy.confidence > 0.7) {
                    // Only strong signals
                    const marketSignal = analysis.signals.find((s) => s.type === 'market');
                    const demandSignal = analysis.signals.find((s) => s.type === 'demand');
                    const urgencySignal = analysis.signals.find((s) => s.type === 'urgency');
                    if (marketSignal?.strength && demandSignal?.strength) {
                        opportunities.push({
                            category,
                            vertical: analysis.vertical,
                            demandStrength: demandSignal.strength,
                            priceRange: demandSignal.metadata.pricePoint
                                ? {
                                    min: Number(demandSignal.metadata.pricePoint) * 0.8,
                                    max: Number(demandSignal.metadata.pricePoint) * 1.2,
                                }
                                : undefined,
                            targetAudience: demandSignal.metadata.targetDemographic || [],
                            urgency: urgencySignal?.strength || 0,
                            requirements: marketSignal.metadata.drivers || [],
                            searchTerms: this.generateSearchTerms(category, marketSignal.metadata.drivers || [], demandSignal.metadata.targetDemographic || []),
                        });
                    }
                }
            }
            // Sort by potential (demand * urgency)
            return opportunities.sort((a, b) => b.demandStrength * b.urgency - a.demandStrength * a.urgency);
        }
        catch (error) {
            logger_1.logger.error('Error finding product opportunities:', error);
            throw error;
        }
    }
    /**
     * Generate platform-specific search terms
     */
    generateSearchTerms(category, requirements, audience) {
        const terms = new Set();
        // Base category terms
        terms.add(category);
        // Requirement-based terms
        requirements.forEach((req) => {
            terms.add(`${category} ${req}`);
            terms.add(req);
        });
        // Audience-specific terms
        audience.forEach((demo) => {
            terms.add(`${category} for ${demo}`);
        });
        return Array.from(terms);
    }
    /**
     * Generate Awin search queries
     */
    async generateAwinQueries(opportunity) {
        const queries = new Set();
        // Basic category search
        queries.add(opportunity.category);
        // Add vertical-specific terms
        if (opportunity.vertical.characteristics.purchaseCycle === 'impulse') {
            queries.add(`best selling ${opportunity.category}`);
        }
        if (opportunity.vertical.characteristics.techDependency > 0.7) {
            queries.add(`latest ${opportunity.category}`);
        }
        // Add price-range specific terms
        if (opportunity.priceRange) {
            if (opportunity.priceRange.max < 50) {
                queries.add(`affordable ${opportunity.category}`);
            }
            else if (opportunity.priceRange.min > 200) {
                queries.add(`premium ${opportunity.category}`);
            }
        }
        // Add requirement-specific terms
        opportunity.requirements.forEach((req) => {
            queries.add(`${opportunity.category} with ${req}`);
        });
        return Array.from(queries);
    }
    /**
     * Generate Fiverr search queries
     */
    async generateFiverrQueries(opportunity) {
        const queries = new Set();
        // Basic service search
        queries.add(opportunity.category.replace('products', 'services'));
        // Add vertical-specific terms
        if (opportunity.vertical.characteristics.techDependency > 0.7) {
            queries.add(`${opportunity.category} development`);
            queries.add(`${opportunity.category} expert`);
        }
        // Add requirement-specific terms
        opportunity.requirements.forEach((req) => {
            queries.add(`${opportunity.category} ${req}`);
        });
        return Array.from(queries);
    }
    /**
     * Score a potential product against an opportunity
     */
    async scoreProduct(productName, productDescription, price, opportunity) {
        try {
            const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(`${productName} - ${productDescription}`);
            let score = 0;
            // Price match (30%)
            if (opportunity.priceRange) {
                if (price >= opportunity.priceRange.min && price <= opportunity.priceRange.max) {
                    score += 0.3;
                }
                else {
                    const midPoint = (opportunity.priceRange.min + opportunity.priceRange.max) / 2;
                    const deviation = Math.abs(price - midPoint) / midPoint;
                    score += Math.max(0, 0.3 * (1 - deviation));
                }
            }
            // Requirement match (40%)
            const productSignals = analysis.signals.flatMap((s) => s.metadata.drivers || []);
            const reqMatch = opportunity.requirements.filter((req) => productSignals.some((sig) => sig.toLowerCase().includes(req.toLowerCase()) ||
                req.toLowerCase().includes(sig.toLowerCase()))).length / opportunity.requirements.length;
            score += reqMatch * 0.4;
            // Market fit (30%)
            const marketFit = analysis.signals.find((s) => s.type === 'market')?.strength || 0;
            score += marketFit * 0.3;
            return score;
        }
        catch (error) {
            logger_1.logger.error('Error scoring product:', error);
            return 0;
        }
    }
}
exports.ProductSourcing = ProductSourcing;
//# sourceMappingURL=productSourcing.js.map