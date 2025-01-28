import { EventEmitter } from 'events';
import { Logger } from '../logging/Logger';

export interface ApiMetrics {
  requests: number;
  errors: number;
  latency: number;
  throughput?: number;
}

export interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp?: number;
  data?: any;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    latency: number;
    bandwidth: number;
  };
}

export interface ApiMetricsData {
  latency: number;
  success: boolean;
}

export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private apiMetrics: Map<string, ApiMetrics>;
  private resourceMetrics: ResourceMetrics;
  private logger: Logger;
  private readonly thresholds = {
    processingTime: 1000, // 1 second
    errorRate: 0.1, // 10% error rate
    responseTime: 2000, // 2 seconds
    cpuUsage: 80, // 80% CPU usage
    memoryUsage: 80, // 80% memory usage
    diskUsage: 90, // 90% disk usage
  };

  private constructor() {
    super();
    this.apiMetrics = new Map();
    this.resourceMetrics = {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: {
        latency: 0,
        bandwidth: 0,
      },
    };
    this.logger = new Logger('MetricsCollector');
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public trackApiMetrics(endpoint: string, data: ApiMetricsData): void {
    let metrics = this.apiMetrics.get(endpoint) || {
      requests: 0,
      errors: 0,
      latency: 0,
    };

    metrics.requests++;
    if (!data.success) {
      metrics.errors++;
    }
    metrics.latency = (metrics.latency * (metrics.requests - 1) + data.latency) / metrics.requests;
    metrics.throughput = metrics.requests / (Date.now() / 1000);

    this.apiMetrics.set(endpoint, metrics);

    // Check thresholds
    if (data.latency > this.thresholds.responseTime) {
      this.emitAlert({
        type: 'latency',
        severity: 'warning',
        message: `High latency detected for ${endpoint}: ${data.latency}ms`,
        timestamp: Date.now(),
        data: { endpoint, latency: data.latency },
      });
    }

    const errorRate = metrics.errors / metrics.requests;
    if (errorRate > this.thresholds.errorRate) {
      this.emitAlert({
        type: 'error_rate',
        severity: 'critical',
        message: `High error rate detected for ${endpoint}: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: Date.now(),
        data: { endpoint, errorRate },
      });
    }
  }

  public trackError(errorType: string): void {
    this.logger.error(`Error tracked: ${errorType}`);
    this.emitAlert({
      type: 'error',
      severity: 'warning',
      message: `Error occurred: ${errorType}`,
      timestamp: Date.now(),
    });
  }

  public getApiMetrics(): { [key: string]: ApiMetrics } {
    const result: { [key: string]: ApiMetrics } = {};
    this.apiMetrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  public getResourceMetrics(): ResourceMetrics {
    return { ...this.resourceMetrics };
  }

  async getMetricValues(metric: string): Promise<number[]> {
    const metricData = this.apiMetrics.get(metric);
    if (!metricData) return [];

    return Object.values(metricData).map((entry) => entry.value);
  }

  async getMetricTimestamps(metric: string): Promise<string[]> {
    const metricData = this.apiMetrics.get(metric);
    if (!metricData) return [];

    return Object.values(metricData).map((entry) => entry.timestamp);
  }

  private emitAlert(alert: Alert): void {
    this.emit('alert', alert);
    this.logger.warn(`Alert emitted: ${alert.type} - ${alert.message}`);
  }
}
