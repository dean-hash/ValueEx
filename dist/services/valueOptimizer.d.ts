interface ValueMetrics {
    productId: string;
    merchantValue: number;
    affiliateValue: number;
    userValue: number;
    platformValue: number;
}
export declare class ValueOptimizer {
    private valueHistory;
    optimizeForAllParties<T extends {
        id: string;
        commissionRate: number;
    }>(products: T[], userContext: any): Promise<T[]>;
    recordValueCreation(metrics: ValueMetrics): Promise<void>;
    private calculateTotalValue;
    private optimizeValueDistribution;
    private analyzeValueTrends;
    private calculateAverage;
    private isTrendImproving;
    private calculateDistribution;
    private reinforcePositiveTrends;
    private adjustValueDistribution;
}
export {};
