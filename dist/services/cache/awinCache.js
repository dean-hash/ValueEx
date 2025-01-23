"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinCache = void 0;
const logger_1 = require("../../logger/logger");
class AwinCache {
    constructor() {
        this.TTL = 5 * 60 * 1000; // 5 minutes
        this.cache = new Map();
        this.logger = new logger_1.Logger('AwinCache');
    }
    static getInstance() {
        if (!AwinCache.instance) {
            AwinCache.instance = new AwinCache();
        }
        return AwinCache.instance;
    }
    generateKey(pattern) {
        const keyParts = [pattern.searchTerm, pattern.category, pattern.minPrice, pattern.maxPrice].map((part) => String(part));
        return keyParts.join('::');
    }
    isExpired(timestamp) {
        return Date.now() - timestamp > this.TTL;
    }
    isSimilarPattern(cached, current) {
        return (cached.searchTerm === current.searchTerm &&
            cached.category === current.category &&
            Math.abs(cached.minPrice - current.minPrice) < 10 &&
            Math.abs(cached.maxPrice - current.maxPrice) < 10);
    }
    set(pattern, products) {
        const key = this.generateKey(pattern);
        this.cache.set(key, {
            data: products,
            timestamp: Date.now(),
            pattern,
        });
        this.logger.debug('Cached products for pattern', { key, productCount: products.length });
    }
    get(pattern) {
        const key = this.generateKey(pattern);
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (this.isExpired(entry.timestamp)) {
            this.cache.delete(key);
            return null;
        }
        if (!this.isSimilarPattern(entry.pattern, pattern)) {
            return null;
        }
        this.logger.debug('Cache hit for pattern', { key });
        return entry.data;
    }
    clear() {
        this.cache.clear();
        this.logger.info('Cache cleared');
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry.timestamp)) {
                this.cache.delete(key);
            }
        }
        this.logger.info('Cache cleanup completed');
    }
}
exports.AwinCache = AwinCache;
//# sourceMappingURL=awinCache.js.map