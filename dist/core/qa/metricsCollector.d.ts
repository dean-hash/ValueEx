import { EventEmitter } from 'events';
interface MetricPoint {
    timestamp: number;
    value: number;
}
export declare class MetricsCollector extends EventEmitter {
    private metrics;
    private collectors;
    private static instance;
    private constructor();
    static getInstance(): MetricsCollector;
    private initializeDefaultMetrics;
    private startCollecting;
    private collectMetric;
    private measureApiResponseTime;
    private measureMemoryUsage;
    private calculateErrorRate;
    private measureCpuUsage;
    private addMetricPoint;
    getMetricHistory(name: string): MetricPoint[];
    getAllMetrics(): Map<string, MetricPoint[]>;
    stopCollecting(name: string): void;
}
export {};
