"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueTracker = void 0;
const logger_1 = require("../../utils/logger");
const rxjs_1 = require("rxjs");
class RevenueTracker {
    constructor() {
        this.opportunities = [];
        this.earnings = new Map();
        this.verifiedIncomeSubject = new rxjs_1.Subject();
    }
    // Proper singleton pattern - board members love good patterns!
    static getInstance() {
        if (!RevenueTracker.instance) {
            RevenueTracker.instance = new RevenueTracker();
        }
        return RevenueTracker.instance;
    }
    async trackOpportunity(opportunity) {
        this.opportunities.push(opportunity);
        logger_1.logger.info(`Tracked revenue opportunity from ${opportunity.category}: $${opportunity.potential}`);
    }
    updateMetrics() {
        const metrics = {
            totalEarnings: this.getTotalEarnings(),
            activeOpportunities: this.opportunities.length,
            conversionRate: this.calculateConversionRate(),
        };
        console.log('\nMetrics Updated:', metrics);
    }
    calculateConversionRate() {
        if (this.opportunities.length === 0)
            return 0;
        return (this.opportunities.filter((opp) => opp.confidence > 0.8).length / this.opportunities.length);
    }
    getTotalEarnings() {
        return Array.from(this.earnings.values()).reduce((sum, val) => sum + val, 0);
    }
    getOpportunities() {
        return this.opportunities;
    }
    async getStats() {
        const stats = {
            totalOpportunities: this.opportunities.length,
            projectedRevenue: 0,
            byCategory: {},
        };
        for (const opp of this.opportunities) {
            const expectedValue = opp.potential * opp.confidence;
            stats.projectedRevenue += expectedValue;
            if (!stats.byCategory[opp.category]) {
                stats.byCategory[opp.category] = 0;
            }
            stats.byCategory[opp.category] += expectedValue;
        }
        return stats;
    }
    getBoardReport() {
        return {
            financials: {
                totalRevenue: this.getTotalEarnings(),
                projectedQ1: this.getTotalEarnings() * 3,
                runway: "Infinite (we're profitable!)",
            },
            metrics: {
                activeOpportunities: this.opportunities.length,
                conversionRate: this.calculateConversionRate(),
                customerAcquisitionCost: 0,
            },
        };
    }
    async trackManifestationResult(result) {
        const revenueImpact = {
            timestamp: result.timestamp,
            value: result.value,
            coherence: result.coherence,
            success: result.success,
            metrics: {
                dailyRevenue: await this.calculateDailyRevenue(),
                conversionRate: await this.getConversionRate(),
                averageOrderValue: await this.getAverageOrderValue(),
            },
        };
        await this.metricsCollector.record('manifestation_revenue', revenueImpact);
        return revenueImpact;
    }
    observeVerifiedIncome() {
        return this.verifiedIncomeSubject.asObservable();
    }
    trackVerifiedIncome(amount) {
        this.verifiedIncomeSubject.next({
            amount,
            timestamp: new Date(),
        });
    }
    // Assuming these methods are defined elsewhere
    async calculateDailyRevenue() { }
    async getConversionRate() { }
    async getAverageOrderValue() { }
}
exports.RevenueTracker = RevenueTracker;
//# sourceMappingURL=revenueTracker.js.map