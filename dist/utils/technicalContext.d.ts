export declare class TechnicalContextTracker {
  private static readonly METRICS_FILE;
  private metrics;
  private models;
  private codebaseMetrics;
  constructor();
  private initializeMetricsFile;
  private updateSystemMetrics;
  updateModelState(
    modelName: string,
    status: 'active' | 'idle' | 'error',
    performance: {
      latency: number;
      throughput: number;
      errorRate: number;
    }
  ): Promise<void>;
  updateCodebaseMetrics(): Promise<void>;
  private calculateTestCoverage;
  generateTechnicalReport(): Promise<string>;
  private startPeriodicUpdates;
  dispose(): void;
}
