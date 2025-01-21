import { IntelligentQA } from './intelligentQA';
import { MetricsCollector } from './metricsCollector';
import { OptimizationEngine } from './optimizationEngine';
import { HealthMonitor } from './healthMonitor';
import { ResonanceField } from '../unified/intelligenceField';
import { EcosystemAnalyzer } from './ecosystemAnalyzer';

export class QASystem {
  private static instance: QASystem;
  private intelligentQA: IntelligentQA;
  private metricsCollector: MetricsCollector;
  private optimizationEngine: OptimizationEngine;
  private healthMonitor: HealthMonitor;
  private resonanceField: ResonanceField;
  private ecosystemAnalyzer: EcosystemAnalyzer;

  private constructor() {
    // Initialize all components
    this.resonanceField = ResonanceField.getInstance();
    this.intelligentQA = IntelligentQA.getInstance();
    this.metricsCollector = MetricsCollector.getInstance();
    this.optimizationEngine = OptimizationEngine.getInstance();
    this.healthMonitor = HealthMonitor.getInstance();
    this.ecosystemAnalyzer = EcosystemAnalyzer.getInstance();

    this.initializeSystem();
  }

  public static getInstance(): QASystem {
    if (!QASystem.instance) {
      QASystem.instance = new QASystem();
    }
    return QASystem.instance;
  }

  private initializeSystem() {
    // Connect components through event listeners
    this.healthMonitor.on('health-update', (status) => {
      this.resonanceField.monitorQAMetrics(
        'systemHealth',
        status.status === 'healthy' ? 1 : status.status === 'warning' ? 0.5 : 0
      );
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

  private async handlePredictedIssues(data: any) {
    const { component, issues } = data;

    // Feed predictions into resonance field
    for (const issue of issues) {
      await this.resonanceField.monitorQAMetrics(
        `predicted_issue_${issue.type}`,
        1 - issue.probability * issue.impact
      );
    }

    // Auto-generate tests for predicted issues
    await this.intelligentQA.generatePreventiveTests(component, issues);
  }

  private async handleEcosystemHealth(report: any) {
    // Update resonance field with ecosystem health
    await this.resonanceField.monitorQAMetrics('ecosystem_health', report.overallHealth);

    // Generate ecosystem-wide tests
    if (report.recommendations.length > 0) {
      await this.intelligentQA.generateEcosystemTests(report);
    }
  }

  private async checkSystemHealth() {
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

  public getSystemStatus() {
    return {
      health: this.healthMonitor.getHealthStatus(),
      metrics: this.metricsCollector.getAllMetrics(),
      optimizations: this.optimizationEngine.getActiveOptimizations(),
      resonance: this.resonanceField.getCurrentState(),
    };
  }

  public async handleError(error: Error) {
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

  public async handleRejection(reason: any, promise: Promise<any>) {
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

  private async attemptRecovery(error: any) {
    // Log recovery attempt
    console.log('Attempting system recovery...');

    try {
      // Reset system state if needed
      await this.resonanceField.initialize();

      // Restart monitoring
      this.checkSystemHealth();

      console.log('System recovery completed');
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      // Notify of recovery failure
      this.emit('recovery-failed', {
        originalError: error,
        recoveryError,
      });
    }
  }
}

// Export singleton instance
export const qaSystem = QASystem.getInstance();
