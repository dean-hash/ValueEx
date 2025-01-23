export interface AffiliateResponse {
    content: string;
    affiliateLink?: string;
    disclosure: string;
    metrics: ResponseMetrics;
}
export interface ResponseMetrics {
    questionAnswered: boolean;
    detailLevel: number;
    sourcesProvided: boolean;
    upvotes: number;
    comments: number;
    reportCount: number;
    clickCount: number;
    conversionCount: number;
    karmaBalance: number;
    communityStanding: number;
}
export interface ResponseRules {
    minDetailLevel: number;
    minKarmaRatio: number;
    maxDailyPosts: number;
    requiredDisclosure: string;
    bannedSubreddits: string[];
    minAccountAge: number;
    minKarma: number;
}
