"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheAnalytics = void 0;
class CacheAnalytics {
    constructor() {
        this.hits = 0;
        this.misses = 0;
    }
    static getInstance() {
        if (!CacheAnalytics.instance) {
            CacheAnalytics.instance = new CacheAnalytics();
        }
        return CacheAnalytics.instance;
    }
    recordHit() {
        this.hits++;
    }
    recordMiss() {
        this.misses++;
    }
    getStats() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }
    reset() {
        this.hits = 0;
        this.misses = 0;
    }
}
exports.CacheAnalytics = CacheAnalytics;
//# sourceMappingURL=cacheAnalytics.js.map