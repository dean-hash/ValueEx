interface ResponseLoopConfig {
    subreddits: string[];
    keywords: string[];
    maxConcurrent: number;
    checkInterval: number;
}
export declare class ResponseLoop {
    private config;
    private static instance;
    private isRunning;
    private activeResponses;
    private lastCheck;
    private affiliateManager;
    private redditManager;
    private rateLimiter;
    private metricsCollector;
    private alertManager;
    private constructor();
    static getInstance(config: ResponseLoopConfig): ResponseLoop;
    start(): Promise<void>;
    stop(): Promise<void>;
    private checkSubreddits;
    private canCheckSubreddit;
    private processThread;
    getStatus(): any;
}
export {};
