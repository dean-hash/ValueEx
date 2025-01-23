import { EventEmitter } from 'events';
import { DemandSignal } from '../types/demandTypes';
import { MetricsCollector } from './monitoring/metrics';
import { ResourceMonitor } from './monitoring/resourceMonitor';
export interface EnhancementResult {
    success: boolean;
    enhancedSignal?: DemandSignal;
    error?: string;
    metrics?: {
        processingTime: number;
        confidenceScore: number;
        enhancementDepth: number;
    };
}
export declare class IntelligenceOrchestrator extends EventEmitter {
    private static instance;
    private enhancer;
    private metrics;
    private monitor;
    private constructor();
    static getInstance(): IntelligenceOrchestrator;
    private setupEventHandlers;
    enhanceSignal(signal: DemandSignal): Promise<EnhancementResult>;
    private calculateEnhancementDepth;
    getMetrics(): MetricsCollector;
    getMonitor(): ResourceMonitor;
    dispose(): void;
}
