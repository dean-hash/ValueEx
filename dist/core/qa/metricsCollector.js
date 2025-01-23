"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
class MetricsCollector extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.collectors = new Map();
        this.initializeDefaultMetrics();
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    initializeDefaultMetrics() {
        const defaultMetrics = [
            { name: 'apiResponseTime', threshold: 500, collectInterval: 5000 },
            { name: 'memoryUsage', threshold: 0.8, collectInterval: 10000 },
            { name: 'errorRate', threshold: 0.05, collectInterval: 15000 },
            { name: 'cpuUsage', threshold: 0.7, collectInterval: 10000 },
        ];
        defaultMetrics.forEach((metric) => {
            this.startCollecting(metric);
        });
    }
    startCollecting(config) {
        const collector = setInterval(async () => {
            const value = await this.collectMetric(config.name);
            this.addMetricPoint(config.name, value);
            if (value > config.threshold) {
                this.emit('threshold-exceeded', {
                    metric: config.name,
                    value,
                    threshold: config.threshold,
                    timestamp: Date.now(),
                });
            }
        }, config.collectInterval);
        this.collectors.set(config.name, collector);
    }
    async collectMetric(name) {
        switch (name) {
            case 'apiResponseTime':
                return await this.measureApiResponseTime();
            case 'memoryUsage':
                return this.measureMemoryUsage();
            case 'errorRate':
                return this.calculateErrorRate();
            case 'cpuUsage':
                return this.measureCpuUsage();
            default:
                return 0;
        }
    }
    async measureApiResponseTime() {
        const start = perf_hooks_1.performance.now();
        try {
            await fetch('/api/health');
            return perf_hooks_1.performance.now() - start;
        }
        catch {
            return Infinity;
        }
    }
    measureMemoryUsage() {
        const used = process.memoryUsage();
        return used.heapUsed / used.heapTotal;
    }
    calculateErrorRate() {
        // Implementation would track errors over time
        return 0.01; // Placeholder
    }
    measureCpuUsage() {
        // Implementation would measure CPU usage
        return 0.5; // Placeholder
    }
    addMetricPoint(name, value) {
        const points = this.metrics.get(name) || [];
        points.push({
            timestamp: Date.now(),
            value,
        });
        // Keep last 100 points
        if (points.length > 100) {
            points.shift();
        }
        this.metrics.set(name, points);
        this.emit('metric-collected', { name, value });
    }
    getMetricHistory(name) {
        return this.metrics.get(name) || [];
    }
    getAllMetrics() {
        return new Map(this.metrics);
    }
    stopCollecting(name) {
        const collector = this.collectors.get(name);
        if (collector) {
            clearInterval(collector);
            this.collectors.delete(name);
        }
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metricsCollector.js.map