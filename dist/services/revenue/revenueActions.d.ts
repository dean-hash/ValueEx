interface RevenueAction {
    type: 'affiliate' | 'domain' | 'partnership' | 'market';
    estimatedValue: number;
    timeToValue: number;
    requirements: string[];
    execute: () => Promise<number>;
}
export declare class RevenueActions {
    private static instance;
    private revenueTracker;
    private awinClient;
    private opportunityMatcher;
    private domainEndpoint;
    private affiliateEndpoint;
    private marketEndpoint;
    private constructor();
    static getInstance(): RevenueActions;
    private readonly ACTIONS;
    private findFlippableDomains;
    private flipDomain;
    private findAffiliateOpportunities;
    private boostAffiliate;
    private executeAffiliateStep;
    private executeSignup;
    private generateContent;
    private executePromotion;
    private findMarketOpportunities;
    private executeMarketMaking;
    private findPartnershipOpportunities;
    private activatePartnership;
    executeAction(actionKey: keyof typeof this.ACTIONS): Promise<number>;
    getAvailableActions(): Array<{
        key: string;
        action: RevenueAction;
    }>;
    getEstimatedValue(actionKey: string): number;
    getTimeToValue(actionKey: string): number;
}
export {};
