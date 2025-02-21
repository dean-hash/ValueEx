import { ResponseMetrics } from '../types/affiliate';
export declare class MetricsCollector {
    private events;
    private static instance;
    private constructor();
    static getInstance(): MetricsCollector;
    trackResponse(subreddit: string, question: string, response: string, metrics: ResponseMetrics): Promise<void>;
    trackEngagement(responseId: string, type: 'upvote' | 'comment' | 'report', value: number): Promise<void>;
    trackConversion(responseId: string, revenue: number): Promise<void>;
    trackError(type: string, error: Error, context?: any): Promise<void>;
    private processMetrics;
    private calculateAvgResponseLength;
    private calculateQualityScore;
    private countEngagement;
    private calculateRevenue;
    private categorizeErrors;
    private calculateHelpfulnessRatio;
    private calculateCommunityImpact;
    private checkAlerts;
    getMetricsSummary(timeframe?: number): Promise<any>;
}
