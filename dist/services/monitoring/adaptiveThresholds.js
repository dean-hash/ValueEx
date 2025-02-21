"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveThresholdManager = void 0;
const logger_1 = require("../../utils/logger");
class AdaptiveThresholdManager {
    constructor() {
        this.metricWindows = new Map();
        this.thresholdConfigs = new Map();
        // Default configurations for different metric types
        this.thresholdConfigs.set('processing_time', {
            baselineWindow: 60, // 1 hour
            sensitivity: 2.5, // 2.5 standard deviations
            minThreshold: 500, // 500ms minimum
            maxThreshold: 5000, // 5s maximum
        });
        this.thresholdConfigs.set('error_rate', {
            baselineWindow: 30,
            sensitivity: 2.0,
            minThreshold: 0.01, // 1% minimum
            maxThreshold: 0.2, // 20% maximum
        });
        this.thresholdConfigs.set('response_time', {
            baselineWindow: 60,
            sensitivity: 2.5,
            minThreshold: 800, // 800ms minimum
            maxThreshold: 8000, // 8s maximum
        });
    }
    static getInstance() {
        if (!AdaptiveThresholdManager.instance) {
            AdaptiveThresholdManager.instance = new AdaptiveThresholdManager();
        }
        return AdaptiveThresholdManager.instance;
    }
    addMetricValue(metricName, value) {
        try {
            const now = Date.now();
            const config = this.thresholdConfigs.get(metricName);
            if (!config) {
                logger_1.logger.warn(`No threshold config found for metric: ${metricName}`);
                return;
            }
            let window = this.metricWindows.get(metricName);
            if (!window) {
                window = {
                    values: [],
                    timestamp: [],
                    maxSize: Math.ceil((config.baselineWindow * 60 * 1000) / 10000), // Store points every 10 seconds
                };
                this.metricWindows.set(metricName, window);
            }
            // Add new value
            window.values.push(value);
            window.timestamp.push(now);
            // Remove old values
            const cutoff = now - config.baselineWindow * 60 * 1000;
            while (window.timestamp[0] < cutoff) {
                window.values.shift();
                window.timestamp.shift();
            }
            // Trim to max size if needed
            if (window.values.length > window.maxSize) {
                window.values.shift();
                window.timestamp.shift();
            }
        }
        catch (error) {
            logger_1.logger.error('Error adding metric value:', error);
        }
    }
    calculateThreshold(metricName) {
        try {
            const window = this.metricWindows.get(metricName);
            const config = this.thresholdConfigs.get(metricName);
            if (!window || !config || window.values.length < 10) {
                return config?.maxThreshold || Number.MAX_VALUE;
            }
            // Calculate mean and standard deviation
            const mean = window.values.reduce((a, b) => a + b) / window.values.length;
            const variance = window.values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.values.length;
            const stdDev = Math.sqrt(variance);
            // Calculate adaptive threshold
            const threshold = mean + stdDev * config.sensitivity;
            // Clamp to configured limits
            return Math.max(config.minThreshold, Math.min(config.maxThreshold, threshold));
        }
        catch (error) {
            logger_1.logger.error('Error calculating threshold:', error);
            return Number.MAX_VALUE;
        }
    }
    getMetricTrend(metricName) {
        try {
            const window = this.metricWindows.get(metricName);
            if (!window || window.values.length < 10)
                return 'stable';
            const recentValues = window.values.slice(-10);
            const firstHalf = recentValues.slice(0, 5);
            const secondHalf = recentValues.slice(-5);
            const firstMean = firstHalf.reduce((a, b) => a + b) / 5;
            const secondMean = secondHalf.reduce((a, b) => a + b) / 5;
            const changePct = (secondMean - firstMean) / firstMean;
            if (changePct > 0.1)
                return 'increasing';
            if (changePct < -0.1)
                return 'decreasing';
            return 'stable';
        }
        catch (error) {
            logger_1.logger.error('Error calculating metric trend:', error);
            return 'stable';
        }
    }
    setThresholdConfig(metricName, config) {
        try {
            const existingConfig = this.thresholdConfigs.get(metricName) || {
                baselineWindow: 60,
                sensitivity: 2.0,
                minThreshold: 0,
                maxThreshold: Number.MAX_VALUE,
            };
            this.thresholdConfigs.set(metricName, {
                ...existingConfig,
                ...config,
            });
        }
        catch (error) {
            logger_1.logger.error('Error setting threshold config:', error);
        }
    }
    clearMetricHistory(metricName) {
        this.metricWindows.delete(metricName);
    }
}
exports.AdaptiveThresholdManager = AdaptiveThresholdManager;
//# sourceMappingURL=adaptiveThresholds.js.map