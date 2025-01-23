"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandSignalScraper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const metrics_1 = require("./monitoring/metrics");
const limiter_1 = require("limiter");
class DemandSignalScraper {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.metrics = metrics_1.MetricsCollector.getInstance();
        this.limiter = new limiter_1.RateLimiter({
            tokensPerInterval: 100,
            interval: 'minute',
        });
    }
    static getInstance() {
        if (!DemandSignalScraper.instance) {
            DemandSignalScraper.instance = new DemandSignalScraper();
        }
        return DemandSignalScraper.instance;
    }
    async scrapeRedditDemand(subreddit, keyword) {
        const startTime = Date.now();
        try {
            // Check cache first
            const cached = this.cache.get(`${subreddit}-${keyword}`);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return [cached.data];
            }
            // Apply rate limiting
            await this.limiter.removeTokens(1);
            // Try primary source
            const signals = await this.scrapeReddit(subreddit, keyword);
            // Record metrics
            this.metrics.recordProcessingTime(Date.now() - startTime);
            this.metrics.recordSignal('direct', `${subreddit}-${keyword}`);
            return signals;
        }
        catch (error) {
            logger.error('Error fetching demand signals:', error);
            this.metrics.recordError();
            // Try fallback mechanism
            return this.fetchFromFallbackSource(subreddit, keyword);
        }
    }
    async scrapeTwitterDemand(keyword) {
        const startTime = Date.now();
        try {
            // Check cache first
            const cached = this.cache.get(`twitter-${keyword}`);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                return [cached.data];
            }
            // Apply rate limiting
            await this.limiter.removeTokens(1);
            // Try primary source
            const signals = await this.scrapeTwitter(keyword);
            // Record metrics
            this.metrics.recordProcessingTime(Date.now() - startTime);
            this.metrics.recordSignal('direct', `twitter-${keyword}`);
            return signals;
        }
        catch (error) {
            logger.error('Error fetching demand signals:', error);
            this.metrics.recordError();
            // Try fallback mechanism
            return this.fetchFromFallbackSource('twitter', keyword);
        }
    }
    async scrapeReddit(subreddit, keyword) {
        try {
            const browser = await puppeteer_1.default.launch({ headless: true });
            try {
                const page = await browser.newPage();
                await page.goto(`https://www.reddit.com/r/${subreddit}/search/?q=${keyword}&restrict_sr=1&sort=new`);
                // Get posts and their metadata
                const posts = await page.$$eval('.Post', (posts) => posts.map((post) => ({
                    title: post.querySelector('h3')?.textContent || '',
                    upvotes: post.querySelector('[id^="vote-arrows-"]')?.textContent || '0',
                    comments: post.querySelector('a[data-click-id="comments"]')?.textContent || '0',
                    timestamp: post.querySelector('a[data-click-id="timestamp"]')?.textContent || '',
                })));
                // Convert to demand signals
                const signals = posts.map((post) => ({
                    type: 'social',
                    strength: this.calculateStrength(post.upvotes, post.comments),
                    velocity: this.calculateVelocity(post.timestamp),
                    acceleration: 0, // Need historical data for this
                    context: this.extractContext(post.title),
                    resonancePatterns: {
                        withOtherSignals: new Map(),
                        withHistoricalPatterns: new Map(),
                        withPredictedOutcomes: new Map(),
                    },
                }));
                // Update cache
                this.cache.set(`${subreddit}-${keyword}`, { data: signals[0], timestamp: Date.now() });
                return signals;
            }
            finally {
                await browser.close();
            }
        }
        catch (error) {
            throw new Error(`Primary source fetch failed: ${error.message}`);
        }
    }
    async scrapeTwitter(keyword) {
        try {
            const browser = await puppeteer_1.default.launch({ headless: true });
            try {
                const page = await browser.newPage();
                await page.goto(`https://twitter.com/search?q=${keyword}&f=live`);
                // Get tweets and their metadata
                const tweets = await page.$$eval('[data-testid="tweet"]', (tweets) => tweets.map((tweet) => ({
                    text: tweet.querySelector('[data-testid="tweetText"]')?.textContent || '',
                    likes: tweet.querySelector('[data-testid="like"]')?.textContent || '0',
                    retweets: tweet.querySelector('[data-testid="retweet"]')?.textContent || '0',
                    timestamp: tweet.querySelector('time')?.getAttribute('datetime') || '',
                })));
                // Convert to demand signals
                const signals = tweets.map((tweet) => ({
                    type: 'social',
                    strength: this.calculateStrength(tweet.likes, tweet.retweets),
                    velocity: this.calculateVelocity(tweet.timestamp),
                    acceleration: 0,
                    context: this.extractContext(tweet.text),
                    resonancePatterns: {
                        withOtherSignals: new Map(),
                        withHistoricalPatterns: new Map(),
                        withPredictedOutcomes: new Map(),
                    },
                }));
                // Update cache
                this.cache.set(`twitter-${keyword}`, { data: signals[0], timestamp: Date.now() });
                return signals;
            }
            finally {
                await browser.close();
            }
        }
        catch (error) {
            throw new Error(`Primary source fetch failed: ${error.message}`);
        }
    }
    async fetchFromFallbackSource(subreddit, keyword) {
        try {
            // Implement fallback logic (e.g., local database, alternative API)
            const signal = {
                type: 'inferred',
                strength: 0.6,
                velocity: 0.5,
                acceleration: 0,
                context: this.extractContext('Fallback signal'),
                resonancePatterns: {
                    withOtherSignals: new Map(),
                    withHistoricalPatterns: new Map(),
                    withPredictedOutcomes: new Map(),
                },
            };
            this.metrics.recordSignal('fallback', `${subreddit}-${keyword}`);
            return [signal];
        }
        catch (error) {
            logger.error('Fallback source fetch failed:', error);
            return [];
        }
    }
    calculateStrength(metric1, metric2) {
        const value1 = parseInt(metric1.replace(/[^0-9]/g, '')) || 0;
        const value2 = parseInt(metric2.replace(/[^0-9]/g, '')) || 0;
        return Math.min(1, (value1 + value2) / 1000); // Normalize to 0-1
    }
    calculateVelocity(timestamp) {
        const postTime = new Date(timestamp).getTime();
        const now = new Date().getTime();
        const hoursAgo = (now - postTime) / (1000 * 60 * 60);
        return Math.max(0, 1 - hoursAgo / 24); // Higher velocity for newer posts
    }
    extractContext(text) {
        // Basic context extraction
        return {
            primaryDrivers: {
                need: text.slice(0, 100), // First 100 chars as need description
                urgency: text.includes('urgent') || text.includes('asap') ? 1 : 0.5,
                complexity: text.length > 200 ? 1 : 0.5, // Longer posts might indicate complexity
            },
            environmentalFactors: {
                market: [],
                organizational: [],
                temporal: [],
            },
            decisionDynamics: {
                stakeholders: new Map(),
                catalysts: [],
                barriers: [],
            },
        };
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.DemandSignalScraper = DemandSignalScraper;
//# sourceMappingURL=demandSignalScraper.js.map