import { DemandSignal } from '../../types/mvp/demand';
interface ValueMetrics {
    engagementQuality: number;
    userSatisfaction: number;
    valueConversion: number;
    predictedImpact: number;
}
interface BiddingStrategy {
    resourceAllocation: number;
    timing: 'immediate' | 'scheduled';
    priority: number;
    expectedValue: number;
}
export declare class ValueOptimizer {
    private static instance;
    private bigQuery;
    private contentAnalyzer;
    private trendAnalyzer;
    private influenceAnalyzer;
    private constructor();
    static getInstance(): ValueOptimizer;
    optimizeValue(signal: DemandSignal): Promise<{
        metrics: ValueMetrics;
        strategy: BiddingStrategy;
        insights: string[];
    }>;
    private analyzeCurrentValue;
    private predictValueImpact;
    private determineBiddingStrategy;
    private queryHistoricalData;
    private applyPredictiveModel;
    private calculateResourceAllocation;
    private calculatePriority;
    private generateValueInsights;
}
export {};
