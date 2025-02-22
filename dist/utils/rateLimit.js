"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = exports.RateLimit = void 0;
class RateLimit {
    constructor() {
        this.limits = new Map([
            ['google_trends', { requestsPerMinute: 30, burstLimit: 5 }],
            ['reddit', { requestsPerMinute: 60, burstLimit: 10 }],
            ['github', { requestsPerMinute: 60, burstLimit: 10 }],
            ['stackoverflow', { requestsPerMinute: 30, burstLimit: 5 }],
            ['wikipedia', { requestsPerMinute: 200, burstLimit: 20 }],
            ['rss', { requestsPerMinute: 100, burstLimit: 15 }],
        ]);
        this.state = new Map();
    }
    async wait(source) {
        const config = this.limits.get(source);
        if (!config) {
            throw new Error(`Unknown rate limit source: ${source}`);
        }
        let state = this.state.get(source);
        if (!state) {
            state = {
                requests: 0,
                lastReset: Date.now(),
                burstCount: 0,
            };
            this.state.set(source, state);
        }
        // Reset counter if minute has passed
        if (Date.now() - state.lastReset >= 60000) {
            state.requests = 0;
            state.lastReset = Date.now();
            state.burstCount = 0;
        }
        // Check if we need to wait
        if (state.requests >= config.requestsPerMinute) {
            const waitTime = 60000 - (Date.now() - state.lastReset);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            state.requests = 0;
            state.lastReset = Date.now();
            state.burstCount = 0;
        }
        // Handle burst limits
        if (config.burstLimit && state.burstCount >= config.burstLimit) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            state.burstCount = 0;
        }
        state.requests++;
        state.burstCount++;
    }
    setLimit(source, config) {
        this.limits.set(source, config);
    }
    getLimit(source) {
        return this.limits.get(source);
    }
    reset(source) {
        this.state.delete(source);
    }
    resetAll() {
        this.state.clear();
    }
}
exports.RateLimit = RateLimit;
exports.rateLimit = new RateLimit();
//# sourceMappingURL=rateLimit.js.map