"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheAnalytics = void 0;
const events_1 = require("events");
const logger_1 = require("../../logger/logger");
class CacheAnalytics extends events_1.EventEmitter {
    constructor() {
        super();
        this.events = [];
        this.MAX_EVENTS = 1000;
        this.metrics = {
            hits: 0,
            misses: 0,
            size: 0,
            avgLatency: 0,
            hitRate: 0,
            patternDistribution: new Map(),
        };
        this.logger = new logger_1.Logger('CacheAnalytics');
        this.startPeriodicAnalysis();
    }
    static getInstance() {
        if (!CacheAnalytics.instance) {
            CacheAnalytics.instance = new CacheAnalytics();
        }
        return CacheAnalytics.instance;
    }
    startPeriodicAnalysis() {
        setInterval(() => this.analyzeMetrics(), 60000); // Every minute
    }
    trackEvent(event) {
        this.events.push(event);
        if (this.events.length > this.MAX_EVENTS) {
            this.events.shift();
        }
        // Update real-time metrics
        switch (event.type) {
            case 'hit':
                this.metrics.hits++;
                break;
            case 'miss':
                this.metrics.misses++;
                break;
            case 'set':
                this.metrics.size++;
                if (event.pattern) {
                    const category = event.pattern.category || 'uncategorized';
                    this.metrics.patternDistribution.set(category, (this.metrics.patternDistribution.get(category) || 0) + 1);
                }
                break;
            case 'delete':
                this.metrics.size = Math.max(0, this.metrics.size - 1);
                break;
        }
        // Update latency metrics
        if (event.latency) {
            const totalEvents = this.metrics.hits + this.metrics.misses;
            this.metrics.avgLatency =
                (this.metrics.avgLatency * (totalEvents - 1) + event.latency) / totalEvents;
        }
        // Update hit rate
        const totalRequests = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;
        this.emit('metrics-updated', this.getMetrics());
    }
    analyzeMetrics() {
        const now = Date.now();
        const recentEvents = this.events.filter((e) => now - e.timestamp < 300000 // Last 5 minutes
        );
        const analysis = {
            recentHitRate: this.calculateRecentHitRate(recentEvents),
            popularCategories: this.getPopularCategories(),
            performanceMetrics: {
                avgLatency: this.metrics.avgLatency,
                hitRate: this.metrics.hitRate,
                cacheSize: this.metrics.size,
            },
        };
        this.logger.info('Cache performance analysis', analysis);
        this.emit('analysis-complete', analysis);
    }
    calculateRecentHitRate(events) {
        const hits = events.filter((e) => e.type === 'hit').length;
        return events.length > 0 ? hits / events.length : 0;
    }
    getPopularCategories() {
        return Array.from(this.metrics.patternDistribution.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getAnalytics() {
        return {
            metrics: this.getMetrics(),
            recentEvents: this.events.slice(-50), // Last 50 events
            analysis: {
                popularCategories: this.getPopularCategories(),
                hitRate: this.metrics.hitRate,
                avgLatency: this.metrics.avgLatency,
            },
        };
    }
}
exports.CacheAnalytics = CacheAnalytics;
//# sourceMappingURL=cacheAnalytics.js.map