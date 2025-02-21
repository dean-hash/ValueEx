import { EventEmitter } from 'events';
import { DemandPattern } from '../../types/demandTypes';
interface CacheMetrics {
    hits: number;
    misses: number;
    size: number;
    avgLatency: number;
    hitRate: number;
    patternDistribution: Map<string, number>;
}
interface CacheEvent {
    type: 'hit' | 'miss' | 'set' | 'delete';
    pattern?: DemandPattern;
    latency?: number;
    timestamp: number;
}
export declare class CacheAnalytics extends EventEmitter {
    private static instance;
    private events;
    private readonly MAX_EVENTS;
    private logger;
    private metrics;
    private constructor();
    static getInstance(): CacheAnalytics;
    private startPeriodicAnalysis;
    trackEvent(event: CacheEvent): void;
    private analyzeMetrics;
    private calculateRecentHitRate;
    private getPopularCategories;
    getMetrics(): CacheMetrics;
    getAnalytics(): any;
}
export {};
