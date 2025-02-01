interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  timeout: number;
}
type RetryableOperation<T> = () => Promise<T>;
export declare class RetryStrategy {
  private static instance;
  private logger;
  private defaultConfig;
  private constructor();
  static getInstance(): RetryStrategy;
  private calculateDelay;
  private isRetryableError;
  private delay;
  execute<T>(operation: RetryableOperation<T>, customConfig?: Partial<RetryConfig>): Promise<T>;
  withAdaptiveRetry<T>(operation: RetryableOperation<T>): Promise<T>;
  withAggressiveRetry<T>(operation: RetryableOperation<T>): Promise<T>;
  withGentleRetry<T>(operation: RetryableOperation<T>): Promise<T>;
}
export {};
