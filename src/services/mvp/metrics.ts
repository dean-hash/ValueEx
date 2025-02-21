import { logger } from '../../utils/logger';

interface MetricEntry {
  timestamp: number;
  value: number;
}

export class MatchMetrics {
  private static instance: MatchMetrics;
  private matchTimes: MetricEntry[] = [];
  private errors: MetricEntry[] = [];
  private readonly maxHistorySize = 1000;

  private constructor() {}

  public static getInstance(): MatchMetrics {
    if (!MatchMetrics.instance) {
      MatchMetrics.instance = new MatchMetrics();
    }
    return MatchMetrics.instance;
  }

  public recordMatchTime(timeMs: number): void {
    this.matchTimes.push({
      timestamp: Date.now(),
      value: timeMs,
    });

    if (this.matchTimes.length > this.maxHistorySize) {
      this.matchTimes.shift();
    }
  }

  public recordError(): void {
    this.errors.push({
      timestamp: Date.now(),
      value: 1,
    });

    if (this.errors.length > this.maxHistorySize) {
      this.errors.shift();
    }
  }

  public getLastNMatchTimes(n: number): number[] {
    return this.matchTimes.slice(-n).map((entry) => entry.value);
  }

  public getErrorRate(timeWindowSeconds: number): number {
    const now = Date.now();
    const windowStart = now - timeWindowSeconds * 1000;

    const recentErrors = this.errors.filter((error) => error.timestamp >= windowStart);
    const totalErrors = recentErrors.length;

    // Calculate error rate as errors per second
    return totalErrors / timeWindowSeconds;
  }

  public clearMetrics(): void {
    this.matchTimes = [];
    this.errors = [];
    logger.info('Metrics cleared');
  }
}
