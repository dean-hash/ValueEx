"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandFulfillment = void 0;
const digitalIntelligence_1 = require("../digitalIntelligence");
const logger_1 = require("../../utils/logger");
class DemandFulfillment {
    constructor() { }
    static getInstance() {
        if (!DemandFulfillment.instance) {
            DemandFulfillment.instance = new DemandFulfillment();
        }
        return DemandFulfillment.instance;
    }
    /**
     * Create fulfillment strategies for a product-demand match
     */
    async createFulfillmentStrategies(product, demand) {
        try {
            // Analyze the context to determine best fulfillment approach
            const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(`${demand.query} seeking ${product.name}`);
            // Generate value proposition
            const valueProps = await this.generateValueProposition(product, demand, analysis);
            // Generate affiliate link with tracking
            const affiliateLink = this.generateAffiliateLink(product.id, demand.id);
            // Create platform-specific strategies
            const strategies = [];
            // If demand came from Reddit
            if (demand.source === 'reddit') {
                strategies.push({
                    platform: 'reddit',
                    confidence: analysis.accuracy.confidence,
                    valueProposition: this.formatForReddit(valueProps),
                    affiliateLink,
                    context: {
                        originalPost: demand.query,
                        timing: 'immediate',
                        engagement: 'direct',
                    },
                });
            }
            // If high urgency, add forum strategy
            if (demand.insights.urgency > 0.7) {
                strategies.push({
                    platform: 'forum',
                    confidence: analysis.accuracy.confidence * 0.9,
                    valueProposition: this.formatForForum(valueProps),
                    affiliateLink,
                    context: {
                        timing: 'immediate',
                        engagement: 'contextual',
                    },
                });
            }
            // For considered purchases, add blog comment strategy
            if (product.vertical.characteristics.purchaseCycle === 'considered') {
                strategies.push({
                    platform: 'blog_comment',
                    confidence: analysis.accuracy.confidence * 0.8,
                    valueProposition: this.formatForBlog(valueProps),
                    affiliateLink,
                    context: {
                        timing: 'scheduled',
                        engagement: 'contextual',
                    },
                });
            }
            return strategies.sort((a, b) => b.confidence - a.confidence);
        }
        catch (error) {
            logger_1.logger.error('Error creating fulfillment strategies:', error);
            throw error;
        }
    }
    async generateValueProposition(product, demand, analysis) {
        const sellingPoints = analysis.signals
            .filter((s) => s.type === 'market' || s.type === 'demand')
            .flatMap((s) => s.metadata.drivers || []);
        const valueProps = [
            // Main benefit aligned with demand
            sellingPoints[0] || product.description,
            // Supporting points (if available)
            ...sellingPoints.slice(1, 3),
            // Price point (if relevant to the context)
            demand.insights.priceRange ? `Available at ${product.price.toFixed(2)}` : null,
            // Urgency factor (if high)
            demand.insights.urgency > 0.7 ? 'Limited time opportunity' : null,
        ].filter(Boolean);
        return valueProps;
    }
    generateAffiliateLink(productId, demandId) {
        // MVP: Generate trackable affiliate link
        // This will integrate with Awin in production
        return `https://valuex.app/ref/${productId}?src=${demandId}`;
    }
    formatForReddit(valueProps) {
        return `
            ${valueProps[0]}
            
            ${valueProps
            .slice(1)
            .map((prop) => `• ${prop}`)
            .join('\n')}
            
            [Check it out here](${this.generateAffiliateLink})
        `.trim();
    }
    formatForForum(valueProps) {
        return `
            Hope this helps - I found exactly what you're looking for:
            
            ${valueProps[0]}
            ${valueProps
            .slice(1)
            .map((prop) => `- ${prop}`)
            .join('\n')}
            
            Here's the link: ${this.generateAffiliateLink}
        `.trim();
    }
    formatForBlog(valueProps) {
        return `
            Great discussion! For anyone interested, here's a solution that matches these requirements:
            
            ${valueProps.join('\n\n')}
            
            More details: ${this.generateAffiliateLink}
        `.trim();
    }
    /**
     * Track fulfillment success
     */
    async trackFulfillment(strategy, success, metrics) {
        // Log success/failure for analysis
        logger_1.logger.info('Fulfillment tracked:', {
            platform: strategy.platform,
            success,
            metrics,
        });
        // In production: Store metrics for analysis and strategy refinement
    }
}
exports.DemandFulfillment = DemandFulfillment;
//# sourceMappingURL=demandFulfillment.js.map