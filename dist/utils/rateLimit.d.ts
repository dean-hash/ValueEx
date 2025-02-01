interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit?: number;
}
export declare class RateLimit {
  private limits;
  private state;
  wait(source: string): Promise<void>;
  setLimit(source: string, config: RateLimitConfig): void;
  getLimit(source: string): RateLimitConfig | undefined;
  reset(source: string): void;
  resetAll(): void;
}
export declare const rateLimit: RateLimit;
export {};
