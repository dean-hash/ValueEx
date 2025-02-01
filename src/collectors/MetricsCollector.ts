import { EventEmitter } from 'events';

export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private metricValues: Map<string, number[]> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public getMetricValues(metric: string): number[] {
    return this.metricValues.get(metric) || [];
  }

  public getLatestMetricValues(): Record<string, number> {
    const latest: Record<string, number> = {};
    this.metricValues.forEach((values, metric) => {
      latest[metric] = values[values.length - 1] || 0;
    });
    return latest;
  }
}
