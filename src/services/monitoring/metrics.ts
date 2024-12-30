import { Gauge, Counter, register } from 'prom-client';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

interface AlertThresholds {
  processingTime: number;
  errorRate: number;
  responseTime: number;
}

export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private errorWindow: number[] = [];
  private readonly ERROR_WINDOW_SIZE = 100;
  private thresholds: AlertThresholds = {
    processingTime: 1000, // 1 second
    errorRate: 0.1, // 10% error rate
    responseTime: 2000, // 2 seconds
  };

  // Core metrics
  private readonly processingTime = new Gauge({
    name: 'demand_signal_processing_time',
    help: 'Time taken to process demand signals in milliseconds'
  });

  private readonly errorCount = new Counter({
    name: 'demand_signal_errors_total',
    help: 'Total number of errors in demand signal processing'
  });

  private readonly signalCount = new Counter({
    name: 'demand_signals_processed_total',
    help: 'Total number of demand signals processed',
    labelNames: ['type', 'source']
  });

  private readonly responseTime = new Gauge({
    name: 'value_response_generation_time',
    help: 'Time taken to generate value responses in milliseconds'
  });

  // User interaction metrics
  private readonly userInteractions = new Counter({
    name: 'user_interactions_total',
    help: 'Total number of user interactions',
    labelNames: ['type', 'result']
  });

  private readonly userSessionDuration = new Gauge({
    name: 'user_session_duration_seconds',
    help: 'Duration of user sessions in seconds',
    labelNames: ['user_type']
  });

  private readonly demandPatternStrength = new Gauge({
    name: 'demand_pattern_strength',
    help: 'Strength of identified demand patterns',
    labelNames: ['pattern_type']
  });

  private constructor() {
    super();
    this.setupAlertChecks();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private setupAlertChecks() {
    setInterval(() => {
      this.checkErrorRate();
    }, 5000); // Check every 5 seconds
  }

  private checkErrorRate() {
    const errorRate = this.errorWindow.reduce((sum, val) => sum + val, 0) / this.ERROR_WINDOW_SIZE;
    if (errorRate > this.thresholds.errorRate) {
      this.emit('alert', {
        type: 'error_rate',
        message: `Error rate (${errorRate}) exceeds threshold (${this.thresholds.errorRate})`,
        severity: 'high'
      });
    }
  }

  recordProcessingTime(duration: number): void {
    try {
      this.processingTime.set(duration);
      if (duration > this.thresholds.processingTime) {
        this.emit('alert', {
          type: 'processing_time',
          message: `Processing time (${duration}ms) exceeds threshold (${this.thresholds.processingTime}ms)`,
          severity: 'medium'
        });
      }
    } catch (error) {
      logger.error('Error recording processing time:', error);
    }
  }

  recordError(): void {
    try {
      this.errorCount.inc();
      this.errorWindow.push(1);
      if (this.errorWindow.length > this.ERROR_WINDOW_SIZE) {
        this.errorWindow.shift();
      }
    } catch (error) {
      logger.error('Error incrementing error count:', error);
    }
  }

  recordSignal(type: string, source: string): void {
    try {
      this.signalCount.labels(type, source).inc();
    } catch (error) {
      logger.error('Error recording signal:', error);
    }
  }

  recordResponseTime(duration: number): void {
    try {
      this.responseTime.set(duration);
      if (duration > this.thresholds.responseTime) {
        this.emit('alert', {
          type: 'response_time',
          message: `Response time (${duration}ms) exceeds threshold (${this.thresholds.responseTime}ms)`,
          severity: 'high'
        });
      }
    } catch (error) {
      logger.error('Error recording response time:', error);
    }
  }

  recordUserInteraction(type: string, result: string): void {
    try {
      this.userInteractions.labels(type, result).inc();
    } catch (error) {
      logger.error('Error recording user interaction:', error);
    }
  }

  recordSessionDuration(duration: number, userType: string): void {
    try {
      this.userSessionDuration.labels(userType).set(duration);
    } catch (error) {
      logger.error('Error recording session duration:', error);
    }
  }

  recordDemandPattern(strength: number, patternType: string): void {
    try {
      this.demandPatternStrength.labels(patternType).set(strength);
    } catch (error) {
      logger.error('Error recording demand pattern:', error);
    }
  }

  setAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('Error getting metrics:', error);
      return '';
    }
  }
}
