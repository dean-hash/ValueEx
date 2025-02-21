import { DemandSignal } from '../../types/demandTypes';
import { TrendMetrics } from '../../types/trendTypes';
interface TrendMetrics {
    organicGrowth: number;
    sustainedInterest: boolean;
    realWorldImpact: boolean;
    growthRate: {
        day: number;
        week: number;
        month: number;
    };
    engagement: {
        depth: number;
        breadth: number;
        consistency: number;
    };
    marketValidation: {
        realDemand: number;
        problemSolution: number;
        marketFit: number;
    };
    sentiment?: number;
}
export declare class TrendAnalyzer {
    private static instance;
    private constructor();
    static getInstance(): TrendAnalyzer;
    analyzeTrend(signal: DemandSignal): Promise<TrendMetrics>;
    private calculateGrowthRate;
    private calculatePeriodGrowth;
    private analyzeEngagement;
    private calculateEngagementDepth;
    private calculateEngagementBreadth;
    private calculateEngagementConsistency;
    private validateMarket;
    private assessRealDemand;
    private assessProblemSolution;
    private assessMarketFit;
    private calculateOrganicGrowth;
    private evaluateSustainedInterest;
    private assessRealWorldImpact;
}
export {};
