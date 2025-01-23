interface DemandPattern {
    category: string;
    pricePoint: {
        min: number;
        max: number;
        optimal: number;
    };
    urgency: number;
    frequency: number;
    conversion: {
        potential: number;
        value: number;
    };
}
interface MerchantOpportunity {
    merchantId: string;
    name: string;
    category: string;
    commission: {
        rate: number;
        type: 'percentage' | 'fixed';
        tiers?: {
            [volume: string]: number;
        };
    };
    products: {
        priceRange: {
            min: number;
            max: number;
        };
        categories: string[];
        uniqueValue: string[];
    };
    requirements: {
        traffic?: number;
        sales?: number;
        platform?: string[];
    };
}
interface OpportunityScore {
    merchant: MerchantOpportunity;
    score: number;
    matchedDemand: DemandPattern[];
    potentialRevenue: number;
    implementationEffort: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}
interface Merchant {
    name: string;
    averageCommission: number;
    conversionRate: number;
    validationStatus: string;
    performance?: {
        reliability: number;
    };
}
interface ResonancePattern {
    name: string;
    resonanceScore: number;
    harmonicFactors: {
        strength: number;
        urgency: number;
        readiness: number;
        confidence: number;
    };
    coherenceMetrics: {
        valueAlignment: number;
        trustFactor: number;
        marketResonance: number;
    };
}
export declare class MerchantOpportunityAnalyzer {
    private demandPatterns;
    private knownMerchants;
    private opportunityScores;
    constructor();
    private initializeAnalysis;
    addDemandPattern(pattern: DemandPattern): void;
    analyzeMerchant(merchant: MerchantOpportunity): OpportunityScore;
    private findMatchingDemandPatterns;
    private calculateOpportunityScore;
    private normalizeCommission;
    private calculatePriceAlignment;
    private estimatePotentialRevenue;
    private estimateImplementationEffort;
    private determinePriority;
    private updateOpportunityScores;
    private calculateImplementationEffort;
    getTopOpportunities(limit?: number): OpportunityScore[];
    generateOpportunityReport(): string;
    analyzeResonancePatterns(merchants: Merchant[]): Promise<ResonancePattern[]>;
    private calculateResonanceScore;
    private measureCoherence;
}
export {};
