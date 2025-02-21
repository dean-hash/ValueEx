import { ResponseMetrics, ResponseRules } from '../types/affiliate';
export declare class RedditManager {
    private reddit;
    private postHistory;
    private rateLimiter;
    constructor(config: {
        userAgent: string;
        clientId: string;
        clientSecret: string;
        refreshToken: string;
    });
    getRelevantThreads(subreddit: string, keywords: string[]): Promise<any[]>;
    postResponse(threadId: string, response: string): Promise<boolean>;
    getUserMetrics(username: string): Promise<ResponseMetrics>;
    private calculateKarmaRatio;
    private calculateCommunityStanding;
    canPostInSubreddit(subreddit: string, rules: ResponseRules): Promise<boolean>;
    updatePostCount(subreddit: string): Promise<void>;
}
