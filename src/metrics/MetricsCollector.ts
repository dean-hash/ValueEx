export interface MetricValue {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: MetricValue[] = [];

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public async getLatestMetricValues(): Promise<MetricValue[]> {
    // For now, return some sample metrics
    return [
      {
        id: 'logo-design',
        name: 'Logo Design Demand',
        value: 85,
        timestamp: new Date()
      },
      {
        id: 'web-dev',
        name: 'Web Development Demand',
        value: 92,
        timestamp: new Date()
      },
      {
        id: 'content-writing',
        name: 'Content Writing Demand',
        value: 78,
        timestamp: new Date()
      }
    ];
  }

  public async getMetricHistory(metricId: string): Promise<MetricValue[]> {
    // For now, return sample historical data
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => ({
      id: metricId,
      name: `Sample Metric ${metricId}`,
      value: Math.random() * 100,
      timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    }));
  }
}
