import { logger } from '../../utils/logger';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number>;

  constructor() {
    this.metrics = new Map();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  trackMetric(name: string, value: number): void {
    this.metrics.set(name, value);
    logger.info(`Tracked metric: ${name} = ${value}`);
  }

  getMetric(name: string): number {
    return this.metrics.get(name) || 0;
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
    logger.info('Cleared all metrics');
  }
}
