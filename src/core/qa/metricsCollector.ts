import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import os from 'os';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorRate: number;
}

export interface MetricThresholds {
  [key: string]: {
    warning: number;
    critical: number;
  };
}

export class MetricsCollector extends EventEmitter {
  private metrics: Map<string, number>;
  private collectionInterval: NodeJS.Timeout | null;
  private errorCounts: Map<string, number>;
  private lastCollectionTime: number;
  private thresholds: MetricThresholds;

  constructor() {
    super();
    this.metrics = new Map();
    this.errorCounts = new Map();
    this.lastCollectionTime = Date.now();
    this.collectionInterval = null;
    this.thresholds = {
      cpuUsage: { warning: 70, critical: 90 },
      memoryUsage: { warning: 80, critical: 95 },
      apiResponseTime: { warning: 500, critical: 1000 },
      errorRate: { warning: 0.05, critical: 0.1 },
    };
  }

  public startCollection(intervalMs: number = 5000): void {
    if (this.collectionInterval) {
      this.stopCollection();
    }

    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  private async collectMetrics(): Promise<void> {
    const currentTime = Date.now();
    const timeDiff = (currentTime - this.lastCollectionTime) / 1000;

    const cpuUsage = await this.getCPUUsage();
    const memUsage = this.getMemoryUsage();
    const apiResponseTime = this.getAverageResponseTime();
    const errorRate = this.calculateErrorRate(timeDiff);

    this.metrics.set('cpuUsage', cpuUsage);
    this.metrics.set('memoryUsage', memUsage);
    this.metrics.set('apiResponseTime', apiResponseTime);
    this.metrics.set('errorRate', errorRate);

    this.detectAnomalies();
    this.errorCounts.clear();
    this.lastCollectionTime = currentTime;

    this.emit('metric-collected', this.getMetrics());
  }

  public getMetrics(): Record<string, number> {
    const metricsObj: Record<string, number> = {};
    this.metrics.forEach((value, key) => {
      metricsObj[key] = value;
    });
    return metricsObj;
  }

  private async getCPUUsage(): Promise<number> {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0);
    
    return Math.round(totalCPU / cpus.length);
  }

  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
  }

  private getAverageResponseTime(): number {
    return performance.now() % 1000;
  }

  private calculateErrorRate(timeDiff: number): number {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    return totalErrors / timeDiff;
  }

  public recordError(errorType: string): void {
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);
  }

  private detectAnomalies(): void {
    const anomalies: Array<{ metric: string; value: number }> = [];

    this.metrics.forEach((value, metric) => {
      const threshold = this.thresholds[metric];
      if (threshold && value > threshold.critical) {
        anomalies.push({ metric, value });
      }
    });

    if (anomalies.length > 0) {
      this.emit('anomaly', anomalies);
    }
  }

  private aggregateMetrics(metrics: { metric: string; value: number }[]): Record<string, number> {
    return metrics.reduce(
      (acc, event) => {
        acc[event.metric] = (acc[event.metric] || 0) + event.value;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
