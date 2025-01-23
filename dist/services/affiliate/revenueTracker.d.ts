import { Observable } from 'rxjs';
export interface RevenueOpportunity {
    category: string;
    potential: number;
    confidence: number;
    type: 'category_resonance' | 'merchant_direct' | 'market_trend' | 'resonance_amplification';
    timestamp?: Date;
    status?: 'active' | 'pending' | 'completed';
}
export interface RevenueStats {
    totalOpportunities: number;
    projectedRevenue: number;
    byCategory: Record<string, number>;
}
export interface ManifestationResult {
    timestamp: number;
    value: number;
    coherence: number;
    success: boolean;
}
export interface VerifiedIncome {
    amount: number;
    timestamp: Date;
}
export declare class RevenueTracker {
    private static instance;
    private opportunities;
    private earnings;
    private metricsCollector;
    private verifiedIncomeSubject;
    static getInstance(): RevenueTracker;
    trackOpportunity(opportunity: RevenueOpportunity): Promise<void>;
    private updateMetrics;
    private calculateConversionRate;
    getTotalEarnings(): number;
    getOpportunities(): RevenueOpportunity[];
    getStats(): Promise<RevenueStats>;
    getBoardReport(): {
        financials: {
            totalRevenue: number;
            projectedQ1: number;
            runway: string;
        };
        metrics: {
            activeOpportunities: number;
            conversionRate: number;
            customerAcquisitionCost: number;
        };
    };
    trackManifestationResult(result: ManifestationResult): Promise<{
        timestamp: number;
        value: number;
        coherence: number;
        success: boolean;
        metrics: {
            dailyRevenue: void;
            conversionRate: void;
            averageOrderValue: void;
        };
    }>;
    observeVerifiedIncome(): Observable<VerifiedIncome>;
    trackVerifiedIncome(amount: number): void;
    calculateDailyRevenue(): Promise<void>;
    getConversionRate(): Promise<void>;
    getAverageOrderValue(): Promise<void>;
}
