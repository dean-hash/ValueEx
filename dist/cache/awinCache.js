"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwinCache = void 0;
class AwinCache {
    constructor(ttl = 3600000) {
        // 1 hour default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }
    static getInstance(ttl) {
        if (!AwinCache.instance) {
            AwinCache.instance = new AwinCache(ttl);
        }
        return AwinCache.instance;
    }
    async get(key) {
        const entry = this.cache.get(key);
        return entry || null;
    }
    async set(key, value) {
        this.cache.set(key, value);
        setTimeout(() => {
            this.cache.delete(key);
        }, this.ttl);
    }
    async delete(key) {
        return this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
}
exports.AwinCache = AwinCache;
//# sourceMappingURL=awinCache.js.map