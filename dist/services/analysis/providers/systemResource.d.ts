import { IntelligenceProvider, DemandSignal } from '../adapters/demandSignalAdapter';
import { EventEmitter } from 'events';
export declare class SystemResourceProvider extends EventEmitter implements IntelligenceProvider {
  name: string;
  type: 'monitoring';
  confidence: number;
  private metrics;
  private optimizationThresholds;
  constructor();
  private getSystemMetrics;
  private optimizeResources;
  private startMonitoring;
  processSignal(signal: DemandSignal): Promise<DemandSignal>;
  validateAlignment(): Promise<boolean>;
  optimizeIDE(): Promise<void>;
}
