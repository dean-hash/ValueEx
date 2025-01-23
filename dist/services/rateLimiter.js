"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.configs = new Map();
        // Default configs for different actions
        this.configs.set('reddit_post', {
            requestsPerMinute: 1,
            requestsPerHour: 10,
            requestsPerDay: 50,
            cooldownMs: 30000, // 30 seconds between posts
        });
        this.configs.set('reddit_read', {
            requestsPerMinute: 30,
            requestsPerHour: 300,
            requestsPerDay: 1000,
            cooldownMs: 1000,
        });
        this.configs.set('subreddit', {
            requestsPerMinute: 1,
            requestsPerHour: 5,
            requestsPerDay: 20,
            cooldownMs: 60000,
        });
    }
    async canMakeRequest(action, identifier) {
        const key = `${action}:${identifier}`;
        const config = this.configs.get(action);
        if (!config) {
            throw new Error(`No rate limit config for action: ${action}`);
        }
        let limit = this.limits.get(key);
        const now = Date.now();
        // Initialize if not exists
        if (!limit) {
            limit = {
                requests: 0,
                lastReset: now,
                nextAllowed: now,
            };
            this.limits.set(key, limit);
        }
        // Reset counters if needed
        if (now - limit.lastReset >= 86400000) {
            // 24 hours
            limit.requests = 0;
            limit.lastReset = now;
        }
        // Check all limits
        if (limit.requests >= config.requestsPerDay)
            return false;
        if (now < limit.nextAllowed)
            return false;
        // Calculate requests in last minute and hour
        const requestsLastMinute = await this.getRequestsInTimeframe(key, 60000);
        const requestsLastHour = await this.getRequestsInTimeframe(key, 3600000);
        if (requestsLastMinute >= config.requestsPerMinute)
            return false;
        if (requestsLastHour >= config.requestsPerHour)
            return false;
        return true;
    }
    async recordRequest(action, identifier) {
        const key = `${action}:${identifier}`;
        const config = this.configs.get(action);
        if (!config) {
            throw new Error(`No rate limit config for action: ${action}`);
        }
        let limit = this.limits.get(key);
        const now = Date.now();
        if (!limit) {
            limit = {
                requests: 0,
                lastReset: now,
                nextAllowed: now,
            };
        }
        limit.requests++;
        limit.nextAllowed = now + config.cooldownMs;
        this.limits.set(key, limit);
    }
    async getRequestsInTimeframe(key, timeframe) {
        const limit = this.limits.get(key);
        if (!limit)
            return 0;
        const now = Date.now();
        if (now - limit.lastReset <= timeframe) {
            return limit.requests;
        }
        return 0;
    }
    setConfig(action, config) {
        this.configs.set(action, config);
    }
    clearLimits(action, identifier) {
        const key = `${action}:${identifier}`;
        this.limits.delete(key);
    }
    // Helper method to get current limits for monitoring
    getLimitStatus(action, identifier) {
        const key = `${action}:${identifier}`;
        const limit = this.limits.get(key);
        const config = this.configs.get(action);
        if (!limit || !config)
            return null;
        return {
            remaining: config.requestsPerDay - limit.requests,
            resetIn: Math.max(0, limit.nextAllowed - Date.now()),
        };
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map