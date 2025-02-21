import { EventEmitter } from 'events';
interface HealthMetric {
    component: string;
    status: 'healthy' | 'warning' | 'critical';
    metric: number;
    context: string;
    recommendation?: string;
}
export declare class IntelligentQA extends EventEmitter {
    private static instance;
    private resonanceField;
    private healthMetrics;
    private isMonitoring;
    private constructor();
    static getInstance(): IntelligentQA;
    private initializeMonitoring;
    private checkSystemHealth;
    private handleHealthIssues;
    private takeAutomaticAction;
    private handleAPIIssue;
    private handleDataIssue;
    private handleResourceIssue;
    private handleUXIssue;
    private handleAnomaly;
    private takePreemptiveAction;
    private checkAPIHealth;
    private checkDataConsistency;
    private checkResourceUsage;
    private checkUserExperience;
    getHealthMetrics(): HealthMetric[];
}
export {};
