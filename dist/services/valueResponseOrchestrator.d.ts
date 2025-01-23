import { SymbiosisMetrics } from './symbiosis';
export interface ValueResponse {
    content: string;
    metrics: SymbiosisMetrics;
    timestamp: Date;
}
export declare class ValueResponseOrchestrator {
    private static instance;
    private intelligenceOrchestrator;
    private symbiosis;
    private responses;
    private constructor();
    static getInstance(): ValueResponseOrchestrator;
    processValue(input: string): Promise<ValueResponse>;
    getValueResponses(input: string): Promise<ValueResponse[]>;
}
