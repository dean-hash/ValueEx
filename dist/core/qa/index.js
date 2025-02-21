"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaSystem = exports.QASystem = void 0;
const intelligentQA_1 = require("./intelligentQA");
const metricsCollector_1 = require("./metricsCollector");
const optimizationEngine_1 = require("./optimizationEngine");
const healthMonitor_1 = require("./healthMonitor");
const intelligenceField_1 = require("../unified/intelligenceField");
const ecosystemAnalyzer_1 = require("./ecosystemAnalyzer");
class QASystem {
    constructor() {
        // Initialize all components
        this.resonanceField = intelligenceField_1.ResonanceField.getInstance();
        this.intelligentQA = intelligentQA_1.IntelligentQA.getInstance();
        this.metricsCollector = metricsCollector_1.MetricsCollector.getInstance();
        this.optimizationEngine = optimizationEngine_1.OptimizationEngine.getInstance();
        this.healthMonitor = healthMonitor_1.HealthMonitor.getInstance();
        this.ecosystemAnalyzer = ecosystemAnalyzer_1.EcosystemAnalyzer.getInstance();
        this.initializeSystem();
    }
    static getInstance() {
        if (!QASystem.instance) {
            QASystem.instance = new QASystem();
        }
        return QASystem.instance;
    }
    initializeSystem() {
        // Connect components through event listeners
        this.healthMonitor.on('health-update', (status) => {
            this.resonanceField.monitorQAMetrics('systemHealth', status.status === 'healthy' ? 1 : status.status === 'warning' ? 0.5 : 0);
        });
        this.optimizationEngine.on('optimization-complete', (data) => {
            this.resonanceField.monitorQAMetrics(`optimization_${data.strategy}`, 1);
        });
        this.resonanceField.on('anomaly', (anomalies) => {
            anomalies.forEach((anomaly) => {
                this.intelligentQA.handleAnomaly(anomaly);
            });
        });
        this.ecosystemAnalyzer.on('predicted-issues', (data) => {
            this.handlePredictedIssues(data);
        });
        this.ecosystemAnalyzer.on('ecosystem-health', (report) => {
            this.handleEcosystemHealth(report);
        });
        // Start monitoring system health
        setInterval(() => {
            this.checkSystemHealth();
        }, 5000);
    }
    async handlePredictedIssues(data) {
        const { component, issues } = data;
        // Feed predictions into resonance field
        for (const issue of issues) {
            await this.resonanceField.monitorQAMetrics(`predicted_issue_${issue.type}`, 1 - issue.probability * issue.impact);
        }
        // Auto-generate tests for predicted issues
        await this.intelligentQA.generatePreventiveTests(component, issues);
    }
    async handleEcosystemHealth(report) {
        // Update resonance field with ecosystem health
        await this.resonanceField.monitorQAMetrics('ecosystem_health', report.overallHealth);
        // Generate ecosystem-wide tests
        if (report.recommendations.length > 0) {
            await this.intelligentQA.generateEcosystemTests(report);
        }
    }
    async checkSystemHealth() {
        const status = this.healthMonitor.getHealthStatus();
        const metrics = this.metricsCollector.getAllMetrics();
        // Feed data into resonance field
        for (const [name, values] of metrics) {
            if (values.length > 0) {
                await this.resonanceField.monitorQAMetrics(name, values[values.length - 1].value);
            }
        }
        // Update system state
        this.emit('system-update', {
            status,
            metrics,
            timestamp: Date.now(),
        });
    }
    getSystemStatus() {
        return {
            health: this.healthMonitor.getHealthStatus(),
            metrics: this.metricsCollector.getAllMetrics(),
            optimizations: this.optimizationEngine.getActiveOptimizations(),
            resonance: this.resonanceField.getCurrentState(),
        };
    }
    async handleError(error) {
        console.error('Uncaught exception:', error);
        // Log error to resonance field
        await this.resonanceField.monitorQAMetrics('uncaught_error', 0);
        // Notify ecosystem analyzer
        this.ecosystemAnalyzer.emit('system-error', {
            type: 'uncaught_exception',
            error: error.message,
            stack: error.stack,
        });
        // Attempt recovery
        await this.attemptRecovery(error);
    }
    async handleRejection(reason, promise) {
        console.error('Unhandled rejection:', reason);
        // Log rejection to resonance field
        await this.resonanceField.monitorQAMetrics('unhandled_rejection', 0);
        // Notify ecosystem analyzer
        this.ecosystemAnalyzer.emit('system-error', {
            type: 'unhandled_rejection',
            reason,
            promise,
        });
        // Attempt recovery
        await this.attemptRecovery(reason);
    }
    async attemptRecovery(error) {
        // Log recovery attempt
        console.log('Attempting system recovery...');
        try {
            // Reset system state if needed
            await this.resonanceField.initialize();
            // Restart monitoring
            this.checkSystemHealth();
            console.log('System recovery completed');
        }
        catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            // Notify of recovery failure
            this.emit('recovery-failed', {
                originalError: error,
                recoveryError,
            });
        }
    }
}
exports.QASystem = QASystem;
// Export singleton instance
exports.qaSystem = QASystem.getInstance();
//# sourceMappingURL=index.js.map