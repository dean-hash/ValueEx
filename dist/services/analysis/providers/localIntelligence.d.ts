import {
  DemandSignal,
  IntelligenceProvider,
  ProviderStatus,
  ProviderMetrics,
  ProviderConfig,
} from '../../../types/providerTypes';
interface ProcessedSignal {
  signal: DemandSignal;
  context: any;
}
export declare class LocalIntelligenceProvider implements IntelligenceProvider {
  name: string;
  type: 'processing';
  status: ProviderStatus;
  metrics?: ProviderMetrics;
  config: ProviderConfig;
  private model;
  private demandInference;
  private matchingEngine;
  private isOllamaAvailable;
  private parallelProcessor;
  private googleTrends;
  private localCache;
  private readonly CACHE_TTL;
  constructor(model?: string);
  private initializeLocalProcessing;
  private setupCacheCleanup;
  private setupGoogleWorkspaceFallback;
  private getCachedData;
  private setCachedData;
  processSignal(signal: DemandSignal): Promise<ProcessedSignal>;
  private processLocally;
  private analyzeWithOllama;
  private processWithGoogleTrends;
  processSignalBatch(signals: DemandSignal[]): Promise<ProcessedSignal[]>;
  getStatus(): ProviderStatus;
}
export {};
