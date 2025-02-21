export declare class RetryStrategy {
    private maxRetries;
    private baseDelay;
    private maxDelay;
    constructor(maxRetries?: number, baseDelay?: number, maxDelay?: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
