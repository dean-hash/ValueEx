interface AffiliateProgram {
    name: string;
    baseUrl: string;
    affiliateId: string;
    commission: number;
    category: string;
}
interface AffiliateLink {
    originalUrl: string;
    affiliateUrl: string;
    program: string;
    potentialCommission: number;
}
export declare class AffiliateManager {
    private static instance;
    private programs;
    private revenueTracker;
    private constructor();
    static getInstance(): AffiliateManager;
    addProgram(program: AffiliateProgram): void;
    generateAffiliateLink(url: string, programName: string): Promise<AffiliateLink>;
    getActivePrograms(): Promise<AffiliateProgram[]>;
    getRevenueStats(): Promise<any>;
}
export {};
