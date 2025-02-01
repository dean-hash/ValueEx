export declare class APIMonitor {
  private static instance;
  private logger;
  private alertManager;
  private configService;
  private checkInterval;
  private constructor();
  static getInstance(): APIMonitor;
  startMonitoring(intervalMs?: number): void;
  stopMonitoring(): void;
  private checkAwinAPI;
  runManualCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    details: {
      programmes: boolean;
      productSearch: boolean;
      responseTime?: number;
    };
  }>;
}
