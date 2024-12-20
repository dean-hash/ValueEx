import { logger } from './logger';

interface PerformanceMetrics {
    operationName: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics[] = [];
    private readonly MAX_METRICS_LENGTH = 1000;

    private constructor() {}

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    measureAsync<T>(operationName: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
        const startTime = performance.now();
        return operation().finally(() => {
            this.recordMetrics(operationName, startTime, metadata);
        });
    }

    measure<T>(operationName: string, operation: () => T, metadata?: Record<string, any>): T {
        const startTime = performance.now();
        try {
            return operation();
        } finally {
            this.recordMetrics(operationName, startTime, metadata);
        }
    }

    private recordMetrics(operationName: string, startTime: number, metadata?: Record<string, any>) {
        const duration = performance.now() - startTime;
        const metrics: PerformanceMetrics = {
            operationName,
            duration,
            timestamp: Date.now(),
            metadata
        };

        this.metrics.push(metrics);
        if (this.metrics.length > this.MAX_METRICS_LENGTH) {
            this.metrics.shift();
        }

        logger.debug('Performance metrics recorded', {
            operation: operationName,
            duration,
            ...metadata
        });

        // Alert if operation takes too long
        if (duration > 100) {
            logger.warn('Operation exceeded performance threshold', {
                operation: operationName,
                duration,
                threshold: 100,
                ...metadata
            });
        }
    }

    getMetrics(operationName?: string): PerformanceMetrics[] {
        return operationName 
            ? this.metrics.filter(m => m.operationName === operationName)
            : [...this.metrics];
    }

    getAverageMetrics(operationName: string): number {
        const relevantMetrics = this.getMetrics(operationName);
        if (relevantMetrics.length === 0) return 0;
        
        const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
        return total / relevantMetrics.length;
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
