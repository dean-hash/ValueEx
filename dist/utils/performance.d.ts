interface PerformanceMetrics {
    operationName: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
}
declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private readonly MAX_METRICS_LENGTH;
    private constructor();
    static getInstance(): PerformanceMonitor;
    measureAsync<T>(operationName: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    measure<T>(operationName: string, operation: () => T, metadata?: Record<string, any>): T;
    private recordMetrics;
    getMetrics(operationName?: string): PerformanceMetrics[];
    getAverageMetrics(operationName: string): number;
}
export declare const performanceMonitor: PerformanceMonitor;
export {};
