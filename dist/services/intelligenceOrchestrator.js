"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceOrchestrator = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const intelligenceEnhancer_1 = require("./analysis/intelligenceEnhancer");
const metrics_1 = require("./monitoring/metrics");
const resourceMonitor_1 = require("./monitoring/resourceMonitor");
class IntelligenceOrchestrator extends events_1.EventEmitter {
    constructor() {
        super();
        this.enhancer = new intelligenceEnhancer_1.IntelligenceEnhancer();
        this.metrics = metrics_1.MetricsCollector.getInstance();
        this.monitor = new resourceMonitor_1.ResourceMonitor();
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!IntelligenceOrchestrator.instance) {
            IntelligenceOrchestrator.instance = new IntelligenceOrchestrator();
        }
        return IntelligenceOrchestrator.instance;
    }
    setupEventHandlers() {
        this.monitor.on('alert', (alert) => {
            logger_1.logger.warn('Resource alert:', alert);
            this.emit('resourceAlert', alert);
        });
        this.metrics.on('alert', (alert) => {
            logger_1.logger.warn('Metrics alert:', alert);
            this.emit('metricsAlert', alert);
        });
    }
    async enhanceSignal(signal) {
        const startTime = Date.now();
        try {
            // Record initial metrics
            this.metrics.recordApiMetrics('signal_enhancement', {
                requests: 1,
                errors: 0,
                latency: 0,
            });
            // Enhance the signal
            const enhancedSignal = await this.enhancer.enhance(signal);
            // Calculate processing time
            const processingTime = Date.now() - startTime;
            // Record success metrics
            this.metrics.recordApiMetrics('signal_enhancement', {
                requests: 1,
                errors: 0,
                latency: processingTime,
            });
            return {
                success: true,
                enhancedSignal,
                metrics: {
                    processingTime,
                    confidenceScore: enhancedSignal.insights.confidence,
                    enhancementDepth: this.calculateEnhancementDepth(enhancedSignal),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Error enhancing signal:', error);
            // Record error metrics
            this.metrics.recordApiMetrics('signal_enhancement', {
                requests: 1,
                errors: 1,
                latency: Date.now() - startTime,
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                metrics: {
                    processingTime: Date.now() - startTime,
                    confidenceScore: 0,
                    enhancementDepth: 0,
                },
            };
        }
    }
    calculateEnhancementDepth(signal) {
        let depth = 0;
        // Check for enhanced fields
        if (signal.insights.keywords?.length)
            depth++;
        if (signal.insights.context)
            depth++;
        if (signal.insights.intent)
            depth++;
        if (signal.insights.valueEvidence?.authenticityMarkers?.length)
            depth++;
        if (signal.insights.valueEvidence?.realWorldImpact?.length)
            depth++;
        if (signal.insights.demographics?.length)
            depth++;
        if (signal.insights.priceRange)
            depth++;
        if (signal.insights.demandPatterns?.evidence?.length)
            depth++;
        return depth;
    }
    getMetrics() {
        return this.metrics;
    }
    getMonitor() {
        return this.monitor;
    }
    dispose() {
        this.monitor.stopMonitoring();
        this.removeAllListeners();
    }
}
exports.IntelligenceOrchestrator = IntelligenceOrchestrator;
//# sourceMappingURL=intelligenceOrchestrator.js.map