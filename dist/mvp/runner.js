"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mvpRunner = void 0;
const digitalIntelligence_1 = require("../services/digitalIntelligence");
const demandMatcher_1 = require("../services/mvp/demandMatcher");
const demandFulfillment_1 = require("../services/mvp/demandFulfillment");
const productSourcing_1 = require("../services/mvp/productSourcing");
const storage_1 = require("../services/mvp/storage");
const commissionTracker_1 = require("../services/mvp/commissionTracker");
const logger_1 = require("../utils/logger");
class MVPRunner {
    constructor() {
        this.storage = storage_1.MVPStorage.getInstance();
        this.demandMatcher = demandMatcher_1.DemandMatcher.getInstance();
        this.fulfillment = demandFulfillment_1.DemandFulfillment.getInstance();
        this.productSourcing = productSourcing_1.ProductSourcing.getInstance();
        this.commissionTracker = commissionTracker_1.CommissionTracker.getInstance();
        this.isRunning = false;
        this.matchInterval = null;
        this.analyticsInterval = null;
        this.MATCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.ANALYTICS_INTERVAL = 60 * 60 * 1000; // 1 hour
    }
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn('MVP Runner is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info('Starting MVP Runner');
        // Initial run
        await this.runMatchingCycle();
        await this.runAnalytics();
        // Set up intervals
        this.matchInterval = setInterval(() => this.runMatchingCycle(), this.MATCH_INTERVAL);
        this.analyticsInterval = setInterval(() => this.runAnalytics(), this.ANALYTICS_INTERVAL);
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
    async runMatchingCycle() {
        try {
            logger_1.logger.info('Starting matching cycle');
            // 1. Find product opportunities
            const opportunities = await this.productSourcing.findOpportunities();
            // 2. For each opportunity, find potential matches
            for (const opportunity of opportunities) {
                // Track API usage
                this.storage.trackAPICall();
                // Analyze market demand
                const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(opportunity.category);
                if (analysis.accuracy.confidence > 0.7) {
                    // Generate fulfillment strategies
                    const strategies = await this.fulfillment.createFulfillmentStrategies({
                        id: `temp_${Date.now()}`,
                        name: opportunity.category,
                        description: opportunity.requirements.join(', '),
                        price: opportunity.priceRange?.min || 0,
                        category: opportunity.category,
                        vertical: opportunity.vertical,
                        tags: opportunity.searchTerms,
                        source: 'manual',
                        status: 'active',
                    }, {
                        id: `demand_${Date.now()}`,
                        query: opportunity.category,
                        timestamp: new Date(),
                        source: 'inferred',
                        vertical: opportunity.vertical,
                        strength: opportunity.demandStrength,
                        insights: {
                            urgency: opportunity.urgency,
                            confidence: analysis.accuracy.confidence,
                            keywords: opportunity.requirements,
                            demographics: opportunity.targetAudience,
                        },
                        status: 'active',
                    });
                    // Track potential matches
                    strategies.forEach((strategy) => {
                        if (strategy.confidence > 0.8) {
                            this.storage.trackMatch(`demand_${Date.now()}`, `prod_${Date.now()}`);
                            logger_1.logger.info('High confidence match found:', {
                                category: opportunity.category,
                                confidence: strategy.confidence,
                                platform: strategy.platform,
                            });
                        }
                    });
                }
            }
            logger_1.logger.info('Matching cycle completed');
        }
        catch (error) {
            logger_1.logger.error('Error in matching cycle:', error);
        }
    }
    async runAnalytics() {
        try {
            logger_1.logger.info('Running analytics');
            const analytics = this.storage.getAnalytics();
            const activeMatches = this.storage.getActiveMatches();
            const bestVerticals = this.commissionTracker.getBestVerticals();
            // Calculate key metrics
            const conversionRate = analytics.successfulMatches / analytics.apiCalls;
            const revenuePerCall = analytics.totalRevenue / analytics.apiCalls;
            const activeMatchRate = activeMatches.length / analytics.apiCalls;
            // Log performance metrics
            logger_1.logger.info('Performance Metrics:', {
                conversionRate,
                revenuePerCall,
                activeMatchRate,
                bestVerticals: bestVerticals.slice(0, 3),
                apiCalls: analytics.apiCalls,
                totalRevenue: analytics.totalRevenue,
            });
            // Adjust strategies based on performance
            if (conversionRate < 0.1) {
                logger_1.logger.warn('Low conversion rate - adjusting confidence thresholds');
                // In production: Implement strategy adjustments
            }
            if (revenuePerCall < 0.5) {
                logger_1.logger.warn('Low revenue per call - focusing on higher commission verticals');
                // In production: Implement vertical prioritization
            }
        }
        catch (error) {
            logger_1.logger.error('Error running analytics:', error);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down MVP Runner');
        this.isRunning = false;
        if (this.matchInterval) {
            clearInterval(this.matchInterval);
        }
        if (this.analyticsInterval) {
            clearInterval(this.analyticsInterval);
        }
        // Save final state
        this.storage.cleanup();
        process.exit(0);
    }
}
// Create and export runner instance
exports.mvpRunner = new MVPRunner();
// If this file is run directly, start the runner
if (require.main === module) {
    exports.mvpRunner.start().catch((error) => {
        logger_1.logger.error('Error starting MVP Runner:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=runner.js.map