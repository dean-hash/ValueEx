import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

interface MetricPoint {
  timestamp: number;
  value: number;
}

interface MetricConfig {
  name: string;
  threshold: number;
  collectInterval: number;
}

export class MetricsCollector extends EventEmitter {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private collectors: Map<string, NodeJS.Timer> = new Map();
  private static instance: MetricsCollector;

  private constructor() {
    super();
    this.initializeDefaultMetrics();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private initializeDefaultMetrics() {
    const defaultMetrics: MetricConfig[] = [
      { name: 'apiResponseTime', threshold: 500, collectInterval: 5000 },
      { name: 'memoryUsage', threshold: 0.8, collectInterval: 10000 },
      { name: 'errorRate', threshold: 0.05, collectInterval: 15000 },
      { name: 'cpuUsage', threshold: 0.7, collectInterval: 10000 },
    ];

    defaultMetrics.forEach((metric) => {
      this.startCollecting(metric);
    });
  }

  private startCollecting(config: MetricConfig) {
    const collector = setInterval(async () => {
      const value = await this.collectMetric(config.name);
      this.addMetricPoint(config.name, value);

      if (value > config.threshold) {
        this.emit('threshold-exceeded', {
          metric: config.name,
          value,
          threshold: config.threshold,
          timestamp: Date.now(),
        });
      }
    }, config.collectInterval);

    this.collectors.set(config.name, collector);
  }

  private async collectMetric(name: string): Promise<number> {
    switch (name) {
      case 'apiResponseTime':
        return await this.measureApiResponseTime();
      case 'memoryUsage':
        return this.measureMemoryUsage();
      case 'errorRate':
        return this.calculateErrorRate();
      case 'cpuUsage':
        return this.measureCpuUsage();
      default:
        return 0;
    }
  }

  private async measureApiResponseTime(): Promise<number> {
    const start = performance.now();
    try {
      await fetch('/api/health');
      return performance.now() - start;
    } catch {
      return Infinity;
    }
  }

  private measureMemoryUsage(): number {
    const used = process.memoryUsage();
    return used.heapUsed / used.heapTotal;
  }

  private calculateErrorRate(): number {
    // Implementation would track errors over time
    return 0.01; // Placeholder
  }

  private measureCpuUsage(): number {
    // Implementation would measure CPU usage
    return 0.5; // Placeholder
  }

  private addMetricPoint(name: string, value: number) {
    const points = this.metrics.get(name) || [];
    points.push({
      timestamp: Date.now(),
      value,
    });

    // Keep last 100 points
    if (points.length > 100) {
      points.shift();
    }

    this.metrics.set(name, points);
    this.emit('metric-collected', { name, value });
  }

  public getMetricHistory(name: string): MetricPoint[] {
    return this.metrics.get(name) || [];
  }

  public getAllMetrics(): Map<string, MetricPoint[]> {
    return new Map(this.metrics);
  }

  public stopCollecting(name: string) {
    const collector = this.collectors.get(name);
    if (collector) {
      clearInterval(collector);
      this.collectors.delete(name);
    }
  }
}
