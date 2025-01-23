import { SignalDimension } from './demandPrecognition';
export declare class DemandSignalScraper {
    private static instance;
    private metrics;
    private limiter;
    private cache;
    private readonly CACHE_TTL;
    private constructor();
    static getInstance(): DemandSignalScraper;
    scrapeRedditDemand(subreddit: string, keyword: string): Promise<SignalDimension[]>;
    scrapeTwitterDemand(keyword: string): Promise<SignalDimension[]>;
    private scrapeReddit;
    private scrapeTwitter;
    private fetchFromFallbackSource;
    private calculateStrength;
    private calculateVelocity;
    private extractContext;
    clearCache(): void;
}
