import { EventEmitter } from 'events';
import { LocalIntelligenceProvider } from './localIntelligence';
import { ResearchIntelligenceProvider } from './researchIntelligence';
import { SystemResourceProvider } from './systemResource';
import { DemandSignal, ProcessedSignal, DataProvider } from '../../../types/resonanceTypes';
import { logger } from '../../../utils/logger';

interface ProviderState {
  status: 'idle' | 'processing' | 'error';
  lastUpdate: number;
  currentLoad: number;
  errorCount: number;
}

interface ProcessResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

interface IntelligenceProvider<T = ProcessedSignal> {
  process(data: DemandSignal): Promise<ProcessResult<T>>;
  getCapacity(): number;
  getName(): string;
}

interface QueuedTask {
  id: string;
  task: () => Promise<ProcessResult<ProcessedSignal>>;
  priority: number;
  provider: string;
  timestamp: number;
}

export class ProviderCoordinator extends EventEmitter {
  private providers: Map<string, IntelligenceProvider>;
  private providerStates: Map<string, ProviderState>;
  private taskQueue: QueuedTask[];
  private monitoringInterval?: NodeJS.Timeout;
  private readonly MAX_LOAD = 0.8;
  private readonly ERROR_THRESHOLD = 5;

  constructor() {
    super();
    this.providers = new Map();
    this.providerStates = new Map();
    this.taskQueue = [];
    this.initializeProviders();
    this.startStateMonitoring();
  }

  private initializeProviders(): void {
    const localProvider = new LocalIntelligenceProvider();
    const researchProvider = new ResearchIntelligenceProvider();
    const systemProvider = new SystemResourceProvider();

    this.providers.set('local', localProvider);
    this.providers.set('research', researchProvider);
    this.providers.set('system', systemProvider);

    this.initializeState('local');
    this.initializeState('research');
    this.initializeState('system');
  }

  private initializeState(providerId: string): void {
    this.providerStates.set(providerId, {
      status: 'idle',
      lastUpdate: Date.now(),
      currentLoad: 0,
      errorCount: 0,
    });
  }

  private startStateMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitorProviderStates();
    }, 5000);
  }

  private async monitorProviderStates(): Promise<void> {
    for (const [providerId, state] of this.providerStates.entries()) {
      try {
        const provider = this.providers.get(providerId);
        if (!provider) continue;

        const capacity = provider.getCapacity();
        const load = 1 - capacity;

        if (load > this.MAX_LOAD) {
          this.emit('providerOverload', {
            providerId,
            load,
            timestamp: Date.now(),
          });
        }

        if (state.errorCount > this.ERROR_THRESHOLD) {
          this.emit('providerError', {
            providerId,
            errorCount: state.errorCount,
            timestamp: Date.now(),
          });
        }

        this.providerStates.set(providerId, {
          ...state,
          currentLoad: load,
          lastUpdate: Date.now(),
        });
      } catch (error) {
        logger.error(`Error monitoring provider ${providerId}:`, error);
      }
    }
  }

  public async processSignal(signal: DemandSignal, provider: DataProvider): Promise<ProcessResult> {
    try {
      const result = await provider.process(signal);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  private async processWithProvider(
    providerId: string,
    signal: DemandSignal
  ): Promise<ProcessResult<ProcessedSignal>> {
    const provider = this.providers.get(providerId);
    const state = this.providerStates.get(providerId);

    if (!provider || !state) {
      return {
        success: false,
        error: new Error(`Provider ${providerId} not found`),
      };
    }

    try {
      const result = await provider.process(signal);

      this.providerStates.set(providerId, {
        ...state,
        errorCount: 0,
        status: 'idle',
      });

      return result;
    } catch (error) {
      this.providerStates.set(providerId, {
        ...state,
        errorCount: state.errorCount + 1,
        status: 'error',
      });

      logger.error(`Error processing with provider ${providerId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  }

  private mergeResults(results: ProcessedSignal[]): ProcessedSignal {
    return results.reduce(
      (merged, result) => ({
        ...merged,
        ...result,
        confidence: Math.max(merged.confidence || 0, result.confidence || 0),
        relevance: Math.max(merged.relevance || 0, result.relevance || 0),
        priority: Math.max(merged.priority || 0, result.priority || 0),
      }),
      {} as ProcessedSignal
    );
  }

  public dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.removeAllListeners();
    this.taskQueue = [];
    this.providers.clear();
    this.providerStates.clear();
  }
}
