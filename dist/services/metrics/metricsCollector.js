"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const logger_1 = require("../../utils/logger");
class MetricsCollector {
    constructor() {
        this.metrics = new Map();
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    trackMetric(name, value) {
        this.metrics.set(name, value);
        logger_1.logger.info(`Tracked metric: ${name} = ${value}`);
    }
    getMetric(name) {
        return this.metrics.get(name) || 0;
    }
    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }
    clearMetrics() {
        this.metrics.clear();
        logger_1.logger.info('Cleared all metrics');
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metricsCollector.js.map