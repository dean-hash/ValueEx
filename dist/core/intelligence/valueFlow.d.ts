import { Observable } from 'rxjs';
interface ValueSignal {
    source: string;
    target: string;
    type: 'NEED' | 'SOLUTION' | 'CONNECTION' | 'OPTIMIZATION';
    strength: number;
    value: number;
    confidence: number;
    timestamp: number;
}
export declare class ValueFlow {
    private static instance;
    private valueStream;
    private activeConnections;
    private valueMetrics;
    private constructor();
    static getInstance(): ValueFlow;
    private initializeValueFlow;
    private validateSignal;
    private enrichSignal;
    private calculateValue;
    private getNetworkEffect;
    private getOptimizationBonus;
    private processSignal;
    private updateMetrics;
    injectValue(signal: ValueSignal): void;
    observeValue(): Observable<Map<string, number>>;
    getActiveConnections(): Observable<Map<string, any>>;
    getCurrentValue(): number;
}
export {};
