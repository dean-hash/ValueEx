declare class MVPRunner {
  private storage;
  private demandMatcher;
  private fulfillment;
  private productSourcing;
  private commissionTracker;
  private isRunning;
  private matchInterval;
  private analyticsInterval;
  private readonly MATCH_INTERVAL;
  private readonly ANALYTICS_INTERVAL;
  start(): Promise<void>;
  private runMatchingCycle;
  private runAnalytics;
  private shutdown;
}
export declare const mvpRunner: MVPRunner;
export {};
