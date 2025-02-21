export declare class MetricsCollector {
    private static instance;
    private metrics;
    constructor();
    static getInstance(): MetricsCollector;
    trackMetric(name: string, value: number): void;
    getMetric(name: string): number;
    getAllMetrics(): Record<string, number>;
    clearMetrics(): void;
}
