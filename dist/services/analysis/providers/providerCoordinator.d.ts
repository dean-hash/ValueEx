import { EventEmitter } from 'events';
import { DemandSignal, DataProvider } from '../../../types/resonanceTypes';
interface ProcessResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
export declare class ProviderCoordinator extends EventEmitter {
  private providers;
  private providerStates;
  private taskQueue;
  private monitoringInterval?;
  private readonly MAX_LOAD;
  private readonly ERROR_THRESHOLD;
  constructor();
  private initializeProviders;
  private initializeState;
  private startStateMonitoring;
  private monitorProviderStates;
  processSignal(signal: DemandSignal, provider: DataProvider): Promise<ProcessResult>;
  private processWithProvider;
  private mergeResults;
  dispose(): void;
}
export {};
