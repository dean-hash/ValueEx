import { EventEmitter } from 'events';
export interface ApiMetrics {
    requests: number;
    errors: number;
    latency: number;
    throughput?: number;
}
export interface Alert {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp?: number;
    data?: any;
}
export interface ResourceMetrics {
    cpu: number;
    memory: number;
    disk: number;
    network: {
        latency: number;
        bandwidth: number;
    };
}
export declare class MetricsCollector extends EventEmitter {
    private static instance;
    private apiMetrics;
    private resourceMetrics;
    private readonly errorWindow;
    private readonly ERROR_WINDOW_SIZE;
    private readonly thresholds;
    constructor();
    static getInstance(): MetricsCollector;
    private setupAlertChecks;
    private checkErrorRate;
    private checkResourceUsage;
    private emitAlert;
    recordApiMetrics(api: string, metrics: ApiMetrics): void;
    recordResourceMetric(resource: string, value: number): void;
    getApiMetrics(): Record<string, ApiMetrics>;
    getResourceMetrics(): Record<string, number[]>;
    getAverageMetric(key: string): number;
    clearMetrics(): void;
}
