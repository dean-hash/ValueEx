"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryStrategy = void 0;
class RetryStrategy {
    constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }
    async execute(fn) {
        let lastError = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < this.maxRetries - 1) {
                    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('Retry failed');
    }
}
exports.RetryStrategy = RetryStrategy;
//# sourceMappingURL=retryStrategy.js.map