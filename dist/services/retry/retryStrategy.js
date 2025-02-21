"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryStrategy = void 0;
const logger_1 = require("../../logger/logger");
class RetryStrategy {
    constructor() {
        this.defaultConfig = {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2,
            timeout: 30000,
        };
        this.logger = new logger_1.Logger('RetryStrategy');
    }
    static getInstance() {
        if (!RetryStrategy.instance) {
            RetryStrategy.instance = new RetryStrategy();
        }
        return RetryStrategy.instance;
    }
    calculateDelay(attempt, config) {
        const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
        return Math.min(delay, config.maxDelay);
    }
    isRetryableError(error) {
        // Network errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }
        // Rate limiting
        if (error.response?.status === 429) {
            return true;
        }
        // Server errors
        if (error.response?.status >= 500 && error.response?.status < 600) {
            return true;
        }
        // Specific API errors that we know are temporary
        if (error.response?.data?.error?.type === 'temporary_error') {
            return true;
        }
        return false;
    }
    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async execute(operation, customConfig = {}) {
        const config = { ...this.defaultConfig, ...customConfig };
        let lastError;
        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timed out')), config.timeout);
                });
                const result = await Promise.race([operation(), timeoutPromise]);
                if (attempt > 1) {
                    this.logger.info('Operation succeeded after retry', { attempt });
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (!this.isRetryableError(error) || attempt === config.maxAttempts) {
                    this.logger.error('Operation failed permanently', {
                        error: error.message,
                        attempt,
                        maxAttempts: config.maxAttempts,
                    });
                    throw error;
                }
                const delay = this.calculateDelay(attempt, config);
                this.logger.warn('Operation failed, retrying', {
                    error: error.message,
                    attempt,
                    nextDelay: delay,
                });
                await this.delay(delay);
            }
        }
        throw lastError;
    }
    // Specialized retry strategies for different scenarios
    async withAdaptiveRetry(operation) {
        return this.execute(operation, {
            maxAttempts: 5,
            initialDelay: 500,
            backoffFactor: 1.5,
        });
    }
    async withAggressiveRetry(operation) {
        return this.execute(operation, {
            maxAttempts: 7,
            initialDelay: 200,
            backoffFactor: 1.2,
        });
    }
    async withGentleRetry(operation) {
        return this.execute(operation, {
            maxAttempts: 3,
            initialDelay: 2000,
            backoffFactor: 2.5,
        });
    }
}
exports.RetryStrategy = RetryStrategy;
//# sourceMappingURL=retryStrategy.js.map