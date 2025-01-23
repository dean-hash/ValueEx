"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendAnalyzer = void 0;
const logger_1 = require("../../utils/logger");
class TrendAnalyzer {
    constructor() { }
    static getInstance() {
        if (!TrendAnalyzer.instance) {
            TrendAnalyzer.instance = new TrendAnalyzer();
        }
        return TrendAnalyzer.instance;
    }
    async analyzeTrend(signal) {
        try {
            // Gather trend data
            const growthRate = await this.calculateGrowthRate(signal);
            const engagement = await this.analyzeEngagement(signal);
            const marketValidation = await this.validateMarket(signal);
            // Calculate core metrics
            const organicGrowth = this.calculateOrganicGrowth(growthRate, engagement);
            const sustainedInterest = this.evaluateSustainedInterest(engagement);
            const realWorldImpact = await this.assessRealWorldImpact(signal);
            return {
                organicGrowth,
                sustainedInterest,
                realWorldImpact,
                growthRate,
                engagement,
                marketValidation,
                sentiment: signal.analysis?.sentiment,
            };
        }
        catch (error) {
            logger_1.logger.error('Error analyzing trend:', error);
            return {
                organicGrowth: 0,
                sustainedInterest: false,
                realWorldImpact: false,
                growthRate: { day: 0, week: 0, month: 0 },
                engagement: { depth: 0, breadth: 0, consistency: 0 },
                marketValidation: { realDemand: 0, problemSolution: 0, marketFit: 0 },
            };
        }
    }
    async calculateGrowthRate(signal) {
        // Calculate growth rates over different time periods
        return {
            day: this.calculatePeriodGrowth(signal, 'day'),
            week: this.calculatePeriodGrowth(signal, 'week'),
            month: this.calculatePeriodGrowth(signal, 'month'),
        };
    }
    calculatePeriodGrowth(signal, period) {
        const now = new Date();
        const periodStart = new Date();
        switch (period) {
            case 'day':
                periodStart.setDate(now.getDate() - 1);
                break;
            case 'week':
                periodStart.setDate(now.getDate() - 7);
                break;
            case 'month':
                periodStart.setMonth(now.getMonth() - 1);
                break;
        }
        // Use signal's trend metrics if available
        if (signal.trendMetrics) {
            switch (period) {
                case 'day':
                    return signal.trendMetrics.momentum || 0;
                case 'week':
                    return signal.trendMetrics.growth || 0;
                case 'month':
                    return signal.trendMetrics.volume - signal.trendMetrics.seasonality || 0;
            }
        }
        return 0;
    }
    async analyzeEngagement(signal) {
        return {
            depth: this.calculateEngagementDepth(signal),
            breadth: this.calculateEngagementBreadth(signal),
            consistency: this.calculateEngagementConsistency(signal),
        };
    }
    calculateEngagementDepth(signal) {
        if (!signal.context)
            return 0;
        // Consider multiple engagement factors
        const factors = {
            priceRange: signal.context.priceRange ? 0.2 : 0,
            topics: signal.context.topics.length * 0.1,
            keywords: signal.context.keywords.length * 0.05,
            sentiment: Math.abs(signal.context.sentiment) * 0.2,
            urgency: signal.context.urgency * 0.2,
        };
        return Object.values(factors).reduce((sum, value) => sum + value, 0);
    }
    calculateEngagementBreadth(signal) {
        if (!signal.context?.marketTrends)
            return 0;
        const { volume, growth } = signal.context.marketTrends;
        return Math.min(volume * 0.6 + growth * 0.4, 1);
    }
    calculateEngagementConsistency(signal) {
        if (!signal.context?.marketTrends)
            return 0;
        return Math.max(0, 1 - Math.abs(signal.context.marketTrends.seasonality));
    }
    async validateMarket(signal) {
        return {
            realDemand: this.assessRealDemand(signal),
            problemSolution: this.assessProblemSolution(signal),
            marketFit: this.assessMarketFit(signal),
        };
    }
    assessRealDemand(signal) {
        if (!signal.context?.marketTrends)
            return 0;
        const { volume, momentum } = signal.context.marketTrends;
        return Math.min(volume * 0.7 + momentum * 0.3, 1);
    }
    assessProblemSolution(signal) {
        if (!signal.context)
            return 0;
        const hasClearProblem = signal.context.keywords.some((k) => k.includes('problem') || k.includes('need') || k.includes('issue'));
        const hasSolution = signal.context.keywords.some((k) => k.includes('solution') || k.includes('fix') || k.includes('resolve'));
        return hasClearProblem && hasSolution ? 1 : 0;
    }
    assessMarketFit(signal) {
        if (!signal.context?.marketTrends || !signal.context.competitiveAnalysis)
            return 0;
        const marketPotential = signal.context.marketTrends.volume * 0.4 + signal.context.marketTrends.growth * 0.6;
        return Math.min(marketPotential, 1);
    }
    calculateOrganicGrowth(growthRate, engagement) {
        const growthScore = growthRate.day * 0.2 + growthRate.week * 0.3 + growthRate.month * 0.5;
        const engagementScore = engagement.depth * 0.4 + engagement.breadth * 0.3 + engagement.consistency * 0.3;
        return Math.min(growthScore * 0.6 + engagementScore * 0.4, 1);
    }
    evaluateSustainedInterest(engagement) {
        const sustainedScore = engagement.depth * 0.3 + engagement.breadth * 0.3 + engagement.consistency * 0.4;
        return sustainedScore > 0.7;
    }
    async assessRealWorldImpact(signal) {
        if (!signal.context)
            return false;
        const hasRealWorldIndicators = signal.context.keywords.some((k) => k.includes('impact') || k.includes('result') || k.includes('outcome'));
        const hasValidation = signal.validation?.isValid && signal.validation.confidence > 0.7;
        return hasRealWorldIndicators && hasValidation;
    }
}
exports.TrendAnalyzer = TrendAnalyzer;
//# sourceMappingURL=trendAnalyzer.js.map