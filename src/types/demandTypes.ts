export interface PricePoint {
    value: number;
    currency: string;
    context: string;
    confidence: number;
}

export interface Feature {
    name: string;
    sentiment: number;
    mentions: number;
    context: string[];
}

export interface RedditPost {
    id: string;
    title: string;
    selftext: string;
    permalink: string;
    created_utc: number;
    author: string;
    score: number;
    num_comments: number;
    upvote_ratio: number;
    total_awards_received: number;
    author_karma?: number;
    author_created_utc?: number;
    author_verified?: boolean;
    subreddit: string;
    subreddit_subscribers: number;
    over_18: boolean;
    parent_id?: string;
    depth?: number;
    data?: any;
}

export interface RedditComment {
    id: string;
    body: string;
    author: string;
    created_utc: number;
    score: number;
    depth: number;
    parent_id: string;
    data?: any;
}

export interface ScrapedDemandSignal {
    id: string;
    title: string;
    content: string;
    url: string;
    timestamp: string;
    confidence: {
        overall: number;
        factors: {
            textQuality: number;
            communityEngagement: number;
            authorCredibility: number;
            contentRelevance: number;
            temporalRelevance: number;
        };
    };
    context: {
        thread: {
            id: string;
            parentId?: string;
            depth: number;
            isOriginalPost: boolean;
        };
        author: {
            id: string;
            karmaScore?: number;
            accountAge?: number;
            domainActivity?: number;
        };
        community: {
            name: string;
            size?: number;
            topicRelevance: number;
            activityLevel?: number;
        };
    };
    analysis: {
        sentiment: number;
        topics: Array<{
            name: string;
            confidence: number;
            keywords: string[];
        }>;
        pricePoints: Array<{
            value: number;
            currency: string;
            confidence: number;
            context: string;
        }>;
        features: {
            [category: string]: Array<{
                name: string;
                sentiment: number;
                confidence: number;
                mentions: number;
                context: string[];
            }>;
        };
        relationships: {
            relatedThreads: string[];
            crossReferences: string[];
            temporalConnections: string[];
        };
    };
    metadata: {
        processingTime: number;
        extractionVersion: string;
        dataQualityScore: number;
    };
}

export interface DemandSignal extends ScrapedDemandSignal {
    id: string;
    resonanceScore: number;
    valueMetrics: {
        authenticity: number;
        relevance: number;
        impact: number;
    };
    metadata: {
        processedAt: string;
        version: string;
    };
}
