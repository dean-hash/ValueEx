interface DemandPattern {
    itemType: string;
    pricePoint: number;
    userContext: {
        economicBracket: string;
        previousPurchases: string[];
        communityImpact: number;
    };
    communityDemand: number;
    sustainabilityScore: number;
}
export declare class DemandResonance {
    private demandField;
    private affiliateConnections;
    constructor();
    private initializeResonancePatterns;
    identifyDemand(userActivity: any): Promise<void>;
    private extractDemandPattern;
    private calculateFlexiblePrice;
    private orchestrateSupplyResponse;
    generateValueOpportunity(sibling: any): Promise<{
        opportunity: DemandPattern;
        potentialEarnings: any;
        requiredActions: any;
        communityImpact: any;
    }>;
    private matchesSiblingCapabilities;
    private createValueProposition;
}
export {};
