"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheAnalytics = void 0;
var CacheAnalytics = /** @class */ (function () {
    function CacheAnalytics() {
        this.hits = 0;
        this.misses = 0;
    }
    CacheAnalytics.getInstance = function () {
        if (!CacheAnalytics.instance) {
            CacheAnalytics.instance = new CacheAnalytics();
        }
        return CacheAnalytics.instance;
    };
    CacheAnalytics.prototype.recordHit = function () {
        this.hits++;
    };
    CacheAnalytics.prototype.recordMiss = function () {
        this.misses++;
    };
    CacheAnalytics.prototype.getStats = function () {
        var total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    };
    CacheAnalytics.prototype.reset = function () {
        this.hits = 0;
        this.misses = 0;
    };
    return CacheAnalytics;
}());
exports.CacheAnalytics = CacheAnalytics;
