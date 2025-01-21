import { Logger } from '../../logger/logger';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  timeout: number;
}

type RetryableOperation<T> = () => Promise<T>;

export class RetryStrategy {
  private static instance: RetryStrategy;
  private logger: Logger;
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    timeout: 30000,
  };

  private constructor() {
    this.logger = new Logger('RetryStrategy');
  }

  static getInstance(): RetryStrategy {
    if (!RetryStrategy.instance) {
      RetryStrategy.instance = new RetryStrategy();
    }
    return RetryStrategy.instance;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Rate limiting
    if (error.response?.status === 429) {
      return true;
    }

    // Server errors
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }

    // Specific API errors that we know are temporary
    if (error.response?.data?.error?.type === 'temporary_error') {
      return true;
    }

    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async execute<T>(
    operation: RetryableOperation<T>,
    customConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...customConfig };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), config.timeout);
        });

        const result = await Promise.race([operation(), timeoutPromise]);

        if (attempt > 1) {
          this.logger.info('Operation succeeded after retry', { attempt });
        }

        return result as T;
      } catch (error: any) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === config.maxAttempts) {
          this.logger.error('Operation failed permanently', {
            error: error.message,
            attempt,
            maxAttempts: config.maxAttempts,
          });
          throw error;
        }

        const delay = this.calculateDelay(attempt, config);
        this.logger.warn('Operation failed, retrying', {
          error: error.message,
          attempt,
          nextDelay: delay,
        });

        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  // Specialized retry strategies for different scenarios
  async withAdaptiveRetry<T>(operation: RetryableOperation<T>): Promise<T> {
    return this.execute(operation, {
      maxAttempts: 5,
      initialDelay: 500,
      backoffFactor: 1.5,
    });
  }

  async withAggressiveRetry<T>(operation: RetryableOperation<T>): Promise<T> {
    return this.execute(operation, {
      maxAttempts: 7,
      initialDelay: 200,
      backoffFactor: 1.2,
    });
  }

  async withGentleRetry<T>(operation: RetryableOperation<T>): Promise<T> {
    return this.execute(operation, {
      maxAttempts: 3,
      initialDelay: 2000,
      backoffFactor: 2.5,
    });
  }
}
