interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    cooldownMs: number;
}
export declare class RateLimiter {
    private limits;
    private configs;
    constructor();
    canMakeRequest(action: string, identifier: string): Promise<boolean>;
    recordRequest(action: string, identifier: string): Promise<void>;
    private getRequestsInTimeframe;
    setConfig(action: string, config: RateLimitConfig): void;
    clearLimits(action: string, identifier: string): void;
    getLimitStatus(action: string, identifier: string): {
        remaining: number;
        resetIn: number;
    } | null;
}
export {};
