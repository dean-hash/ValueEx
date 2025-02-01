import { DemandSignal, ProcessedSignal } from './demandTypes';
export type ProviderStatus = 'ready' | 'processing' | 'error' | 'offline';
export interface ProviderMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  lastUpdated: string;
}
export interface ProviderConfig {
  maxBatchSize: number;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
}
export interface IntelligenceProvider {
  name: string;
  type: 'processing' | 'analysis' | 'validation';
  status: ProviderStatus;
  metrics?: ProviderMetrics;
  config?: ProviderConfig;
  processSignal(signal: DemandSignal): Promise<ProcessedSignal>;
  processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]>;
  getStatus(): ProviderStatus;
}
