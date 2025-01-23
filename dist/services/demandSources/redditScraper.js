"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedditScraper = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = require("../../utils/logger");
class RedditScraper {
    constructor() {
        this.name = 'reddit';
        this.weight = 0.3;
        // ... include all the methods we fixed earlier ...
    }
    // Move all the Reddit-specific code from demandScraper.ts here
    // This includes all the methods we just fixed
    async scrape(query, options) {
        const subreddits = options?.subreddits || ['technology', 'programming', 'webdev', 'software'];
        const signals = [];
        await Promise.all(subreddits.map(async (subreddit) => {
            try {
                const subredditSignals = await this.scrapeSubreddit(subreddit, query);
                signals.push(...subredditSignals);
            }
            catch (error) {
                logger_1.logger.error(`Error scraping subreddit ${subreddit}`, { error });
            }
        }));
        return signals;
    }
    validateSignal(signal) {
        const requiredFields = [
            signal.id,
            signal.title,
            signal.content,
            signal.url,
            signal.timestamp,
            signal.confidence?.overall,
            signal.context?.author?.id,
            signal.context?.community?.name,
        ];
        return requiredFields.filter(Boolean).length === requiredFields.length;
    }
    async scrapeSubreddit(subreddit, query) {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=10`;
        try {
            const response = await (0, node_fetch_1.default)(url, {
                headers: {
                    'User-Agent': 'ValueEx/1.0.0',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const posts = data.data.children;
            return posts
                .map((post) => ({
                id: post.data.id,
                title: post.data.title,
                content: post.data.selftext || post.data.title,
                url: `https://reddit.com${post.data.permalink}`,
                timestamp: new Date(post.data.created_utc * 1000).toISOString(),
                confidence: {
                    overall: post.data.score / 100, // Normalize score
                    factors: {
                        textQuality: 0.8,
                        communityEngagement: post.data.num_comments / 50,
                        authorCredibility: 0.7,
                        contentRelevance: post.data.upvote_ratio,
                        temporalRelevance: 0.9,
                    },
                },
                context: {
                    thread: {
                        id: post.data.id,
                        isOriginalPost: true,
                        depth: 0,
                    },
                    author: {
                        id: post.data.author,
                    },
                    community: {
                        name: post.data.subreddit,
                        size: post.data.subreddit_subscribers,
                        topicRelevance: 0.8,
                    },
                },
                analysis: {
                    sentiment: 0, // Will be filled by Digital Intelligence
                    topics: [],
                    pricePoints: [],
                    features: {},
                    relationships: {
                        relatedThreads: [],
                        crossReferences: [],
                        temporalConnections: [],
                    },
                },
                metadata: {
                    processingTime: Date.now(),
                    extractionVersion: '1.0.0',
                    dataQualityScore: 0.8,
                },
            }))
                .filter((signal) => this.validateSignal(signal));
        }
        catch (error) {
            logger_1.logger.error(`Error scraping subreddit ${subreddit}:`, { error });
            return [];
        }
    }
}
exports.RedditScraper = RedditScraper;
//# sourceMappingURL=redditScraper.js.map