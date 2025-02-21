import { Observable } from 'rxjs';
interface FlowSignal {
    type: 'MARKET' | 'USER' | 'SYSTEM' | 'VALUE';
    source: string;
    data: any;
    timestamp: number;
}
export declare class FlowEngine {
    private static instance;
    private intelligence;
    private valueNetwork;
    private flowStream;
    private activeFlows;
    private constructor();
    static getInstance(): FlowEngine;
    private initializeFlows;
    private createFlow;
    private processMarketSignal;
    private processValueSignal;
    private processUserSignal;
    private processSystemSignal;
    private generateRecommendations;
    private broadcastResults;
    injectSignal(signal: FlowSignal): void;
    observeFlow(type?: string): Observable<any>;
}
export {};
