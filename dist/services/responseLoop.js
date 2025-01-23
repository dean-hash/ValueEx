"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseLoop = void 0;
const affiliateManager_1 = require("./affiliateManager");
const redditManager_1 = require("./redditManager");
const rateLimiter_1 = require("./rateLimiter");
const metricsCollector_1 = require("./metricsCollector");
const alertManager_1 = require("./alertManager");
class ResponseLoop {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.activeResponses = 0;
        this.lastCheck = {};
        this.affiliateManager = new affiliateManager_1.AffiliateManager();
        this.redditManager = new redditManager_1.RedditManager({
            userAgent: process.env.REDDIT_USER_AGENT,
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            refreshToken: process.env.REDDIT_REFRESH_TOKEN,
        });
        this.rateLimiter = rateLimiter_1.RateLimiter.getInstance();
        this.metricsCollector = metricsCollector_1.MetricsCollector.getInstance();
        this.alertManager = alertManager_1.AlertManager.getInstance();
    }
    static getInstance(config) {
        if (!ResponseLoop.instance) {
            ResponseLoop.instance = new ResponseLoop(config);
        }
        return ResponseLoop.instance;
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('Starting response loop...');
        while (this.isRunning) {
            try {
                await this.checkSubreddits();
                await new Promise((resolve) => setTimeout(resolve, this.config.checkInterval));
            }
            catch (error) {
                console.error('Error in response loop:', error);
                await this.metricsCollector.trackError('responseLoop', error);
            }
        }
    }
    async stop() {
        this.isRunning = false;
        console.log('Stopping response loop...');
    }
    async checkSubreddits() {
        for (const subreddit of this.config.subreddits) {
            if (this.activeResponses >= this.config.maxConcurrent) {
                break;
            }
            try {
                if (!(await this.canCheckSubreddit(subreddit))) {
                    continue;
                }
                const threads = await this.redditManager.getRelevantThreads(subreddit, this.config.keywords);
                for (const thread of threads) {
                    if (this.activeResponses >= this.config.maxConcurrent) {
                        break;
                    }
                    await this.processThread(subreddit, thread);
                }
            }
            catch (error) {
                console.error(`Error checking ${subreddit}:`, error);
                await this.metricsCollector.trackError('subredditCheck', error, { subreddit });
            }
        }
    }
    async canCheckSubreddit(subreddit) {
        const now = Date.now();
        const lastCheck = this.lastCheck[subreddit] || 0;
        // Respect rate limits
        if (!(await this.rateLimiter.canMakeRequest('subreddit_check', subreddit))) {
            return false;
        }
        // Check if enough time has passed
        if (now - lastCheck < this.config.checkInterval) {
            return false;
        }
        this.lastCheck[subreddit] = now;
        return true;
    }
    async processThread(subreddit, thread) {
        this.activeResponses++;
        try {
            // Check if we can respond
            const metrics = await this.redditManager.getUserMetrics(thread.author);
            const canRespond = await this.affiliateManager.canRespond(subreddit, metrics);
            if (!canRespond) {
                return;
            }
            // Generate and post response
            const response = await this.affiliateManager.generateResponse(thread.title + '\n' + thread.selftext, {
                name: 'Relevant Product',
                link: 'http://affiliate.link',
                details: 'Product details',
            });
            if (response) {
                await this.redditManager.postResponse(thread.name, response.content);
                // Track metrics
                await this.metricsCollector.trackResponse(subreddit, thread.title, response.content, metrics);
            }
        }
        catch (error) {
            console.error('Error processing thread:', error);
            await this.metricsCollector.trackError('threadProcess', error, {
                subreddit,
                threadId: thread.name,
            });
        }
        finally {
            this.activeResponses--;
        }
    }
    // Public API for monitoring
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeResponses: this.activeResponses,
            lastChecks: this.lastCheck,
            subreddits: this.config.subreddits,
        };
    }
}
exports.ResponseLoop = ResponseLoop;
//# sourceMappingURL=responseLoop.js.map