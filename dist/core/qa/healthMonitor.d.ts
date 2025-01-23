import { EventEmitter } from 'events';
interface HealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    components: {
        [key: string]: {
            status: 'healthy' | 'warning' | 'critical';
            metrics: any;
            lastCheck: number;
        };
    };
    lastUpdate: number;
}
export declare class HealthMonitor extends EventEmitter {
    private static instance;
    private metricsCollector;
    private optimizationEngine;
    private resonanceField;
    private status;
    private checkInterval;
    private constructor();
    static getInstance(): HealthMonitor;
    private initializeMonitoring;
    private updateComponentHealth;
    private calculateComponentStatus;
    private updateOverallStatus;
    private performHealthCheck;
    private handleOptimizationEvent;
    private calculateOptimizationImpact;
    private handleAnomalies;
    private suggestAction;
    getHealthStatus(): HealthStatus;
    getComponentHealth(component: string): {
        status: "healthy" | "warning" | "critical";
        metrics: any;
        lastCheck: number;
    };
}
export {};
