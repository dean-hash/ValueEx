export declare class GeminiService {
    private static instance;
    private config;
    private constructor();
    static getInstance(): GeminiService;
    generateContent(prompt: string): Promise<string>;
    analyzeMarketTrends(niche: string): Promise<string>;
    optimizeDomainValue(domain: string): Promise<string>;
    generateListingDescription(domain: string, marketData: any): Promise<string>;
}
