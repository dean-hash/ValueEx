"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = void 0;
const logger_1 = require("./logger");
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.MAX_METRICS_LENGTH = 1000;
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    measureAsync(operationName, operation, metadata) {
        const startTime = performance.now();
        return operation().finally(() => {
            this.recordMetrics(operationName, startTime, metadata);
        });
    }
    measure(operationName, operation, metadata) {
        const startTime = performance.now();
        try {
            return operation();
        }
        finally {
            this.recordMetrics(operationName, startTime, metadata);
        }
    }
    recordMetrics(operationName, startTime, metadata) {
        const duration = performance.now() - startTime;
        const metrics = {
            operationName,
            duration,
            timestamp: Date.now(),
            metadata,
        };
        this.metrics.push(metrics);
        if (this.metrics.length > this.MAX_METRICS_LENGTH) {
            this.metrics.shift();
        }
        logger_1.logger.debug('Performance metrics recorded', {
            operation: operationName,
            duration,
            ...metadata,
        });
        // Alert if operation takes too long
        if (duration > 100) {
            logger_1.logger.warn('Operation exceeded performance threshold', {
                operation: operationName,
                duration,
                threshold: 100,
                ...metadata,
            });
        }
    }
    getMetrics(operationName) {
        return operationName
            ? this.metrics.filter((m) => m.operationName === operationName)
            : [...this.metrics];
    }
    getAverageMetrics(operationName) {
        const relevantMetrics = this.getMetrics(operationName);
        if (relevantMetrics.length === 0)
            return 0;
        const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / relevantMetrics.length;
    }
}
exports.performanceMonitor = PerformanceMonitor.getInstance();
//# sourceMappingURL=performance.js.map