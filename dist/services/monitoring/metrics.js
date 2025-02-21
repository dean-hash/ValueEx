"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class MetricsCollector extends events_1.EventEmitter {
    constructor() {
        super();
        this.errorWindow = [];
        this.ERROR_WINDOW_SIZE = 100;
        this.thresholds = {
            processingTime: 1000, // 1 second
            errorRate: 0.1, // 10% error rate
            responseTime: 2000, // 2 seconds
            cpuUsage: 80, // 80% CPU usage
            memoryUsage: 80, // 80% memory usage
            diskUsage: 90, // 90% disk usage
        };
        this.apiMetrics = new Map();
        this.resourceMetrics = new Map();
        this.setupAlertChecks();
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    setupAlertChecks() {
        setInterval(() => {
            this.checkErrorRate();
            this.checkResourceUsage();
        }, 60000); // Check every minute
    }
    checkErrorRate() {
        const errorRate = this.errorWindow.reduce((sum, val) => sum + val, 0) / this.ERROR_WINDOW_SIZE;
        if (errorRate > this.thresholds.errorRate) {
            const alert = {
                type: 'error_rate',
                severity: 'warning',
                message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${this.thresholds.errorRate * 100}%`,
                timestamp: Date.now(),
            };
            this.emit('alert', alert);
            logger_1.logger.warn(alert.message);
        }
    }
    checkResourceUsage() {
        const cpuUsage = this.getAverageMetric('cpu');
        const memoryUsage = this.getAverageMetric('memory');
        const diskUsage = this.getAverageMetric('disk');
        if (cpuUsage > this.thresholds.cpuUsage) {
            this.emitAlert('cpu_usage', 'warning', `CPU usage ${cpuUsage.toFixed(1)}% exceeds threshold ${this.thresholds.cpuUsage}%`);
        }
        if (memoryUsage > this.thresholds.memoryUsage) {
            this.emitAlert('memory_usage', 'critical', `Memory usage ${memoryUsage.toFixed(1)}% exceeds threshold ${this.thresholds.memoryUsage}%`);
        }
        if (diskUsage > this.thresholds.diskUsage) {
            this.emitAlert('disk_usage', 'critical', `Disk usage ${diskUsage.toFixed(1)}% exceeds threshold ${this.thresholds.diskUsage}%`);
        }
    }
    emitAlert(type, severity, message, data) {
        const alert = {
            type,
            severity,
            message,
            timestamp: Date.now(),
            data,
        };
        this.emit('alert', alert);
        logger_1.logger.warn(message);
    }
    recordApiMetrics(api, metrics) {
        try {
            // Update error window
            if (metrics.requests > 0) {
                this.errorWindow.push(metrics.errors / metrics.requests);
                if (this.errorWindow.length > this.ERROR_WINDOW_SIZE) {
                    this.errorWindow.shift();
                }
            }
            // Update API metrics
            this.apiMetrics.set(api, {
                ...this.apiMetrics.get(api),
                ...metrics,
            });
            // Check for rate limit warnings
            if (metrics.requests > 90) {
                // Approaching rate limit
                this.emitAlert('api_rate_limit', 'warning', `API ${api} is approaching rate limit: ${metrics.requests} requests`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error recording API metrics:', error);
        }
    }
    recordResourceMetric(resource, value) {
        try {
            if (!this.resourceMetrics.has(resource)) {
                this.resourceMetrics.set(resource, []);
            }
            const data = this.resourceMetrics.get(resource);
            data.push(value);
            // Keep only last 1000 data points
            if (data.length > 1000) {
                data.shift();
            }
        }
        catch (error) {
            logger_1.logger.error('Error recording resource metric:', error);
        }
    }
    getApiMetrics() {
        const result = {};
        this.apiMetrics.forEach((metrics, api) => {
            result[api] = metrics;
        });
        return result;
    }
    getResourceMetrics() {
        const result = {};
        this.resourceMetrics.forEach((metrics, resource) => {
            result[resource] = metrics;
        });
        return result;
    }
    getAverageMetric(key) {
        const data = this.resourceMetrics.get(key) || [];
        if (data.length === 0)
            return 0;
        return data.reduce((sum, value) => sum + value, 0) / data.length;
    }
    clearMetrics() {
        this.apiMetrics.clear();
        this.resourceMetrics.clear();
        this.errorWindow.length = 0;
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics.js.map