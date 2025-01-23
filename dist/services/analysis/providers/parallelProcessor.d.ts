import { EventEmitter } from 'events';
import { DemandSignal, ProcessedSignal, ProcessResult } from '../../../types/demandTypes';
import { ProcessorConfig, ProcessorMetrics } from '../../../types/processingTypes';
interface ProcessingTask {
    id: string;
    signal: DemandSignal;
    timestamp: string;
}
export declare class ParallelProcessor extends EventEmitter {
    private activeTasks;
    private results;
    private config;
    private metrics;
    constructor(config: ProcessorConfig);
    processInParallel(tasks: ProcessingTask[]): Promise<ProcessResult<ProcessedSignal>[]>;
    private aggregateTopics;
    private aggregateFeatures;
    private queryMistral;
    private queryLlama2;
    private processNLP;
    private calculateSentiment;
    private extractTopics;
    getResult(taskId: string): ProcessResult<ProcessedSignal> | undefined;
    clearResults(): void;
    getMetrics(): ProcessorMetrics;
    getActiveProcesses(): number;
}
export {};
