"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = void 0;
const metricsCollector_1 = require("./metricsCollector");
const logger_1 = require("../utils/logger");
class AlertManager {
    constructor() {
        this.alertStates = new Map();
        this.alertConfigs = [
            {
                name: 'highErrorRate',
                condition: (m) => m.errors.rate > 0.05,
                message: (m) => `High error rate detected: ${(m.errors.rate * 100).toFixed(1)}%`,
                severity: 'error',
                cooldown: 30,
            },
            {
                name: 'lowHelpfulness',
                condition: (m) => m.valueMetrics.helpfulnessRatio < 0.8,
                message: (m) => `Helpfulness ratio below threshold: ${(m.valueMetrics.helpfulnessRatio * 100).toFixed(1)}%`,
                severity: 'warning',
                cooldown: 60,
            },
            {
                name: 'communityStanding',
                condition: (m) => m.valueMetrics.communityImpact < 0.7,
                message: (m) => `Community standing needs attention: ${(m.valueMetrics.communityImpact * 100).toFixed(1)}%`,
                severity: 'warning',
                cooldown: 120,
            },
            {
                name: 'highReportRate',
                condition: (m) => m.engagement.reports > m.engagement.upvotes * 0.1,
                message: () => `High report to upvote ratio`,
                severity: 'error',
                cooldown: 15,
            },
            {
                name: 'rateLimitApproaching',
                condition: (m) => m.api.rateLimit.remaining < m.api.rateLimit.total * 0.2,
                message: (m) => `API rate limit approaching: ${m.api.rateLimit.remaining} remaining`,
                severity: 'warning',
                cooldown: 5,
            },
            {
                name: 'lowConversion',
                condition: (m) => m.conversions.rate < 0.01 && m.responses.total > 10,
                message: (m) => `Low conversion rate: ${(m.conversions.rate * 100).toFixed(1)}%`,
                severity: 'info',
                cooldown: 240,
            },
        ];
        this.startMonitoring();
    }
    static getInstance() {
        if (!AlertManager.instance) {
            AlertManager.instance = new AlertManager();
        }
        return AlertManager.instance;
    }
    async startMonitoring() {
        setInterval(async () => {
            const metrics = await metricsCollector_1.MetricsCollector.getInstance().getMetricsSummary();
            await this.checkAlerts(metrics);
        }, 60000); // Check every minute
    }
    async checkAlerts(metrics) {
        const now = Date.now();
        for (const config of this.alertConfigs) {
            const state = this.alertStates.get(config.name) || { isActive: false };
            const shouldTrigger = config.condition(metrics);
            if (shouldTrigger && !state.isActive) {
                // New alert
                if (!state.lastTriggered || now - state.lastTriggered > config.cooldown * 60000) {
                    await this.triggerAlert(config, metrics);
                    this.alertStates.set(config.name, {
                        lastTriggered: now,
                        isActive: true,
                    });
                }
            }
            else if (!shouldTrigger && state.isActive) {
                // Alert resolved
                await this.resolveAlert(config);
                this.alertStates.set(config.name, {
                    lastTriggered: state.lastTriggered,
                    isActive: false,
                });
            }
        }
    }
    async triggerAlert(config, metrics) {
        const message = config.message(metrics);
        // Log alert based on severity
        switch (config.severity) {
            case 'error':
                logger_1.logger.error(message);
                await this.sendUrgentNotification(message);
                break;
            case 'warning':
                logger_1.logger.warn(message);
                await this.sendWarningNotification(message);
                break;
            case 'info':
                logger_1.logger.info(message);
                await this.logNotification(message);
                break;
        }
    }
    async resolveAlert(config) {
        logger_1.logger.info(`Alert resolved: ${config.name}`);
        // Could notify about resolution if needed
    }
    async sendUrgentNotification(message) {
        // Integration point for urgent notifications (e.g., SMS, phone call)
        logger_1.logger.error('URGENT:', message);
    }
    async sendWarningNotification(message) {
        // Integration point for warning notifications (e.g., email, Slack)
        logger_1.logger.warn('WARNING:', message);
    }
    async logNotification(message) {
        // Integration point for info notifications (e.g., logging system)
        logger_1.logger.info('INFO:', message);
    }
    // Public API for manual alert checks
    async checkMetrics() {
        const metrics = await metricsCollector_1.MetricsCollector.getInstance().getMetricsSummary();
        await this.checkAlerts(metrics);
    }
}
exports.AlertManager = AlertManager;
//# sourceMappingURL=alertManager.js.map