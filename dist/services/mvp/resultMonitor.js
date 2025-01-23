"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultMonitor = void 0;
const storage_1 = require("./storage");
const commissionTracker_1 = require("./commissionTracker");
const logger_1 = require("../../utils/logger");
class ResultMonitor {
    constructor() {
        this.storage = storage_1.MVPStorage.getInstance();
        this.commissionTracker = commissionTracker_1.CommissionTracker.getInstance();
        this.clicks = new Map();
        this.conversions = new Map();
        this.matchPerformance = new Map();
        // Start periodic performance analysis
        setInterval(() => this.analyzePerformance(), 15 * 60 * 1000); // Every 15 minutes
    }
    static getInstance() {
        if (!ResultMonitor.instance) {
            ResultMonitor.instance = new ResultMonitor();
        }
        return ResultMonitor.instance;
    }
    /**
     * Track a click on an affiliate link
     */
    trackClick(affiliateLink, demandId, productId, source, metadata) {
        const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.clicks.set(clickId, {
            affiliateLink,
            timestamp: new Date(),
            demandId,
            productId,
            source,
            ...metadata,
        });
        // Update match performance
        const matchKey = `${demandId}_${productId}`;
        const performance = this.matchPerformance.get(matchKey) || {
            demandId,
            productId,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commissions: 0,
            conversionRate: 0,
        };
        performance.clicks++;
        performance.lastClick = new Date();
        this.matchPerformance.set(matchKey, performance);
        logger_1.logger.info('Click tracked:', {
            clickId,
            demandId,
            productId,
            source,
        });
        return clickId;
    }
    /**
     * Track a conversion from an affiliate link
     */
    trackConversion(clickId, orderValue, commission) {
        const clickData = this.clicks.get(clickId);
        if (!clickData) {
            logger_1.logger.warn('Conversion tracked for unknown click:', clickId);
            return;
        }
        this.conversions.set(clickId, {
            clickId,
            orderValue,
            commission,
            timestamp: new Date(),
        });
        // Update match performance
        const matchKey = `${clickData.demandId}_${clickData.productId}`;
        const performance = this.matchPerformance.get(matchKey) || {
            demandId: clickData.demandId,
            productId: clickData.productId,
            clicks: 0,
            conversions: 0,
            revenue: 0,
            commissions: 0,
            conversionRate: 0,
        };
        performance.conversions++;
        performance.revenue += orderValue;
        performance.commissions += commission;
        performance.conversionRate = performance.conversions / performance.clicks;
        performance.lastConversion = new Date();
        this.matchPerformance.set(matchKey, performance);
        // Track commission for analysis
        this.commissionTracker.trackCommission(clickData.productId, clickData.demandId, commission, orderValue);
        logger_1.logger.info('Conversion tracked:', {
            clickId,
            orderValue,
            commission,
            demandId: clickData.demandId,
            productId: clickData.productId,
        });
    }
    /**
     * Analyze performance and adjust strategies
     */
    async analyzePerformance() {
        try {
            const now = new Date();
            const performanceData = Array.from(this.matchPerformance.values());
            // Calculate key metrics
            const totalClicks = performanceData.reduce((sum, p) => sum + p.clicks, 0);
            const totalConversions = performanceData.reduce((sum, p) => sum + p.conversions, 0);
            const totalRevenue = performanceData.reduce((sum, p) => sum + p.revenue, 0);
            const totalCommissions = performanceData.reduce((sum, p) => sum + p.commissions, 0);
            const overallConversionRate = totalConversions / totalClicks;
            const averageOrderValue = totalRevenue / totalConversions;
            const revenuePerClick = totalRevenue / totalClicks;
            // Identify best and worst performing matches
            const sortedByRevenue = [...performanceData].sort((a, b) => b.revenue - a.revenue);
            const bestPerformers = sortedByRevenue.slice(0, 5);
            const worstPerformers = sortedByRevenue.slice(-5);
            // Log performance metrics
            logger_1.logger.info('Performance Analysis:', {
                timestamp: now,
                overall: {
                    clicks: totalClicks,
                    conversions: totalConversions,
                    revenue: totalRevenue,
                    commissions: totalCommissions,
                    conversionRate: overallConversionRate,
                    averageOrderValue,
                    revenuePerClick,
                },
                bestPerformers: bestPerformers.map((p) => ({
                    demandId: p.demandId,
                    revenue: p.revenue,
                    conversionRate: p.conversionRate,
                })),
                worstPerformers: worstPerformers.map((p) => ({
                    demandId: p.demandId,
                    revenue: p.revenue,
                    conversionRate: p.conversionRate,
                })),
            });
            // Store analytics data
            this.storage.trackAnalytics({
                timestamp: now,
                metrics: {
                    clicks: totalClicks,
                    conversions: totalConversions,
                    revenue: totalRevenue,
                    commissions: totalCommissions,
                    conversionRate: overallConversionRate,
                },
                topPerformers: bestPerformers.map((p) => p.demandId),
            });
            // Clean up old data (keep last 30 days)
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            for (const [clickId, clickData] of this.clicks) {
                if (clickData.timestamp < thirtyDaysAgo) {
                    this.clicks.delete(clickId);
                    this.conversions.delete(clickId);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error analyzing performance:', error);
        }
    }
    /**
     * Get performance metrics for a specific match
     */
    getMatchPerformance(demandId, productId) {
        const matchKey = `${demandId}_${productId}`;
        return this.matchPerformance.get(matchKey) || null;
    }
    /**
     * Get overall performance metrics
     */
    getOverallPerformance() {
        const performanceData = Array.from(this.matchPerformance.values());
        return {
            clicks: performanceData.reduce((sum, p) => sum + p.clicks, 0),
            conversions: performanceData.reduce((sum, p) => sum + p.conversions, 0),
            revenue: performanceData.reduce((sum, p) => sum + p.revenue, 0),
            commissions: performanceData.reduce((sum, p) => sum + p.commissions, 0),
            conversionRate: performanceData.reduce((sum, p) => sum + p.conversions, 0) /
                performanceData.reduce((sum, p) => sum + p.clicks, 0),
            bestPerformers: [...performanceData].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        };
    }
}
exports.ResultMonitor = ResultMonitor;
//# sourceMappingURL=resultMonitor.js.map