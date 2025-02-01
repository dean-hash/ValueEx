interface ThresholdConfig {
  baselineWindow: number;
  sensitivity: number;
  minThreshold: number;
  maxThreshold: number;
}
export declare class AdaptiveThresholdManager {
  private static instance;
  private metricWindows;
  private thresholdConfigs;
  private constructor();
  static getInstance(): AdaptiveThresholdManager;
  addMetricValue(metricName: string, value: number): void;
  calculateThreshold(metricName: string): number;
  getMetricTrend(metricName: string): 'increasing' | 'decreasing' | 'stable';
  setThresholdConfig(metricName: string, config: Partial<ThresholdConfig>): void;
  clearMetricHistory(metricName: string): void;
}
export {};
