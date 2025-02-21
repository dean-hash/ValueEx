import { MarketVertical } from '../../types/marketTypes';
interface CommissionData {
    verticalId: string;
    averageCommission: number;
    averageOrderValue: number;
    successfulMatches: number;
    totalMatches: number;
}
interface ProductCommission {
    productId: string;
    commission: number;
    orderValue: number;
    vertical: MarketVertical;
}
export declare class CommissionTracker {
    private static instance;
    private verticalStats;
    private productStats;
    private constructor();
    static getInstance(): CommissionTracker;
    private initializeVerticalData;
    /**
     * Calculate potential commission for a match
     */
    calculatePotentialCommission(vertical: MarketVertical, price: number): {
        estimatedCommission: number;
        confidence: number;
    };
    /**
     * Track a successful commission
     */
    trackCommission(productId: string, vertical: MarketVertical, commission: number, orderValue: number): void;
    /**
     * Get best performing verticals
     */
    getBestVerticals(): {
        verticalId: string;
        expectedValue: number;
    }[];
    /**
     * Get commission history for analysis
     */
    getCommissionHistory(): {
        byProduct: Map<string, ProductCommission>;
        byVertical: Map<string, CommissionData>;
    };
}
export {};
